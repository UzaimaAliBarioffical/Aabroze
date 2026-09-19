import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Category, Product } from '@/types'
import { unstable_rethrow } from 'next/navigation'
import { SupabaseConfigurationError } from '@/lib/supabase/config'

let configurationWarningShown = false
function reportLoadError(scope: string, error: unknown) {
  // Preserve Next.js dynamic rendering signals instead of caching an empty catalog.
  unstable_rethrow(error)
  if (error instanceof SupabaseConfigurationError) {
    if (!configurationWarningShown) {
      console.warn(`[store] ${error.message} Live catalog unavailable until configured.`)
      configurationWarningShown = true
    }
    return
  }
  console.error(`[${scope}] Catalog request failed. Check Supabase connectivity and configuration.`)
}

export const PRODUCT_LIST_SELECT =
  '*, images:product_images(*), variants:product_variants(*)'

export async function fetchPublishedProducts(options?: {
  limit?: number
  featured?: boolean
  newArrival?: boolean
  search?: string
  categoryId?: string
}): Promise<Product[]> {
  try {
    const supabase = await createSupabaseServerClient()
    let query = supabase
      .from('products')
      .select(PRODUCT_LIST_SELECT)
      .eq('is_published', true)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })

    if (options?.featured) query = query.eq('is_featured', true)
    if (options?.newArrival) query = query.eq('is_new_arrival', true)
    if (options?.search) query = query.ilike('name', `%${options.search}%`)
    if (options?.categoryId) query = query.eq('category_id', options.categoryId)
    if (options?.limit) query = query.limit(options.limit)

    const { data, error } = await query
    if (error) {
      console.error('[products] Failed to load products:', error.message)
      return []
    }
    return (data as Product[]) ?? []
  } catch (err) {
    reportLoadError('products', err)
    return []
  }
}

export async function fetchPublishedProductBySlug(slug: string): Promise<Product | null> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_LIST_SELECT)
      .eq('slug', slug)
      .eq('is_published', true)
      .eq('is_archived', false)
      .maybeSingle()

    if (error) {
      console.error('[products] Failed to load product:', error.message)
      return null
    }
    return (data as Product) ?? null
  } catch (err) {
    reportLoadError('products', err)
    return null
  }
}

export async function fetchActiveCategories(): Promise<Category[]> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('[categories] Failed to load categories:', error.message)
      return []
    }
    return (data as Category[]) ?? []
  } catch (err) {
    reportLoadError('categories', err)
    return []
  }
}
