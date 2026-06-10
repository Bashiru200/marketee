import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { ReviewNotificationEmail } from '@/emails/ReviewNotificationEmail'

const resend  = new Resend(process.env.RESEND_API_KEY!)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Called by Supabase webhook on reviews INSERT
export async function POST(req: NextRequest) {
  try {
    const { type, record } = await req.json()
    if (type !== 'INSERT') return NextResponse.json({ ok: true })

    const review = record

    // Fetch business + owner info
    const { data: biz } = await supabase
      .from('businesses')
      .select('name, email, owner_id, profiles(name, email)')
      .eq('id', review.business_id)
      .single()

    if (!biz) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    // Get reviewer name
    const { data: reviewer } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', review.user_id)
      .single()

    const ownerProfile = Array.isArray(biz.profiles) ? biz.profiles[0] : biz.profiles
    const ownerEmail   = biz.email || ownerProfile?.email
    const ownerName    = ownerProfile?.name ?? 'Business owner'
    const reviewerName = reviewer?.name ?? 'A customer'

    if (!ownerEmail) {
      return NextResponse.json({ error: 'No owner email found' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://markeetee.com'

    await resend.emails.send({
      from:    process.env.EMAIL_FROM!,
      to:      ownerEmail,
      subject: `New ${review.rating}★ review on ${biz.name}`,
      react:   ReviewNotificationEmail({
        ownerName,
        businessName: biz.name,
        reviewerName,
        rating:       review.rating,
        title:        review.title  ?? null,
        body:         review.body   ?? '',
        businessUrl:  `${baseUrl}/businesses/${review.business_id}`,
      }),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[review-notification]', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}