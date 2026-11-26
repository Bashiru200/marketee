import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const userClient = await createServerClient()
    const {
      data: { user },
    } = await userClient.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
    }

    const { eventType, metadata } = await req.json()
    if (!eventType) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const ip        = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
    const userAgent = req.headers.get('user-agent') ?? null

    await supabase.from('auth_events').insert({
      user_id:    user.id,
      event_type: eventType,
      metadata:   metadata ?? {},
      ip_address: ip,
      user_agent: userAgent,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[auth-event]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
