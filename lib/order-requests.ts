import 'server-only'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile, rename, unlink } from 'node:fs/promises'
import path from 'node:path'
import nodemailer from 'nodemailer'
import { orderRequestSchema, type OrderRequestInput } from '@/lib/order-request-schema'
import { collectionImages } from '@/lib/collection-images'
import { fetchPublishedProductById, fetchPublishedProductBySlug } from '@/lib/products'
import { getVariantUnitPrice } from '@/lib/pricing'
import { escapeHtml } from '@/lib/email'
import { formatPKR } from '@/lib/utils'

export class OrderRequestError extends Error {
  constructor(message: string, public status = 503) { super(message) }
}
type Receipt = { id: string; accepted: true; kind: 'request' }
type Journal = { fingerprint: string; status: 'sending' | 'accepted'; receipt?: Receipt }

async function resolveItems(input: OrderRequestInput) {
  return Promise.all(input.items.map(async item => {
    const product = item.product_id ? await fetchPublishedProductById(item.product_id) : await fetchPublishedProductBySlug(item.slug)
    if (product) {
      const variant = product.variants?.find(v => item.variant_id ? v.id === item.variant_id && v.size === item.size : v.size === item.size)
      if (!variant || variant.stock < item.quantity) throw new OrderRequestError('Please select an available size and quantity for this product.', 400)
      return { name: product.name, product_id: product.id, size: variant.size, quantity: item.quantity, price: getVariantUnitPrice(product, variant) }
    }
    // Only existing local collection entries can be requested without catalog access.
    const preview = collectionImages.find(entry => entry.slug === item.slug)
    if (!preview || item.product_id || !['S', 'M', 'L', 'XL'].includes(item.size)) {
      throw new OrderRequestError('This product could not be verified. Please reload the collection and select it again.', 400)
    }
    return { name: preview.name, product_id: null, size: item.size, quantity: item.quantity, price: null }
  }))
}

export async function submitOrderRequest(value: unknown): Promise<Receipt> {
  const parsed = orderRequestSchema.safeParse(value)
  if (!parsed.success) throw new OrderRequestError(parsed.error.issues[0]?.message || 'Invalid order request', 400)
  const input = parsed.data
  const fingerprint = createHash('sha256').update(JSON.stringify(input)).digest('hex')
  const directory = path.resolve(process.env.ORDER_REQUEST_DATA_DIR || '.order-requests')
  const file = path.join(directory, `${input.idempotency_key}.json`)
  await mkdir(directory, { recursive: true, mode: 0o700 })
  const previous = async () => {
    const record: Journal = JSON.parse(await readFile(file, 'utf8'))
    if (record.fingerprint !== fingerprint) throw new OrderRequestError('This request ID belongs to different details. Start a new request.', 409)
    if (record.status === 'accepted' && record.receipt) return record.receipt
    throw new OrderRequestError('This request is still processing or its email status is uncertain. Please contact the store with this request ID before submitting again.', 409)
  }
  try { return await previous() } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  if (!process.env.EMAIL_USER?.trim() || !process.env.EMAIL_PASS?.trim()) {
    throw new OrderRequestError('Email ordering is temporarily unavailable. Please contact the store or try again later. Your bag has been preserved.')
  }
  const items = await resolveItems(input)
  const id = `ABZ-REQ-${input.idempotency_key.toUpperCase()}`
  const date = new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })
  const c = input.customer
  const text = [
    'AABROZE ORDER REQUEST — NOT A CONFIRMED SALE', `Order request ID: ${id}`, `Date and time (Pakistan): ${date}`,
    `Customer name: ${c.full_name}`, `Email: ${c.email}`, `Phone / WhatsApp: ${c.phone}`, `Alternate phone: ${c.whatsapp || 'Not provided'}`,
    `Complete delivery address: ${c.address}`, `City: ${c.city}`, `Province: ${c.province}`, 'Country: Pakistan',
    `Postal code: ${c.postal_code || 'Not provided'}`, `Order notes: ${c.order_notes || 'None'}`, '',
    ...items.map(item => `${item.name} | Size: ${item.size} | Quantity: ${item.quantity} | Unit price: ${item.price === null ? 'Price to be confirmed' : formatPKR(item.price)}`),
    '', 'Price, availability, shipping and final total must be confirmed by the store. No payment has been collected and no stock has been reserved.',
  ].join('\n')
  try { await writeFile(file, JSON.stringify({ fingerprint, status: 'sending', id, date, customer: c, items }), { flag: 'wx', mode: 0o600 }) }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') return previous()
    throw new OrderRequestError('Unable to safely record this request. Please try again later.')
  }
  const port = Number(process.env.EMAIL_PORT || 587)
  const transport = nodemailer.createTransport({ host: process.env.EMAIL_HOST || 'smtp.gmail.com', port,
    secure: port === 465, requireTLS: port !== 465,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
  })
  try {
    const result = await transport.sendMail({
      from: process.env.EMAIL_FROM || `AABROZE <${process.env.EMAIL_USER}>`,
      to: 'aabroze.pk@gmail.com', replyTo: c.email,
      subject: `AABROZE Order Request - ${id}`, messageId: `<${input.idempotency_key}.request@aabroze.order>`,
      text, html: `<h1>AABROZE Order Request</h1><pre style="white-space:pre-wrap;font-family:Arial,sans-serif;line-height:1.6">${escapeHtml(text)}</pre>`,
    })
    if (!result.accepted?.some((recipient: string | { address: string }) =>
      (typeof recipient === 'string' ? recipient : recipient.address).toLowerCase() === 'aabroze.pk@gmail.com')) {
      throw Object.assign(new Error('Not accepted'), { code: 'EENVELOPE' })
    }
  } catch (error) {
    const smtp = error as { code?: string; command?: string; responseCode?: number }
    // Definite rejection/pre-DATA connection failure is safe to retry. A lost
    // acceptance response is ambiguous: retain the journal, do not resend blindly.
    if (['EAUTH', 'EENVELOPE', 'ECONNECTION', 'EDNS'].includes(smtp.code || '') ||
        (smtp.responseCode != null && smtp.responseCode >= 400) ||
        (smtp.command && ['CONN', 'EHLO', 'HELO', 'STARTTLS', 'AUTH'].includes(smtp.command))) {
      await unlink(file)
      throw new OrderRequestError('The email provider did not accept your request. Please retry; your bag has been preserved.')
    }
    throw new OrderRequestError(`Email status is uncertain. Contact the store with request ID ${id} before trying a new request.`, 409)
  } finally { transport.close() }
  const receipt: Receipt = { id, accepted: true, kind: 'request' }
  // Keep the request details for reconciliation; commit acceptance atomically.
  const temporary = `${file}.accepted`
  await writeFile(temporary, JSON.stringify({ fingerprint, status: 'accepted', receipt, id, date, customer: c, items }), { mode: 0o600 })
  await rename(temporary, file)
  return receipt
}
