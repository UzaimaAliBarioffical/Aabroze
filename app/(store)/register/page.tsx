import Link from 'next/link'
import UserRegister from '@/components/store/UserRegister'

export default function RegisterPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 bg-cream">
      <div className="w-full max-w-md bg-white border border-beige-200 p-8 space-y-6">
        <h1 className="font-serif text-3xl text-charcoal-300 text-center">Create Account</h1>
        <UserRegister />
        <p className="text-center text-sm font-sans text-charcoal-200">
          Already have an account? <Link href="/login" className="underline text-charcoal-300">Sign In</Link>
        </p>
      </div>
    </div>
  )
}
