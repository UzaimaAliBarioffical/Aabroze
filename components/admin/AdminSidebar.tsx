'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingBag, LogOut } from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-full md:w-64 md:shrink-0 bg-charcoal-400 text-cream flex flex-col md:min-h-screen border-r border-charcoal-300">
      <div className="p-6 border-b border-charcoal-300">
        <span className="font-serif text-2xl tracking-[0.2em] text-cream-100">AABROZE</span>
        <p className="text-[10px] tracking-widest uppercase text-taupe-200 mt-1">Management Portal</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-xs tracking-wider uppercase font-sans transition-colors ${
                isActive
                  ? 'bg-charcoal-300 text-cream-100 font-medium'
                  : 'text-cream-300 hover:bg-charcoal-300/50 hover:text-cream-100'
              }`}
            >
              <Icon size={18} className="text-taupe-200" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-charcoal-300">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 text-xs tracking-wider uppercase font-sans text-cream-300 hover:text-cream-100 transition-colors"
        >
          <LogOut size={16} className="text-taupe-200" />
          Back to Store
        </Link>
      </div>
    </aside>
  )
}
