import { createSupabaseServerClient } from '@/lib/supabase/server'
import HeroSection from '@/components/store/HeroSection'
import ProductGrid from '@/components/store/ProductGrid'
import VideoSection from '@/components/store/VideoSection'
import NewsletterSignup from '@/components/store/NewsletterSignup'
import InstagramGallery from '@/components/store/InstagramGallery'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import SafeImage from '@/components/ui/SafeImage'
import { collectionImages } from '@/lib/collection-images'
import type { Product } from '@/types'

export const revalidate = 60

export default async function HomePage() {
  let products: Product[] = []
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase
      .from('products')
      .select('*, images:product_images(*), variants:product_variants(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(8)
    if (data) products = data as Product[]
  } catch {
    products = []
  }

  const newArrivals = products.filter((p) => p.is_new_arrival)
  const displayArrivals = newArrivals.length > 0 ? newArrivals : products.slice(0, 4)

  return (
    <div className="space-y-16 md:space-y-24">
      <HeroSection />

      {/* New Arrivals */}
      <section className="container-wide">
        <div className="text-center space-y-2 mb-10">
          <p className="section-subheading">Just Landed</p>
          <h2 className="section-heading">New Arrivals</h2>
          <p className="text-xs font-sans text-charcoal-200">
            Carefully curated eastern apparel fresh from our atelier
          </p>
        </div>
        <ProductGrid products={displayArrivals} previewImages={collectionImages.slice(0, 4)} />
        <div className="text-center mt-8">
          <Link href="/new-arrivals">
            <Button variant="secondary">View All New Arrivals</Button>
          </Link>
        </div>
      </section>

      {/* Featured Collection Banner */}
      <section className="bg-cream py-16 border-t border-b border-beige-200">
        <div className="container-wide grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4 max-w-lg">
            <p className="section-subheading text-left">Curated Edit</p>
            <h2 className="text-3xl md:text-5xl font-serif text-charcoal-300">
              The Festive &amp; Semi-Formal Edit
            </h2>
            <p className="text-xs md:text-sm text-charcoal-200 font-sans leading-relaxed">
              Elevate your gatherings with intricate embroidery, soft color palettes, and breathable silhouettes designed for memorable Pakistani evenings.
            </p>
            <Link href="/collections/semi-formal">
              <Button>Shop Collection</Button>
            </Link>
          </div>
          <div className="aspect-[4/3] bg-beige-200 shadow-soft overflow-hidden relative grid grid-cols-2">
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
              <div>
                <span className="font-serif text-3xl text-taupe-300 tracking-wider">AABROZE</span>
                <p className="text-xs uppercase tracking-widest text-charcoal-200 mt-1">Festive Splendor</p>
              </div>
            </div>
            {collectionImages.slice(1, 3).map((image) => (
              <div key={image.slug} className="relative">
                <SafeImage
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All Best Sellers */}
      <section className="container-wide">
        <div className="text-center space-y-2 mb-10">
          <p className="section-subheading">Timeless Staples</p>
          <h2 className="section-heading">Best Sellers</h2>
        </div>
        <ProductGrid products={products.slice(0, 8)} previewImages={collectionImages} />
        <div className="text-center mt-8">
          <Link href="/shop">
            <Button variant="secondary">Explore Full Store</Button>
          </Link>
        </div>
      </section>

      <VideoSection />
      <InstagramGallery />
      <NewsletterSignup />
    </div>
  )
}
