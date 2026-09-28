import 'server-only'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

import { cookies } from 'next/headers'

// Recheck authorization at every data/action entry point, independently of middleware.
export async function requireAdmin() {
  const cookieStore = await cookies()
  const isAdmin = cookieStore.get('admin_session')?.value === 'true'
  if (!isAdmin) redirect('/admin/login')
  
  // Return supabase client as before
  return await createSupabaseServerClient()
}
