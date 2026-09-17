'use client'

import React, { createContext, useContext, useEffect, useReducer } from 'react'
import toast from 'react-hot-toast'

interface WishlistItem {
  product_id: string
  name: string
  slug: string
  price: number
  sale_price: number | null
  image_url: string
}

interface WishlistState {
  items: WishlistItem[]
}

type WishlistAction =
  | { type: 'ADD'; payload: WishlistItem }
  | { type: 'REMOVE'; payload: string }
  | { type: 'LOAD'; payload: WishlistItem[] }

function wishlistReducer(state: WishlistState, action: WishlistAction): WishlistState {
  switch (action.type) {
    case 'LOAD':
      return { items: action.payload }
    case 'ADD':
      if (state.items.some((i) => i.product_id === action.payload.product_id)) return state
      return { items: [...state.items, action.payload] }
    case 'REMOVE':
      return { items: state.items.filter((i) => i.product_id !== action.payload) }
    default:
      return state
  }
}

interface WishlistContextValue {
  items: WishlistItem[]
  addItem: (item: WishlistItem) => void
  removeItem: (product_id: string) => void
  isWishlisted: (product_id: string) => boolean
  count: number
}

const WishlistContext = createContext<WishlistContextValue | null>(null)
const WISHLIST_KEY = 'aabroze_wishlist'

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(wishlistReducer, { items: [] })

  useEffect(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_KEY)
      if (stored) dispatch({ type: 'LOAD', payload: JSON.parse(stored) })
    } catch {
      localStorage.removeItem(WISHLIST_KEY)
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(state.items))
    } catch {}
  }, [state.items])

  const addItem = (item: WishlistItem) => {
    dispatch({ type: 'ADD', payload: item })
    toast.success('Added to wishlist')
  }

  const removeItem = (product_id: string) => {
    dispatch({ type: 'REMOVE', payload: product_id })
    toast.success('Removed from wishlist')
  }

  const isWishlisted = (product_id: string) =>
    state.items.some((i) => i.product_id === product_id)

  return (
    <WishlistContext.Provider
      value={{ items: state.items, addItem, removeItem, isWishlisted, count: state.items.length }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
