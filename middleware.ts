import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

  // ─── Verify admin_session cookie server-side ─────────────────────
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const isAdmin = request.cookies.get('admin_session')?.value === 'true'

  if (!isAdmin) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
