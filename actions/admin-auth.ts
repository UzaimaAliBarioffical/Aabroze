'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getClientIp, rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

import { cookies } from 'next/headers'

export async function signInAdmin(form: FormData) {
  const limit = rateLimit(`admin-login:${getClientIp(await headers())}`, RATE_LIMITS.adminLogin)
  if (!limit.success) return { error: 'Too many attempts. Please try again later.' }
  const username = form.get('username') as string
  const password = form.get('password') as string
  
  if (username === 'admin' && password === 'Password8989$$') {
    const cookieStore = await cookies()
    cookieStore.set('admin_session', 'true', { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' })
    return { success: true }
  }
  return { error: 'Invalid username or password.' }
}

export async function signOutAdmin() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_session')
  redirect('/admin/login')
}
