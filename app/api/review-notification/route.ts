import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { LIMITS, getClientIp, rateLimitResponse } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  const resend   = new Resend(process.env.RESEND_API_KEY!)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Rate limit webhook — 30 per minute per IP
  const ip    = getClientIp(req)
  const limit = LIMITS.search(ip) // reuse search limit for webhooks

  if (!limit.success) {
    return rateLimitResponse(limit.resetAt)
  }

  try {
    const { type, record } = await req.json()
    if (type !== 'INSERT') return NextResponse.json({ ok: true })

    const review = record

    const { data: biz } = await supabase
      .from('businesses')
      .select('name, email, owner_id, profiles(name, email)')
      .eq('id', review.business_id)
      .single()

    if (!biz) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    const { data: reviewer } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', review.user_id)
      .single()

    const ownerProfile = Array.isArray(biz.profiles) ? biz.profiles[0] : biz.profiles
    const ownerEmail   = biz.email || ownerProfile?.email
    const ownerName    = ownerProfile?.name ?? 'Business owner'
    const reviewerName = reviewer?.name ?? 'A customer'

    if (!ownerEmail) {
      return NextResponse.json({ error: 'No owner email' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://markeetee.com'
    const stars   = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating)

    await resend.emails.send({
      from:    process.env.EMAIL_FROM!,
      to:      ownerEmail,
      subject: `New ${review.rating}★ review on ${biz.name}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 16px">
          <div style="background:#085041;padding:28px 32px;border-radius:12px 12px 0 0">
            <p style="margin:0;font-size:22px;font-weight:700;color:#fff">Markeetee</p>
          </div>
          <div style="background:#fff;padding:28px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
            <p style="font-size:15px;color:#111827">Hi <strong>${ownerName}</strong>,</p>
            <p style="font-size:15px;color:#374151"><strong>${reviewerName}</strong> left a review on <strong>${biz.name}</strong>.</p>
            <div style="background:#f0faf6;border-radius:12px;padding:20px;margin:20px 0">
              <p style="margin:0 0 8px;font-size:22px;color:#F59E0B">${stars}</p>
              <p style="margin:0;font-size:14px;color:#374151;line-height:1.6">&ldquo;${review.body ?? ''}&rdquo;</p>
              <p style="margin:12px 0 0;font-size:12px;color:#6B7280">— ${reviewerName}</p>
            </div>
            <a href="${baseUrl}/businesses/${review.business_id}"
              style="display:inline-block;background:#1D9E75;color:#fff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;text-decoration:none">
              View your listing →
            </a>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[review-notification]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}