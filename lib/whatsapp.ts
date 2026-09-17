/**
 * WhatsApp Business Cloud API Service
 * ⚠️  Server-side only.
 *
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 *
 * Prerequisites:
 * 1. Create a Meta Business account
 * 2. Set up WhatsApp Business API
 * 3. Set WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID in environment
 */
import type { Order, OrderItem } from '@/types'
import { formatPKR } from '@/lib/utils'

const WHATSAPP_API_URL = 'https://graph.facebook.com/v19.0'

interface WhatsAppTextMessage {
  to: string
  body: string
}

async function sendTextMessage({ to, body }: WhatsAppTextMessage): Promise<void> {
  const token = process.env.WHATSAPP_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!token || !phoneNumberId) {
    console.warn(
      '[WhatsApp] WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set — skipping notification'
    )
    return
  }

  const cleanTo = to.replace(/\D/g, '')

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanTo,
    type: 'text',
    text: {
      preview_url: false,
      body,
    },
  }

  const response = await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error(`[WhatsApp] Failed to send message: ${response.status} — ${errorBody}`)
    throw new Error(`WhatsApp API error: ${response.status}`)
  }

  const data = await response.json()
  console.log(`[WhatsApp] Message sent successfully. ID: ${data?.messages?.[0]?.id}`)
}

/**
 * Send new order notification to the store owner via WhatsApp.
 */
export async function sendOwnerWhatsAppNotification(
  order: Order & { items: OrderItem[] }
): Promise<void> {
  const ownerWhatsApp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
  if (!ownerWhatsApp) {
    console.warn('[WhatsApp] NEXT_PUBLIC_WHATSAPP_NUMBER not set')
    return
  }

  const itemsList = order.items
    .map((item) => `  • ${item.product_name} (${item.size}) × ${item.quantity}`)
    .join('\n')

  const message = `🛍️ *NEW ORDER — AABROZE*

📦 Order: *${order.order_number}*

👤 *Customer*
Name: ${order.customer_name}
Phone: ${order.customer_phone}${order.customer_whatsapp ? `\nWhatsApp: ${order.customer_whatsapp}` : ''}${order.customer_email ? `\nEmail: ${order.customer_email}` : ''}

📍 *Delivery Address*
${order.address}
${order.city}, ${order.province}${order.postal_code ? ' ' + order.postal_code : ''}

🧾 *Items*
${itemsList}

💰 *Payment*
Subtotal: ${formatPKR(order.subtotal)}
Delivery: ${formatPKR(order.delivery_charges)}
*Total: ${formatPKR(order.total)}*
Method: ${order.payment_method.toUpperCase()}

${order.order_notes ? `📝 Notes: ${order.order_notes}` : ''}

Please confirm the order and update the status in your admin panel.`

  try {
    await sendTextMessage({ to: ownerWhatsApp, body: message })
  } catch (error) {
    // Log but don't throw — email notification still works
    console.error('[WhatsApp] Owner notification failed:', error)
  }
}

/**
 * Verify WhatsApp webhook (used for webhook subscription verification).
 */
export function verifyWhatsAppWebhook(
  mode: string,
  token: string,
  challenge: string
): string | null {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN
  if (!verifyToken) {
    console.warn('[WhatsApp] WHATSAPP_VERIFY_TOKEN not set')
    return null
  }
  if (mode === 'subscribe' && token === verifyToken) {
    return challenge
  }
  return null
}
