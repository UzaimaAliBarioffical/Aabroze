import Link from 'next/link'
import { fetchActiveCategories } from '@/lib/products'

export const revalidate = 60

export default async function CollectionsPage() {
  const categories = await fetchActiveCategories()

  return (
    <div className="container-wide py-10 md:py-16">
      <div className="text-center space-y-2 mb-10">
        <p className="section-subheading">Curated Edits</p>
        <h1 className="section-heading">Collections</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/collections/${category.slug}`}
            className="border border-beige-200 bg-white p-8 hover:border-charcoal-300 transition-colors"
          >
            <h2 className="font-serif text-2xl text-charcoal-300">{category.name}</h2>
            {category.description && (
              <p className="text-xs font-sans text-taupe-200 mt-2">{category.description}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
