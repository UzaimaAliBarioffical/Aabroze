import Link from 'next/link'
import AdminLogin from '@/components/admin/AdminLogin'
import BrandLogo from '@/components/ui/BrandLogo'

export default function AdminLoginPage() {
  return <main className="min-h-screen bg-cream flex items-center justify-center p-6">
    <div className="w-full max-w-md bg-white border border-beige-200 p-8 space-y-6">
      <Link href="/" aria-label="AABROZE home"><BrandLogo className="w-24" /></Link>
      <h1 className="font-serif text-3xl text-charcoal-300">Admin sign in</h1>
      <AdminLogin />
    </div>
  </main>
}
