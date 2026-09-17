'use client'

import { useEffect, useMemo, useState } from 'react'
import Modal from '@/components/ui/Modal'
import SafeImage from '@/components/ui/SafeImage'
import Button from '@/components/ui/Button'
import { Minus, Plus } from 'lucide-react'
import { formatPKR } from '@/lib/utils'
import { getCollectionImage, getProductImage } from '@/lib/collection-images'
import { getVariantUnitPrice, isUuid, sortVariants } from '@/lib/pricing'
import type { CartItem, Product, ProductVariant } from '@/types'

export type VariantModalIntent = 'cart' | 'buy-now'

interface VariantSelectModalProps {
  product: Product | null
  isOpen: boolean
  intent: VariantModalIntent
  onClose: () => void
  onConfirm: (item: CartItem) => void
}

export default function VariantSelectModal({
  product,
  isOpen,
  intent,
  onClose,
  onConfirm,
}: VariantSelectModalProps) {
  const [selectedVariantId, setSelectedVariantId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const variants = useMemo(
    () => (product?.variants ? sortVariants(product.variants) : []),
    [product]
  )

  const inStockVariants = variants.filter((v) => v.stock > 0 && isUuid(v.id))

  useEffect(() => {
    if (!isOpen || !product) return
    setError('')
    setSubmitting(false)
    const only = inStockVariants.length === 1 ? inStockVariants[0].id : ''
    setSelectedVariantId(only)
    setQuantity(1)
  }, [isOpen, product?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!product) return null

  const selectedVariant: ProductVariant | undefined = variants.find(
    (v) => v.id === selectedVariantId
  )
  const unitPrice = getVariantUnitPrice(product, selectedVariant)
  const maxQty = selectedVariant ? Math.min(selectedVariant.stock, 10) : 1
  const image = getProductImage(product)
  const fallback = getCollectionImage(product.slug).src

  const handleConfirm = () => {
    if (!selectedVariant || selectedVariant.stock <= 0) {
      setError('Please select an available size')
      return
    }
    if (!isUuid(product.id) || !isUuid(selectedVariant.id)) {
      setError('This product cannot be purchased yet')
      return
    }
    const qty = Math.min(Math.max(1, quantity), maxQty)
    setSubmitting(true)

    const item: CartItem = {
      product_id: product.id,
      variant_id: selectedVariant.id,
      name: product.name,
      slug: product.slug,
      size: selectedVariant.size,
      price: selectedVariant.price != null ? unitPrice : product.price,
      sale_price:
        selectedVariant.price != null
          ? null
          : product.sale_price,
      image_url: image,
      quantity: qty,
    }

    onConfirm(item)
    setSubmitting(false)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={intent === 'buy-now' ? 'Buy Now' : 'Select Size'}
      size="lg"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="relative aspect-[3/4] bg-beige-100 overflow-hidden">
          <SafeImage src={image} fallbackSrc={fallback} alt={product.name} fill className="object-cover" />
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-serif text-lg text-charcoal-300">{product.name}</h3>
            {product.color && (
              <p className="text-xs text-taupe-200 font-sans mt-1">Colour: {product.color}</p>
            )}
            <p className="font-sans text-base font-medium text-charcoal-300 mt-2">
              {formatPKR(unitPrice)}
            </p>
          </div>

          <fieldset>
            <legend className="text-xs uppercase tracking-wider font-sans font-medium text-charcoal-300 mb-2">
              Size
            </legend>
            {variants.length === 0 ? (
              <p className="text-xs text-taupe-200 font-sans">Sizes are not available for this piece yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2" role="listbox" aria-label="Available sizes">
                {variants.map((variant) => {
                  const available = variant.stock > 0 && isUuid(variant.id)
                  const selected = selectedVariantId === variant.id
                  const variantPrice = getVariantUnitPrice(product, variant)
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      disabled={!available}
                      onClick={() => {
                        setSelectedVariantId(variant.id)
                        setQuantity(1)
                        setError('')
                      }}
                      className={`min-w-[4.5rem] px-3 py-2 text-xs font-sans border text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal-300 ${
                        selected
                          ? 'border-charcoal-300 bg-charcoal-300 text-cream-100'
                          : available
                            ? 'border-beige-300 text-charcoal-300 hover:border-charcoal-300'
                            : 'border-beige-100 text-taupe-100 line-through cursor-not-allowed'
                      }`}
                    >
                      <span className="block uppercase tracking-wider">{variant.size}</span>
                      <span className="block text-[10px] mt-0.5 opacity-80">
                        {available ? formatPKR(variantPrice) : 'Out of stock'}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
            {selectedVariant && selectedVariant.stock > 0 && (
              <p className="text-[11px] text-taupe-200 font-sans mt-2">
                {selectedVariant.stock <= 3
                  ? `Only ${selectedVariant.stock} left`
                  : `${selectedVariant.stock} in stock`}
              </p>
            )}
          </fieldset>

          <div>
            <label htmlFor="variant-qty" className="text-xs uppercase tracking-wider font-sans font-medium text-charcoal-300 mb-2 block">
              Quantity
            </label>
            <div className="inline-flex items-center border border-beige-200 bg-white">
              <button
                type="button"
                aria-label="Decrease quantity"
                disabled={!selectedVariant || quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2 text-charcoal-200 hover:text-charcoal-300 disabled:opacity-40"
              >
                <Minus size={14} />
              </button>
              <input
                id="variant-qty"
                type="number"
                min={1}
                max={maxQty}
                value={quantity}
                onChange={(e) => {
                  const next = Number(e.target.value)
                  if (!Number.isFinite(next)) return
                  setQuantity(Math.min(maxQty, Math.max(1, next)))
                }}
                className="w-12 text-center text-sm font-sans text-charcoal-300 bg-transparent border-0 focus:outline-none"
                aria-label="Quantity"
              />
              <button
                type="button"
                aria-label="Increase quantity"
                disabled={!selectedVariant || quantity >= maxQty}
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                className="p-2 text-charcoal-200 hover:text-charcoal-300 disabled:opacity-40"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <Button
            type="button"
            className="w-full"
            size="lg"
            loading={submitting}
            disabled={!selectedVariant || selectedVariant.stock <= 0 || submitting}
            onClick={handleConfirm}
          >
            {intent === 'buy-now' ? 'Continue to Checkout' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
