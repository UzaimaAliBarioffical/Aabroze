import { after, NextRequest, NextResponse } from 'next/server'
import { deliverOrderEmails } from '@/lib/order-emails'
import { sendOwnerWhatsAppNotification } from '@/lib/whatsapp'
import { placeStoreOrder } from '@/lib/create-order'
import { getClientIp, RATE_LIMITS, rateLimit } from '@/lib/rate-limit'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const limited = rateLimit(`checkout:${ip}`, RATE_LIMITS.checkout)
  if (!limited.success) {
    return NextResponse.json(
      { success: false, error: 'Too many checkout attempts. Please wait and try again.' },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
  }

  const payload = body as {
    customer?: Record<string, unknown>
    items?: unknown
  }

  if (!payload?.customer || !payload?.items) {
    return NextResponse.json({ success: false, error: 'Missing order details' }, { status: 400 })
  }

  let userId: string | null = null
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    userId = user?.id ?? null
  } catch {
    userId = null
  }

  try {
    const result = await placeStoreOrder({
      customer: payload.customer as never,
      items: payload.items as never,
      userId,
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.retryable ? 503 : 400 })
    }

    const order = result.order!
    after(async () => {
      try { await deliverOrderEmails(order.id) }
      catch { console.error('[email] Queue processing unavailable') }
      if (!result.duplicate) {
        try { await sendOwnerWhatsAppNotification(order) }
        catch { console.error('[orders] WhatsApp notification failed') }
      }
    })
    return NextResponse.json({
      success: true,
      duplicate: result.duplicate ?? false,
      data: {
        order_number: result.order?.order_number,
        order_id: result.order?.id,
        total: result.order?.total,
      },
    })
  } catch {
    console.error('[api/orders] Order request failed')
    return NextResponse.json(
      { success: false, error: 'Unable to place order. Please try again.' },
      { status: 500 }
    )
  }
}
