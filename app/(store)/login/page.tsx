import Link from 'next/link'
import UserLogin from '@/components/store/UserLogin'

export default function LoginPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 bg-cream">
      <div className="w-full max-w-md bg-white border border-beige-200 p-8 space-y-6">
        <h1 className="font-serif text-3xl text-charcoal-300 text-center">Sign In</h1>
        <UserLogin />
        <p className="text-center text-sm font-sans text-charcoal-200">
          Don&apos;t have an account? <Link href="/register" className="underline text-charcoal-300">Register</Link>
        </p>
      </div>
    </div>
  )
}
