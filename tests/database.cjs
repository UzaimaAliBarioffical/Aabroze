const { PGlite } = require('@electric-sql/pglite')
const { uuid_ossp } = require('@electric-sql/pglite/contrib/uuid_ossp')
const { readFileSync } = require('node:fs')
const path = require('node:path')

async function createDatabase() {
  const db = new PGlite({ extensions: { uuid_ossp } })
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql as $$ select null::uuid $$;
  `)
  for (const file of ['001_initial_schema.sql', '002_variant_price.sql', '003_atomic_checkout.sql']) {
    const sql = readFileSync(path.join(__dirname, '../supabase/migrations', file), 'utf8')
    await db.exec(sql)
  }
  return db
}
const productId = '10000000-0000-4000-8000-000000000001'
const smallId = '20000000-0000-4000-8000-000000000001'
const mediumId = '20000000-0000-4000-8000-000000000002'
const largeId = '20000000-0000-4000-8000-000000000003'
async function seed(db) {
  await db.query(`insert into products (id,name,slug,price,sale_price,is_published) values ($1,'Test Lawn Suit','test-lawn-suit',2500,2200,true)`, [productId])
  await db.query(`insert into product_variants (id,product_id,size,stock,price) values
    ($1,$4,'S',5,2700), ($2,$4,'M',5,null), ($3,$4,'L',0,2900)`, [smallId,mediumId,largeId,productId])
}
const customer = {
  full_name: 'Test Customer', email: 'customer@example.com', phone: '03001234567', whatsapp: '',
  province: 'Punjab', city: 'Lahore', address: '123 Test Street, Gulberg', postal_code: '',
  order_notes: '', payment_method: 'cod', idempotency_key: '30000000-0000-4000-8000-000000000001',
}
const items = [{ product_id: productId, variant_id: smallId, quantity: 2 }]
async function place(db, overrides = {}) {
  const args = { customer, items, fingerprint: 'test-fingerprint', shipping: 200, threshold: 0, ...overrides }
  const { rows } = await db.query('select place_store_order($1::jsonb,$2::jsonb,null,$3,$4,$5) as result',
    [JSON.stringify(args.customer), JSON.stringify(args.items), args.fingerprint, args.shipping, args.threshold])
  return rows[0].result
}
module.exports = { createDatabase, seed, place, productId, smallId, mediumId, largeId, customer, items }
