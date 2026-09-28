'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInUser } from '@/actions/user-auth'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function UserLogin() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  return (
    <form className="space-y-5" onSubmit={async (event) => {
      event.preventDefault()
      if (loading) return
      const form = new FormData(event.currentTarget)
      setLoading(true)
      setError('')
      try {
        const result = await signInUser(form)
        if (result?.error) setError(result.error)
        else {
          router.replace('/shop')
          router.refresh()
        }
      } catch {
        setError('Unable to sign in. Please try again.')
      } finally {
        setLoading(false)
      }
    }}>
      <Input label="Email" name="email" type="email" autoComplete="email" required />
      <Input label="Password" name="password" type="password" autoComplete="current-password" required />
      {error && <p role="alert" className="form-error text-red-600 text-sm">{error}</p>}
      <Button type="submit" loading={loading} className="w-full">Sign In</Button>
    </form>
  )
}
