import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin-auth'
import { isUuid } from '@/lib/pricing'
import { formatDate, formatPKR } from '@/lib/utils'
import OrderStatusForm from '@/components/admin/OrderStatusForm'
import type { Order, OrderItem } from '@/types'

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await requireAdmin()
  const { id } = await params
  if (!isUuid(id)) notFound()
  const { data, error } = await supabase.from('orders').select('*, items:order_items(*)').eq('id', id).maybeSingle()
  if (error) return <p role="alert">Unable to load this order. Please try again.</p>
  if (!data) notFound()
  const order = data as Order & { items: OrderItem[] }
  const { data: jobs, error: emailError } = await supabase.from('order_email_jobs')
    .select('id, recipient, sent_at, attempts, last_error, next_attempt_at').eq('order_id', id)
  return <div className="space-y-6">
    <Link href="/admin/orders" className="text-xs underline">Back to orders</Link>
    <h1 className="font-serif text-2xl break-all">Order {order.order_number}</h1>
    <p className="text-sm">{formatDate(order.created_at)} · Status: {order.status} · Payment: {order.payment_method.toUpperCase()} / {order.payment_status}</p>
    <div className="grid lg:grid-cols-2 gap-6">
      <section className="bg-white border border-beige-200 p-5 space-y-2 text-sm break-words">
        <h2 className="font-serif text-xl">Customer details</h2>
        <p>{order.customer_name}</p><p>{order.customer_email}</p><p>{order.customer_phone}</p>
        {order.customer_whatsapp && <p>Alternate phone: {order.customer_whatsapp}</p>}
        <p>{order.address}</p><p>{order.city}, {order.province} {order.postal_code}</p><p>Pakistan</p>
        {order.order_notes && <p className="whitespace-pre-wrap">Notes: {order.order_notes}</p>}
      </section>
      <section className="bg-white border border-beige-200 p-5 space-y-4">
        <h2 className="font-serif text-xl">Manage order</h2>
        <OrderStatusForm key={`${order.status}-${order.payment_status}`} order={order} />
      </section>
    </div>
    <section className="bg-white border border-beige-200 p-5 space-y-4">
      <h2 className="font-serif text-xl">Order items</h2>
      <ul className="divide-y divide-beige-200 text-sm">
        {order.items.map(item => <li key={item.id} className="py-3 flex flex-wrap justify-between gap-3">
          <span>{item.product_name} · Size: {item.size} · Qty: {item.quantity}</span>
          <span>{formatPKR(item.unit_price)} each · {formatPKR(item.total_price)}</span>
        </li>)}
      </ul>
      <p>Subtotal: {formatPKR(order.subtotal)}</p><p>Delivery charges: {formatPKR(order.delivery_charges)}</p>
      <p className="font-medium">Total: {formatPKR(order.total)}</p>
    </section>
    <section className="bg-white border border-beige-200 p-5 space-y-3">
      <h2 className="font-serif text-xl">Order emails</h2>
      {emailError ? <p role="alert">Email queue unavailable. Check the database migration.</p> : !jobs?.length ? <p>No queued email records for this order.</p>
        : jobs.map(job => <p key={job.id} className="text-sm">
          {job.recipient === 'owner' ? 'Owner notification' : 'Customer confirmation'}: {job.sent_at ? 'Accepted by email provider' : job.last_error ? 'Delivery failed — queued for retry' : 'Queued'} · Attempts: {job.attempts}
        </p>)}
    </section>
  </div>
}
