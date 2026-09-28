'use server'

import { fetchPublishedProductById, fetchPublishedProductBySlug } from '@/lib/products'
import { isUuid } from '@/lib/pricing'

// Image-only previews must resolve to a real published database product before purchase.
export async function resolveCardProduct(slug: string, productId?: string) {
  if (productId !== undefined) return isUuid(productId) ? fetchPublishedProductById(productId) : null
  if (!/^[a-z0-9-]{1,200}$/.test(slug)) return null
  return fetchPublishedProductBySlug(slug)
}
