'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SafeImage from '@/components/ui/SafeImage'
import { Heart } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import VariantSelectModal, { type VariantModalIntent } from '@/components/store/VariantSelectModal'
import { useWishlist } from '@/context/WishlistContext'
import { useCart } from '@/context/CartContext'
import { formatPKR, getDiscountPercent, cn } from '@/lib/utils'
import { getCollectionImage, getProductImage } from '@/lib/collection-images'
import { isRealPurchasableProduct } from '@/lib/pricing'
import type { CartItem, Product } from '@/types'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter()
  const {
    addItem: addWishlistItem,
    removeItem: removeWishlistItem,
    isWishlisted,
  } = useWishlist()
  const { addItem: addCartItem } = useCart()

  const [modalOpen, setModalOpen] = useState(false)
  const [intent, setIntent] = useState<VariantModalIntent>('cart')
  const [pending, setPending] = useState<'cart' | 'buy-now' | null>(null)

  const wishlisted = isWishlisted(product.id)
  const primaryImage = getProductImage(product)
  const secondaryImage = product.images?.[1]?.url
  const fallbackImage = getCollectionImage(product.slug).src
  const effectivePrice = product.sale_price ?? product.price
  const discount = product.sale_price
    ? getDiscountPercent(product.price, product.sale_price)
    : 0

  const purchasable = isRealPurchasableProduct(product)
  const inStock = product.variants?.some((variant) => variant.stock > 0) ?? false
  const canPurchase = purchasable && inStock

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (wishlisted) {
      removeWishlistItem(product.id)
    } else {
      addWishlistItem({
        product_id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        sale_price: product.sale_price,
        image_url: primaryImage,
      })
    }
  }

  const openModal = (nextIntent: VariantModalIntent, e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!canPurchase) return
    setIntent(nextIntent)
    setModalOpen(true)
  }

  const handleConfirm = (item: CartItem) => {
    if (intent === 'buy-now') {
      setPending('buy-now')
      addCartItem(item, { openDrawer: false })
      setModalOpen(false)
      router.push('/checkout')
      return
    }
    setPending('cart')
    addCartItem(item)
    setModalOpen(false)
    setPending(null)
  }

  return (
    <div className="group relative">
      <Link href={`/shop/${product.slug}`} className="block">
        <div className="product-image-wrapper">
          <SafeImage
            src={primaryImage}
            fallbackSrc={fallbackImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn(
              'object-cover transition-opacity duration-500',
              secondaryImage && 'group-hover:opacity-0'
            )}
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
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.is_new_arrival && <Badge variant="new">New</Badge>}
            {discount > 0 && <Badge variant="sale">-{discount}%</Badge>}
            {!inStock && <Badge variant="oos">Sold Out</Badge>}
          </div>
          <button
            type="button"
            onClick={handleWishlist}
            className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white focus-visible:opacity-100"
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              size={16}
              className={wishlisted ? 'fill-maroon-300 text-maroon-300' : 'text-charcoal-200'}
            />
          </button>
        </div>

        <div className="pt-3">
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
        </div>
      </Link>

      <div className="grid grid-cols-2 gap-2 mt-3 pb-2">
        <button
          type="button"
          onClick={(e) => openModal('cart', e)}
          disabled={!canPurchase || pending !== null}
          className="btn-secondary px-2 py-2.5 text-[10px] md:text-xs tracking-wider disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal-300"
        >
          {pending === 'cart' ? 'Adding…' : 'Add to Cart'}
        </button>
        <button
          type="button"
          onClick={(e) => openModal('buy-now', e)}
          disabled={!canPurchase || pending !== null}
          className="btn-primary px-2 py-2.5 text-[10px] md:text-xs tracking-wider disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal-300"
        >
          {pending === 'buy-now' ? 'Loading…' : 'Buy Now'}
        </button>
      </div>

      <VariantSelectModal
        product={product}
        isOpen={modalOpen}
        intent={intent}
        onClose={() => {
          setModalOpen(false)
          setPending(null)
        }}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
