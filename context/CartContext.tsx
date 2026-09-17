'use client'

import React, { createContext, useContext, useEffect, useReducer } from 'react'
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
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] }

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'LOAD_CART':
      return { ...state, items: action.payload }

    case 'ADD_ITEM': {
      const existingIndex = state.items.findIndex(
        (i) =>
          i.product_id === action.payload.product_id &&
          i.variant_id === action.payload.variant_id
      )
      if (existingIndex > -1) {
        const updated = [...state.items]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: Math.min(updated[existingIndex].quantity + action.payload.quantity, 10),
        }
        return { ...state, items: updated }
      }
      return { ...state, items: [...state.items, action.payload] }
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
            ? { ...i, quantity: Math.min(action.payload.quantity, 10) }
            : i
        ),
      }
    }

    case 'CLEAR_CART':
      return { ...state, items: [] }

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

  // Load cart from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as CartItem[]
        if (Array.isArray(parsed)) {
          dispatch({ type: 'LOAD_CART', payload: parsed })
        }
      }
    } catch {
      localStorage.removeItem(CART_STORAGE_KEY)
    }
  }, [])

  // Persist cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items))
    } catch {
      // Storage full or unavailable
    }
  }, [state.items])

  const addItem = (item: CartItem, options?: AddItemOptions) => {
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
    dispatch({ type: 'UPDATE_QUANTITY', payload: { product_id, variant_id, quantity } })
  }

  const clearCart = () => dispatch({ type: 'CLEAR_CART' })
  const openCart = () => dispatch({ type: 'OPEN_CART' })
  const closeCart = () => dispatch({ type: 'CLOSE_CART' })

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = state.items.reduce(
    (sum, i) => sum + (i.sale_price ?? i.price) * i.quantity,
    0
  )

  return (
    <CartContext.Provider
      value={{
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
