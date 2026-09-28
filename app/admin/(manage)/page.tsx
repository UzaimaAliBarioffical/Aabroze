import { ShoppingBag, TrendingUp, Clock, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import StatsCard from '@/components/admin/StatsCard'
import { fetchDashboardData } from '@/actions/admin/dashboard'
import { formatPKR, formatDate } from '@/lib/utils'

export default async function AdminDashboardPage() {
  const data = await fetchDashboardData()

  const orderStatusColors: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-700',
    confirmed: 'bg-blue-50 text-blue-700',
    packed: 'bg-purple-50 text-purple-700',
    shipped: 'bg-indigo-50 text-indigo-700',
    delivered: 'bg-green-50 text-green-700',
    cancelled: 'bg-red-50 text-red-700',
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="section-heading">Dashboard</h1>
        <p className="text-sm text-charcoal-100 mt-1">Welcome back to the AABROZE management portal.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Orders"
          value={data.totalOrders}
          icon={ShoppingBag}
          description="All time"
        />
        <StatsCard
          title="Total Revenue"
          value={formatPKR(data.totalRevenue)}
          icon={TrendingUp}
          description="All orders"
        />
        <StatsCard
          title="Pending Orders"
          value={data.pendingOrders}
          icon={Clock}
          description="Awaiting action"
        />
        <StatsCard
          title="Low Stock Variants"
          value={data.lowStockCount}
          icon={AlertTriangle}
          description="1-3 units left"
        />
      </div>

      {/* Recent Orders */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-charcoal-300">Recent Orders</h2>
          <Link href="/admin/orders" className="text-xs font-sans underline text-taupe-300 hover:text-charcoal-300">
            View all
          </Link>
        </div>

        {data.recentOrders.length === 0 ? (
          <p className="text-sm text-charcoal-100">No orders yet.</p>
        ) : (
          <div className="bg-white rounded border border-beige-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans border-collapse">
                <thead>
                  <tr className="bg-beige-100/60 border-b border-beige-200 text-charcoal-200 uppercase tracking-wider">
                    <th className="p-3.5">Order</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-beige-100">
                  {data.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-cream/50 transition-colors">
                      <td className="p-3.5 font-medium text-charcoal-300">{order.order_number}</td>
                      <td className="p-3.5 text-charcoal-200">{order.customer_name}</td>
                      <td className="p-3.5 font-medium text-charcoal-300">{formatPKR(order.total)}</td>
                      <td className="p-3.5">
                        <span className={inline-block px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider }>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-charcoal-200">{formatDate(order.created_at)}</td>
                      <td className="p-3.5 text-right">
                        <Link href={/admin/orders/} className="text-taupe-300 hover:text-charcoal-300 font-medium">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Quick Links */}
      <section className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/admin/products/new"
          className="bg-white border border-beige-200 rounded p-5 hover:border-taupe-200 transition-colors group"
        >
          <p className="text-xs font-sans uppercase tracking-widest text-taupe-200 mb-1">Products</p>
          <p className="font-serif text-lg text-charcoal-300 group-hover:text-taupe-300 transition-colors">Add New Product →</p>
        </Link>
        <Link
          href="/admin/orders?status=pending"
          className="bg-white border border-beige-200 rounded p-5 hover:border-taupe-200 transition-colors group"
        >
          <p className="text-xs font-sans uppercase tracking-widest text-taupe-200 mb-1">Orders</p>
          <p className="font-serif text-lg text-charcoal-300 group-hover:text-taupe-300 transition-colors">View Pending Orders →</p>
        </Link>
      </section>
    </div>
  )
}
