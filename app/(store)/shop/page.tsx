import ProductGrid from '@/components/store/ProductGrid'
import { collectionImages } from '@/lib/collection-images'
import { fetchPublishedProducts } from '@/lib/products'

export const dynamic = 'force-dynamic'

interface ShopPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const resolvedParams = await searchParams
  const query = typeof resolvedParams.q === 'string' ? resolvedParams.q : undefined
  const products = await fetchPublishedProducts({ search: query })

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
