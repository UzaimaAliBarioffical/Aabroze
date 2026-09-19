'use server'

import { revalidatePath } from 'next/cache'
import { unstable_rethrow } from 'next/navigation'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin-auth'
import { orderStatusSchema } from '@/lib/zod-schemas'

const updateSchema = orderStatusSchema.extend({
  id: z.string().uuid(),
  expectedStatus: orderStatusSchema.shape.status,
  paymentReceived: z.boolean(),
})

export async function updateAdminOrder(input: unknown) {
  const parsed = updateSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid order update.' }
  try {
    const supabase = await requireAdmin()
    const { id, status, expectedStatus, paymentReceived } = parsed.data
    const { error } = await supabase.rpc('update_admin_order', {
      p_order_id: id, p_status: status, p_expected_status: expectedStatus,
      p_payment_received: paymentReceived,
    })
    if (error) {
      return { error: error.code === 'P0001' && error.message.startsWith('Order:')
        ? error.message.slice(6).trim()
        : 'Unable to update the order. Check the database migration and try again.' }
    }
    revalidatePath('/admin/orders')
    revalidatePath(`/admin/orders/${id}`)
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error) {
    unstable_rethrow(error)
    return { error: 'Order management is temporarily unavailable.' }
  }
}
