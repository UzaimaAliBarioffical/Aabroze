import { timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { deliverOrderEmails } from '@/lib/order-emails'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const secret = process.env.ORDER_EMAIL_RETRY_SECRET
  const expected = Buffer.from(`Bearer ${secret ?? ''}`)
  const actual = Buffer.from(request.headers.get('authorization') ?? '')
  if (!secret || expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    await deliverOrderEmails()
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Email queue unavailable' }, { status: 503 })
  }
}
