export class SupabaseConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SupabaseConfigurationError'
  }
}

// Direct env references are required for Next.js to inline public browser values.
// Never add a service-role key to this shared module.
export function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  const missing = [
    !url && 'NEXT_PUBLIC_SUPABASE_URL',
    !anonKey && 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ].filter(Boolean)

  if (missing.length) {
    throw new SupabaseConfigurationError(
      `Configure ${missing.join(', ')} in .env.local and restart Next.js.`
    )
  }

  return { url: validateSupabaseUrl(url!), anonKey: anonKey! }
}

export function validateSupabaseUrl(value: string) {
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error()
    return value
  } catch {
    // Do not include the supplied value in logs or client-facing errors.
    throw new SupabaseConfigurationError('NEXT_PUBLIC_SUPABASE_URL must be a valid HTTP(S) project URL.')
  }
}
