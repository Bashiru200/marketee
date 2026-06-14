import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)

  const code   = searchParams.get('code')
  const next   = searchParams.get('next')
  const intent = searchParams.get('intent') // 'login' | 'signup' | null

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

        // ── No profile found — brand-new Google sign-in ──────────────────
        // Every Google sign-in (login OR signup) creates an OWNER account
        // with the ability to list a business, edit it, and manage
        // subscription/plan from the dashboard.
        const fullName =
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined) ??
          ''

        await supabase.from('profiles').upsert({
          id:     user.id,
          name:   fullName,
          email:  user.email,
          role:   'owner',
          origin: 'african',
        })

        // Log signup event (best-effort, never blocks)
        try {
          await supabase.from('auth_events').insert({
            user_id:    user.id,
            event_type: 'signup',
            metadata:   {
              role: 'owner',
              via:  'google',
              first_login_no_account: intent === 'login',
            },
          })
        } catch {}

        // Send to business setup — they can fill it in now or skip to dashboard
        return NextResponse.redirect(`${origin}/business/new?welcome=1`)
      }
    }

    console.error('[auth/callback]', error?.message)
  }

  return NextResponse.redirect(`${origin}/auth/error?message=confirmation_failed`)
}