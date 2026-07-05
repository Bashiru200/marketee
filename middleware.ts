import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

// ── Mode flags — control in Vercel env vars ───────────────────────────────
// NEXT_PUBLIC_COMING_SOON=true  → full lock, everyone sees coming soon
// NEXT_PUBLIC_BETA_MODE=true    → beta mode, need code to get in
// both false                    → site is fully live
const COMING_SOON = process.env.NEXT_PUBLIC_COMING_SOON === 'false'
const BETA_MODE   = process.env.NEXT_PUBLIC_BETA_MODE   === 'true'

// Always accessible regardless of mode
const PUBLIC_PATHS = [
  '/coming-soon',
  '/api/beta-access',
  '/api/early-access',
  '/api/',
  '/auth/',
  '/admin',
  '/_next',
  '/favicon',
  '/apple-touch-icon',
  '/android-chrome',
  '/og-',
  '/robots',
  '/sitemap',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))

  // ── Beta mode ─────────────────────────────────────────────────────────
  if (BETA_MODE && !isPublic) {
    const cookie       = request.cookies.get('markeetee-beta')?.value
    const hasBetaAccess = cookie === process.env.BETA_COOKIE_SECRET

    if (!hasBetaAccess) {
      const url = request.nextUrl.clone()
      url.pathname = '/coming-soon'
      url.searchParams.set('beta', '1')
      return NextResponse.redirect(url)
    }
  }

  // ── Full coming soon lock ─────────────────────────────────────────────
  if (COMING_SOON && !BETA_MODE && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/coming-soon'
    return NextResponse.redirect(url)
  }

  // ── Supabase session refresh ──────────────────────────────────────────
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next()
  }

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

  const { data: { user } } = await supabase.auth.getUser()

  // Protect /dashboard
  if (!user && pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Protect /admin
  if (!user && pathname.startsWith('/admin')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}