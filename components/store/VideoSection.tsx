export default function VideoSection() {
  return (
    <section className="bg-charcoal-300 text-cream py-16 md:py-24">
      <div className="container-wide">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <p className="text-xs font-sans tracking-[0.25em] uppercase text-taupe-200">
            Artisanal Detail
          </p>
          <h2 className="text-3xl md:text-5xl font-serif text-cream-100 font-medium">
            Behind the Craft
          </h2>
          <p className="text-xs md:text-sm text-cream-300/80 font-sans">
            Witness the drape, embellishments, and graceful flow of AABROZE garments in motion.
          </p>
        </div>

        <div className="relative aspect-video max-w-4xl mx-auto bg-charcoal-400 border border-charcoal-200/40 shadow-hover overflow-hidden rounded-sm">
          <video
            className="w-full h-full object-cover"
            controls
            playsInline
            poster="/brand/video-poster.jpg"
          >
            <source src="/videos/coming%20soon.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </section>
  )
}
