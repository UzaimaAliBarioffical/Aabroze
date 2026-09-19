'use server'

import { fetchPublishedProductBySlug } from '@/lib/products'

// Image-only previews must resolve to a real published database product before purchase.
export async function resolveCardProduct(slug: string) {
  if (!/^[a-z0-9-]{1,200}$/.test(slug)) return null
  return fetchPublishedProductBySlug(slug)
}
