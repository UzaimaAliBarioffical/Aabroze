import Link from 'next/link'
import BrandLogo from '@/components/ui/BrandLogo'
import { Instagram, Facebook, Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-charcoal-300 text-cream-200">
      <div className="container-wide py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <BrandLogo className="h-24 mb-4" light />
            <p className="text-xs font-sans text-cream-300 leading-relaxed mt-3">
              Timeless Pakistani ladies wear crafted for the modern woman. Elegant. Feminine. Premium.
            </p>
            <div className="flex gap-4 mt-5">
              <a href="https://www.instagram.com/aabroze.pk/" target="_blank" rel="noopener noreferrer" className="text-cream-300 hover:text-cream-100 transition-colors" aria-label="Instagram">
                <Instagram size={18} />
              </a>
              <a href="https://www.facebook.com/profile.php?id=61556878628622" target="_blank" rel="noopener noreferrer" className="text-cream-300 hover:text-cream-100 transition-colors" aria-label="Facebook">
                <Facebook size={18} />
              </a>
              <a href="mailto:aabroze.pk@gmail.com" className="text-cream-300 hover:text-cream-100 transition-colors" aria-label="Email">
                <Mail size={18} />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-[10px] font-sans tracking-widest uppercase text-cream-200 mb-4">Shop</h3>
            <ul className="space-y-2">
              {[
                ['New Arrivals', '/new-arrivals'],
                ['All Products', '/shop'],
                ['Collections', '/collections'],
                ['Casual Wear', '/collections/casual-wear'],
                ['Semi-Formal', '/collections/semi-formal']
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-xs font-sans text-cream-300 hover:text-cream-100 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-[10px] font-sans tracking-widest uppercase text-cream-200 mb-4">Information</h3>
            <ul className="space-y-2">
              {[
                ['About AABROZE', '/about'],
                ['Contact Us', '/contact'],
                ['Shipping Policy', '/policies/shipping'],
                ['Returns & Exchange', '/policies/returns'],
                ['Privacy Policy', '/policies/privacy'],
                ['Terms & Conditions', '/policies/terms']
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-xs font-sans text-cream-300 hover:text-cream-100 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[10px] font-sans tracking-widest uppercase text-cream-200 mb-4">Get in Touch</h3>
            <ul className="space-y-3 text-xs font-sans text-cream-300">
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="text-taupe-300 flex-shrink-0 mt-0.5" />
                <span>Karachi, Pakistan</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={16} className="text-taupe-300 flex-shrink-0" />
                <a href="tel:+923001234567" className="hover:text-cream-100 transition-colors">
                  +92 3282301296
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={16} className="text-taupe-300 flex-shrink-0" />
                <a href="mailto:info@aabroze.com" className="hover:text-cream-100 transition-colors">
                  aabroze.pk@gmail.com
                </a>
              </li>
            </ul>
            <div className="mt-6 pt-4 border-t border-charcoal-200/50">
              <p className="text-[11px] text-cream-300/80 font-sans">
                Payment methods: Cash on Delivery, JazzCash, Easypaisa
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-charcoal-200/40 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between text-[11px] font-sans text-cream-300">
          <p>© {year} AaBROZE. All rights reserved.</p>
          <p className="mt-2 md:mt-0">Premium Eastern & Semi-Formal Ladies Wear</p>
        </div>
      </div>
    </footer>
  )
}
