// app/api/stripe/checkout/route.ts
// Creates a Stripe Checkout session for Premium or Storefront subscription

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

// ── Price IDs from your Stripe dashboard ─────────────────────────────────
// Set these in Vercel env vars after creating products in Stripe
const PRICE_IDS: Record<string, string> = {
  growth_monthly:    process.env.STRIPE_PRICE_GROWTH_MONTHLY!,
  growth_annual:     process.env.STRIPE_PRICE_GROWTH_ANNUAL!,
  pro_store_monthly: process.env.STRIPE_PRICE_PRO_STORE_MONTHLY!,
  pro_store_annual:  process.env.STRIPE_PRICE_PRO_STORE_ANNUAL!,
}

export async function POST(req: NextRequest) {
  const stripe   = getStripe()
  const supabase = getSupabase()

  try {
    const { businessId, plan, interval, userId } = await req.json()
    // plan: 'premium' | 'storefront'
    // interval: 'monthly' | 'annual'

    if (!businessId || !plan || !interval || !userId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const priceKey = `${plan}_${interval}`
    const priceId  = PRICE_IDS[priceKey]

    if (!priceId) {
      return NextResponse.json({ error: `Price not configured for ${priceKey}` }, { status: 400 })
    }

    // Get business + owner info
    const { data: biz } = await supabase
      .from('businesses')
      .select('id, name, stripe_customer_id, plan')
      .eq('id', businessId)
      .single()

    if (!biz) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Get owner email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('id', userId)
      .single()

    // Get or create Stripe customer
    let customerId = biz.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email:    profile?.email ?? undefined,
        name:     profile?.name  ?? undefined,
        metadata: { businessId, userId },
      })
      customerId = customer.id

      await supabase
        .from('businesses')
        .update({ stripe_customer_id: customerId })
        .eq('id', businessId)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://markeetee.com'

    // Create Checkout session
    const session = await stripe.checkout.sessions.create({
      customer:             customerId,
      payment_method_types: ['card'],
      mode:                 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,  // 7-day free trial
        metadata:          { businessId, plan, interval },
      },
      success_url: `${appUrl}/dashboard?upgrade=success&plan=${plan}`,
      cancel_url:  `${appUrl}/dashboard?upgrade=cancelled`,
      metadata:    { businessId, plan, interval, userId },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('[stripe/checkout]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}