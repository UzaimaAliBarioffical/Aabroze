'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInAdmin } from '@/actions/admin-auth'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function AdminLogin() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  return <form className="space-y-5" onSubmit={async (event) => {
    event.preventDefault()
    if (loading) return
    const form = new FormData(event.currentTarget)
    setLoading(true)
    setError('')
    try {
      const result = await signInAdmin(form)
      if (result.error) setError(result.error)
      else { router.replace('/admin/orders'); router.refresh() }
    } catch { setError('Unable to sign in. Please try again.') }
    finally { setLoading(false) }
  }}>
    <Input label="Email" name="email" type="email" autoComplete="username" required />
    <Input label="Password" name="password" type="password" autoComplete="current-password" required />
    {error && <p role="alert" className="form-error">{error}</p>}
    <Button type="submit" loading={loading} className="w-full">Sign in</Button>
  </form>
}
