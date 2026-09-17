import { notFound } from 'next/navigation'
import ProductDetailClient from './ProductDetailClient'
import { fetchPublishedProductBySlug } from '@/lib/products'

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await fetchPublishedProductBySlug(slug)

  if (!product) {
    notFound()
  }

  return <ProductDetailClient product={product} />
}
