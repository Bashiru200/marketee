// app/api/track/view/route.ts
// Records a profile view. Called client-side on the business detail page.
// Uses a session cookie to deduplicate — same visitor won't count twice in 1 hour.

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
    const { businessId, viewerId, source = 'direct' } = await req.json()

    if (!businessId) {
      return NextResponse.json({ error: 'Missing businessId' }, { status: 400 })
    }

    // Deduplicate — check if this visitor already viewed in the last hour
    // Using a cookie key: markeetee-view-{businessId}
    const cookieKey  = `mv-${businessId}`
    const alreadySeen = req.cookies.get(cookieKey)?.value

    if (alreadySeen) {
      return NextResponse.json({ ok: true, counted: false })
    }

    // Don't count the owner viewing their own page
    if (viewerId) {
      const { data: biz } = await supabase
        .from('businesses')
        .select('owner_id')
        .eq('id', businessId)
        .single()
      if (biz?.owner_id === viewerId) {
        return NextResponse.json({ ok: true, counted: false })
      }
    }

    // Insert the view
    await supabase.from('business_views').insert({
      business_id: businessId,
      viewer_id:   viewerId ?? null,
      source,
    })

    // Set dedup cookie — expires in 1 hour
    const response = NextResponse.json({ ok: true, counted: true })
    response.cookies.set(cookieKey, '1', {
      maxAge:   60 * 60,
      httpOnly: true,
      sameSite: 'lax',
      path:     '/',
    })
    return response
  } catch (err) {
    console.error('[track/view]', err)
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 })
  }
}