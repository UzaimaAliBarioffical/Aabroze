import { NextRequest, NextResponse } from 'next/server'
import { OrderRequestError, submitOrderRequest } from '@/lib/order-requests'
import { getClientIp, rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 60
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ success: false, error: 'Invalid request origin' }, { status: 403 })
  if (!rateLimit(`order-request:${getClientIp(request.headers)}`, RATE_LIMITS.checkout).success) {
    return NextResponse.json({ success: false, error: 'Too many requests. Please wait before trying again.' }, { status: 429 })
  }
  try {
    const body = await request.text()
    if (body.length > 50000) return NextResponse.json({ success: false, error: 'Request too large' }, { status: 413 })
    let input: unknown
    try { input = JSON.parse(body) } catch { return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 }) }
    const receipt = await submitOrderRequest(input)
    return NextResponse.json({ success: true, receipt })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof OrderRequestError ? error.message : 'Unable to confirm email delivery. Retry the same request or contact the store.' },
      { status: error instanceof OrderRequestError ? error.status : 503 })
  }
}
