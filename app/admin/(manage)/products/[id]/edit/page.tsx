import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireAdmin } from '@/lib/admin-auth'
import { fetchActiveCategories } from '@/lib/products'
import { PRODUCT_LIST_SELECT } from '@/lib/products'
import ProductForm from '@/components/admin/ProductForm'
import type { Product, ProductImage, ProductVariant } from '@/types'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await requireAdmin()
  const { id } = await params
  const categories = await fetchActiveCategories()

  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_LIST_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) return <p role="alert">Unable to load product. Please try again.</p>
  if (!data) notFound()

  const product = data as Product & { images: ProductImage[]; variants: ProductVariant[] }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/admin/products" className="text-xs underline text-taupe-300">← Back to products</Link>
        <h1 className="section-heading mt-2">Edit: {product.name}</h1>
        {product.is_archived && (
          <p className="text-xs text-red-600 mt-1 font-sans">This product is archived and hidden from the store.</p>
        )}
      </div>
      <ProductForm product={product} categories={categories} />
    </div>
  )
}