'use client'

import Link from 'next/link'
import SafeImage from '@/components/ui/SafeImage'
import { Heart } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { useWishlist } from '@/context/WishlistContext'
import { formatPKR, getDiscountPercent } from '@/lib/utils'
import type { Product } from '@/types'
import { cn } from '@/lib/utils'
import { getCollectionImage, getProductImage } from '@/lib/collection-images'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem, removeItem, isWishlisted } = useWishlist()
  const wishlisted = isWishlisted(product.id)

  const primaryImage = getProductImage(product)
  const secondaryImage = product.images?.[1]?.url
  const fallbackImage = getCollectionImage(product.slug).src

  const effectivePrice = product.sale_price ?? product.price
  const discount = product.sale_price ? getDiscountPercent(product.price, product.sale_price) : 0

  const inStock = product.variants?.some((v) => v.stock > 0) ?? true

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    if (wishlisted) {
      removeItem(product.id)
    } else {
      addItem({
        product_id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        sale_price: product.sale_price,
        image_url: primaryImage,
      })
    }
  }

  return (
    <div className="group relative">
      <Link href={`/shop/${product.slug}`} className="block">
        {/* Image */}
        <div className="product-image-wrapper">
          <SafeImage
            src={primaryImage}
            fallbackSrc={fallbackImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn('object-cover transition-opacity duration-500', secondaryImage && 'group-hover:opacity-0')}
          />
          {secondaryImage && (
            <SafeImage
              src={secondaryImage}
              fallbackSrc={fallbackImage}
              alt={`${product.name} — alternate view`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.is_new_arrival && <Badge variant="new">New</Badge>}
            {discount > 0 && <Badge variant="sale">-{discount}%</Badge>}
            {!inStock && <Badge variant="oos">Sold Out</Badge>}
          </div>

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white"
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              size={16}
              className={wishlisted ? 'fill-maroon-300 text-maroon-300' : 'text-charcoal-200'}
            />
          </button>
        </div>

        {/* Info */}
        <div className="pt-3 pb-2">
          <h3 className="font-serif text-sm md:text-base text-charcoal-300 leading-snug line-clamp-2">
            {product.name}
          </h3>
          {product.color && (
            <p className="text-xs text-taupe-200 font-sans mt-0.5">{product.color}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="font-sans text-sm font-medium text-charcoal-300">
              {formatPKR(effectivePrice)}
            </span>
            {product.sale_price && (
              <span className="font-sans text-xs text-taupe-200 line-through">
                {formatPKR(product.price)}
              </span>
            )}
          </div>
          {/* Available sizes */}
          {product.variants && product.variants.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {product.variants.map((v) => (
                <span
                  key={v.size}
                  className={cn(
                    'text-[10px] font-sans px-1.5 py-0.5 border',
                    v.stock > 0
                      ? 'border-beige-200 text-charcoal-200'
                      : 'border-beige-100 text-taupe-100 line-through'
                  )}
                >
                  {v.size}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </div>
  )
}
