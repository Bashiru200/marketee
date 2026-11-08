import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { authErrorResponse, createAdminClient, requireAdminAccess } from '@/lib/adminAuth'
import {
  ensureUnsubscribeToken,
  isSubscribedToEmailType,
  type EmailPreference,
} from '@/lib/emailPreferences'
import { LIMITS, rateLimitResponse } from '@/lib/rateLimit'
import { broadcastEmailTemplate } from '@/lib/emailTemplates'

type Audience = 'all' | 'owners' | 'customers'
type SendMode = 'test' | 'bulk'

interface Recipient {
  id: string
  email: string | null
  name: string | null
  role: string | null
}

const VALID_AUDIENCES = new Set<Audience>(['all', 'owners', 'customers'])
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://markeetee.com'
const BATCH_SIZE = 50

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? '').trim().slice(0, maxLength)
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function formatMessageBody(message: string) {
  return message
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p style="margin:0 0 16px;">${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
    .join('')
}

function shouldDryRun(mode: SendMode) {
  return process.env.NODE_ENV !== 'production' || mode === 'test'
}

async function getRecipients(audience: Audience) {
  const supabase = createAdminClient()
  let query = supabase
    .from('profiles')
    .select('id, email, name, role')
    .not('email', 'is', null)
    .order('created_at', { ascending: false })
    .limit(5000)

  if (audience === 'owners') query = query.eq('role', 'owner')
  if (audience === 'customers') query = query.eq('role', 'customer')

  const { data, error } = await query
  if (error) throw error

  const recipients = ((data ?? []) as Recipient[]).filter((recipient) => recipient.email)
  const emails = recipients.map((recipient) => recipient.email!.toLowerCase())

  const preferenceMap = new Map<string, EmailPreference>()

  if (emails.length > 0) {
    const { data: preferences, error: prefError } = await supabase
      .from('email_preferences')
      .select('email, token, unsubscribed_from, unsubscribed_all')
      .in('email', emails)

    if (prefError) throw prefError

    for (const preference of (preferences ?? []) as EmailPreference[]) {
      preferenceMap.set(preference.email.toLowerCase(), preference)
    }
  }

  const subscribed = recipients.filter((recipient) => {
    const preference = preferenceMap.get(recipient.email!.toLowerCase())
    return isSubscribedToEmailType(preference, 'broadcast') && isSubscribedToEmailType(preference, 'marketing')
  })

  return {
    recipients: subscribed,
    skipped: recipients.length - subscribed.length,
  }
}

export async function GET(req: NextRequest) {
  try {
    await requireAdminAccess({ superAdminOnly: true })
    const audience = req.nextUrl.searchParams.get('audience') ?? 'owners'

    if (!VALID_AUDIENCES.has(audience as Audience)) {
      return jsonError('Invalid audience', 400)
    }

    const { recipients, skipped } = await getRecipients(audience as Audience)
    return NextResponse.json({
      audience,
      count: recipients.length,
      skippedByPreferences: skipped,
    })
  } catch (error) {
    try {
      return authErrorResponse(error)
    } catch (unhandled) {
      console.error('[broadcast-email:get]', unhandled)
      return jsonError('Unable to load recipients', 500)
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminAccess({ superAdminOnly: true })
    const payload = await req.json()

    const mode = payload.mode === 'test' ? 'test' : 'bulk'
    const audience = payload.audience as Audience
    const subject = cleanText(payload.subject, 150)
    const message = cleanText(payload.body ?? payload.message, 8000)
    const headline = cleanText(payload.headline || subject, 120)
    const ctaLabel = cleanText(payload.ctaLabel, 40)
    const ctaUrl = cleanText(payload.ctaUrl, 500)
    const expectedRecipientCount = Number(payload.expectedRecipientCount)
    const confirmed = payload.confirmed === true

    if (!VALID_AUDIENCES.has(audience)) return jsonError('Invalid audience', 400)
    if (subject.length < 4) return jsonError('Subject is too short', 400)
    if (message.length < 20) return jsonError('Message must be at least 20 characters', 400)
    if (ctaUrl && !/^https?:\/\//i.test(ctaUrl)) return jsonError('CTA URL must start with http:// or https://', 400)

    const { recipients, skipped } = await getRecipients(audience)
    if (mode === 'bulk' && recipients.length === 0) return jsonError('No subscribed recipients found', 400)
    if (mode === 'bulk' && !confirmed) return jsonError('Confirm this bulk send before continuing', 400)
    if (mode === 'bulk' && expectedRecipientCount !== recipients.length) {
      return jsonError('Recipient count changed. Refresh the count and confirm again.', 409)
    }

    const limit = LIMITS.broadcast(`${admin.id}:${mode}`)
    if (!limit.success) {
      return rateLimitResponse(limit.resetAt)
    }

    const supabase = createAdminClient()
    const dryRun = shouldDryRun(mode)
    const from = process.env.EMAIL_FROM
    const resendKey = process.env.RESEND_API_KEY

    if (!dryRun && (!from || !resendKey)) {
      return jsonError('Email provider is not configured', 500)
    }

    const recipientsToSend = mode === 'test'
      ? [{
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: 'admin',
        } as Recipient]
      : recipients

    if (recipientsToSend.some((recipient) => !recipient.email)) {
      return jsonError('No email address available for this send', 400)
    }

    const failed: Array<{ email: string; error: string }> = []
    let sent = 0
    const resend = !dryRun ? new Resend(resendKey!) : null

    for (let i = 0; i < recipientsToSend.length; i += BATCH_SIZE) {
      const batch = recipientsToSend.slice(i, i + BATCH_SIZE)

      try {
        const emails = await Promise.all(batch.map(async (recipient) => {
          const token = await ensureUnsubscribeToken(supabase, recipient.email!, recipient.id)
          const unsubscribeUrl = `${APP_URL}/api/unsubscribe?token=${token}&type=broadcast`
          const template = broadcastEmailTemplate({
            recipientName: recipient.name,
            subject,
            headline,
            body: formatMessageBody(message),
            ctaLabel: ctaLabel || undefined,
            ctaUrl: ctaUrl || undefined,
            unsubscribeUrl,
          })

          return {
            from: from!,
            to: recipient.email!,
            subject: template.subject,
            html: template.html,
          }
        }))

        if (!dryRun) {
          await resend!.batch.send(emails)
        }

        sent += emails.length
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Provider error'
        for (const recipient of batch) {
          failed.push({ email: recipient.email ?? 'unknown', error: message })
        }
      }
    }

    await supabase.from('broadcast_emails').insert({
      subject,
      body: message,
      audience,
      sent_count: sent,
      sent_by: admin.id,
    })

    const status = failed.length > 0 ? 207 : 200
    return NextResponse.json({
      ok: failed.length === 0,
      dryRun,
      mode,
      sent,
      failedCount: failed.length,
      skippedByPreferences: skipped,
      failures: failed.slice(0, 10),
    }, { status })
  } catch (error) {
    try {
      return authErrorResponse(error)
    } catch (unhandled) {
      console.error('[broadcast-email:post]', unhandled)
      return jsonError('Failed to send email', 500)
    }
  }
}
