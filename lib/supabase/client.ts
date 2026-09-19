'use client'

import { createBrowserClient } from '@supabase/ssr'
import { getSupabasePublicConfig } from './config'

export function createSupabaseClient() {
  const { url, anonKey } = getSupabasePublicConfig()
  return createBrowserClient(url, anonKey)
}
