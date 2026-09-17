'use client'

import Modal from '@/components/ui/Modal'
import SafeImage from '@/components/ui/SafeImage'
import Button from '@/components/ui/Button'
import { formatPKR } from '@/lib/utils'
import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import type { Product } from '@/types'
import { getCollectionImage, getProductImage } from '@/lib/collection-images'

interface QuickViewProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
}

export default function QuickView({ product, isOpen, onClose }: QuickViewProps) {
  const [selectedSize, setSelectedSize] = useState<string>('')
  const { addItem } = useCart()

  if (!product) return null

  const primaryImage = getProductImage(product)

  const handleAddToCart = () => {
    if (!selectedSize) return
    const variant = product.variants?.find((v) => v.size === selectedSize)
    if (!variant) return

    addItem({
      product_id: product.id,
      variant_id: variant.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      sale_price: product.sale_price,
      size: selectedSize,
      image_url: primaryImage,
      quantity: 1,
    })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={product.name} size="lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="relative aspect-[3/4] bg-beige-100 overflow-hidden">
          <SafeImage
            src={primaryImage}
            fallbackSrc={getCollectionImage(product.slug).src}
            alt={product.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="space-y-4">
          <p className="text-xl font-serif text-charcoal-300">
            {formatPKR(product.sale_price ?? product.price)}
          </p>
          <p className="text-xs text-charcoal-200 font-sans leading-relaxed">
            {product.description}
          </p>

          <div>
            <label className="text-xs uppercase tracking-wider font-sans block mb-2 font-medium">Select Size</label>
            <div className="flex gap-2">
              {product.variants?.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedSize(v.size)}
                  className={`px-3 py-1 text-xs border transition-colors ${
                    selectedSize === v.size
                      ? 'border-charcoal-300 bg-charcoal-300 text-cream-100'
                      : 'border-beige-200 text-charcoal-300 hover:border-charcoal-300'
                  }`}
                >
                  {v.size}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={!selectedSize}
            className="w-full mt-4"
          >
            {selectedSize ? 'Add to Bag' : 'Select a Size'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
