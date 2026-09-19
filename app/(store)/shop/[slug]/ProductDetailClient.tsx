'use client'

import { useState } from 'react'
import SafeImage from '@/components/ui/SafeImage'
import Button from '@/components/ui/Button'
import SizeGuide from '@/components/store/SizeGuide'
import { formatPKR, getDiscountPercent } from '@/lib/utils'
import { getVariantUnitPrice, isUuid, sortVariants } from '@/lib/pricing'
import { saveBuyNow } from '@/lib/cart'
import toast from 'react-hot-toast'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import { Heart, Truck, RotateCcw, ShieldCheck } from 'lucide-react'
import type { Product } from '@/types'
import { getCollectionImage, getProductImage } from '@/lib/collection-images'
import { useRouter } from 'next/navigation'

export default function ProductDetailClient({ product }: { product: Product }) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false)

  const { addItem } = useCart()
  const router = useRouter()
  const { addItem: addWishlist, removeItem: removeWishlist, isWishlisted } = useWishlist()
  const wishlisted = isWishlisted(product.id)

  const primaryImage = getProductImage(product)
  const fallbackImage = getCollectionImage(product.slug).src
  const images = product.images && product.images.length > 0
    ? product.images
    : [{ id: product.id, url: primaryImage }]

  const selectedVariant = product.variants?.find((v) => v.size === selectedSize)
  const effectivePrice = getVariantUnitPrice(product, selectedVariant)
  const discount = selectedVariant?.price == null && product.sale_price ? getDiscountPercent(product.price, product.sale_price) : 0
  const maxQuantity = Math.min(selectedVariant?.stock ?? 0, 10)
  const canPurchase = !!selectedVariant && isUuid(product.id) && isUuid(selectedVariant.id) && maxQuantity > 0

  const handleAddToCart = (buyNow = false) => {
    if (!selectedSize) return
    const variant = product.variants?.find((v) => v.size === selectedSize)
    if (!variant || !canPurchase || quantity > maxQuantity) return

    const item = {
      product_id: product.id,
      variant_id: variant.id,
      name: product.name,
      slug: product.slug,
      price: effectivePrice,
      sale_price: null,
      size: selectedSize,
      image_url: primaryImage,
      quantity,
      stock: variant.stock,
    }
    if (buyNow) {
      if (!saveBuyNow(item)) { toast.error('Please enable browser storage to use Buy Now'); return }
      router.push('/checkout?mode=buy-now')
    } else addItem(item)
  }

  const handleWishlistToggle = () => {
    if (wishlisted) {
      removeWishlist(product.id)
    } else {
      addWishlist({
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
    <div className="container-wide py-10 md:py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-start">
        {/* Images Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-[3/4] bg-beige-100 overflow-hidden shadow-soft">
            <SafeImage
              src={images[selectedImage]?.url || primaryImage}
              fallbackSrc={fallbackImage}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative aspect-[3/4] bg-beige-100 overflow-hidden border-2 transition-all ${
                    selectedImage === idx ? 'border-charcoal-300' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <SafeImage src={img.url || primaryImage} fallbackSrc={fallbackImage} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <p className="text-xs font-sans tracking-widest uppercase text-taupe-300">
              {product.fabric || 'Eastern Pret'}
            </p>
            <h1 className="text-2xl md:text-4xl font-serif text-charcoal-300 mt-1">
              {product.name}
            </h1>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-xl md:text-2xl font-sans font-medium text-charcoal-300">
                {formatPKR(effectivePrice)}
              </span>
              {discount > 0 && (
                <span className="text-sm font-sans text-taupe-200 line-through">
                  {formatPKR(product.price)}
                </span>
              )}
              {discount > 0 && (
                <span className="badge-sale">Save {discount}%</span>
              )}
            </div>
          </div>

          <div className="border-t border-b border-beige-200 py-4 space-y-2">
            <p className="text-xs text-charcoal-200 font-sans leading-relaxed">
              {product.description}
            </p>
            {product.care_instructions && (
              <p className="text-[11px] text-taupe-300 font-sans">
                <strong>Care:</strong> {product.care_instructions}
              </p>
            )}
          </div>

          {/* Size Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider font-sans font-medium text-charcoal-300">
                Select Size: {selectedSize && <span className="font-bold">{selectedSize}</span>}
              </span>
              <button
                onClick={() => setSizeGuideOpen(true)}
                className="text-xs text-taupe-300 underline font-sans hover:text-charcoal-300"
              >
                Size Guide
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {sortVariants(product.variants ?? []).map((v) => {
                const available = v.stock > 0 && isUuid(v.id)
                return (
                  <button
                    key={v.id}
                    disabled={!available}
                    onClick={() => { setSelectedSize(v.size); setQuantity(1) }}
                    aria-pressed={selectedSize === v.size}
                    title={available ? formatPKR(getVariantUnitPrice(product, v)) : 'Out of stock'}
                    className={`size-btn ${selectedSize === v.size ? 'selected' : ''}`}
                  >
                    {v.size}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 text-xs font-sans text-charcoal-200">
            <p>{selectedVariant ? (maxQuantity > 0 ? `${selectedVariant.stock} in stock` : 'Out of stock') : 'Select an available size'}</p>
            <label className="flex items-center gap-3">Quantity
              <input type="number" min={1} max={maxQuantity || 1} value={quantity} disabled={!canPurchase}
                onChange={(event) => setQuantity(Math.max(1, Math.min(maxQuantity, Math.floor(Number(event.target.value) || 1))))}
                className="w-20 border border-beige-200 p-2" />
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => handleAddToCart()}
              disabled={!canPurchase}
              className="flex-1"
              size="lg"
            >
              {selectedSize ? 'Add to Bag' : 'Select Size to Order'}
            </Button>
            <button
              onClick={handleWishlistToggle}
              className="p-3 border border-charcoal-300 hover:bg-beige-100 transition-colors"
              aria-label="Wishlist"
            >
              <Heart
                size={20}
                className={wishlisted ? 'fill-maroon-300 text-maroon-300' : 'text-charcoal-300'}
              />
            </button>
          </div>
          <Button className="w-full" size="lg" disabled={!canPurchase} onClick={() => handleAddToCart(true)}>Buy Now</Button>

          {/* Reassurance Features */}
          <div className="pt-4 grid grid-cols-3 gap-2 border-t border-beige-200 text-center">
            <div className="space-y-1 p-2">
              <Truck size={18} className="mx-auto text-taupe-300" />
              <p className="text-[10px] uppercase tracking-wider font-sans text-charcoal-200">Express Delivery</p>
            </div>
            <div className="space-y-1 p-2">
              <ShieldCheck size={18} className="mx-auto text-taupe-300" />
              <p className="text-[10px] uppercase tracking-wider font-sans text-charcoal-200">100% Authentic</p>
            </div>
            <div className="space-y-1 p-2">
              <RotateCcw size={18} className="mx-auto text-taupe-300" />
              <p className="text-[10px] uppercase tracking-wider font-sans text-charcoal-200">Easy Exchange</p>
            </div>
          </div>
        </div>
      </div>

      <SizeGuide isOpen={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
    </div>
  )
}
