import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

// ── Coming soon mode — set to false on launch day ─────────────────────────
const COMING_SOON = process.env.NEXT_PUBLIC_COMING_SOON === 'true'

// Routes that stay accessible even in coming soon mode
const COMING_SOON_ALLOWED = [
  '/app',
  '/api/',
  '/auth/',
  '/admin',
  '/_next',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Coming soon redirect ──────────────────────────────────────────────
  if (COMING_SOON) {
    const allowed = COMING_SOON_ALLOWED.some(p => pathname.startsWith(p))
    if (!allowed) {
      const url = request.nextUrl.clone()
      url.pathname = '/coming-soon'
      return NextResponse.redirect(url)
    }
  }

  // ── Supabase session refresh ──────────────────────────────────────────
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — keeps the user logged in
  const { data: { user } } = await supabase.auth.getUser()

  // Protect /dashboard — redirect to login if not authenticated
  if (!user && pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Protect /admin — redirect to login if not authenticated
  if (!user && pathname.startsWith('/admin')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next()
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}