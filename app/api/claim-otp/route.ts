// app/api/claim-otp/route.ts
// Sends and verifies a 6-digit OTP via Twilio SMS to the business phone number.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getTwilio() {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  )
}

// ── POST /api/claim-otp — send OTP via SMS ────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = getSupabase()

  try {
    const { businessId, userId } = await req.json()

    if (!businessId || !userId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Get the business phone number
    const { data: biz, error: bizErr } = await supabase
      .from('businesses')
      .select('phone, name')
      .eq('id', businessId)
      .single()

    if (bizErr || !biz?.phone) {
      return NextResponse.json(
        { error: 'This business has no phone number on file. Contact support to claim this listing.' },
        { status: 404 }
      )
    }

    // Normalise phone — Twilio requires E.164 format e.g. +17135551234
    const normalised = normalisePhone(biz.phone)
    if (!normalised) {
      return NextResponse.json(
        { error: 'The phone number on this listing is not valid. Contact support.' },
        { status: 422 }
      )
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // Store OTP (upsert — one active OTP per business/user pair)
    const { error: upsertErr } = await supabase
      .from('claim_otps')
      .upsert({
        business_id: businessId,
        user_id:     userId,
        otp_code:    otp,
        expires_at:  expiresAt,
        verified:    false,
        attempts:    0,
      }, { onConflict: 'business_id,user_id' })

    if (upsertErr) {
      console.error('[claim-otp/upsert]', upsertErr)
      return NextResponse.json({ error: 'Failed to create verification. Try again.' }, { status: 500 })
    }

    // Send SMS via Twilio
    const client = getTwilio()

    await client.messages.create({
      to:   normalised,
      from: process.env.TWILIO_PHONE_NUMBER!,
      body: `Your Markeetee business claim code for "${biz.name}" is: ${otp}\n\nThis code expires in 10 minutes. If you did not request this, ignore this message.`,
    })

    return NextResponse.json({
      ok:           true,
      maskedPhone:  maskPhone(normalised),
      businessName: biz.name,
    })
  } catch (err: any) {
    console.error('[claim-otp/send]', err)

    // Twilio-specific error handling
    if (err?.code === 21211) {
      return NextResponse.json(
        { error: 'The phone number on this listing is not a valid mobile number.' },
        { status: 422 }
      )
    }
    if (err?.code === 21608) {
      return NextResponse.json(
        { error: 'This phone number cannot receive SMS messages.' },
        { status: 422 }
      )
    }
    if (err?.status === 401) {
      console.error('Twilio auth failed — check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN')
      return NextResponse.json({ error: 'SMS service unavailable. Try again later.' }, { status: 503 })
    }

    return NextResponse.json({ error: 'Failed to send SMS. Try again.' }, { status: 500 })
  }
}

// ── PATCH /api/claim-otp — verify the OTP ────────────────────────────────
export async function PATCH(req: NextRequest) {
  const supabase = getSupabase()

  try {
    const { businessId, userId, otp } = await req.json()

    if (!businessId || !userId || !otp) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const { data: record, error } = await supabase
      .from('claim_otps')
      .select('otp_code, expires_at, verified, attempts')
      .eq('business_id', businessId)
      .eq('user_id',     userId)
      .single()

    if (error || !record) {
      return NextResponse.json(
        { error: 'No verification code found. Please request a new one.' },
        { status: 404 }
      )
    }

    // Brute-force protection — max 5 attempts
    const attempts = record.attempts ?? 0
    if (attempts >= 5) {
      return NextResponse.json(
        { error: 'Too many incorrect attempts. Please request a new code.' },
        { status: 429 }
      )
    }

    // Increment attempt count before checking (fail-safe)
    await supabase.from('claim_otps')
      .update({ attempts: attempts + 1 })
      .eq('business_id', businessId)
      .eq('user_id',     userId)

    // Check expiry
    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Code has expired. Please request a new one.' },
        { status: 410 }
      )
    }

    // Check if already used
    if (record.verified) {
      return NextResponse.json(
        { error: 'This code has already been used.' },
        { status: 409 }
      )
    }

    // Constant-time string comparison to prevent timing attacks
    if (!safeCompare(record.otp_code, otp.trim())) {
      return NextResponse.json(
        { error: `Incorrect code. ${4 - attempts} attempt${4 - attempts !== 1 ? 's' : ''} remaining.` },
        { status: 422 }
      )
    }

    // ✅ OTP is valid — mark as verified
    await supabase.from('claim_otps')
      .update({ verified: true, attempts: 0 })
      .eq('business_id', businessId)
      .eq('user_id',     userId)

    return NextResponse.json({ ok: true, verified: true })
  } catch (err) {
    console.error('[claim-otp/verify]', err)
    return NextResponse.json({ error: 'Verification failed. Try again.' }, { status: 500 })
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Normalise a phone number to E.164 format for Twilio.
 * Assumes US numbers if no country code present.
 */
function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`          // US number
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  if (digits.length > 10 && raw.startsWith('+')) return `+${digits}`
  if (digits.length >= 10) return `+${digits}`
  return null
}

/**
 * Mask a phone number for display: +17135551234 → +1 (713) ***-1234
 */
function maskPhone(e164: string): string {
  const digits = e164.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) {
    const area = digits.slice(1, 4)
    const last4 = digits.slice(-4)
    return `+1 (${area}) ***-${last4}`
  }
  // International: show country code + last 4
  const last4 = digits.slice(-4)
  return `${e164.slice(0, e164.length - 7)}***-${last4}`
}

/**
 * Constant-time string comparison to prevent timing attacks on OTP verification.
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}