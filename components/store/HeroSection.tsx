import Link from 'next/link'
import SafeImage from '@/components/ui/SafeImage'
import Button from '@/components/ui/Button'
import { collectionImages } from '@/lib/collection-images'

export default function HeroSection() {
  return (
    <section className="relative bg-beige-100 overflow-hidden min-h-[550px] md:min-h-[680px] flex items-center">
      <div className="container-wide py-12 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Text Content */}
        <div className="z-10 text-center md:text-left space-y-6 max-w-xl">
          <p className="text-xs md:text-sm font-sans tracking-[0.25em] uppercase text-taupe-300">
            Timeless Elegance &amp; Grace
          </p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-medium text-charcoal-300 leading-tight">
            Curated for the Modern Pakistani Woman
          </h1>
          <p className="text-sm md:text-base text-charcoal-200 font-sans leading-relaxed">
            Discover artisanal craftsmanship, delicate silhouettes, and graceful fabrics tailored for every occasion.
          </p>
          <div className="pt-2 flex flex-wrap gap-4 justify-center md:justify-start">
            <Link href="/shop">
              <Button size="lg">Explore Collection</Button>
            </Link>
            <Link href="/new-arrivals">
              <Button variant="secondary" size="lg">New Arrivals</Button>
            </Link>
          </div>
        </div>

        {/* Visual Showcase */}
        <div className="relative aspect-[3/4] max-w-md mx-auto md:max-w-none w-full bg-beige-200 shadow-soft overflow-hidden">
          <SafeImage
            src={collectionImages[5].src}
            alt={collectionImages[5].alt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
            fallback={
              <div className="hero-fallback flex absolute inset-0 bg-beige-200 flex-col items-center justify-center p-8 text-center">
                <span className="font-serif text-3xl tracking-widest text-taupe-300 mb-2">AABROZE</span>
                <p className="text-xs uppercase tracking-widest text-charcoal-200">Signature Collection</p>
              </div>
            }
          />
        </div>
      </div>
    </section>
  )
}
