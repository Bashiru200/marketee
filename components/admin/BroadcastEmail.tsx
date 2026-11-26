'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ElementType } from 'react'
import {
  AlertTriangle,
  Bold,
  Building2,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  Italic,
  List,
  Loader2,
  Mail,
  Plus,
  Send,
  Trash2,
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
  registeredEmailCount: number
  skippedByPreferences: number
}

interface MediaItem {
  url: string
  alt: string
  caption: string
}

const AUDIENCES: Array<{
  value: Audience
  label: string
  desc: string
  icon: ElementType
}> = [
  { value: 'owners', label: 'Business owners', desc: 'Owners with Markeetee accounts', icon: Building2 },
  { value: 'customers', label: 'Customers', desc: 'People discovering businesses', icon: User },
  { value: 'all', label: 'Everyone', desc: 'All registered email addresses', icon: Users },
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
  const escapePreviewHtml = (value: string) => value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
  const renderInline = (value: string) => escapePreviewHtml(value)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')

  return (
    <>
      {paragraphs.map((paragraph) => {
        const lines = paragraph.split('\n').map((line) => line.trim()).filter(Boolean)
        if (lines.every((line) => line.startsWith('• ') || line.startsWith('- '))) {
          return (
            <ul key={paragraph} className="mb-4 list-disc space-y-1 pl-5 text-sm leading-7 text-gray-600">
              {lines.map((line) => (
                <li key={line} dangerouslySetInnerHTML={{ __html: renderInline(line.replace(/^[•-]\s*/, '')) }} />
              ))}
            </ul>
          )
        }
        return (
          <p
            key={paragraph}
            className="mb-4 text-sm leading-7 text-gray-600"
            dangerouslySetInnerHTML={{ __html: renderInline(paragraph).replace(/\n/g, '<br />') }}
          />
        )
      })}
    </>
  )
}

export default function BroadcastEmail() {
  const supabase = useRef(createClient()).current
  const { profile } = useAuth()

  const [audience, setAudience] = useState<Audience>('all')
  const [emailType, setEmailType] = useState<EmailType>('announcement')
  const [subject, setSubject] = useState(EMAIL_TYPES[0].subject)
  const [body, setBody] = useState(EMAIL_TYPES[0].body)
  const [media, setMedia] = useState<MediaItem[]>([])
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [brokenMediaUrls, setBrokenMediaUrls] = useState<Record<string, true>>({})
  const [ctaLabel, setCtaLabel] = useState(EMAIL_TYPES[0].ctaLabel)
  const [ctaUrl, setCtaUrl] = useState(APP_URL)
  const [counts, setCounts] = useState<Record<Audience, AudienceCount>>({
    owners: { count: 0, registeredEmailCount: 0, skippedByPreferences: 0 },
    customers: { count: 0, registeredEmailCount: 0, skippedByPreferences: 0 },
    all: { count: 0, registeredEmailCount: 0, skippedByPreferences: 0 },
  })
  const [history, setHistory] = useState<SentEmail[]>([])
  const [loadingCounts, setLoadingCounts] = useState(true)
  const [sending, setSending] = useState<'test' | 'bulk' | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [bulkReviewOpen, setBulkReviewOpen] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const selectedType = EMAIL_TYPES.find((type) => type.value === emailType) ?? EMAIL_TYPES[0]
  const selectedAudience = AUDIENCES.find((item) => item.value === audience) ?? AUDIENCES[0]
  const recipientCount = counts[audience].count
  const registeredEmailCount = counts[audience].registeredEmailCount
  const skippedCount = counts[audience].skippedByPreferences
  const mediaErrors = media.map((item) => {
    const url = item.url.trim()
    if (!url) return ''
    if (!/^https?:\/\//i.test(url)) return 'Media URL must start with http:// or https://.'
    if (brokenMediaUrls[url]) return 'Image preview could not be loaded. Check the URL before sending.'
    return ''
  })
  const hasMediaErrors = mediaErrors.some(Boolean)
  const validMedia = media.filter((item, index) => item.url.trim() && !mediaErrors[index]).slice(0, 4)
  const isValid = subject.trim().length >= 4
    && body.trim().length >= 20
    && (!ctaUrl || /^https?:\/\//i.test(ctaUrl))
    && !hasMediaErrors

  const markDirty = useCallback(() => {
    setConfirmed(false)
  }, [])

  function wrapBody(before: string, after = '') {
    markDirty()
    const selected = typeof window !== 'undefined' ? window.getSelection()?.toString() : ''
    if (!selected) {
      setBody((current) => `${current}${current.endsWith('\n') ? '' : '\n'}${before}text${after}`)
      return
    }
    setBody((current) => current.replace(selected, `${before}${selected}${after}`))
  }

  function addMedia() {
    if (media.length >= 4) return
    markDirty()
    setMedia((current) => [...current, { url: '', alt: '', caption: '' }])
  }

  function updateMedia(index: number, field: keyof MediaItem, value: string) {
    markDirty()
    if (field === 'url') {
      setBrokenMediaUrls((current) => {
        const next = { ...current }
        const previousUrl = media[index]?.url.trim()
        if (previousUrl) delete next[previousUrl]
        delete next[value.trim()]
        return next
      })
    }
    setMedia((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    )))
  }

  function handleMediaLoadError(url: string) {
    if (!url.trim()) return
    setBrokenMediaUrls((current) => ({ ...current, [url.trim()]: true }))
  }

  function PreviewImage({
    src,
    alt,
    className,
  }: {
    src: string
    alt: string
    className: string
  }) {
    if (brokenMediaUrls[src.trim()]) {
      return (
        <div className={`${className} flex items-center justify-center bg-gray-100 text-gray-300`}>
          <ImageIcon size={18} />
        </div>
      )
    }

    return (
      // eslint-disable-next-line @next/next/no-img-element -- Admin email previews render arbitrary remote media URLs.
      <img src={src} alt={alt} className={className} onError={() => handleMediaLoadError(src)} />
    )
  }

  function removeMedia(index: number) {
    markDirty()
    setMedia((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  async function uploadMediaFiles(files: FileList | null) {
    if (!files?.length) return
    const remaining = 4 - media.length
    if (remaining <= 0) return

    setUploadingMedia(true)
    setNotice(null)

    const uploaded: MediaItem[] = []
    for (const file of Array.from(files).slice(0, remaining)) {
      if (file.size > 5 * 1024 * 1024) {
        setNotice({ type: 'error', message: 'Images must be under 5MB.' })
        continue
      }

      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const path = `broadcast/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage
        .from('business-images')
        .upload(path, file, { upsert: false })

      if (error) {
        setNotice({ type: 'error', message: error.message })
        continue
      }

      const { data } = supabase.storage.from('business-images').getPublicUrl(path)
      uploaded.push({ url: data.publicUrl, alt: file.name.replace(/\.[^.]+$/, ''), caption: '' })
    }

    if (uploaded.length) {
      markDirty()
      setMedia((current) => [...current, ...uploaded])
    }
    setUploadingMedia(false)
  }

  const loadCounts = useCallback(async () => {
    setLoadingCounts(true)
    const nextCounts: Record<Audience, AudienceCount> = {
      owners: { count: 0, registeredEmailCount: 0, skippedByPreferences: 0 },
      customers: { count: 0, registeredEmailCount: 0, skippedByPreferences: 0 },
      all: { count: 0, registeredEmailCount: 0, skippedByPreferences: 0 },
    }

    await Promise.all(AUDIENCES.map(async ({ value }) => {
      const response = await fetch(`/api/broadcast-email?audience=${value}`)
      if (!response.ok) return
      const data = await response.json()
      nextCounts[value] = {
        count: data.count ?? 0,
        registeredEmailCount: data.registeredEmailCount ?? data.count ?? 0,
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
    setMedia([])
    setCtaLabel(template.ctaLabel)
    setCtaUrl(template.value === 'owner_update' ? `${APP_URL}/dashboard` : APP_URL)
  }

  async function send(mode: 'test' | 'bulk') {
    if (!isValid) {
      setNotice({ type: 'error', message: 'Complete the subject, message, CTA URL, and media URLs before sending.' })
      return
    }

    if (mode === 'test' && !profile?.email) {
      setNotice({ type: 'error', message: 'No admin email is available for a test send.' })
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
        media: validMedia,
        ctaLabel,
        ctaUrl,
        confirmed,
        expectedRecipientCount: recipientCount,
      }),
    })

    const data = await response.json()
    setSending(null)

    if (!response.ok && response.status !== 207) {
      setNotice({ type: 'error', message: data.error ?? 'Email send failed.' })
      return
    }

    if (mode === 'test') {
      setNotice({
        type: 'success',
        message: `Test email sent to ${profile?.email}.`,
      })
      await loadHistory()
      return
    }

    const partialCopy = data.failedCount ? ` ${data.failedCount} recipient(s) failed and can be retried later.` : ''
    setNotice({
      type: data.failedCount ? 'error' : 'success',
      message: `Email sent: ${data.sent} recipient(s).${partialCopy}`,
    })
    setConfirmed(false)
    await loadCounts()
    await loadHistory()
  }

  async function openHtmlPreview() {
    if (!isValid) {
      setNotice({ type: 'error', message: 'Complete the subject, message, CTA URL, and media URLs before previewing.' })
      return
    }

    setPreviewing(true)
    setNotice(null)

    const response = await fetch('/api/preview-broadcast-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject,
        headline: subject,
        body,
        media: validMedia,
        ctaLabel,
        ctaUrl,
      }),
    })

    const html = await response.text()
    setPreviewing(false)

    if (!response.ok) {
      try {
        const data = JSON.parse(html)
        setNotice({ type: 'error', message: data.error ?? 'Preview failed.' })
      } catch {
        setNotice({ type: 'error', message: 'Preview failed.' })
      }
      return
    }

    const previewWindow = window.open('about:blank', '_blank', 'noopener,noreferrer')
    if (!previewWindow) {
      setNotice({ type: 'error', message: 'Allow pop-ups to open the email preview.' })
      return
    }

    previewWindow.document.open()
    previewWindow.document.write(html)
    previewWindow.document.close()
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
                      {loadingCounts ? 'Loading...' : `${counts[option.value].registeredEmailCount} registered`}
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
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label htmlFor="broadcast-body" className="block text-xs font-bold uppercase tracking-wide text-gray-400">
                Message
              </label>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => wrapBody('**', '**')} title="Bold"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100">
                  <Bold size={14} />
                </button>
                <button type="button" onClick={() => wrapBody('_', '_')} title="Italic"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100">
                  <Italic size={14} />
                </button>
                <button type="button" onClick={() => wrapBody('\n• ')} title="Bullet"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100">
                  <List size={14} />
                </button>
              </div>
            </div>
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
            <p className="mt-1 text-right text-xs text-gray-400">Supports **bold**, _italic_, and • bullets · {body.length} characters</p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-400">
                Media
              </label>
              <button
                type="button"
                onClick={addMedia}
                disabled={media.length >= 4}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-[#085041] disabled:opacity-40"
              >
                <Plus size={13} /> Add URL
              </button>
            </div>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-4 text-sm font-semibold text-gray-500 transition hover:border-green-300 hover:bg-green-50">
              {uploadingMedia ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />}
              Upload images
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => {
                  void uploadMediaFiles(event.target.files)
                  event.target.value = ''
                }}
              />
            </label>
            {media.length > 0 && (
              <div className="mt-3 space-y-3">
                {media.map((item, index) => (
                  <div key={`${item.url}-${index}`} className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                    <div className="flex items-start gap-3">
                      {item.url ? (
                        <PreviewImage
                          src={item.url}
                          alt=""
                          className="h-16 w-16 flex-shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-white text-gray-300">
                          <ImageIcon size={18} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1 space-y-2">
                        <input
                          value={item.url}
                          onChange={(event) => updateMedia(index, 'url', event.target.value)}
                          placeholder="https://image-url..."
                          className={`w-full rounded-xl border px-3 py-2 text-xs outline-none focus:border-transparent focus:ring-2 focus:ring-[#1D9E75] ${
                            mediaErrors[index] ? 'border-amber-300 bg-amber-50' : 'border-gray-200'
                          }`}
                        />
                        {mediaErrors[index] ? (
                          <p className="text-[11px] font-semibold text-amber-700">{mediaErrors[index]}</p>
                        ) : null}
                        <div className="grid gap-2 sm:grid-cols-2">
                          <input
                            value={item.alt}
                            onChange={(event) => updateMedia(index, 'alt', event.target.value)}
                            placeholder="Alt text"
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-transparent focus:ring-2 focus:ring-[#1D9E75]"
                          />
                          <input
                            value={item.caption}
                            onChange={(event) => updateMedia(index, 'caption', event.target.value)}
                            placeholder="Caption"
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-transparent focus:ring-2 focus:ring-[#1D9E75]"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMedia(index)}
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                        title="Remove media"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                I confirm this email should go to <strong>{recipientCount}</strong> {selectedAudience.label.toLowerCase()}.
                {skippedCount > 0 ? ` ${skippedCount} opted-out recipient(s) will be skipped.` : ''}
              </span>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={openHtmlPreview}
              disabled={previewing || sending !== null || !isValid}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 disabled:opacity-50 sm:col-span-2"
            >
              {previewing ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
              Open full email preview
            </button>
            <button
              type="button"
              onClick={() => send('test')}
              disabled={sending !== null || !isValid || !profile?.email}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#085041] bg-white px-4 py-3 text-sm font-bold text-[#085041] disabled:opacity-50"
            >
              {sending === 'test' ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
              Send test to {profile?.email ?? 'admin'}
            </button>
            <button
              type="button"
              onClick={() => setBulkReviewOpen(true)}
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
                {validMedia.length > 0 && (
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    {validMedia.map((item, index) => (
                      <div key={`${item.url}-${index}`} className="overflow-hidden rounded-xl border border-gray-100 bg-white">
                        <PreviewImage src={item.url} alt={item.alt || ''} className="h-24 w-full object-cover" />
                        {item.caption ? (
                          <p className="p-2 text-[11px] leading-4 text-gray-500">{item.caption}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-5 border-t border-gray-100 pt-3 text-[11px] leading-5 text-gray-400">
                  Footer includes Website, Contact, and a recipient-specific Unsubscribe link.
                </div>
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
                <span className="text-gray-500">Registered emails</span>
                <span className="font-semibold text-gray-900">{registeredEmailCount}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Recipients to send</span>
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

      {bulkReviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 px-4 py-6">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-amber-600">Final review</p>
                <h4 className="mt-1 text-lg font-black text-gray-950">Send this bulk email?</h4>
              </div>
              <button
                type="button"
                onClick={() => setBulkReviewOpen(false)}
                className="rounded-lg px-2 py-1 text-sm font-bold text-gray-400 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
            <div className="mt-5 space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Audience</span>
                <span className="font-semibold text-gray-900">{selectedAudience.label}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Recipients</span>
                <span className="font-semibold text-gray-900">{recipientCount}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Skipped</span>
                <span className="font-semibold text-gray-900">{skippedCount}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Media</span>
                <span className="font-semibold text-gray-900">{validMedia.length}</span>
              </div>
              <div>
                <span className="text-gray-500">Subject</span>
                <p className="mt-1 font-semibold text-gray-900">{subject}</p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-gray-500">
              The footer includes a recipient-specific unsubscribe link. Counts are checked again before sending.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setBulkReviewOpen(false)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700"
              >
                Review more
              </button>
              <button
                type="button"
                onClick={() => {
                  setBulkReviewOpen(false)
                  void send('bulk')
                }}
                disabled={sending !== null || !isValid || !confirmed || recipientCount === 0}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#085041] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {sending === 'bulk' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Send bulk email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
