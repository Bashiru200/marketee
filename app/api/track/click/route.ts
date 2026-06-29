// app/api/track/click/route.ts
// Records a WhatsApp, phone, website or directions click.

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
    const { businessId, clickType, viewerId } = await req.json()

    if (!businessId || !clickType) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    await supabase.from('business_clicks').insert({
      business_id: businessId,
      click_type:  clickType,
      viewer_id:   viewerId ?? null,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[track/click]', err)
    return NextResponse.json({ error: 'Failed to track click' }, { status: 500 })
  }
}