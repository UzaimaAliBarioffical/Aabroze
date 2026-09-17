import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format number as PKR currency string */
export function formatPKR(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Generate a human-readable order number: ABZ-YYYYMMDD-XXXX */
export function generateOrderNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.floor(1000 + Math.random() * 9000)
  return `ABZ-${year}${month}${day}-${random}`
}

/** Convert product name to URL slug */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Truncate text to a max length */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '…'
}

/** Get discount percentage */
export function getDiscountPercent(price: number, salePrice: number): number {
  return Math.round(((price - salePrice) / price) * 100)
}

/** Get effective price (sale price if available, else regular price) */
export function getEffectivePrice(price: number, salePrice: number | null): number {
  return salePrice ?? price
}

/** Sanitize string input — strip dangerous HTML tags */
export function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim()
}

/** Format date as readable string */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** Format datetime */
export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Check if a URL is an external URL */
export function isExternalUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://')
}

/** Build WhatsApp enquiry URL */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '')
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}

/** Calculate delivery charges by province */
export function getDeliveryCharges(province: string): number {
  const charges: Record<string, number> = {
    Punjab: 200,
    Sindh: 250,
    'Khyber Pakhtunkhwa': 250,
    Balochistan: 300,
    'Islamabad Capital Territory': 200,
    'Gilgit-Baltistan': 350,
    'Azad Jammu & Kashmir': 300,
  }
  return charges[province] ?? 250
}

/** Check free shipping threshold */
export function isFreeShipping(subtotal: number, threshold = 3000): boolean {
  return subtotal >= threshold
}
