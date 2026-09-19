import ProductCard from './ProductCard'
import type { Product } from '@/types'
import type { CollectionImage } from '@/lib/collection-images'

interface ProductGridProps {
  products: Product[]
  previewImages?: CollectionImage[]
}

export default function ProductGrid({ products, previewImages }: ProductGridProps) {
  if (!products || products.length === 0) {
    if (previewImages && previewImages.length > 0) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {previewImages.map((image) => (
            <ProductCard key={image.slug} preview={image} />
          ))}
        </div>
      )
    }

    return (
      <div className="text-center py-16">
        <p className="font-serif text-lg text-charcoal-200">No products found</p>
        <p className="text-xs text-taupe-200 font-sans mt-1">Check back soon for new additions to this collection.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
