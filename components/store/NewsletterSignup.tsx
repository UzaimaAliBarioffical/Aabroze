'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'

export default function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Thank you for subscribing!')
        setEmail('')
      } else {
        toast.error(data.error || 'Failed to subscribe. Please try again.')
      }
    } catch {
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-cream border-t border-b border-beige-200 py-16">
      <div className="container-narrow text-center space-y-4">
        <p className="text-xs font-sans tracking-[0.2em] uppercase text-taupe-300">
          Stay Connected
        </p>
        <h2 className="text-3xl md:text-4xl font-serif text-charcoal-300">
          Join the AABROZE Circle
        </h2>
        <p className="text-xs md:text-sm text-charcoal-200 max-w-md mx-auto font-sans leading-relaxed">
          Be the first to hear about private previews, new arrivals, seasonal collections, and exclusive eastern wear stories.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-2">
          <Input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1"
          />
          <Button type="submit" loading={loading} className="whitespace-nowrap">
            Subscribe
          </Button>
        </form>
      </div>
    </section>
  )
}
