'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { registerUser } from '@/actions/user-auth'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function UserRegister() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  
  return (
    <form className="space-y-5" onSubmit={async (event) => {
      event.preventDefault()
      if (loading) return
      const form = new FormData(event.currentTarget)
      setLoading(true)
      setError('')
      setSuccess('')
      try {
        const result = await registerUser(form)
        if (result?.error) setError(result.error)
        else {
          setSuccess('Account created! You can now sign in.')
          setTimeout(() => {
            router.replace('/login')
          }, 2000)
        }
      } catch {
        setError('Unable to register. Please try again.')
      } finally {
        setLoading(false)
      }
    }}>
      <Input label="Full Name" name="name" type="text" autoComplete="name" required />
      <Input label="Email" name="email" type="email" autoComplete="email" required />
      <Input label="Password" name="password" type="password" autoComplete="new-password" required />
      {error && <p role="alert" className="form-error text-red-600 text-sm">{error}</p>}
      {success && <p role="alert" className="text-green-600 text-sm">{success}</p>}
      <Button type="submit" loading={loading} className="w-full">Register</Button>
    </form>
  )
}
