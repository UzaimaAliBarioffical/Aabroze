/**
 * Email Service — Nodemailer / Gmail SMTP
 * ⚠️  Server-side only. Never import in client components.
 */
import nodemailer from 'nodemailer'
import type { Order, OrderItem } from '@/types'
import { formatPKR, formatDateTime } from '@/lib/utils'

interface TransportConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

function createTransporter() {
  const config: TransportConfig = {
    host: process.env.EMAIL_HOST ?? 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT ?? 587),
    secure: Number(process.env.EMAIL_PORT ?? 587) === 465,
    auth: {
      user: process.env.EMAIL_USER ?? '',
      pass: process.env.EMAIL_PASS ?? '',
    },
  }

  if (!config.auth.user || !config.auth.pass) {
    throw new Error(
      'Email credentials not configured. Set EMAIL_USER and EMAIL_PASS environment variables.'
    )
  }

  return nodemailer.createTransport(config)
}

function getFrom(): string {
  return process.env.EMAIL_FROM ?? `AABROZE <${process.env.EMAIL_USER}>`
}

// ─── Order Confirmation Email to Customer ─────────────────────────
export async function sendCustomerOrderConfirmation(
  order: Order & { items: OrderItem[] }
): Promise<void> {
  if (!order.customer_email) {
    console.log('[Email] No customer email — skipping customer confirmation')
    return
  }

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #f0ebe2">${item.product_name}</td>
        <td style="padding:8px;border-bottom:1px solid #f0ebe2;text-align:center">${item.size}</td>
        <td style="padding:8px;border-bottom:1px solid #f0ebe2;text-align:center">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #f0ebe2;text-align:right">${formatPKR(item.total_price)}</td>
      </tr>`
    )
    .join('')

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /><title>Order Confirmation — AABROZE</title></head>
<body style="margin:0;padding:0;background:#faf7f2;font-family:Georgia,serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px">
      <table width="600" style="max-width:600px;background:#fff;border-radius:4px;overflow:hidden">
        <tr><td style="background:#2C2C2C;padding:32px;text-align:center">
          <h1 style="color:#FAF7F2;font-family:Georgia,serif;margin:0;font-size:28px;letter-spacing:4px">AABROZE</h1>
          <p style="color:#C4AD92;margin:8px 0 0;font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px">ORDER CONFIRMED</p>
        </td></tr>
        <tr><td style="padding:32px">
          <p style="color:#2c2c2c;font-family:Arial,sans-serif">Dear ${order.customer_name},</p>
          <p style="color:#4a4a4a;font-family:Arial,sans-serif;line-height:1.6">
            Thank you for your order! We've received your purchase and will begin processing it shortly.
          </p>
          <div style="background:#faf7f2;border:1px solid #f0ebe2;border-radius:4px;padding:16px;margin:24px 0">
            <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#8b7355;letter-spacing:1px">ORDER NUMBER</p>
            <p style="margin:4px 0 0;font-family:Georgia,serif;font-size:22px;color:#2c2c2c">${order.order_number}</p>
          </div>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:24px 0">
            <thead>
              <tr style="background:#faf7f2">
                <th style="padding:8px;text-align:left;font-family:Arial,sans-serif;font-size:12px;color:#8b7355;letter-spacing:1px;font-weight:normal">PRODUCT</th>
                <th style="padding:8px;text-align:center;font-family:Arial,sans-serif;font-size:12px;color:#8b7355;letter-spacing:1px;font-weight:normal">SIZE</th>
                <th style="padding:8px;text-align:center;font-family:Arial,sans-serif;font-size:12px;color:#8b7355;letter-spacing:1px;font-weight:normal">QTY</th>
                <th style="padding:8px;text-align:right;font-family:Arial,sans-serif;font-size:12px;color:#8b7355;letter-spacing:1px;font-weight:normal">TOTAL</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px">
            <tr><td style="padding:4px 0;font-family:Arial,sans-serif;color:#4a4a4a">Subtotal</td><td style="padding:4px 0;font-family:Arial,sans-serif;color:#4a4a4a;text-align:right">${formatPKR(order.subtotal)}</td></tr>
            <tr><td style="padding:4px 0;font-family:Arial,sans-serif;color:#4a4a4a">Delivery</td><td style="padding:4px 0;font-family:Arial,sans-serif;color:#4a4a4a;text-align:right">${order.delivery_charges === 0 ? 'FREE' : formatPKR(order.delivery_charges)}</td></tr>
            <tr><td style="padding:8px 0;font-family:Georgia,serif;font-size:18px;color:#2c2c2c;border-top:2px solid #f0ebe2"><strong>Total</strong></td><td style="padding:8px 0;font-family:Georgia,serif;font-size:18px;color:#2c2c2c;text-align:right;border-top:2px solid #f0ebe2"><strong>${formatPKR(order.total)}</strong></td></tr>
          </table>
          <div style="margin-top:24px;padding:16px;background:#faf7f2;border-radius:4px;font-family:Arial,sans-serif;font-size:13px;color:#4a4a4a">
            <strong>Delivery Address:</strong><br/>
            ${order.address}, ${order.city}, ${order.province}${order.postal_code ? ` ${order.postal_code}` : ''}
          </div>
          <p style="margin-top:24px;font-family:Arial,sans-serif;font-size:13px;color:#8b7355">Payment Method: <strong style="color:#2c2c2c">${order.payment_method.toUpperCase()}</strong></p>
        </td></tr>
        <tr><td style="background:#faf7f2;padding:24px;text-align:center;border-top:1px solid #f0ebe2">
          <p style="font-family:Arial,sans-serif;font-size:12px;color:#8b7355;margin:0">
            Questions? WhatsApp us or email <a href="mailto:${process.env.STORE_OWNER_EMAIL}" style="color:#6b2d3e">${process.env.STORE_OWNER_EMAIL}</a>
          </p>
          <p style="font-family:Arial,sans-serif;font-size:11px;color:#c4ad92;margin:8px 0 0">© ${new Date().getFullYear()} AABROZE. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const transporter = createTransporter()
  await transporter.sendMail({
    from: getFrom(),
    to: order.customer_email,
    subject: `Order Confirmed — ${order.order_number} | AABROZE`,
    html,
  })

  console.log(`[Email] Customer confirmation sent to ${order.customer_email}`)
}

// ─── New Order Notification to Store Owner ────────────────────────
export async function sendOwnerOrderNotification(
  order: Order & { items: OrderItem[] }
): Promise<void> {
  const ownerEmail = process.env.STORE_OWNER_EMAIL
  if (!ownerEmail) {
    console.warn('[Email] STORE_OWNER_EMAIL not set — skipping owner notification')
    return
  }

  const itemsText = order.items
    .map((item) => `  • ${item.product_name} | Size: ${item.size} | Qty: ${item.quantity} | ${formatPKR(item.total_price)}`)
    .join('\n')

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:4px;overflow:hidden">
    <div style="background:#2C2C2C;padding:20px;text-align:center">
      <h2 style="color:#FAF7F2;margin:0;letter-spacing:3px">AABROZE</h2>
      <p style="color:#C4AD92;margin:4px 0 0;font-size:12px">🛍️ NEW ORDER RECEIVED</p>
    </div>
    <div style="padding:24px">
      <h3 style="color:#2c2c2c;border-bottom:2px solid #f0ebe2;padding-bottom:8px">Order ${order.order_number}</h3>
      <p style="color:#4a4a4a;font-size:13px">Placed: ${formatDateTime(order.created_at)}</p>
      <h4 style="color:#8b7355;margin-top:20px;margin-bottom:8px">CUSTOMER</h4>
      <table style="font-size:13px;color:#4a4a4a;line-height:2">
        <tr><td><strong>Name:</strong></td><td>${order.customer_name}</td></tr>
        <tr><td><strong>Phone:</strong></td><td>${order.customer_phone}</td></tr>
        ${order.customer_whatsapp ? `<tr><td><strong>WhatsApp:</strong></td><td>${order.customer_whatsapp}</td></tr>` : ''}
        ${order.customer_email ? `<tr><td><strong>Email:</strong></td><td>${order.customer_email}</td></tr>` : ''}
        <tr><td><strong>Address:</strong></td><td>${order.address}, ${order.city}, ${order.province}</td></tr>
        <tr><td><strong>Payment:</strong></td><td>${order.payment_method.toUpperCase()}</td></tr>
      </table>
      <h4 style="color:#8b7355;margin-top:20px;margin-bottom:8px">ITEMS</h4>
      ${order.items.map(item => `
        <div style="padding:8px;border-bottom:1px solid #f0ebe2;font-size:13px">
          <strong>${item.product_name}</strong> — Size: ${item.size} × ${item.quantity} = ${formatPKR(item.total_price)}
        </div>`).join('')}
      <div style="margin-top:16px;padding:16px;background:#faf7f2;border-radius:4px">
        <table width="100%" style="font-size:14px">
          <tr><td>Subtotal</td><td align="right">${formatPKR(order.subtotal)}</td></tr>
          <tr><td>Delivery</td><td align="right">${formatPKR(order.delivery_charges)}</td></tr>
          <tr><td><strong>Total</strong></td><td align="right"><strong>${formatPKR(order.total)}</strong></td></tr>
        </table>
      </div>
      ${order.order_notes ? `<p style="margin-top:16px;font-size:13px;color:#4a4a4a"><strong>Order Notes:</strong> ${order.order_notes}</p>` : ''}
    </div>
  </div>
</body>
</html>`

  const transporter = createTransporter()
  await transporter.sendMail({
    from: getFrom(),
    to: ownerEmail,
    subject: `🛍️ New Order ${order.order_number} — ${formatPKR(order.total)} | AABROZE`,
    html,
    text: `New Order: ${order.order_number}\n\nCustomer: ${order.customer_name}\nPhone: ${order.customer_phone}\nAddress: ${order.address}, ${order.city}, ${order.province}\nPayment: ${order.payment_method}\n\nItems:\n${itemsText}\n\nTotal: ${formatPKR(order.total)}`,
  })

  console.log(`[Email] Owner notification sent to ${ownerEmail}`)
}
