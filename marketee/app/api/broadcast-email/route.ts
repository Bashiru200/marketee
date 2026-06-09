import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { LIMITS, getClientIp, rateLimitResponse } from '@/lib/rateLimit'

const resend   = new Resend(process.env.RESEND_API_KEY!)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { subject, body, audience, adminId } = await req.json()

    if (!subject?.trim() || !body?.trim() || !audience) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify admin
    const { data: admin } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', adminId)
      .single()

    if (!admin?.is_admin) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })
    }

    // Rate limit — 2 broadcasts per hour per admin
    const limit = LIMITS.broadcast(adminId)
    if (!limit.success) {
      return rateLimitResponse(limit.resetAt)
    }

    // Fetch recipients
    let query = supabase.from('profiles').select('email, name').not('email', 'is', null)
    if (audience === 'owners')    query = query.eq('role', 'owner')
    if (audience === 'customers') query = query.eq('role', 'customer')

    const { data: recipients } = await query
    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients found' }, { status: 400 })
    }

    // Send in batches of 50
    const BATCH = 50
    let sent = 0

    for (let i = 0; i < recipients.length; i += BATCH) {
      const batch  = recipients.slice(i, i + BATCH)
      const emails = batch
        .filter(r => r.email)
        .map(r => ({
          from:    process.env.EMAIL_FROM!,
          to:      r.email!,
          subject,
          html:    buildEmailHtml({ name: r.name ?? 'there', subject, body }),
        }))

      if (emails.length > 0) {
        await resend.batch.send(emails)
        sent += emails.length
      }
    }

    // Log to broadcast_emails
    await supabase.from('broadcast_emails').insert({
      subject, body, audience,
      sent_count: sent,
      sent_by:    adminId,
    })

    return NextResponse.json({ ok: true, sent })
  } catch (err) {
    console.error('[broadcast]', err)
    return NextResponse.json({ error: 'Failed to send emails' }, { status: 500 })
  }
}

function buildEmailHtml({ name, subject, body }: { name: string; subject: string; body: string }) {
  const paragraphs = body
    .split('\n\n')
    .filter(Boolean)
    .map(p => `<p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.7">${p.replace(/\n/g, '<br>')}</p>`)
    .join('')

  return `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px 16px">
      <div style="background:#085041;padding:24px 32px;border-radius:12px 12px 0 0">
        <p style="margin:0;font-size:22px;font-weight:700;color:#fff">Markeetee</p>
      </div>
      <div style="background:#fff;padding:28px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        <p style="margin:0 0 20px;font-size:15px;color:#111827">Hi <strong>${name}</strong>,</p>
        ${paragraphs}
        <div style="margin-top:24px;padding-top:20px;border-top:1px solid #f3f4f6">
          <p style="margin:0;font-size:12px;color:#9ca3af">
            You received this because you have an account on Markeetee.
          </p>
        </div>
      </div>
      <p style="text-align:center;font-size:11px;color:#9ca3af;margin-top:16px">
        © 2025 Markeetee
      </p>
    </div>
  `
}