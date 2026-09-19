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
import { getCollectionImage, getProductImage, type CollectionImage } from '@/lib/collection-images'
import { getProductPriceRange, isRealPurchasableProduct } from '@/lib/pricing'
import { resolveCardProduct } from '@/actions/product-card'
import type { CartItem, Product } from '@/types'
import { saveBuyNow } from '@/lib/cart'
import toast from 'react-hot-toast'

type ProductCardProps = ({ product: Product; preview?: never } | { preview: CollectionImage; product?: never }) & { details?: boolean }

export default function ProductCard({ product: suppliedProduct, preview, details = true }: ProductCardProps) {
  const CardElement = details ? 'article' : 'div'
  const [resolvedProduct, setResolvedProduct] = useState<Product | null>(null)
  const product = suppliedProduct ?? resolvedProduct
  const entry = product ?? preview!
  const [availabilityMessage, setAvailabilityMessage] = useState('')
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

  const wishlisted = product ? isWishlisted(product.id) : false
  const primaryImage = product ? getProductImage(product) : preview!.src
  const secondaryImage = product?.images?.[1]?.url
  const fallbackImage = getCollectionImage(entry.slug).src
  const priceRange = product ? getProductPriceRange(product) : null
  const discount = product?.sale_price != null && !priceRange?.hasVariantPrices
    ? getDiscountPercent(product.price, product.sale_price)
    : 0

  const purchasable = product ? isRealPurchasableProduct(product) : false
  const inStock = product?.variants?.some((variant) => variant.stock > 0) ?? false
  const canPurchase = purchasable && inStock

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!product) return
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

  const openModal = async (nextIntent: VariantModalIntent, e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (pending) return
    setAvailabilityMessage('')
    if (!product) {
      setPending(nextIntent)
      try {
        const found = await resolveCardProduct(entry.slug)
        if (!found) {
          setAvailabilityMessage('Price and sizes are currently unavailable. Please try again later.')
          return
        }
        setResolvedProduct(found)
      } catch {
        setAvailabilityMessage('Unable to load available sizes. Please try again.')
        return
      } finally { setPending(null) }
    } else if (!canPurchase) return
    setIntent(nextIntent)
    setModalOpen(true)
  }

  const handleConfirm = (item: CartItem) => {
    if (intent === 'buy-now') {
      setPending('buy-now')
      if (!saveBuyNow(item)) {
        toast.error('Please enable browser storage to use Buy Now')
        setPending(null)
        return
      }
      setModalOpen(false)
      router.push('/checkout?mode=buy-now')
      return
    }
    setPending('cart')
    addCartItem(item)
    setModalOpen(false)
    setPending(null)
  }

  return (
    <CardElement className="group relative flex flex-col" data-product-slug={entry.slug}>
      {details && <div className="block">
        <div className="product-image-wrapper">
          <SafeImage
            src={primaryImage}
            fallbackSrc={fallbackImage}
            alt={entry.name}
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
              alt={`${entry.name} — alternate view`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
          )}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product?.is_new_arrival && <Badge variant="new">New</Badge>}
            {discount > 0 && <Badge variant="sale">-{discount}%</Badge>}
            {product && !inStock && <Badge variant="oos">Sold Out</Badge>}
          </div>
          {product && <Link href={`/shop/${product.slug}`} className="absolute inset-0" aria-label={`View ${product.name}`} />}
          {product && <button
            type="button"
            onClick={handleWishlist}
            className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white focus-visible:opacity-100"
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              size={16}
              className={wishlisted ? 'fill-maroon-300 text-maroon-300' : 'text-charcoal-200'}
            />
          </button>}
        </div>

        <div className="pt-3">
          <h3 className="font-serif text-sm md:text-base text-charcoal-300 leading-snug line-clamp-2">
            {product ? <Link href={`/shop/${product.slug}`}>{product.name}</Link> : entry.name}
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-1.5" data-product-price>
            <span className="font-sans text-sm font-medium text-charcoal-300">
              {priceRange ? `${priceRange.min !== priceRange.max ? 'From ' : ''}${formatPKR(priceRange.min)}` : 'Price unavailable'}
            </span>
            {product && discount > 0 && (
              <span className="font-sans text-xs text-taupe-200 line-through">
                {formatPKR(product.price)}
              </span>
            )}
          </div>
          {entry.color && (
            <p className="text-xs text-taupe-200 font-sans mt-0.5">{entry.color}</p>
          )}
        </div>
      </div>}

      <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2 mt-auto pt-3 pb-2">
        <button
          type="button"
          onClick={(e) => openModal('cart', e)}
          aria-label="Add to Cart"
          disabled={(!!product && !canPurchase) || pending !== null}
          className="btn-secondary px-2 py-2.5 text-[10px] md:text-xs tracking-wider disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal-300"
        >
          {pending === 'cart' ? 'Loading…' : 'ADD TO CART'}
        </button>
        <button
          type="button"
          onClick={(e) => openModal('buy-now', e)}
          aria-label="Buy Now"
          disabled={(!!product && !canPurchase) || pending !== null}
          className="btn-primary px-2 py-2.5 text-[10px] md:text-xs tracking-wider disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal-300"
        >
          {pending === 'buy-now' ? 'Loading…' : 'BUY NOW'}
        </button>
      </div>
      {availabilityMessage && <p role="status" className="text-xs font-sans text-charcoal-200 pb-2">{availabilityMessage}</p>}

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
    </CardElement>
  )
}
