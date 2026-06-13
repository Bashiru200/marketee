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

  // Rate limit — 10 emails per hour per user
  const ip    = getClientIp(req)
  const limit = LIMITS.contact(ip)
  if (!limit.success) return rateLimitResponse(limit.resetAt)

  try {
    const { to, toName, subject, body, fromBusiness, userId } = await req.json()

    if (!to || !subject?.trim() || !body?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify user owns a business
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, business_id')
      .eq('id', userId)
      .single()

    if (!profile || profile.role !== 'owner') {
      return NextResponse.json({ error: 'Only business owners can send emails' }, { status: 403 })
    }

    const paragraphs = body
      .split('\n\n')
      .filter(Boolean)
      .map((p: string) => `<p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.7">${p.replace(/\n/g, '<br>')}</p>`)
      .join('')

    await resend.emails.send({
      from:    process.env.EMAIL_FROM!,
      to,
      subject,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px 16px">
          <div style="background:#085041;padding:24px 32px;border-radius:12px 12px 0 0">
            <p style="margin:0;font-size:20px;font-weight:700;color:#fff">${fromBusiness}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#9FE1CB">via Markeetee</p>
          </div>
          <div style="background:#fff;padding:28px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
            <p style="margin:0 0 20px;font-size:15px;color:#111827">Hi <strong>${toName}</strong>,</p>
            ${paragraphs}
          </div>
          <p style="text-align:center;font-size:11px;color:#9ca3af;margin-top:16px">
            Sent via <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color:#1D9E75">Markeetee</a>
          </p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[send-email]', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}