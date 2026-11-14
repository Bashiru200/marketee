// app/api/send-email/route.ts
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { businessMessageTemplate } from '@/lib/emailTemplates'

interface LinkButton { label: string; url: string }

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function cleanLinks(value: unknown): LinkButton[] {
  if (!Array.isArray(value)) return []

  return value
    .map(link => ({
      label: cleanText(link?.label, 30),
      url: cleanText(link?.url, 2048),
    }))
    .filter(link => link.label && link.url)
    .slice(0, 3)
}

function cleanImages(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return value
    .map(image => cleanText(image, 2048))
    .filter(Boolean)
    .slice(0, 5)
}

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const to = cleanText(payload.to, 320).toLowerCase()
    const toName = cleanText(payload.toName, 120)
    const subject = cleanText(payload.subject, 150)
    const body = cleanText(payload.body, 10000)
    const fromBusiness = cleanText(payload.fromBusiness, 160)
    const businessCategory = cleanText(payload.businessCategory, 80) || null
    const businessSubcategory = cleanText(payload.businessSubcategory, 80) || null
    const businessId = cleanText(payload.businessId, 120)
    const images = cleanImages(payload.images)
    const links = cleanLinks(payload.links)

    if (!to || !subject || !body || !fromBusiness) return jsonError('Missing required fields', 400)
    if (!isEmail(to)) return jsonError('Enter a valid recipient email address', 400)

    const resendKey = process.env.RESEND_API_KEY
    const from = process.env.EMAIL_FROM

    if (!resendKey || !from) return jsonError('Email provider is not configured', 500)

    const { html } = businessMessageTemplate({
      recipientName: toName || 'there',
      businessName: fromBusiness,
      messageBody: body,
      images,
      links,
      businessCategory,
      businessSubcategory,
      businessId,
    })

    const resend = new Resend(resendKey)
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      replyTo: from,
    })

    if (error) {
      console.error('[send-email] Resend error:', error)
      return jsonError(error.message || 'Email provider rejected the message', 502)
    }

    return NextResponse.json({ id: data?.id })
  } catch (err) {
    console.error('[send-email] Error:', err)
    return jsonError('Failed to send email', 500)
  }
}
