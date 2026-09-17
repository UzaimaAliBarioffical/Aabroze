'use client'

import Link from 'next/link'
import SafeImage from '@/components/ui/SafeImage'
import Button from '@/components/ui/Button'
import { useWishlist } from '@/context/WishlistContext'
import { formatPKR } from '@/lib/utils'
import { getCollectionImage } from '@/lib/collection-images'

export default function WishlistPage() {
  const { items, removeItem } = useWishlist()

  if (items.length === 0) {
    return (
      <div className="container-narrow py-20 text-center space-y-4">
        <h1 className="text-3xl font-serif text-charcoal-300">Your Wishlist</h1>
        <p className="text-xs text-charcoal-200 font-sans">Save pieces you love to revisit later.</p>
        <Link href="/shop">
          <Button>Browse the Collection</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container-wide py-10 md:py-16">
      <h1 className="text-3xl font-serif text-charcoal-300 mb-8">Wishlist ({items.length})</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {items.map((item) => (
          <article key={item.product_id} className="space-y-2">
            <Link href={`/shop/${item.slug}`} className="block product-image-wrapper">
              <SafeImage
                src={item.image_url || getCollectionImage(item.slug).src}
                fallbackSrc={getCollectionImage(item.slug).src}
                alt={item.name}
                fill
                className="object-cover"
              />
            </Link>
            <Link href={`/shop/${item.slug}`} className="font-serif text-sm text-charcoal-300 line-clamp-2">
              {item.name}
            </Link>
            <p className="text-xs font-sans text-charcoal-300">{formatPKR(item.sale_price ?? item.price)}</p>
            <button
              type="button"
              onClick={() => removeItem(item.product_id)}
              className="text-[11px] font-sans text-taupe-200 hover:text-maroon-300"
            >
              Remove
            </button>
          </article>
        ))}
      </div>
    </div>
  )
}
