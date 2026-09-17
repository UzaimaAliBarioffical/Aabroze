import Link from 'next/link'
import { formatPKR, formatDate } from '@/lib/utils'
import type { Order } from '@/types'

interface OrderTableProps {
  orders: Order[]
}

export default function OrderTable({ orders }: OrderTableProps) {
  return (
    <div className="bg-white rounded border border-beige-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-sans border-collapse">
          <thead>
            <tr className="bg-beige-100/60 border-b border-beige-200 text-charcoal-200 uppercase tracking-wider">
              <th className="p-3.5">Order ID</th>
              <th className="p-3.5">Customer</th>
              <th className="p-3.5">Date</th>
              <th className="p-3.5">Payment</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Total</th>
              <th className="p-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-beige-100">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-cream/50 transition-colors">
                <td className="p-3.5 font-medium text-charcoal-300">
                  #{o.order_number || o.id.slice(0, 8)}
                </td>
                <td className="p-3.5 text-charcoal-200">
                  <p className="font-medium text-charcoal-300">{o.shipping_name}</p>
                  <p className="text-[10px] text-taupe-200">{o.shipping_city}, {o.shipping_province}</p>
                </td>
                <td className="p-3.5 text-charcoal-200">{formatDate(o.created_at)}</td>
                <td className="p-3.5 uppercase text-[10px] tracking-wider text-charcoal-300 font-medium">
                  {o.payment_method}
                </td>
                <td className="p-3.5">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-beige-200 text-charcoal-300">
                    {o.status}
                  </span>
                </td>
                <td className="p-3.5 font-medium text-charcoal-300">
                  {formatPKR(o.total_amount)}
                </td>
                <td className="p-3.5 text-right">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="text-taupe-300 hover:text-charcoal-300 font-medium"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
