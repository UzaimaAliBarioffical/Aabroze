import { createSupabaseServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ProductDetailClient from './ProductDetailClient'
import type { Product } from '@/types'

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params

  let product: Product | null = null
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase
      .from('products')
      .select('*, images:product_images(*), variants:product_variants(*)')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (data) product = data as Product
  } catch {
    product = null
  }

  if (!product) {
    notFound()
  }

  return <ProductDetailClient product={product} />
}