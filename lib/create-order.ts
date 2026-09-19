import 'server-only'
import { createHash } from 'node:crypto'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { checkoutCartSchema, checkoutSchema, type CheckoutInput } from '@/lib/zod-schemas'
import { getDeliveryCharges, FREE_SHIPPING_THRESHOLD } from '@/lib/utils'
import type { Order, OrderItem } from '@/types'

export interface PlaceOrderPayload {
  customer: CheckoutInput
  items: { product_id: string; variant_id: string; quantity: number }[]
  userId?: string | null
}
export interface PlaceOrderResult {
  success: boolean
  duplicate?: boolean
  retryable?: boolean
  error?: string
  order?: Order & { items: OrderItem[] }
}

export async function placeStoreOrder(payload: PlaceOrderPayload): Promise<PlaceOrderResult> {
  const customer = checkoutSchema.safeParse(payload.customer)
  const cart = checkoutCartSchema.safeParse(payload.items)
  if (!customer.success) return { success: false, error: customer.error.issues[0]?.message }
  if (!cart.success) return { success: false, error: cart.error.issues[0]?.message }

  const items = [...cart.data].sort((a, b) => a.variant_id.localeCompare(b.variant_id))
  const fingerprint = createHash('sha256')
    .update(JSON.stringify({ customer: customer.data, items }))
    .digest('hex')
  const { data, error } = await createSupabaseAdminClient().rpc('place_store_order', {
    p_customer: customer.data, p_items: items, p_user_id: payload.userId ?? null,
    p_fingerprint: fingerprint, p_shipping: getDeliveryCharges(customer.data.province),
    p_free_threshold: FREE_SHIPPING_THRESHOLD,
  })
  if (error) {
    console.error('[orders] Transaction failed', { code: error.code })
    return { success: false, retryable: error.code !== 'P0001', error: error.code === 'P0001' && error.message.startsWith('Checkout:')
      ? error.message.slice(9).trim() : 'Unable to save your order. Please retry with the same checkout.' }
  }
  return { success: true, duplicate: data.duplicate, order: data.order }
}
