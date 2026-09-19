require('./load-ts.cjs')
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { randomUUID } = require('node:crypto')
const { checkoutSchema, checkoutCartSchema } = require('../lib/zod-schemas.ts')
const { mergeCartItem, readCart, removePurchasedItems } = require('../lib/cart.ts')
const { buildOrderEmail, sendOwnerOrderNotification } = require('../lib/email.ts')
const { getVariantUnitPrice } = require('../lib/pricing.ts')
const { createDatabase, seed, place, productId, smallId, mediumId, largeId, customer, items } = require('./database.cjs')

test('customer validation rejects invalid email, phone, whitespace address/name/city and non-COD', () => {
  assert.equal(checkoutSchema.safeParse(customer).success, true)
  for (const invalid of [{ email: 'invalid' }, { phone: '123' }, { full_name: '  ' }, { city: '  ' }, { address: '          ' }, { payment_method: 'jazzcash' }]) {
    assert.equal(checkoutSchema.safeParse({ ...customer, ...invalid }).success, false)
  }
  for (const invalid of [[], [{ ...items[0], quantity: 1.5 }], [items[0], items[0]], [{ ...items[0], quantity: 11 }]]) {
    assert.equal(checkoutCartSchema.safeParse(invalid).success, false)
  }
})

test('cart merges a size, separates sizes, caps stock and subtracts only purchased quantities', () => {
  const item = { product_id: productId, variant_id: smallId, name: 'Suit', slug: 'suit', size: 'S', image_url: '', price: 2700, sale_price: null, quantity: 1, stock: 3 }
  let cart = mergeCartItem([], item)
  cart = mergeCartItem(cart, { ...item, quantity: 3 })
  assert.equal(cart[0].quantity, 3)
  cart = mergeCartItem(cart, { ...item, variant_id: mediumId, size: 'M' })
  assert.equal(cart.length, 2)
  assert.deepEqual(readCart(JSON.stringify(cart)), cart)
  assert.deepEqual(readCart('{broken'), [])
  assert.deepEqual(readCart('[{"quantity":-1}]'), [])
  const remaining = removePurchasedItems(cart, [{ ...item, quantity: 2 }])
  assert.equal(remaining[0].quantity, 1)
  assert.equal(remaining[1].variant_id, mediumId)
  assert.equal(getVariantUnitPrice({ price: 2500, sale_price: 2200 }, { price: 2700 }), 2700)
})

test('atomic database checkout: trusted price, replay, rollback, stock, access control and durable emails', async (t) => {
  const db = await createDatabase()
  t.after(() => db.close())
  await seed(db)
  const result = await place(db, { items: [{ ...items[0], unit_price: 1 }] })
  assert.equal(result.order.subtotal, 5400)
  assert.equal(result.order.total, 5600)
  assert.equal(result.order.status, 'pending')
  assert.equal(result.order.payment_status, 'unpaid')
  assert.equal((await place(db)).duplicate, true)
  assert.equal((await db.query('select count(*)::int as n from orders')).rows[0].n, 1)
  assert.equal((await db.query('select stock from product_variants where id=$1', [smallId])).rows[0].stock, 3)
  await assert.rejects(place(db, { fingerprint: 'changed' }), /different details/)
  // First line's stock deduction must roll back when a later size is unavailable.
  await assert.rejects(place(db, { customer: { ...customer, idempotency_key: randomUUID() }, items: [
    { ...items[0], quantity: 1 }, { product_id: productId, variant_id: largeId, quantity: 1 },
  ] }), /enough stock/)
  assert.equal((await db.query('select stock from product_variants where id=$1', [smallId])).rows[0].stock, 3)
  await assert.rejects(place(db, { customer: { ...customer, idempotency_key: randomUUID() }, items: [{ ...items[0], quantity: 4 }] }), /enough stock/)
  await assert.rejects(place(db, { customer: { ...customer, idempotency_key: randomUUID() }, items: [{ ...items[0], product_id: randomUUID() }] }), /no longer available/)
  const sale = await place(db, { customer: { ...customer, idempotency_key: randomUUID() }, items: [{ product_id: productId, variant_id: mediumId, quantity: 1 }], threshold: 2000 })
  assert.equal(sale.order.total, 2200)
  const claimed = (await db.query('select * from claim_order_emails($1)', [result.order.id])).rows
  assert.equal(claimed.length, 2)
  assert.equal((await db.query('select * from claim_order_emails($1)', [result.order.id])).rows.length, 0)
  assert.equal((await db.query("select has_function_privilege('anon','place_store_order(jsonb,jsonb,uuid,text,numeric,numeric)','execute') as allowed")).rows[0].allowed, false)
  assert.equal((await db.query("select count(*)::int as n from pg_policies where tablename in ('orders','order_items','payments') and cmd='INSERT'")).rows[0].n, 0)
  const unsafeOrder = { ...result.order, customer_name: '<img src=x onerror=alert(1)>', order_notes: '<script>bad</script>' }
  const email = buildOrderEmail(unsafeOrder, true)
  assert.ok(email.html.includes('&lt;script&gt;bad&lt;/script&gt;'))
  assert.ok(!email.html.includes('<img src=x'))
  assert.equal(email.subject, `New AABROZE Order - ${result.order.order_number}`)
  assert.match(buildOrderEmail(result.order, false).text, /Payment is due on delivery/)
  assert.match(buildOrderEmail({ ...result.order, status: 'delivered', payment_status: 'paid' }, false).text, /Payment has been received/)
  assert.match(buildOrderEmail({ ...result.order, status: 'cancelled' }, false).text, /No payment is due/)
  const oldUser = process.env.EMAIL_USER
  delete process.env.EMAIL_USER
  try { await assert.rejects(sendOwnerOrderNotification(result.order), /SMTP_NOT_CONFIGURED/) }
  finally { if (oldUser !== undefined) process.env.EMAIL_USER = oldUser }
  assert.equal((await db.query('select count(*)::int as n from orders')).rows[0].n, 2)
})
