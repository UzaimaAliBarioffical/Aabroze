import ProductGrid from '@/components/store/ProductGrid'
import { fetchPublishedProducts } from '@/lib/products'

export const revalidate = 60

export default async function NewArrivalsPage() {
  const products = await fetchPublishedProducts({ newArrival: true })

  return (
    <div className="container-wide py-10 md:py-16">
      <div className="text-center space-y-2 mb-10">
        <p className="section-subheading">Just Landed</p>
        <h1 className="section-heading">New Arrivals</h1>
      </div>
      <ProductGrid products={products} />
    </div>
  )
}
