import Link from 'next/link'
import OrderTable from '@/OrderTable'
import { requireAdmin } from '@/lib/admin-auth'
import { orderStatusSchema } from '@/lib/zod-schemas'
import type { Order } from '@/types'

export default async function AdminOrdersPage({ searchParams }: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const supabase = await requireAdmin()
  const params = await searchParams
  const filter = orderStatusSchema.shape.status.safeParse(params.status)
  const parsedPage = Number(params.page)
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? Math.min(parsedPage, 100000) : 1
  let query = supabase.from('orders').select('*', { count: 'exact' })
    .order('created_at', { ascending: false }).order('id', { ascending: false })
    .range((page - 1) * 25, page * 25 - 1)
  if (filter.success) query = query.eq('status', filter.data)
  const { data, error, count } = await query
  const pageUrl = (value: number) => `/admin/orders?page=${value}${filter.success ? `&status=${filter.data}` : ''}`
  return <div className="space-y-6">
    <h1 className="section-heading">Orders</h1>
    <form className="flex flex-wrap items-end gap-3">
      <label className="text-xs font-sans">Filter by status
        <select name="status" defaultValue={filter.success ? filter.data : ''} className="form-input mt-2">
          <option value="">All orders</option>
          {orderStatusSchema.shape.status.options.map(status => <option key={status} value={status}>{status}</option>)}
        </select>
      </label>
      <button className="btn-secondary" type="submit">Filter</button>
    </form>
    {error ? <p role="alert">Unable to load orders. Check the database connection and try again.</p>
      : data?.length ? <OrderTable orders={data as Order[]} /> : <p>No orders found.</p>}
    <nav aria-label="Order pages" className="flex gap-4 text-sm">
      {page > 1 && <Link href={pageUrl(page - 1)}>Previous</Link>}
      <span>Page {page}</span>
      {count !== null && page * 25 < count && <Link href={pageUrl(page + 1)}>Next</Link>}
    </nav>
  </div>
}
