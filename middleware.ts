import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ─── Only protect /admin routes ──────────────────────────────
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // Allow admin login page through
  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  // ─── Verify Supabase session server-side ─────────────────────
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Not authenticated — redirect to login
  if (!user) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ─── Verify admin role server-side (NEVER trust client role) ─
  // Fetch role from the profiles table using service logic via Supabase
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    // Authenticated but not admin — redirect to home with error
    const homeUrl = new URL('/', request.url)
    homeUrl.searchParams.set('error', 'unauthorized')
    return NextResponse.redirect(homeUrl)
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
