import 'server-only'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { sendCustomerOrderConfirmation, sendOwnerOrderNotification } from '@/lib/email'
import type { Order, OrderItem } from '@/types'

// A durable job per recipient makes customer/owner failures independent.
export async function deliverOrderEmails(orderId?: string): Promise<void> {
  const admin = createSupabaseAdminClient()
  const { data: jobs, error } = await admin.rpc('claim_order_emails', { p_order_id: orderId ?? null })
  if (error) throw new Error('EMAIL_QUEUE_UNAVAILABLE')
  await Promise.all((jobs ?? []).map(async (job: {
    id: string; order_id: string; recipient: string; attempts: number; lease_token: string
  }) => {
    let failure: string | null = null
    try {
      const { data, error: readError } = await admin.from('orders')
        .select('*, items:order_items(*)').eq('id', job.order_id).single()
      if (readError || !data) throw new Error('ORDER_READ_FAILED')
      const order = data as Order & { items: OrderItem[] }
      await (job.recipient === 'owner' ? sendOwnerOrderNotification(order) : sendCustomerOrderConfirmation(order))
    } catch {
      // Never log SMTP responses, customer details, or credentials.
      failure = 'Email delivery failed; check server SMTP configuration and provider logs.'
      console.error('[email] Delivery failed', { jobId: job.id, attempt: job.attempts })
    }
    const { error: updateError } = await admin.from('order_email_jobs').update({
      sent_at: failure ? null : new Date().toISOString(), last_error: failure,
      locked_until: null, lease_token: null,
      next_attempt_at: new Date(Date.now() + Math.min(3600, 60 * 2 ** Math.min(job.attempts, 6)) * 1000).toISOString(),
    }).eq('id', job.id).eq('lease_token', job.lease_token)
    if (updateError) console.error('[email] Delivery status update failed', { jobId: job.id })
  }))
}
