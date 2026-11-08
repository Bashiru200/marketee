import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { authErrorResponse, createAdminClient, requireAdminAccess } from '@/lib/adminAuth'
import { adminMessageTemplate } from '@/lib/emailTemplates'

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? '').trim().slice(0, maxLength)
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminAccess()
    const payload = await req.json()

    const toEmail = cleanText(payload.toEmail, 320).toLowerCase()
    const toName = cleanText(payload.toName, 120)
    const subject = cleanText(payload.subject, 150)
    const message = cleanText(payload.body ?? payload.message, 8000)
    const ctaLabel = cleanText(payload.ctaLabel, 40)
    const ctaUrl = cleanText(payload.ctaUrl, 500)
    const dryRun = process.env.NODE_ENV !== 'production' || payload.dryRun === true

    if (!isEmail(toEmail)) return jsonError('Enter a valid recipient email', 400)
    if (subject.length < 4) return jsonError('Subject is too short', 400)
    if (message.length < 10) return jsonError('Message must be at least 10 characters', 400)
    if (ctaUrl && !/^https?:\/\//i.test(ctaUrl)) return jsonError('CTA URL must start with http:// or https://', 400)

    const template = adminMessageTemplate({
      recipientName: toName,
      subject,
      message,
      ctaLabel: ctaLabel || undefined,
      ctaUrl: ctaUrl || undefined,
    })

    if (!dryRun) {
      if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
        return jsonError('Email provider is not configured', 500)
      }

      const resend = new Resend(process.env.RESEND_API_KEY)
      const { error } = await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: toEmail,
        replyTo: process.env.CONTACT_EMAIL ?? process.env.EMAIL_FROM,
        subject: template.subject,
        html: template.html,
      })

      if (error) {
        return jsonError(error.message || 'Email provider rejected the message', 502)
      }
    }

    const supabase = createAdminClient()
    await supabase.from('audit_logs').insert({
      admin_id: admin.id,
      action: dryRun ? 'preview_admin_email' : 'send_email',
      entity_type: 'user',
      entity_name: toName || toEmail,
      details: { to: toEmail, subject },
    })

    return NextResponse.json({ ok: true, dryRun })
  } catch (error) {
    try {
      return authErrorResponse(error)
    } catch (unhandled) {
      console.error('[admin-email]', unhandled)
      return jsonError('Failed to send', 500)
    }
  }
}
