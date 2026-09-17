import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { CartProvider } from '@/context/CartContext'
import { WishlistProvider } from '@/context/WishlistContext'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: {
    template: '%s | AABROZE',
    default: 'AABROZE — Premium Pakistani Ladies Wear',
  },
  description:
    'Discover AABROZE — premium Pakistani ladies wear. Elegant eastern wear, casual and semi-formal clothing crafted for the modern Pakistani woman.',
  keywords: ['Pakistani ladies wear', 'eastern wear', 'Pakistani fashion', 'lawn suits', 'AABROZE'],
  openGraph: {
    type: 'website',
    locale: 'en_PK',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'AABROZE',
    title: 'AABROZE — Premium Pakistani Ladies Wear',
    description: 'Elegant eastern wear for the modern Pakistani woman.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AABROZE — Premium Pakistani Ladies Wear',
    description: 'Elegant eastern wear for the modern Pakistani woman.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans">
        <CartProvider>
          <WishlistProvider>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 3500,
                style: {
                  background: '#2C2C2C',
                  color: '#FAF7F2',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  borderRadius: '2px',
                  padding: '12px 16px',
                },
              }}
            />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  )
}
