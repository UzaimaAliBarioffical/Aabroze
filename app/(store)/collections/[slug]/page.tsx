import { notFound } from 'next/navigation'
import ProductGrid from '@/components/store/ProductGrid'
import { fetchActiveCategories, fetchPublishedProducts } from '@/lib/products'

export const revalidate = 60

interface CollectionPageProps {
  params: Promise<{ slug: string }>
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params
  const categories = await fetchActiveCategories()
  const category = categories.find((c) => c.slug === slug)

  if (!category) {
    notFound()
  }

  const products = await fetchPublishedProducts({ categoryId: category.id })

  return (
    <div className="container-wide py-10 md:py-16">
      <div className="text-center space-y-2 mb-10">
        <p className="section-subheading">Collection</p>
        <h1 className="section-heading">{category.name}</h1>
        {category.description && (
          <p className="text-xs font-sans text-charcoal-200 max-w-xl mx-auto">{category.description}</p>
        )}
      </div>
      <ProductGrid products={products} />
    </div>
  )
}
