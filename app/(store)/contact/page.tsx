import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import {
  STORE_EMAIL,
  STORE_PHONE_LOCAL,
  STORE_PHONE_TEL,
  storeWhatsAppUrl,
} from '@/lib/store-contact'

export default function ContactPage() {
  return (
    <div className="container-narrow py-10 md:py-16">
      <div className="text-center space-y-2 mb-10">
        <p className="section-subheading">We are here</p>
        <h1 className="section-heading">Contact AABROZE</h1>
        <p className="text-xs font-sans text-charcoal-200 max-w-lg mx-auto">
          For orders, sizing, or styling questions, reach us by phone, WhatsApp, or email.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a
          href={STORE_PHONE_TEL}
          className="flex items-start gap-3 border border-beige-200 bg-white p-6 hover:border-charcoal-300 transition-colors"
        >
          <Phone size={18} className="text-taupe-300 mt-0.5" />
          <div>
            <p className="text-[10px] uppercase tracking-widest font-sans text-taupe-200">Call</p>
            <p className="font-serif text-lg text-charcoal-300 mt-1">{STORE_PHONE_LOCAL}</p>
          </div>
        </a>
        <a
          href={storeWhatsAppUrl('Hello AABROZE, I would like to know more about your collection.')}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 border border-beige-200 bg-white p-6 hover:border-charcoal-300 transition-colors"
        >
          <MessageCircle size={18} className="text-taupe-300 mt-0.5" />
          <div>
            <p className="text-[10px] uppercase tracking-widest font-sans text-taupe-200">WhatsApp</p>
            <p className="font-serif text-lg text-charcoal-300 mt-1">{STORE_PHONE_LOCAL}</p>
          </div>
        </a>
        <a
          href={`mailto:${STORE_EMAIL}`}
          className="flex items-start gap-3 border border-beige-200 bg-white p-6 hover:border-charcoal-300 transition-colors"
        >
          <Mail size={18} className="text-taupe-300 mt-0.5" />
          <div>
            <p className="text-[10px] uppercase tracking-widest font-sans text-taupe-200">Email</p>
            <p className="font-serif text-lg text-charcoal-300 mt-1">{STORE_EMAIL}</p>
          </div>
        </a>
        <div className="flex items-start gap-3 border border-beige-200 bg-white p-6">
          <MapPin size={18} className="text-taupe-300 mt-0.5" />
          <div>
            <p className="text-[10px] uppercase tracking-widest font-sans text-taupe-200">Studio</p>
            <p className="font-serif text-lg text-charcoal-300 mt-1">Karachi, Pakistan</p>
          </div>
        </div>
      </div>
    </div>
  )
}
