'use client'

import Link from 'next/link'
import BrandLogo from '@/components/ui/BrandLogo'
import { Search, Heart, ShoppingBag, Menu } from 'lucide-react'
import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import MobileMenu from './MobileMenu'
import CartDrawer from './CartDrawer'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/new-arrivals', label: 'New Arrivals' },
  { href: '/collections', label: 'Collections' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { itemCount, openCart } = useCart()
  const { count: wishlistCount } = useWishlist()

  return (
    <>
      <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur-sm border-b border-beige-200">
        <div className="container-wide">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Mobile: hamburger */}
            <button
              className="md:hidden p-2 text-charcoal-300"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            {/* Logo */}
            <Link href="/" className="flex w-32 items-center justify-center md:w-40">
              <BrandLogo className="h-12 md:h-16" priority />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs font-sans tracking-widest uppercase text-charcoal-200 hover:text-charcoal-300 transition-colors duration-150"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Icons */}
            <div className="flex items-center gap-1 md:gap-2">
              <Link href="/shop" aria-label="Search" className="p-2 text-charcoal-200 hover:text-charcoal-300 transition-colors">
                <Search size={20} />
              </Link>
              <Link href="/wishlist" aria-label={`Wishlist (${wishlistCount} items)`} className="p-2 text-charcoal-200 hover:text-charcoal-300 transition-colors relative">
                <Heart size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-maroon-300 text-cream-50 text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-sans">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <button
                onClick={openCart}
                aria-label={`Cart (${itemCount} items)`}
                className="p-2 text-charcoal-200 hover:text-charcoal-300 transition-colors relative"
              >
                <ShoppingBag size={20} />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-maroon-300 text-cream-50 text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-sans">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} links={navLinks} />
      <CartDrawer />
    </>
  )
}
