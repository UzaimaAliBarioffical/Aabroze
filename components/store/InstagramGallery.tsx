import SafeImage from '@/components/ui/SafeImage'
import { Instagram } from 'lucide-react'
import { collectionImages } from '@/lib/collection-images'

const galleryImages = collectionImages.slice(2)

export default function InstagramGallery() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container-wide">
        <div className="text-center space-y-2 mb-10">
          <p className="text-xs font-sans tracking-[0.25em] uppercase text-taupe-300">
            @AABROZE_OFFICIAL
          </p>
          <h2 className="text-2xl md:text-3xl font-serif text-charcoal-300">
            Follow Us on Instagram
          </h2>
          <p className="text-xs font-sans text-charcoal-200">
            Share your bespoke eastern look with #AabrozeWoman
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {galleryImages.map((img) => (
            <a
              key={img.slug}
              href="https://www.instagram.com/aabroze.pk/"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-[3/4] bg-beige-100 overflow-hidden block"
            >
              <SafeImage
                src={img.src}
                alt={img.alt}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                fallback={
                  <div className="insta-fallback flex absolute inset-0 bg-beige-100 flex-col items-center justify-center text-taupe-300">
                    <Instagram size={28} />
                    <span className="text-[10px] mt-2 uppercase tracking-wider font-sans">AABROZE</span>
                  </div>
                }
              />
              <div className="absolute inset-0 bg-charcoal-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center text-white">
                <Instagram size={24} />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
