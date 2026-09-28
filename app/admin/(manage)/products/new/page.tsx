import { requireAdmin } from '@/lib/admin-auth'
import { fetchActiveCategories } from '@/lib/products'
import ProductForm from '@/components/admin/ProductForm'
import Link from 'next/link'

export default async function NewProductPage() {
  await requireAdmin()
  const categories = await fetchActiveCategories()
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/admin/products" className="text-xs underline text-taupe-300">← Back to products</Link>
        <h1 className="section-heading mt-2">Add New Product</h1>
      </div>
      <ProductForm categories={categories} />
    </div>
  )
}