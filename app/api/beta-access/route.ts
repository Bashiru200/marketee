// app/api/beta-access/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()

  try {
    const { code } = await req.json()

    if (!code?.trim()) {
      return NextResponse.json({ error: 'Please enter an access code' }, { status: 400 })
    }

    const clean = code.trim().toUpperCase()

    const { data, error } = await supabase
      .from('beta_codes')
      .select('id, uses, max_uses, active')
      .eq('code', clean)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Invalid access code. Try again or join the waitlist.' },
        { status: 404 }
      )
    }

    if (!data.active) {
      return NextResponse.json(
        { error: 'This code is no longer active.' },
        { status: 403 }
      )
    }

    if (data.uses >= data.max_uses) {
      return NextResponse.json(
        { error: 'This code has reached its limit. Join the waitlist instead.' },
        { status: 403 }
      )
    }

    // Increment uses
    await supabase
      .from('beta_codes')
      .update({ uses: data.uses + 1 })
      .eq('id', data.id)

    // Set beta access cookie — 30 days
    const response = NextResponse.json({ ok: true })
    response.cookies.set('markeetee-beta', process.env.BETA_COOKIE_SECRET!, {
      maxAge:   60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: 'lax',
      path:     '/',
      secure:   process.env.NODE_ENV === 'production',
    })
    return response

  } catch (err) {
    console.error('[beta-access]', err)
    return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 })
  }
}