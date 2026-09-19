'use client'

import React, { createContext, useCallback, useContext, useEffect, useReducer, useState } from 'react'
import { mergeCartItem, readCart, removePurchasedItems, storedCartItemSchema } from '@/lib/cart'
import type { CartItem } from '@/types'
import toast from 'react-hot-toast'

interface CartState {
  items: CartItem[]
  isOpen: boolean
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { product_id: string; variant_id: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { product_id: string; variant_id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'REMOVE_PURCHASED'; payload: CartItem[] }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] }

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'LOAD_CART':
      return { ...state, items: action.payload }

    case 'ADD_ITEM': {
      return { ...state, items: mergeCartItem(state.items, action.payload) }
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(
          (i) =>
            !(i.product_id === action.payload.product_id &&
              i.variant_id === action.payload.variant_id)
        ),
      }

    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(
            (i) =>
              !(i.product_id === action.payload.product_id &&
                i.variant_id === action.payload.variant_id)
          ),
        }
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.product_id === action.payload.product_id &&
          i.variant_id === action.payload.variant_id
            ? { ...i, quantity: Math.min(Math.floor(action.payload.quantity), i.stock ?? 10, 10) }
            : i
        ),
      }
    }

    case 'CLEAR_CART':
      return { ...state, items: [] }

    case 'REMOVE_PURCHASED':
      return { ...state, items: removePurchasedItems(state.items, action.payload) }

    case 'OPEN_CART':
      return { ...state, isOpen: true }

    case 'CLOSE_CART':
      return { ...state, isOpen: false }

    default:
      return state
  }
}

export interface AddItemOptions {
  openDrawer?: boolean
}

interface CartContextValue {
  ready: boolean
  removePurchased: (items: CartItem[]) => void
  items: CartItem[]
  isOpen: boolean
  addItem: (item: CartItem, options?: AddItemOptions) => void
  removeItem: (product_id: string, variant_id: string) => void
  updateQuantity: (product_id: string, variant_id: string, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  itemCount: number
  subtotal: number
}

const CartContext = createContext<CartContextValue | null>(null)

const CART_STORAGE_KEY = 'aabroze_cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false })
  const [ready, setReady] = useState(false)

  // Load cart from localStorage
  useEffect(() => {
    try {
      dispatch({ type: 'LOAD_CART', payload: readCart(localStorage.getItem(CART_STORAGE_KEY)) })
    } catch { /* Storage may be blocked. Keep the in-memory cart usable. */ }
    setReady(true)
  }, [])

  // Persist cart to localStorage
  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items))
    } catch {
      // Storage full or unavailable
    }
  }, [state.items, ready])

  const addItem = (item: CartItem, options?: AddItemOptions) => {
    if (!storedCartItemSchema.safeParse(item).success || item.quantity > (item.stock ?? 10)) {
      toast.error('Please select an available size and quantity')
      return
    }
    const existing = state.items.find((entry) => entry.variant_id === item.variant_id)
    if (!existing && state.items.length >= 50) {
      toast.error('Your bag can contain up to 50 different selections')
      return
    }
    if ((existing?.quantity ?? 0) + item.quantity > Math.min(item.stock ?? 10, 10)) {
      toast.error('Your bag already contains the available quantity for this size')
      return
    }
    dispatch({ type: 'ADD_ITEM', payload: item })
    toast.success(`${item.name} added to cart`)
    if (options?.openDrawer !== false) {
      dispatch({ type: 'OPEN_CART' })
    }
  }

  const removeItem = (product_id: string, variant_id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { product_id, variant_id } })
    toast.success('Item removed from cart')
  }

  const updateQuantity = (product_id: string, variant_id: string, quantity: number) => {
    if (!Number.isFinite(quantity)) return
    dispatch({ type: 'UPDATE_QUANTITY', payload: { product_id, variant_id, quantity } })
  }

  const clearCart = () => dispatch({ type: 'CLEAR_CART' })
  const openCart = () => dispatch({ type: 'OPEN_CART' })
  const closeCart = useCallback(() => dispatch({ type: 'CLOSE_CART' }), [])
  const removePurchased = (items: CartItem[]) => dispatch({ type: 'REMOVE_PURCHASED', payload: items })

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = state.items.reduce(
    (sum, i) => sum + (i.sale_price ?? i.price) * i.quantity,
    0
  )

  return (
    <CartContext.Provider
      value={{
        ready,
        removePurchased,
        items: state.items,
        isOpen: state.isOpen,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        openCart,
        closeCart,
        itemCount,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
