import Link from 'next/link'
import { requireAdmin } from '@/lib/admin-auth'
import { PRODUCT_LIST_SELECT } from '@/lib/products'
import ProductTable from '@/components/admin/ProductTable'
import type { Product } from '@/types'

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>
}) {
  const supabase = await requireAdmin()
  const params = await searchParams
  const search = params.q?.trim() ?? ''
  const statusFilter = params.status ?? 'all'
  const parsedPage = Number(params.page)
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? Math.min(parsedPage, 100000) : 1
  const perPage = 25

  let query = supabase
    .from('products')
    .select(PRODUCT_LIST_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1)

  if (search) query = query.ilike('name', `%${search}%`)
  if (statusFilter === 'published') query = query.eq('is_published', true).eq('is_archived', false)
  else if (statusFilter === 'draft') query = query.eq('is_published', false).eq('is_archived', false)
  else if (statusFilter === 'archived') query = query.eq('is_archived', true)
  else query = query.eq('is_archived', false)

  const { data, error, count } = await query
  const pageUrl = (p: number) => {
    const q = search ? `&q=${encodeURIComponent(search)}` : ''
    const s = statusFilter !== 'all' ? `&status=${statusFilter}` : ''
    return `/admin/products?page=${p}${q}${s}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="section-heading">Products</h1>
        <Link href="/admin/products/new" className="btn-primary text-sm">
          + Add Product
        </Link>
      </div>

      <form className="flex flex-wrap gap-3 items-end">
        <label className="text-xs font-sans">
          Search
          <input
            name="q"
            defaultValue={search}
            placeholder="Product name..."
            className="form-input mt-2 w-48"
          />
        </label>
        <label className="text-xs font-sans">
          Status
          <select name="status" defaultValue={statusFilter} className="form-input mt-2">
            <option value="all">All (excl. archived)</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <button className="btn-secondary" type="submit">Filter</button>
        {(search || statusFilter !== 'all') && (
          <Link href="/admin/products" className="text-xs underline text-taupe-300 self-end pb-3">Clear</Link>
        )}
      </form>

      {error ? (
        <p role="alert">Unable to load products. Check the database connection.</p>
      ) : data?.length ? (
        <ProductTable products={data as Product[]} />
      ) : (
        <p className="text-sm text-charcoal-100">No products found.</p>
      )}

      <nav aria-label="Products pages" className="flex gap-4 text-sm">
        {page > 1 && <Link href={pageUrl(page - 1)}>Previous</Link>}
        <span>Page {page}</span>
        {count !== null && page * perPage < count && <Link href={pageUrl(page + 1)}>Next</Link>}
      </nav>
    </div>
  )
}