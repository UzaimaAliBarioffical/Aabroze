import 'server-only'
import nodemailer from 'nodemailer'
import { formatPKR } from '@/lib/utils'
import type { Order, OrderItem } from '@/types'

type EmailOrder = Order & { items: OrderItem[] }
export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (char) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)
}

export function buildOrderEmail(order: EmailOrder, owner: boolean) {
  const title = owner ? 'AABROZE — NEW ORDER' : 'Thank you for shopping with AABROZE.'
  const date = new Date(order.created_at).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })
  const paymentNotice = order.status === 'cancelled'
    ? 'This order has been cancelled. No payment is due on delivery.'
    : order.payment_status === 'paid'
      ? 'Payment has been received. Thank you for shopping with AABROZE.'
      : 'Your order has been received. Payment is due on delivery.'
  const details = [
    ['Order number', order.order_number], ['Order date and time (Pakistan)', date],
    ['Full name', order.customer_name], ['Email', order.customer_email],
    ['Phone', order.customer_phone], ['Alternate phone', order.customer_whatsapp || 'Not provided'],
    ['Province', order.province], ['City', order.city], ['Complete delivery address', order.address],
    ['Country', 'Pakistan'], ['Postal code', order.postal_code || 'Not provided'],
    ['Order notes', order.order_notes || 'None'],
  ]
  const summary = [['Subtotal', formatPKR(order.subtotal)], ['Shipping charges', formatPKR(order.delivery_charges)],
    ['Grand total', formatPKR(order.total)], ['Payment Method', order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method],
    ['Payment Status', order.payment_status], ['Order Status', order.status.charAt(0).toUpperCase() + order.status.slice(1)]]
  const rows = (values: (string | null)[][]) => values.map(([label, value]) =>
    `<tr><td style="padding:6px 8px;color:#8b7355">${escapeHtml(label)}</td><td style="padding:6px 8px">${escapeHtml(value)}</td></tr>`).join('')
  const html = `<!doctype html><html><head><meta charset="utf-8"></head>
  <body style="margin:0;background:#faf7f2;color:#2c2c2c;font-family:Arial,sans-serif">
  <div style="max-width:640px;margin:24px auto;background:white">
    <div style="background:#2c2c2c;color:#faf7f2;padding:28px;text-align:center">
      <h1 style="font-family:Georgia,serif;letter-spacing:4px">AABROZE</h1>
      <p>${escapeHtml(title)}</p>
    </div><div style="padding:24px">
    ${owner ? '' : `<p>${escapeHtml(paymentNotice)}</p>`}
    <table style="width:100%;font-size:13px;overflow-wrap:anywhere">${rows(details)}</table>
    <h2 style="font-family:Georgia,serif;font-size:20px">Order items</h2>
    <table style="width:100%;border-collapse:collapse;font-size:12px;text-align:left">
      <thead><tr style="background:#faf7f2"><th>Product</th><th>Size</th><th>Qty</th><th>Unit price</th><th>Line total</th></tr></thead>
      <tbody>${order.items.map((item) => `<tr>
        <td style="padding:10px 2px;border-bottom:1px solid #f0ebe2">${escapeHtml(item.product_name)}</td>
        <td>${escapeHtml(item.size)}</td><td>${item.quantity}</td>
        <td>${formatPKR(item.unit_price)}</td><td>${formatPKR(item.total_price)}</td></tr>`).join('')}</tbody>
    </table><h2 style="font-family:Georgia,serif;font-size:20px">Payment summary</h2>
    <table style="width:100%;background:#faf7f2;font-size:13px">${rows(summary)}</table>
    </div></div></body></html>`
  const text = [title, ...details.map(([label, value]) => `${label}: ${value}`), 'ORDER ITEMS',
    ...order.items.map((item) => `${item.product_name} | Size: ${item.size} | Qty: ${item.quantity} | Unit: ${formatPKR(item.unit_price)} | Line: ${formatPKR(item.total_price)}`),
    'PAYMENT SUMMARY', ...summary.map(([label, value]) => `${label}: ${value}`),
    paymentNotice].join('\n')
  return { html, text, subject: owner ? `New AABROZE Order - ${order.order_number}`
    : `Your AABROZE Order Confirmation - ${order.order_number}` }
}

async function send(order: EmailOrder, owner: boolean): Promise<void> {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) throw new Error('SMTP_NOT_CONFIGURED')
  const recipient = owner
    ? process.env.ORDER_NOTIFICATION_EMAIL || process.env.STORE_OWNER_EMAIL || 'aabroze.pk@gmail.com'
    : order.customer_email
  if (!recipient) throw new Error('EMAIL_RECIPIENT_MISSING')
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com', port: Number(process.env.EMAIL_PORT || 587),
    secure: Number(process.env.EMAIL_PORT || 587) === 465,
    requireTLS: Number(process.env.EMAIL_PORT || 587) !== 465,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
  })
  try {
    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `AABROZE <${process.env.EMAIL_USER}>`, to: recipient,
      // Stable ID reduces duplicates if an SMTP acceptance response is lost.
      messageId: `<${order.id}.${owner ? 'owner' : 'customer'}@aabroze.order>`,
      ...buildOrderEmail(order, owner),
    })
    if (!result.accepted?.length) throw new Error('SMTP_NOT_ACCEPTED')
  } finally { transporter.close() }
}
export const sendOwnerOrderNotification = (order: EmailOrder) => send(order, true)
export const sendCustomerOrderConfirmation = (order: EmailOrder) => send(order, false)
