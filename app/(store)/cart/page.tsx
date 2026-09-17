'use client'

import Link from 'next/link'
import SafeImage from '@/components/ui/SafeImage'
import Button from '@/components/ui/Button'
import { useCart } from '@/context/CartContext'
import { formatPKR } from '@/lib/utils'
import { Minus, Plus, Trash2, ArrowRight } from 'lucide-react'
import { getCollectionImage } from '@/lib/collection-images'

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, subtotal, itemCount } = useCart()

  if (items.length === 0) {
    return (
      <div className="container-narrow py-20 text-center space-y-4">
        <h1 className="text-3xl font-serif text-charcoal-300">Your Bag is Empty</h1>
        <p className="text-xs text-charcoal-200 font-sans">
          Looks like you haven&apos;t added any eastern wear pieces to your shopping bag yet.
        </p>
        <div className="pt-4">
          <Link href="/shop">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container-wide py-10 md:py-16">
      <h1 className="text-3xl font-serif text-charcoal-300 mb-8">Shopping Bag ({itemCount})</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Cart Items */}
        <div className="lg:col-span-2 divide-y divide-beige-200 border-t border-b border-beige-200">
          {items.map((item) => (
            <div key={`${item.product_id}-${item.variant_id}`} className="py-6 flex gap-4 md:gap-6">
              <div className="relative w-24 h-32 bg-beige-100 flex-shrink-0">
                <SafeImage
                  src={item.image_url || getCollectionImage(item.slug).src}
                  fallbackSrc={getCollectionImage(item.slug).src}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <Link
                      href={`/shop/${item.slug}`}
                      className="font-serif text-base text-charcoal-300 hover:text-taupe-300 line-clamp-1"
                    >
                      {item.name}
                    </Link>
                    <button
                      onClick={() => removeItem(item.product_id, item.variant_id)}
                      className="text-taupe-200 hover:text-maroon-300 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-xs text-taupe-200 font-sans mt-1">Size: {item.size}</p>
                  <p className="text-sm font-sans font-medium text-charcoal-300 mt-2">
                    {formatPKR(item.sale_price ?? item.price)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-beige-200 bg-white">
                    <button
                      onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity - 1)}
                      className="p-1.5 text-charcoal-200 hover:text-charcoal-300"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-3 text-xs font-sans text-charcoal-300">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity + 1)}
                      className="p-1.5 text-charcoal-200 hover:text-charcoal-300"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="pt-4 flex justify-between">
            <button
              onClick={clearCart}
              className="text-xs text-taupe-300 hover:text-maroon-300 underline font-sans"
            >
              Clear Entire Bag
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-cream p-6 border border-beige-200 shadow-soft space-y-4">
          <h2 className="text-lg font-serif text-charcoal-300">Order Summary</h2>
          <div className="space-y-2 text-xs font-sans text-charcoal-200 divide-y divide-beige-200/60">
            <div className="flex justify-between pt-2">
              <span>Subtotal</span>
              <span className="font-medium text-charcoal-300">{formatPKR(subtotal)}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span>Estimated Delivery</span>
              <span className="text-taupe-300">Calculated at checkout</span>
            </div>
          </div>
          <div className="border-t border-beige-200 pt-4 flex justify-between items-center">
            <span className="font-serif text-base text-charcoal-300">Total</span>
            <span className="font-serif text-xl text-charcoal-300">{formatPKR(subtotal)}</span>
          </div>
          <Link href="/checkout" className="block pt-2">
            <Button className="w-full flex items-center justify-center gap-2" size="lg">
              Proceed to Checkout <ArrowRight size={16} />
            </Button>
          </Link>
          <p className="text-[11px] text-center text-taupe-300 font-sans">
            Taxes included. Cash on delivery and card/wallet options supported.
          </p>
        </div>
      </div>
    </div>
  )
}
