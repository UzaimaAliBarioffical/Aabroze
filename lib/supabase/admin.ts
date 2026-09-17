/**
 * Supabase Admin Client — SERVICE ROLE
 * NEVER import this in client-side code.
 * Use only in server actions and API routes.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let adminClient: SupabaseClient<any> | null = null

export function createSupabaseAdminClient(): SupabaseClient<any> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  if (!adminClient) {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return adminClient
}