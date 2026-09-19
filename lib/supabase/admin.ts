/**
 * Supabase Admin Client — SERVICE ROLE
 * NEVER import this in client-side code.
 * Use only in server actions and API routes.
 */

import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SupabaseConfigurationError, validateSupabaseUrl } from './config'

let adminClient: SupabaseClient<any> | null = null

export function createSupabaseAdminClient(): SupabaseClient<any> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!supabaseUrl) {
    throw new SupabaseConfigurationError('NEXT_PUBLIC_SUPABASE_URL is not set')
  }

  if (!serviceRoleKey) {
    throw new SupabaseConfigurationError('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  if (!adminClient) {
    adminClient = createClient(validateSupabaseUrl(supabaseUrl), serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return adminClient
}
