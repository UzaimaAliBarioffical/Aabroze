import { createSupabaseServerClient } from '@/lib/supabase/server'
import ProductGrid from '@/components/store/ProductGrid'
import { collectionImages } from '@/lib/collection-images'
import type { Product } from '@/types'

export const dynamic = 'force-dynamic'

interface ShopPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const resolvedParams = await searchParams
  const query = typeof resolvedParams.q === 'string' ? resolvedParams.q : undefined

  let products: Product[] = []
  try {
    const supabase = await createSupabaseServerClient()
    let req = supabase
      .from('products')
      .select('*, images:product_images(*), variants:product_variants(*)')
      .eq('is_active', true)

    if (query) {
      req = req.ilike('name', `%${query}%`)
    }

    const { data } = await req.order('created_at', { ascending: false })
    if (data) products = data as Product[]
  } catch {
    products = []
  }

  return (
    <div className="container-wide py-10 md:py-16">
      <div className="text-center space-y-2 mb-10">
        <p className="section-subheading">All Attire</p>
        <h1 className="section-heading">Shop the Collection</h1>
        {query && (
          <p className="text-xs font-sans text-taupe-300">
            Search results for &quot;{query}&quot;
          </p>
        )}
      </div>

      <ProductGrid products={products} previewImages={query ? undefined : collectionImages} />
    </div>
  )
}
