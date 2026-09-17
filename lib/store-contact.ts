/** Official AABROZE store-facing contact details. */
export const STORE_PHONE_LOCAL = '03282301296'
export const STORE_PHONE_TEL = 'tel:03282301296'
/** Pakistan international format without + for wa.me */
export const STORE_WHATSAPP_INTL = '923282301296'
export const STORE_EMAIL = 'aabroze.pk@gmail.com'

export const STORE_WHATSAPP_URL = `https://wa.me/${STORE_WHATSAPP_INTL}`

export function storeWhatsAppUrl(message?: string): string {
  if (!message) return STORE_WHATSAPP_URL
  return `${STORE_WHATSAPP_URL}?text=${encodeURIComponent(message)}`
}
