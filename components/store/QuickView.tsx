'use client'

import VariantSelectModal from '@/components/store/VariantSelectModal'
import { useCart } from '@/context/CartContext'
import type { Product } from '@/types'

export default function QuickView({ product, isOpen, onClose }: {
  product: Product | null; isOpen: boolean; onClose: () => void
}) {
  const { addItem } = useCart()
  return <VariantSelectModal product={product} isOpen={isOpen} intent="cart" onClose={onClose}
    onConfirm={(item) => { addItem(item); onClose() }} />
}
