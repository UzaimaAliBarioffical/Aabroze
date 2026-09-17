'use client'

import Link from 'next/link'
import SafeImage from '@/components/ui/SafeImage'
import { X, Minus, Plus, ShoppingBag } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { formatPKR } from '@/lib/utils'
import { useEffect } from 'react'
import { getCollectionImage } from '@/lib/collection-images'

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal, itemCount } = useCart()

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-charcoal-400/60 backdrop-blur-sm"
          onClick={closeCart}
          aria-hidden
        />
      )}

      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white flex flex-col transition-transform duration-300 ease-out shadow-hover ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-beige-200">
          <h2 className="font-serif text-xl text-charcoal-300">
            Your Cart {itemCount > 0 && <span className="text-taupe-300 text-base">({itemCount})</span>}
          </h2>
          <button onClick={closeCart} aria-label="Close cart" className="p-1 text-charcoal-200 hover:text-charcoal-300">
            <X size={22} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
              <ShoppingBag size={40} className="text-beige-300" />
              <p className="font-serif text-lg text-charcoal-200">Your cart is empty</p>
              <p className="text-sm text-taupe-200 font-sans">Discover our latest collection</p>
              <button onClick={closeCart} className="btn-primary mt-2">
                <Link href="/shop">Shop Now</Link>
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-beige-200">
              {items.map((item) => (
                <li key={`${item.product_id}-${item.variant_id}`} className="flex gap-4 p-4">
                  <div className="relative w-20 h-28 flex-shrink-0 bg-beige-100">
                    <SafeImage
                      src={item.image_url || getCollectionImage(item.slug).src}
                      fallbackSrc={getCollectionImage(item.slug).src}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/shop/${item.slug}`}
                      onClick={closeCart}
                      className="font-serif text-sm text-charcoal-300 hover:text-taupe-300 line-clamp-2"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-taupe-200 font-sans mt-1">Size: {item.size}</p>
                    <p className="text-sm font-sans font-medium text-charcoal-300 mt-1">
                      {formatPKR(item.sale_price ?? item.price)}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-beige-200">
                        <button
                          onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity - 1)}
                          className="px-2 py-1 text-charcoal-200 hover:text-charcoal-300 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-3 text-sm font-sans text-charcoal-300 min-w-[2rem] text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity + 1)}
                          className="px-2 py-1 text-charcoal-200 hover:text-charcoal-300 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.product_id, item.variant_id)}
                        className="text-xs text-taupe-200 hover:text-maroon-300 font-sans transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-beige-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-sans text-sm text-charcoal-200">Subtotal</span>
              <span className="font-serif text-xl text-charcoal-300">{formatPKR(subtotal)}</span>
            </div>
            <p className="text-xs text-taupe-200 font-sans">Shipping calculated at checkout</p>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="btn-primary w-full text-center block"
            >
              Proceed to Checkout
            </Link>
            <Link
              href="/cart"
              onClick={closeCart}
              className="btn-secondary w-full text-center block"
            >
              View Cart
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
