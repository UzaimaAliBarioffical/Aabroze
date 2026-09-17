import ProductCard from './ProductCard'
import type { Product } from '@/types'
import SafeImage from '@/components/ui/SafeImage'
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
            <article key={image.slug} className="group relative">
              <div className="product-image-wrapper">
                <SafeImage
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover"
                />
              </div>
              <div className="pt-3 pb-2">
                <h3 className="font-serif text-sm md:text-base text-charcoal-300 leading-snug">{image.name}</h3>
                <p className="text-xs text-taupe-200 font-sans mt-0.5">{image.color}</p>
              </div>
            </article>
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
