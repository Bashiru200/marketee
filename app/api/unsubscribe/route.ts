// app/api/unsubscribe/route.ts
// Handles both GET (one-click unsubscribe from email link) and
// POST (granular preference updates from the unsubscribe page)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/unsubscribe?token=xxx&type=all|marketing|reviews|broadcast
// Called when user clicks the unsubscribe link in an email
export async function GET(req: NextRequest) {
  const supabase = getSupabase()
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  const type  = searchParams.get('type') ?? 'all'

  if (!token) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?error=missing_token`
    )
  }

  const { data: prefs, error } = await supabase
    .from('email_preferences')
    .select('id, email, unsubscribed_from, unsubscribed_all')
    .eq('token', token)
    .single()

  if (error || !prefs) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?error=invalid_token`
    )
  }

  if (type === 'all') {
    await supabase.from('email_preferences')
      .update({ unsubscribed_all: true, updated_at: new Date().toISOString() })
      .eq('token', token)
  } else {
    const current = prefs.unsubscribed_from ?? []
    if (!current.includes(type)) {
      await supabase.from('email_preferences')
        .update({
          unsubscribed_from: [...current, type],
          updated_at: new Date().toISOString(),
        })
        .eq('token', token)
    }
  }

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?success=true&type=${type}&email=${encodeURIComponent(prefs.email)}`
  )
}

// POST /api/unsubscribe — update preferences from the unsubscribe page form
export async function POST(req: NextRequest) {
  const supabase = getSupabase()

  try {
    const { token, preferences } = await req.json()
    // preferences: { marketing: bool, reviews: bool, broadcast: bool, all: bool }

    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

    const unsubscribed_from: string[] = []
    if (preferences.marketing) unsubscribed_from.push('marketing')
    if (preferences.reviews)   unsubscribed_from.push('reviews')
    if (preferences.broadcast) unsubscribed_from.push('broadcast')

    await supabase.from('email_preferences')
      .update({
        unsubscribed_from,
        unsubscribed_all: preferences.all ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq('token', token)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[unsubscribe]', err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

// Helper — call this when creating/sending any email to ensure the
// recipient has an unsubscribe token. Returns the token.
export async function ensureUnsubscribeToken(
  email: string,
  userId?: string
): Promise<string> {
  const supabase = getSupabase()

  const { data: existing } = await supabase
    .from('email_preferences')
    .select('token')
    .eq('email', email)
    .single()

  if (existing?.token) return existing.token

  const token = crypto.randomBytes(24).toString('hex')
  await supabase.from('email_preferences').upsert({
    email,
    user_id: userId ?? null,
    token,
  }, { onConflict: 'email' })

  return token
}