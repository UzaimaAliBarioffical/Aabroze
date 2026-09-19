import 'server-only'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// Recheck authorization at every data/action entry point, independently of middleware.
export async function requireAdmin() {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/admin/login')
  const { data: profile, error: profileError } = await supabase.from('profiles')
    .select('role').eq('id', user.id).single()
  if (profileError || profile?.role !== 'admin') redirect('/?error=unauthorized')
  return supabase
}
