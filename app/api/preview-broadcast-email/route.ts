import { NextRequest, NextResponse } from 'next/server'
import { authErrorResponse, requireAdminAccess } from '@/lib/adminAuth'
import { broadcastEmailTemplate } from '@/lib/emailTemplates'

interface MediaItem {
  url: string
  alt?: string
  caption?: string
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://markeetee.com'

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
  const inline = (value: string) => escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')

  return message
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => {
      const lines = paragraph.split('\n').map((line) => line.trim()).filter(Boolean)
      if (lines.every((line) => line.startsWith('• ') || line.startsWith('- '))) {
        return `<ul style="margin:0 0 18px;padding-left:20px;">${lines
          .map((line) => `<li style="margin:0 0 8px;">${inline(line.replace(/^[•-]\s*/, ''))}</li>`)
          .join('')}</ul>`
      }
      return `<p style="margin:0 0 16px;">${inline(paragraph).replace(/\n/g, '<br />')}</p>`
    })
    .join('')
}

function cleanMedia(value: unknown): MediaItem[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => ({
      url: cleanText(item?.url, 2048),
      alt: cleanText(item?.alt, 120),
      caption: cleanText(item?.caption, 160),
    }))
    .filter((item) => /^https?:\/\//i.test(item.url))
    .slice(0, 4)
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminAccess({ superAdminOnly: true })
    const payload = await req.json()

    const subject = cleanText(payload.subject, 150)
    const message = cleanText(payload.body ?? payload.message, 8000)
    const headline = cleanText(payload.headline || subject, 120)
    const ctaLabel = cleanText(payload.ctaLabel, 40)
    const ctaUrl = cleanText(payload.ctaUrl, 500)

    if (subject.length < 4) return jsonError('Subject is too short', 400)
    if (message.length < 20) return jsonError('Message must be at least 20 characters', 400)
    if (ctaUrl && !/^https?:\/\//i.test(ctaUrl)) return jsonError('CTA URL must start with http:// or https://', 400)

    const template = broadcastEmailTemplate({
      recipientName: 'Preview recipient',
      subject,
      headline,
      body: formatMessageBody(message),
      media: cleanMedia(payload.media),
      ctaLabel: ctaLabel || undefined,
      ctaUrl: ctaUrl || undefined,
      unsubscribeUrl: `${APP_URL}/api/unsubscribe?preview=true&type=broadcast`,
    })

    return new NextResponse(template.html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (error) {
    try {
      return authErrorResponse(error)
    } catch (unhandled) {
      console.error('[preview-broadcast-email:post]', unhandled)
      return jsonError('Unable to build preview', 500)
    }
  }
}
