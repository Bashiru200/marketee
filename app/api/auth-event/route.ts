import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { userId, eventType, metadata } = await req.json()
    if (!userId || !eventType) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const ip        = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
    const userAgent = req.headers.get('user-agent') ?? null

    await supabase.from('auth_events').insert({
      user_id:    userId,
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