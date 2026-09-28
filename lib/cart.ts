import { z } from 'zod'
import type { CartItem } from '@/types'
import { formatPKR } from '@/lib/utils'

export const storedCartItemSchema = z.object({
  product_id: z.string().min(1), variant_id: z.string().min(1), request_only: z.boolean().optional(),
  name: z.string(), slug: z.string(), size: z.string().min(1), image_url: z.string(),
  price: z.number().finite().nonnegative().nullable(), sale_price: z.number().finite().nonnegative().nullable(),
  quantity: z.number().int().min(1).max(10), stock: z.number().int().nonnegative().optional(),
}).refine(item => item.request_only
  ? item.product_id === `preview:${item.slug}` && item.variant_id === `request:${item.size}` && ['S', 'M', 'L', 'XL'].includes(item.size) && item.price === null && item.sale_price === null
  : z.string().uuid().safeParse(item.product_id).success && z.string().uuid().safeParse(item.variant_id).success && item.price !== null)

export const cartPriceLabel = (item: CartItem) => (item.sale_price ?? item.price) === null ? 'Price to be confirmed' : formatPKR((item.sale_price ?? item.price)!)
export function readCart(value: string | null): CartItem[] {
  try {
    const parsed = z.array(storedCartItemSchema).max(50).safeParse(JSON.parse(value || '[]'))
    if (!parsed.success) return []
    return parsed.data.reduce<CartItem[]>((items, item) => mergeCartItem(items, item), [])
  } catch { return [] }
}
export function mergeCartItem(items: CartItem[], item: CartItem): CartItem[] {
  const previous = items.find((entry) => entry.product_id === item.product_id && entry.variant_id === item.variant_id)
  const next = { ...item, quantity: Math.min((previous?.quantity ?? 0) + item.quantity, item.stock ?? 10, 10) }
  if (next.quantity < 1) return items
  return previous ? items.map((entry) => entry === previous ? next : entry) : [...items, next]
}
export function removePurchasedItems(items: CartItem[], purchased: CartItem[]): CartItem[] {
  return items.map((item) => {
    const bought = purchased.find((entry) => entry.product_id === item.product_id && entry.variant_id === item.variant_id)
    return bought ? { ...item, quantity: item.quantity - bought.quantity } : item
  }).filter((item) => item.quantity > 0)
}

export const BUY_NOW_KEY = 'aabroze_buy_now'
export function saveBuyNow(item: CartItem): boolean {
  const parsed = storedCartItemSchema.safeParse(item)
  if (!parsed.success || item.quantity > (item.stock ?? 10)) return false
  try { sessionStorage.setItem(BUY_NOW_KEY, JSON.stringify([parsed.data])); return true }
  catch { return false }
}
