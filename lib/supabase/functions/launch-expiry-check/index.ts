// @ts-nocheck
// deno-lint-ignore-file
// supabase/functions/launch-expiry-check/index.ts
// Schedule: 0 9 * * * (daily at 9am)
// Downgrades expired launch businesses + sends warning emails

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)
const resend  = new Resend(Deno.env.get('RESEND_API_KEY')!)
const APP_URL = 'https://markeetee.com'
const FROM    = Deno.env.get('EMAIL_FROM')!

async function getOwnerEmail(ownerId: string) {
  const { data } = await supabase.from('profiles')
    .select('email, name').eq('id', ownerId).single()
  return data
}

Deno.serve(async () => {
  const now  = new Date()
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const in7  = new Date(now.getTime() +  7 * 24 * 60 * 60 * 1000)

  // ── 1. Bulk downgrade expired businesses via SQL function ─────────────
  const { data: downgradedList } = await supabase
    .rpc('downgrade_expired_launch_businesses')

  console.log(`Downgraded ${downgradedList?.length ?? 0} businesses`)

  // Send downgrade emails
  for (const biz of downgradedList ?? []) {
    const { data: bizFull } = await supabase
      .from('businesses').select('owner_id').eq('id', biz.id).single()
    if (!bizFull?.owner_id) continue

    const profile = await getOwnerEmail(bizFull.owner_id)
    if (!profile?.email) continue

    await resend.emails.send({
      from: FROM, to: profile.email,
      subject: 'Your Markeetee launch access has ended',
      html: emailHtml({
        title:   'Your launch access has ended',
        badge:   'Action required',
        name:    profile.name,
        body:    `Your 6-month free Pro Store access for <strong>${biz.name}</strong> has ended. Your listing has moved to the Starter plan. Upgrade to keep your photos, products, analytics, custom URL, and enquiry form.`,
        cta:     'Upgrade my plan →',
        ctaUrl:  `${APP_URL}/dashboard?tab=upgrade`,
      }),
    })
  }

  // ── 2. Warn businesses expiring in 30 days ────────────────────────────
  const { data: expiring30 } = await supabase
    .from('businesses')
    .select('id, name, owner_id, plan_expires_at')
    .eq('plan_interval', 'launch')
    .eq('plan', 'pro_store')
    .gte('plan_expires_at', now.toISOString())
    .lte('plan_expires_at', in30.toISOString())
    .gt('plan_expires_at',  in7.toISOString()) // not in the 7-day window

  for (const biz of expiring30 ?? []) {
    const profile = await getOwnerEmail(biz.owner_id)
    if (!profile?.email) continue
    const days = Math.ceil((new Date(biz.plan_expires_at).getTime() - now.getTime()) / 86400000)

    await resend.emails.send({
      from: FROM, to: profile.email,
      subject: `⚠️ Your free Pro Store access ends in ${days} days`,
      html: emailHtml({
        title:   `Your launch access ends in ${days} days`,
        badge:   'Heads up',
        name:    profile.name,
        body:    `Your 6-month free Pro Store access for <strong>${biz.name}</strong> will end on <strong>${new Date(biz.plan_expires_at).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</strong>. Upgrade now to keep all your Pro Store features.`,
        cta:     'Keep my Pro Store access →',
        ctaUrl:  `${APP_URL}/dashboard?tab=upgrade`,
      }),
    })
  }

  // ── 3. Final 7-day warning ────────────────────────────────────────────
  const { data: expiring7 } = await supabase
    .from('businesses')
    .select('id, name, owner_id, plan_expires_at')
    .eq('plan_interval', 'launch')
    .eq('plan', 'pro_store')
    .gte('plan_expires_at', now.toISOString())
    .lte('plan_expires_at', in7.toISOString())

  for (const biz of expiring7 ?? []) {
    const profile = await getOwnerEmail(biz.owner_id)
    if (!profile?.email) continue

    await resend.emails.send({
      from: FROM, to: profile.email,
      subject: `🚨 Last chance — Pro Store access ends in 7 days`,
      html: emailHtml({
        title:   'Last chance to upgrade',
        badge:   '7 days left',
        name:    profile.name,
        body:    `Your free Pro Store access for <strong>${biz.name}</strong> ends in 7 days. After that your listing drops to Starter — no products, no analytics, no custom URL. Upgrade today to keep everything.`,
        cta:     '🚀 Upgrade now →',
        ctaUrl:  `${APP_URL}/dashboard?tab=upgrade`,
      }),
    })
  }

  return new Response(JSON.stringify({
    downgraded: downgradedList?.length ?? 0,
    warned30:   expiring30?.length ?? 0,
    warned7:    expiring7?.length  ?? 0,
  }), { headers: { 'Content-Type': 'application/json' } })
})

// ── Email HTML helper ─────────────────────────────────────────────────────
function emailHtml({ title, badge, name, body, cta, ctaUrl }: {
  title: string; badge: string; name: string | null
  body: string; cta: string; ctaUrl: string
}) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 14px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#fff;border-radius:20px;overflow:hidden;border:1px solid #E5E7EB;">
  <tr><td style="background:#053528;padding:32px;">
    <table cellpadding="0" cellspacing="0"><tr>
      <td><img src="https://markeetee.com/apple-touch-icon.png" width="40" height="40" style="border-radius:10px;" /></td>
      <td style="padding-left:10px;font-size:20px;font-weight:800;color:#fff;vertical-align:middle;">Markeetee</td>
    </tr></table>
    <p style="margin:20px 0 4px;font-size:22px;font-weight:700;color:#fff;">${title}</p>
    <span style="background:rgba(159,225,203,0.2);color:#9FE1CB;font-size:11px;font-weight:600;padding:4px 12px;border-radius:20px;">${badge}</span>
  </td></tr>
  <tr><td style="padding:32px;">
    <p style="margin:0 0 16px;font-size:15px;color:#111827;">Hi ${name ?? 'there'} 👋</p>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;">${body}</p>
    <a href="${ctaUrl}" style="display:inline-block;background:#1D9E75;color:#fff;font-size:14px;font-weight:600;padding:14px 28px;border-radius:12px;text-decoration:none;">${cta}</a>
  </td></tr>
  <tr><td style="background:#F9FAFB;padding:20px 32px;border-top:1px solid #E5E7EB;text-align:center;">
    <p style="margin:0;font-size:12px;color:#9CA3AF;">© 2026 Markeetee · <a href="https://markeetee.com/privacy" style="color:#9CA3AF;">Privacy</a></p>
  </td></tr>
</table></td></tr></table>
</body></html>`
}