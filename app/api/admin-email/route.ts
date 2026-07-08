// app/api/admin-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { adminMessageTemplate } from '@/lib/emailTemplates'

export async function POST(req: NextRequest) {
  const resend   = new Resend(process.env.RESEND_API_KEY!)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { toEmail, toName, subject, body, adminId } = await req.json()

    if (!toEmail || !subject?.trim() || !body?.trim() || !adminId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify sender is admin
    const { data: admin } = await supabase
      .from('profiles')
      .select('name, is_admin')
      .eq('id', adminId)
      .single()

    if (!admin?.is_admin) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })
    }

    const template = adminMessageTemplate({
      recipientName: toName ?? null,
      subject,
      message:       body,
    })

    await resend.emails.send({
      from:    process.env.EMAIL_FROM!,
      to:      toEmail,
      replyTo: process.env.CONTACT_EMAIL ?? process.env.EMAIL_FROM!,
      subject: template.subject,
      html:    template.html,
    })

    // Log to audit
    await supabase.from('audit_logs').insert({
      admin_id:    adminId,
      action:      'send_email',
      entity_type: 'user',
      entity_name: toName,
      details:     { to: toEmail, subject },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin-email]', err)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}