import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)

  const code       = searchParams.get('code')
  const next       = searchParams.get('next')
  const intent     = searchParams.get('intent') // 'login' | 'signup' | null
  const roleParam  = searchParams.get('role')   // 'customer' | 'owner' | null

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Check if a profile already exists for this user
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, role, business_id')
          .eq('id', user.id)
          .single()

        // ── Existing user — route by role as normal ──────────────────────
        if (profile) {
          if (next) return NextResponse.redirect(`${origin}${next}`)

          if (profile.role === 'owner') {
            // Owner without a business yet → send to setup
            if (!profile.business_id) {
              return NextResponse.redirect(`${origin}/business/new`)
            }
            return NextResponse.redirect(`${origin}/dashboard`)
          }
          return NextResponse.redirect(`${origin}/search`)
        }

        // ── No profile found ──────────────────────────────────────────────
        // If they came from the LOGIN page (not signup), don't silently
        // create an account. Send them to /auth/welcome to confirm first —
        // this is the "no account found, want to create one?" prompt.
        if (intent === 'login') {
          return NextResponse.redirect(`${origin}/auth/welcome?new=true`)
        }

        // ── Came from SIGNUP with a role already chosen → create now ─────
        const chosenRole: 'customer' | 'owner' =
          roleParam === 'owner' ? 'owner' : 'customer'

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
            metadata:   { role: chosenRole, via: 'google' },
          })
        } catch {}

        // ── Route based on the chosen role ────────────────────────────────
        if (chosenRole === 'owner') {
          return NextResponse.redirect(`${origin}/business/new?welcome=1`)
        }
        return NextResponse.redirect(`${origin}/account/onboarding?welcome=1`)
      }
    }

    console.error('[auth/callback]', error?.message)
  }

  return NextResponse.redirect(`${origin}/auth/error?message=confirmation_failed`)
}