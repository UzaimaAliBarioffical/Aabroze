'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function signInUser(form: FormData) {
  const email = form.get('email') as string
  const password = form.get('password') as string
  
  if (!email || !password) return { error: 'Email and password are required.' }

  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) return { error: error.message }
    return { success: true }
  } catch {
    return { error: 'Sign-in temporarily unavailable.' }
  }
}

export async function registerUser(form: FormData) {
  const email = form.get('email') as string
  const password = form.get('password') as string
  const name = form.get('name') as string

  if (!email || !password || !name) return { error: 'All fields are required.' }

  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name
        }
      }
    })
    
    if (error) return { error: error.message }
    return { success: true }
  } catch {
    return { error: 'Registration temporarily unavailable.' }
  }
}

export async function signOutUser() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}
