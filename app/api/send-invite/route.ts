// app/api/send-invite/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
// import { adminMessageTemplate } from '@/lib/emailTemplates'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const resend   = new Resend(process.env.RESEND_API_KEY!)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { email, roleLabel, businessId, invitedBy } = await req.json()

    if (!email || !roleLabel || !invitedBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fetch inviter + verify permission
    const { data: inviter } = await supabase
      .from('profiles')
      .select('name, email, is_admin, business_id')
      .eq('id', invitedBy)
      .single()

    if (!inviter) {
      return NextResponse.json({ error: 'Inviter not found' }, { status: 404 })
    }

    const isAuthorized =
      inviter.is_admin === true ||
      (businessId && inviter.business_id === businessId)

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Not authorised to send this invite' }, { status: 403 })
    }

    let businessName: string | undefined
    if (businessId) {
      const { data: biz } = await supabase
        .from('businesses').select('name').eq('id', businessId).single()
      businessName = biz?.name
    }

    const token     = crypto.randomBytes(24).toString('hex')
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept?token=${token}`
    const inviterName = inviter.name ?? inviter.email ?? 'A Markeetee admin'
    const inviteeName = email.split('@')[0]

    const { error: insertError } = await supabase.from('invites').insert({
      email,
      role_label:  roleLabel,
      business_id: businessId ?? null,
      invited_by:  invitedBy,
      token,
    })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    const subject  = `You've been invited to Markeetee${businessName ? ` — ${businessName}` : ''}`
    const message  = `${inviterName} has invited you to join Markeetee as a <strong>${roleLabel}</strong>${businessName ? ` for <strong>${businessName}</strong>` : ''}.

Click the button below to accept your invitation and set up your account.

Your invitation link expires in 48 hours.`

    await resend.emails.send({
      from:    process.env.EMAIL_FROM!,
      to:      email,
      subject,
      html:    message,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[send-invite]', err)
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 })
  }
}