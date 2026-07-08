// app/api/stripe/portal/route.ts
// Opens the Stripe Customer Portal so users can manage/cancel subscriptions

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const stripe   = getStripe()
  const supabase = getSupabase()

  try {
    const { businessId } = await req.json()

    const { data: biz } = await supabase
      .from('businesses')
      .select('stripe_customer_id')
      .eq('id', businessId)
      .single()

    if (!biz?.stripe_customer_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://markeetee.com'

    const session = await stripe.billingPortal.sessions.create({
      customer:   biz.stripe_customer_id,
      return_url: `${appUrl}/dashboard`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('[stripe/portal]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}