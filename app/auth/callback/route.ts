import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)

  const code   = searchParams.get('code')
  const next   = searchParams.get('next')
  const intent = searchParams.get('intent') // 'login' | 'signup' | null
  const role   = searchParams.get('role')   // 'customer' | 'owner' | null

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Check if a profile already exists for this user
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('id', user.id)
          .single()

        // ── Existing user — route by role as normal ──────────────────────
        if (profile) {
          if (next) return NextResponse.redirect(`${origin}${next}`)
          return NextResponse.redirect(
            `${origin}${profile.role === 'owner' ? '/dashboard' : '/search'}`
          )
        }

        // ── No profile found — this is a brand-new Google sign-in ────────
        if (intent === 'login') {
          // User tried to SIGN IN but has no account yet
          return NextResponse.redirect(`${origin}/auth/welcome?new=true`)
        }

        // intent === 'signup' (or no intent) — create the account now
        const chosenRole = role === 'owner' ? 'owner' : 'customer'
        const fullName =
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined) ??
          ''

        await supabase.from('profiles').upsert({
          id:     user.id,
          name:   fullName,
          email:  user.email,
          role:   chosenRole,
          origin: 'african',
        })

        // Log signup event (best-effort, never blocks)
        try {
          await supabase.from('auth_events').insert({
            user_id:    user.id,
            event_type: 'signup',
            metadata:   { role: chosenRole, via: 'google', origin: 'african' },
          })
        } catch {}

        if (chosenRole === 'owner') {
          return NextResponse.redirect(`${origin}/dashboard?setup=business`)
        }
        return NextResponse.redirect(`${origin}/auth/welcome?onboarding=1`)
      }

      // No user on session somehow — fall through to error
    }

    console.error('[auth/callback]', error?.message)
  }

  return NextResponse.redirect(`${origin}/auth/error?message=confirmation_failed`)
}