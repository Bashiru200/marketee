import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { welcomeEmailTemplate } from '@/lib/emailTemplates'

type WelcomeRole = 'customer' | 'owner'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(req: NextRequest) {
  try {
    const userClient = await createServerClient()
    const {
      data: { user },
    } = await userClient.auth.getUser()

    if (!user) return jsonError('Sign in required', 401)

    const payload = await req.json()
    const role: WelcomeRole = payload.role === 'owner' ? 'owner' : 'customer'
    const requestedUserId = String(payload.userId ?? '')

    if (requestedUserId && requestedUserId !== user.id) {
      return jsonError('Cannot send welcome email for another user', 403)
    }

    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
      return jsonError('Email provider is not configured', 500)
    }

    const supabase = getSupabase()
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, email, role')
      .eq('id', user.id)
      .single()

    const toEmail = profile?.email ?? user.email
    if (!toEmail) return jsonError('No email address available', 400)

    const template = welcomeEmailTemplate({
      name: profile?.name ?? user.user_metadata?.name ?? null,
      role,
    })

    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: toEmail,
      subject: template.subject,
      html: template.html,
    })

    if (error) {
      return jsonError(error.message || 'Email provider rejected the message', 502)
    }

    await supabase.from('auth_events').insert({
      user_id: user.id,
      event_type: 'welcome_email_sent',
      metadata: { role, profileRole: profile?.role ?? null },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[send-welcome]', error)
    return jsonError('Failed to send welcome email', 500)
  }
}
