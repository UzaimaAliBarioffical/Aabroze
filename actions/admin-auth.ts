'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getClientIp, rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

export async function signInAdmin(form: FormData) {
  const limit = rateLimit(`admin-login:${getClientIp(await headers())}`, RATE_LIMITS.adminLogin)
  if (!limit.success) return { error: 'Too many attempts. Please try again later.' }
  const credentials = z.object({ email: z.string().trim().email(), password: z.string().min(1).max(256) })
    .safeParse({ email: form.get('email'), password: form.get('password') })
  if (!credentials.success) return { error: 'Enter your email and password.' }
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.signInWithPassword(credentials.data)
    if (error || !data.user) return { error: 'Unable to sign in with these details.' }
    const { data: profile, error: profileError } = await supabase.from('profiles')
      .select('role').eq('id', data.user.id).single()
    if (profileError || profile?.role !== 'admin') {
      await supabase.auth.signOut()
      return { error: 'This account does not have admin access.' }
    }
    return { success: true }
  } catch {
    return { error: 'Sign-in is temporarily unavailable. Check the store configuration.' }
  }
}

export async function signOutAdmin() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
