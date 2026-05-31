import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { WeeklySummaryEmail } from '@/emails/WeeklySummaryEmail'
const resend   = new Resend(process.env.RESEND_API_KEY!)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Protect with a secret so only your cron job can call this
function isAuthorized(req: NextRequest) {
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${process.env.CRON_SECRET}`
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const baseUrl    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://markeetee.com'

    // Get all owner profiles with a linked business
    const { data: owners } = await supabase
      .from('profiles')
      .select('id, name, email, business_id')
      .eq('role', 'owner')
      .not('business_id', 'is', null)
      .not('email', 'is', null)

    if (!owners || owners.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 })
    }

    let sent = 0

    for (const owner of owners) {
      if (!owner.business_id || !owner.email) continue

      // Get business stats
      const { data: biz } = await supabase
        .from('businesses')
        .select('name, rating, review_count')
        .eq('id', owner.business_id)
        .single()

      if (!biz) continue

      // Get reviews from the past week
      const { data: weekReviews } = await supabase
        .from('reviews')
        .select('rating, body, created_at, profiles(name)')
        .eq('business_id', owner.business_id)
        .gte('created_at', oneWeekAgo)
        .order('rating', { ascending: false })

      const weekCount = weekReviews?.length ?? 0

      // Pick top review (highest rating this week)
      const topReviewRaw = weekReviews?.[0]
      const topReview = topReviewRaw ? {
        reviewerName: (Array.isArray(topReviewRaw.profiles)
          ? topReviewRaw.profiles[0]?.name
          : (topReviewRaw.profiles as { name: string } | null)?.name) ?? 'A customer',
        rating: topReviewRaw.rating,
        body:   topReviewRaw.body ?? '',
      } : null

      await resend.emails.send({
        from:    process.env.EMAIL_FROM!,
        to:      owner.email,
        subject: `Your Markeetee weekly summary — ${biz.name}`,
        react:   WeeklySummaryEmail({
          ownerName:    owner.name ?? 'Owner',
          businessName: biz.name,
          weekReviews:  weekCount,
          totalReviews: biz.review_count ?? 0,
          avgRating:    biz.rating       ?? 0,
          topReview,
          dashboardUrl: `${baseUrl}/dashboard`,
        }),
      })

      sent++
    }

    return NextResponse.json({ ok: true, sent })
  } catch (err) {
    console.error('[weekly-summary]', err)
    return NextResponse.json({ error: 'Failed to send summaries' }, { status: 500 })
  }
}