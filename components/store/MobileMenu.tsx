'use client'

import Link from 'next/link'
import BrandLogo from '@/components/ui/BrandLogo'
import { X, Instagram, Facebook } from 'lucide-react'
import { useEffect } from 'react'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  links: { href: string; label: string }[]
}

export default function MobileMenu({ isOpen, onClose, links }: MobileMenuProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-charcoal-400/60 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-cream flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-between p-6 border-b border-beige-200">
          <Link href="/" onClick={onClose} className="flex w-28 items-center justify-center">
            <BrandLogo className="h-16" />
          </Link>
          <button onClick={onClose} aria-label="Close menu" className="p-2 text-charcoal-200">
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-6" aria-label="Mobile navigation">
          <ul className="space-y-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onClose}
                  className="block py-3 text-sm font-sans tracking-widest uppercase text-charcoal-200 hover:text-charcoal-300 border-b border-beige-200 transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-6 border-t border-beige-200">
          <div className="flex gap-4">
            <a href="https://instagram.com/aabroze" target="_blank" rel="noopener noreferrer" className="text-charcoal-200 hover:text-charcoal-300 transition-colors" aria-label="Instagram">
              <Instagram size={20} />
            </a>
            <a href="https://facebook.com/aabroze" target="_blank" rel="noopener noreferrer" className="text-charcoal-200 hover:text-charcoal-300 transition-colors" aria-label="Facebook">
              <Facebook size={20} />
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
