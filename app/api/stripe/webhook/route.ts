// app/api/stripe/webhook/route.ts
// Handles all Stripe subscription events — upgrades, downgrades, failures, cancellations

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ── Helper: update business plan in DB ───────────────────────────────────
async function updatePlan(
  supabase: ReturnType<typeof getSupabase>,
  customerId: string,
  updates: Record<string, string | null | boolean>
) {
  await supabase
    .from('businesses')
    .update(updates as any)
    .eq('stripe_customer_id', customerId)
}

// ── Helper: send email to business owner ─────────────────────────────────
async function notifyOwner(
  supabase: ReturnType<typeof getSupabase>,
  customerId: string,
  subject: string,
  html: string
) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY!)

    const { data: biz } = await supabase
      .from('businesses')
      .select('owner_id, name')
      .eq('stripe_customer_id', customerId)
      .single()

    if (!biz?.owner_id) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', biz.owner_id)
      .single()

    if (!profile?.email) return

    await resend.emails.send({
      from:    process.env.EMAIL_FROM!,
      to:      profile.email,
      subject,
      html,
    })
  } catch (err) {
    console.error('[webhook/notify]', err)
  }
}

export async function POST(req: NextRequest) {
  const stripe   = getStripe()
  const supabase = getSupabase()

  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('[webhook] signature failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://markeetee.com'

  try {
    switch (event.type) {

      // ── Subscription created or renewed ────────────────────────────────
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub      = event.data.object as Stripe.Subscription
        const meta     = sub.metadata
        const plan     = meta.plan     ?? 'free'
        const interval = meta.interval ?? 'monthly'
        const status   = sub.status    // active, trialing, past_due, canceled

        const planName = status === 'active' || status === 'trialing'
          ? plan : 'free'

        const cancelAt = sub.cancel_at
          ? new Date(sub.cancel_at * 1000).toISOString()
          : null

        const periodEnd  = (sub as any).current_period_end ?? null
        const expiresAt = periodEnd
          ? new Date(periodEnd * 1000).toISOString()
          : null

        await updatePlan(supabase, sub.customer as string, {
          plan:                   planName,
          plan_status:            status,
          plan_interval:          interval,
          plan_expires_at:        expiresAt,
          plan_cancel_at:         cancelAt,
          stripe_subscription_id: sub.id,
        })

        // Welcome email on new subscription
        if (event.type === 'customer.subscription.created' && status === 'active') {
          await notifyOwner(
            supabase, sub.customer as string,
            `🎉 Welcome to Markeetee ${plan.charAt(0).toUpperCase() + plan.slice(1)}!`,
            `<div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:32px 16px">
              <div style="background:#085041;padding:28px;border-radius:12px 12px 0 0">
                <p style="margin:0;font-size:20px;font-weight:700;color:#fff">You're now on the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan!</p>
                <p style="margin:6px 0 0;font-size:13px;color:#9FE1CB">Your subscription is active</p>
              </div>
              <div style="background:#fff;padding:28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
                <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 16px">
                  Thank you for upgrading! Your ${plan} features are now unlocked.
                </p>
                <a href="${appUrl}/dashboard"
                  style="display:inline-block;background:#1D9E75;color:#fff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:10px;text-decoration:none">
                  Go to your dashboard →
                </a>
              </div>
            </div>`
          )
        }

        // Cancellation scheduled email
        if (cancelAt) {
          await notifyOwner(
            supabase, sub.customer as string,
            'Your Markeetee subscription is ending',
            `<div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:32px 16px">
              <div style="background:#085041;padding:28px;border-radius:12px 12px 0 0">
                <p style="margin:0;font-size:20px;font-weight:700;color:#fff">Subscription ending soon</p>
              </div>
              <div style="background:#fff;padding:28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
                <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 16px">
                  Your ${plan} subscription will end on <strong>${new Date(cancelAt).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })}</strong>.
                  After that your listing will revert to the Free plan.
                </p>
                <a href="${appUrl}/dashboard?tab=upgrade"
                  style="display:inline-block;background:#1D9E75;color:#fff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:10px;text-decoration:none">
                  Keep my subscription →
                </a>
              </div>
            </div>`
          )
        }
        break
      }

      // ── Payment failed ─────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice    = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        const attempt    = invoice.attempt_count ?? 1

        await updatePlan(supabase, customerId, { plan_status: 'past_due' })

        await notifyOwner(
          supabase, customerId,
          `⚠️ Payment failed for your Markeetee subscription`,
          `<div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:32px 16px">
            <div style="background:#085041;padding:28px;border-radius:12px 12px 0 0">
              <p style="margin:0;font-size:20px;font-weight:700;color:#fff">Payment failed</p>
              <p style="margin:6px 0 0;font-size:13px;color:#9FE1CB">Attempt ${attempt} of 4</p>
            </div>
            <div style="background:#fff;padding:28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
              <div style="background:#FEF3C7;border-radius:10px;padding:14px 16px;margin-bottom:16px">
                <p style="margin:0;font-size:13px;color:#92400E;font-weight:600">⚠️ Action required</p>
                <p style="margin:6px 0 0;font-size:13px;color:#92400E;line-height:1.5">
                  We couldn't charge your card. Please update your payment method to keep your subscription active.
                  ${attempt >= 3 ? ' Your subscription will be cancelled if this is not resolved.' : ''}
                </p>
              </div>
              <a href="${appUrl}/api/stripe/portal"
                style="display:inline-block;background:#1D9E75;color:#fff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:10px;text-decoration:none">
                Update payment method →
              </a>
            </div>
          </div>`
        )
        break
      }

      // ── Payment succeeded (after failure) ─────────────────────────────
      case 'invoice.paid': {
        const invoice    = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        // Restore active status if it was past_due
        await updatePlan(supabase, customerId, { plan_status: 'active' })
        break
      }

      // ── Subscription cancelled / deleted ──────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription

        await updatePlan(supabase, sub.customer as string, {
          plan:                   'free',
          plan_status:            'canceled',
          plan_interval:          'monthly',
          plan_expires_at:        null,
          plan_cancel_at:         null,
          stripe_subscription_id: null,
        })

        await notifyOwner(
          supabase, sub.customer as string,
          'Your Markeetee subscription has ended',
          `<div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:32px 16px">
            <div style="background:#085041;padding:28px;border-radius:12px 12px 0 0">
              <p style="margin:0;font-size:20px;font-weight:700;color:#fff">Subscription ended</p>
            </div>
            <div style="background:#fff;padding:28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
              <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 16px">
                Your subscription has ended and your listing has moved to the Free plan.
                Your data is safe — you can resubscribe anytime to restore your features.
              </p>
              <a href="${appUrl}/dashboard?tab=upgrade"
                style="display:inline-block;background:#1D9E75;color:#fff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:10px;text-decoration:none">
                Resubscribe →
              </a>
            </div>
          </div>`
        )
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[webhook/handler]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}