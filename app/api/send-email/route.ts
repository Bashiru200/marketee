// app/api/send-email/route.ts
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { businessMessageTemplate } from '@/lib/emailTemplates'

const resend = new Resend(process.env.RESEND_API_KEY!)

interface LinkButton { label: string; url: string }

export async function POST(request: Request) {
  try {
    const {
      to, toName, subject, body,
      images, links, fromBusiness, businessId, userId,
    } = await request.json() as {
      to:           string
      toName:       string
      subject:      string
      body:         string
      images?:      string[]
      links?:       LinkButton[]
      fromBusiness: string
      businessId?:  string
      userId?:      string
    }

    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { html } = businessMessageTemplate({
      recipientName:  toName,
      businessName:   fromBusiness,
      messageBody:    body,
      images:         images ?? [],
      links:          links ?? [],
      businessId,
    })

    const { data, error } = await resend.emails.send({
      from:    process.env.EMAIL_FROM!,
      to,
      subject,
      html,
      replyTo: process.env.EMAIL_FROM,
    })

    if (error) {
      console.error('[send-email] Resend error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ id: data?.id })
  } catch (err) {
    console.error('[send-email] Error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}