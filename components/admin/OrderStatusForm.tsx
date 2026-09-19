'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateAdminOrder } from '@/actions/admin-orders'
import { ORDER_TRANSITIONS } from '@/lib/order-status'
import type { Order, OrderStatus } from '@/types'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'

export default function OrderStatusForm({ order }: { order: Pick<Order, 'id' | 'status' | 'payment_method' | 'payment_status'> }) {
  const router = useRouter()
  const options = ORDER_TRANSITIONS[order.status]
  const [status, setStatus] = useState<OrderStatus>(options[0] ?? order.status)
  const [received, setReceived] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  if (!options.length) return <p className="text-sm font-sans">This order is {order.status}.</p>
  const needsPayment = status === 'delivered' && order.payment_method === 'cod' && order.payment_status !== 'paid'
  return <form className="space-y-4" onSubmit={async (event) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setMessage('')
    try {
      const result = await updateAdminOrder({ id: order.id, expectedStatus: order.status, status, paymentReceived: received })
      if (result.error) setMessage(result.error)
      else { setMessage('Order updated.'); router.refresh() }
    } catch { setMessage('Unable to confirm the update. Refresh the order before retrying.') }
    finally { setSaving(false) }
  }}>
    <Select label="Order status" value={status} disabled={saving}
      onChange={(event) => { setStatus(event.target.value as OrderStatus); setReceived(false) }}
      options={options.map(value => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) }))} />
    {status === 'cancelled' && <p className="text-xs">Cancellation restores reserved stock once. A cancelled order cannot be reopened.</p>}
    {needsPayment && <label className="flex gap-2 text-sm items-center">
      <input type="checkbox" checked={received} onChange={event => setReceived(event.target.checked)} required disabled={saving} />
      COD payment received
    </label>}
    {message && <p role="status" className="text-sm">{message}</p>}
    <Button type="submit" loading={saving} disabled={needsPayment && !received}>Update order</Button>
  </form>
}
