// app/api/send-enquiry/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { businessId, businessName, name, email, phone, message } = await req.json()

    if (!businessId || !name || !email || !message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get business owner email
    const { data: biz } = await supabase
      .from('businesses')
      .select('owner_id, profiles(email, name)')
      .eq('id', businessId)
      .single()

    const ownerEmail = (biz?.profiles as any)?.email
    if (!ownerEmail) {
      // No owner email — still return ok (enquiry saved to DB already)
      return NextResponse.json({ ok: true })
    }

    const resend = new Resend(process.env.RESEND_API_KEY!)

    await resend.emails.send({
      from:    process.env.EMAIL_FROM!,
      to:      ownerEmail,
      replyTo: email,
      subject: `New enquiry from ${name} — ${businessName}`,
      html: `<!doctype html>
<html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 14px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:20px;overflow:hidden;border:1px solid #E5E7EB;">

  <tr><td style="background:#053528;padding:32px;">
    <p style="margin:0;font-size:22px;font-weight:800;color:#fff;">New enquiry</p>
    <p style="margin:6px 0 0;font-size:14px;color:#9FE1CB;">${businessName}</p>
  </td></tr>

  <tr><td style="padding:32px;">
    <div style="background:#F0FAF6;border-left:4px solid #9FE1CB;border-radius:0 12px 12px 0;padding:16px 18px;margin:0 0 24px;font-size:14px;color:#374151;">
      <strong>${name}</strong> sent you an enquiry via Markeetee.
    </div>

    <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
      <tr style="border-bottom:1px solid #F3F4F6;">
        <td style="padding:10px 0;font-size:13px;color:#9CA3AF;width:80px;">Name</td>
        <td style="padding:10px 0;font-size:14px;color:#111827;font-weight:500;">${name}</td>
      </tr>
      <tr style="border-bottom:1px solid #F3F4F6;">
        <td style="padding:10px 0;font-size:13px;color:#9CA3AF;">Email</td>
        <td style="padding:10px 0;font-size:14px;color:#111827;">${email}</td>
      </tr>
      ${phone ? `<tr style="border-bottom:1px solid #F3F4F6;">
        <td style="padding:10px 0;font-size:13px;color:#9CA3AF;">Phone</td>
        <td style="padding:10px 0;font-size:14px;color:#111827;">${phone}</td>
      </tr>` : ''}
    </table>

    <div style="background:#F9FAFB;border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.05em;">Message</p>
      <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;white-space:pre-line;">${message}</p>
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" align="center">
      <tr>
        <td style="border-radius:12px;background:#1D9E75;">
          <a href="mailto:${email}?subject=Re: Your enquiry to ${businessName}"
            style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">
            Reply to ${name} →
          </a>
        </td>
      </tr>
    </table>
  </td></tr>

  <tr><td style="background:#FAFAF9;border-top:1px solid #E5E7EB;padding:24px;text-align:center;">
    <p style="margin:0 0 4px;font-size:13px;color:#6B7280;">This enquiry was sent via <strong>Markeetee</strong></p>
    <p style="margin:0;font-size:12px;color:#9CA3AF;">markeetee.com · Africa is here. Find it.</p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[send-enquiry]', err)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}