'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ElementType } from 'react'
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  Mail,
  Send,
  User,
  Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'

type Audience = 'owners' | 'customers' | 'all'
type EmailType = 'announcement' | 'newsletter' | 'promotion' | 'owner_update'

interface SentEmail {
  id: string
  subject: string
  audience: Audience
  sent_count: number
  created_at: string
}

interface AudienceCount {
  count: number
  skippedByPreferences: number
}

const AUDIENCES: Array<{
  value: Audience
  label: string
  desc: string
  icon: ElementType
}> = [
  { value: 'owners', label: 'Business owners', desc: 'Owners with Markeetee accounts', icon: Building2 },
  { value: 'customers', label: 'Customers', desc: 'People discovering businesses', icon: User },
  { value: 'all', label: 'Everyone', desc: 'All subscribed users', icon: Users },
]

const EMAIL_TYPES: Array<{
  value: EmailType
  label: string
  desc: string
  subject: string
  body: string
  ctaLabel: string
}> = [
  {
    value: 'announcement',
    label: 'Announcement',
    desc: 'Platform news, launches, and important updates',
    subject: 'Important update from Markeetee',
    body: 'We have an update to share with the Markeetee community.\n\nThank you for helping us build a stronger way to discover and support African-owned businesses across the United States.',
    ctaLabel: 'Explore Markeetee',
  },
  {
    value: 'newsletter',
    label: 'Newsletter',
    desc: 'Community roundup or monthly digest',
    subject: 'Markeetee community update',
    body: 'Here is what is new in the Markeetee community this month.\n\nWe are highlighting helpful updates, new businesses, and ways to discover African restaurants, groceries, beauty services, fashion, wellness, and more.',
    ctaLabel: 'Read more',
  },
  {
    value: 'promotion',
    label: 'Promotion',
    desc: 'Marketing campaigns and offers',
    subject: 'A new way to grow with Markeetee',
    body: 'We are sharing a special Markeetee update that may help you get more from the platform.\n\nUse the link below to learn more and decide whether it is right for you.',
    ctaLabel: 'Learn more',
  },
  {
    value: 'owner_update',
    label: 'Owner update',
    desc: 'Helpful message for business owners',
    subject: 'Keep your Markeetee listing fresh',
    body: 'A quick note for Markeetee business owners: listings with clear photos, current hours, and helpful descriptions are easier for customers to trust.\n\nTake a few minutes to review your profile and make sure customers have the details they need.',
    ctaLabel: 'Open dashboard',
  },
]

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://markeetee.com'

function PreviewBody({ body }: { body: string }) {
  const paragraphs = body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)

  return (
    <>
      {paragraphs.map((paragraph) => (
        <p key={paragraph} className="mb-4 text-sm leading-7 text-gray-600">
          {paragraph}
        </p>
      ))}
    </>
  )
}

export default function BroadcastEmail() {
  const supabase = useRef(createClient()).current
  const { profile } = useAuth()

  const [audience, setAudience] = useState<Audience>('owners')
  const [emailType, setEmailType] = useState<EmailType>('announcement')
  const [subject, setSubject] = useState(EMAIL_TYPES[0].subject)
  const [body, setBody] = useState(EMAIL_TYPES[0].body)
  const [ctaLabel, setCtaLabel] = useState(EMAIL_TYPES[0].ctaLabel)
  const [ctaUrl, setCtaUrl] = useState(APP_URL)
  const [counts, setCounts] = useState<Record<Audience, AudienceCount>>({
    owners: { count: 0, skippedByPreferences: 0 },
    customers: { count: 0, skippedByPreferences: 0 },
    all: { count: 0, skippedByPreferences: 0 },
  })
  const [history, setHistory] = useState<SentEmail[]>([])
  const [loadingCounts, setLoadingCounts] = useState(true)
  const [sending, setSending] = useState<'test' | 'bulk' | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const selectedType = EMAIL_TYPES.find((type) => type.value === emailType) ?? EMAIL_TYPES[0]
  const selectedAudience = AUDIENCES.find((item) => item.value === audience) ?? AUDIENCES[0]
  const recipientCount = counts[audience].count
  const skippedCount = counts[audience].skippedByPreferences
  const isValid = subject.trim().length >= 4 && body.trim().length >= 20 && (!ctaUrl || /^https?:\/\//i.test(ctaUrl))

  const markDirty = useCallback(() => {
    setConfirmed(false)
  }, [])

  const loadCounts = useCallback(async () => {
    setLoadingCounts(true)
    const nextCounts: Record<Audience, AudienceCount> = {
      owners: { count: 0, skippedByPreferences: 0 },
      customers: { count: 0, skippedByPreferences: 0 },
      all: { count: 0, skippedByPreferences: 0 },
    }

    await Promise.all(AUDIENCES.map(async ({ value }) => {
      const response = await fetch(`/api/broadcast-email?audience=${value}`)
      if (!response.ok) return
      const data = await response.json()
      nextCounts[value] = {
        count: data.count ?? 0,
        skippedByPreferences: data.skippedByPreferences ?? 0,
      }
    }))

    setCounts(nextCounts)
    setLoadingCounts(false)
  }, [])

  const loadHistory = useCallback(async () => {
    const { data } = await supabase
      .from('broadcast_emails')
      .select('id, subject, audience, sent_count, created_at')
      .order('created_at', { ascending: false })
      .limit(8)

    setHistory((data ?? []) as SentEmail[])
  }, [supabase])

  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      void loadCounts()
      void loadHistory()
    })
    return () => {
      cancelled = true
    }
  }, [loadCounts, loadHistory])

  function applyTemplate(nextType: EmailType) {
    const template = EMAIL_TYPES.find((type) => type.value === nextType) ?? EMAIL_TYPES[0]
    markDirty()
    setEmailType(nextType)
    setSubject(template.subject)
    setBody(template.body)
    setCtaLabel(template.ctaLabel)
    setCtaUrl(template.value === 'owner_update' ? `${APP_URL}/dashboard` : APP_URL)
  }

  async function send(mode: 'test' | 'bulk') {
    if (!isValid) {
      setNotice({ type: 'error', message: 'Complete the subject, message, and CTA URL before sending.' })
      return
    }

    if (mode === 'bulk' && !confirmed) {
      setNotice({ type: 'error', message: 'Confirm the recipient count before sending a bulk email.' })
      return
    }

    setSending(mode)
    setNotice(null)

    const response = await fetch('/api/broadcast-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode,
        audience,
        subject,
        headline: subject,
        body,
        ctaLabel,
        ctaUrl,
        confirmed: mode === 'bulk' ? confirmed : true,
        expectedRecipientCount: recipientCount,
      }),
    })

    const data = await response.json()
    setSending(null)

    if (!response.ok && response.status !== 207) {
      setNotice({ type: 'error', message: data.error ?? 'Email send failed.' })
      return
    }

    const dryRunCopy = data.dryRun ? ' Dry run only; no live email was sent.' : ''
    const partialCopy = data.failedCount ? ` ${data.failedCount} recipient(s) failed and can be retried later.` : ''
    const action = mode === 'test' ? 'Test prepared' : 'Bulk send complete'

    setNotice({
      type: data.failedCount ? 'error' : 'success',
      message: `${action}: ${data.sent} recipient(s).${partialCopy}${dryRunCopy}`,
    })
    setConfirmed(false)
    await loadCounts()
    await loadHistory()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-950">Send email</h3>
          <p className="mt-1 text-sm text-gray-500">
            Compose branded Markeetee emails with preference-aware bulk delivery.
          </p>
        </div>
        <button
          type="button"
          onClick={loadCounts}
          disabled={loadingCounts}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-60"
        >
          {loadingCounts ? <Loader2 size={15} className="animate-spin" /> : <Users size={15} />}
          Refresh counts
        </button>
      </div>

      {notice && (
        <div className={`flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm ${
          notice.type === 'success'
            ? 'border-green-100 bg-green-50 text-green-800'
            : 'border-amber-200 bg-amber-50 text-amber-900'
        }`}>
          {notice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{notice.message}</span>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <form className="space-y-5 rounded-2xl border border-gray-100 bg-white p-5">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-400">
              Recipient group
            </label>
            <div className="grid gap-2 md:grid-cols-3">
              {AUDIENCES.map((option) => {
                const Icon = option.icon
                const selected = option.value === audience
                return (
                  <button
                    key={option.value}
                    type="button"
                  onClick={() => {
                    markDirty()
                    setAudience(option.value)
                  }}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selected ? 'border-[#1D9E75] bg-[#F0FAF6]' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <Icon size={18} className={selected ? 'text-[#085041]' : 'text-gray-400'} />
                    <p className="mt-2 text-sm font-bold text-gray-950">{option.label}</p>
                    <p className="mt-1 text-xs leading-5 text-gray-500">{option.desc}</p>
                    <p className="mt-3 text-xs font-bold text-[#085041]">
                      {loadingCounts ? 'Loading...' : `${counts[option.value].count} subscribed`}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-400">
              Template
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              {EMAIL_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => applyTemplate(type.value)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    emailType === type.value ? 'border-[#1D9E75] bg-[#F0FAF6]' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <p className="text-sm font-bold text-gray-950">{type.label}</p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">{type.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
            <div>
              <label htmlFor="broadcast-subject" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">
                Subject
              </label>
              <input
                id="broadcast-subject"
                value={subject}
                onChange={(event) => {
                  markDirty()
                  setSubject(event.target.value)
                }}
                maxLength={150}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-[#1D9E75]"
              />
              <p className="mt-1 text-[11px] text-gray-400">{subject.length}/150 characters</p>
            </div>
            <div>
              <label htmlFor="broadcast-cta-label" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">
                CTA label
              </label>
              <input
                id="broadcast-cta-label"
                value={ctaLabel}
                onChange={(event) => {
                  markDirty()
                  setCtaLabel(event.target.value)
                }}
                maxLength={40}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-[#1D9E75]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="broadcast-cta-url" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">
              CTA URL
            </label>
            <input
              id="broadcast-cta-url"
              value={ctaUrl}
              onChange={(event) => {
                markDirty()
                setCtaUrl(event.target.value)
              }}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-[#1D9E75]"
            />
          </div>

          <div>
            <label htmlFor="broadcast-body" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">
              Message
            </label>
            <textarea
              id="broadcast-body"
              value={body}
              onChange={(event) => {
                markDirty()
                setBody(event.target.value)
              }}
              rows={9}
              minLength={20}
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm leading-6 outline-none focus:border-transparent focus:ring-2 focus:ring-[#1D9E75]"
            />
            <p className="mt-1 text-right text-xs text-gray-400">{body.length} characters</p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <label className="flex items-start gap-3 text-sm text-amber-900">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                className="mt-0.5 accent-amber-500"
              />
              <span>
                I confirm this bulk email should go to <strong>{recipientCount}</strong> subscribed {selectedAudience.label.toLowerCase()}.
                {skippedCount > 0 ? ` ${skippedCount} opted-out recipient(s) will be skipped.` : ''}
              </span>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => send('test')}
              disabled={sending !== null || !isValid}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#085041] bg-white px-4 py-3 text-sm font-bold text-[#085041] disabled:opacity-50"
            >
              {sending === 'test' ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
              Send test to {profile?.email ?? 'admin'}
            </button>
            <button
              type="button"
              onClick={() => send('bulk')}
              disabled={sending !== null || !isValid || !confirmed || recipientCount === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#085041] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {sending === 'bulk' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Send to {recipientCount} recipient{recipientCount === 1 ? '' : 's'}
            </button>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <div className="border-b border-gray-100 bg-[#085041] px-5 py-4 text-white">
              <div className="flex items-center gap-2">
                <Mail size={18} />
                <p className="font-bold">Email preview</p>
              </div>
              <p className="mt-1 text-xs text-white/70">Branded template with unsubscribe footer.</p>
            </div>
            <div className="p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Subject</p>
              <h4 className="mt-1 text-lg font-black leading-tight text-gray-950">{subject || 'Subject line'}</h4>
              <div className="mt-5 rounded-2xl border border-gray-100 bg-[#FAFAF9] p-4">
                <p className="mb-4 text-sm text-gray-600">Hi {profile?.name ?? 'there'},</p>
                <PreviewBody body={body} />
                {ctaLabel && ctaUrl ? (
                  <div className="mt-5">
                    <span className="inline-flex rounded-xl bg-[#1D9E75] px-4 py-2 text-xs font-bold text-white">
                      {ctaLabel}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <h4 className="font-bold text-gray-950">Delivery summary</h4>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Audience</span>
                <span className="font-semibold text-gray-900">{selectedAudience.label}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Subscribed recipients</span>
                <span className="font-semibold text-gray-900">{recipientCount}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Skipped by preferences</span>
                <span className="font-semibold text-gray-900">{skippedCount}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Type</span>
                <span className="font-semibold text-gray-900">{selectedType.label}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <Clock size={16} className="text-[#1D9E75]" />
              <h4 className="font-bold text-gray-950">Recent sends</h4>
            </div>
            {history.length === 0 ? (
              <p className="text-sm text-gray-400">No broadcast emails recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {history.map((email) => (
                  <div key={email.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <p className="line-clamp-1 text-sm font-semibold text-gray-900">{email.subject}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {email.sent_count} sent to {email.audience} on{' '}
                      {new Date(email.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
