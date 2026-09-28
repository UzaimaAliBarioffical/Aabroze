'use client'
import { createContext, useCallback, useContext, useState } from 'react'
import type { Product } from '@/types'
import type { CollectionImage } from '@/lib/collection-images'
import OrderCheckoutModal from '@/components/store/OrderCheckoutModal'

export type CheckoutSource = { product?: Product; preview?: CollectionImage; size?: string; quantity?: number; mode?: 'cart' | 'checkout' }
const Context = createContext<{ openCheckout: (source?: CheckoutSource) => void } | null>(null)
export function OrderRequestProvider({ children }: { children: React.ReactNode }) {
  const [source, setSource] = useState<CheckoutSource | null>(null)
  const openCheckout = useCallback((next: CheckoutSource = {}) => setSource(next), [])
  return <Context.Provider value={{ openCheckout }}>{children}
    {source && <OrderCheckoutModal source={source} onClose={() => setSource(null)} />}
  </Context.Provider>
}
export function useOrderRequest() {
  const value = useContext(Context)
  if (!value) throw new Error('OrderRequestProvider is required')
  return value
}
