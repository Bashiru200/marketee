import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { LIMITS, getClientIp, rateLimitResponse } from '@/lib/rateLimit'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: NextRequest) {
  // Rate limit — 5 per hour per IP
  const ip    = getClientIp(req)
  const limit = LIMITS.contact(ip)

  if (!limit.success) {
    return rateLimitResponse(limit.resetAt)
  }

  try {
    const { name, email, subject, message } = await req.json()

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // Send to team
    await resend.emails.send({
      from:    process.env.EMAIL_FROM!,
      to:      process.env.CONTACT_EMAIL ?? process.env.EMAIL_FROM!,
      replyTo: email,
      subject: `[Markeetee Contact] ${subject} — from ${name}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px 16px">
          <div style="background:#085041;padding:24px 32px;border-radius:12px 12px 0 0">
            <h2 style="margin:0;color:#fff;font-size:20px">New contact form submission</h2>
          </div>
          <div style="background:#fff;padding:24px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;width:100px">Name</td>
                  <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111827"><strong>${name}</strong></td></tr>
              <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280">Email</td>
                  <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px"><a href="mailto:${email}" style="color:#1D9E75">${email}</a></td></tr>
              <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Subject</td>
                  <td style="padding:8px 0;font-size:14px;color:#111827">${subject}</td></tr>
            </table>
            <div style="margin-top:20px;background:#f9fafb;border-radius:8px;padding:16px;font-size:14px;color:#374151;line-height:1.6;white-space:pre-wrap">${message}</div>
            <div style="margin-top:20px">
              <a href="mailto:${email}?subject=Re: ${subject}"
                style="display:inline-block;background:#1D9E75;color:#fff;font-size:13px;font-weight:600;padding:10px 20px;border-radius:8px;text-decoration:none">
                Reply to ${name} →
              </a>
            </div>
          </div>
        </div>
      `,
    })

    // Confirmation to user
    await resend.emails.send({
      from:    process.env.EMAIL_FROM!,
      to:      email,
      subject: `We received your message — Markeetee`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px 16px">
          <div style="background:#085041;padding:24px 32px;border-radius:12px 12px 0 0">
            <p style="margin:0;font-size:22px;font-weight:700;color:#fff">Markeetee</p>
          </div>
          <div style="background:#fff;padding:24px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
            <p style="font-size:15px;color:#111827">Hi <strong>${name}</strong>,</p>
            <p style="font-size:14px;color:#374151;line-height:1.6">
              Thanks for reaching out! We&apos;ll get back to you within 24 hours.
            </p>
            <div style="background:#f0faf6;border-radius:10px;padding:16px;margin:20px 0;font-size:13px;color:#374151;white-space:pre-wrap">${message}</div>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[contact]', err)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}