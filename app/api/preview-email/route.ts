// app/api/preview-email/route.ts
// Visit /api/preview-email?type=weekly to preview any email template

import { NextRequest, NextResponse } from 'next/server'
import {
  weeklySummaryTemplate,
  welcomeEmailTemplate,
  reviewNotificationTemplate,
  saleNotificationTemplate,
  claimOtpTemplate,
  confirmEmailTemplate,
  resetPasswordTemplate,
  magicLinkTemplate,
  changeEmailTemplate,
  adminMessageTemplate,
  broadcastEmailTemplate,
  contactFormTemplate,
  waitlistTemplate,
} from '@/lib/emailTemplates'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://markeetee.com'

// Every template returns { subject, html } — this helper picks the html
function pickHtml(t: { subject: string; html: string }): string {
  return t.html
}

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') ?? 'weekly'

  try {
    let html = ''

    switch (type) {

      case 'weekly':
        html = pickHtml(weeklySummaryTemplate({
          ownerName:         'Amina',
          businessName:      'Mama Titi African Kitchen',
          businessLogoUrl:   null,
          publicProfileUrl:  `${APP_URL}/businesses/mama-titi`,
          reviewsThisWeek:   5,
          totalReviews:      47,
          averageRating:     4.6,
          topReview: {
            reviewerName: 'Kwame A.',
            rating:       5,
            body:         'The jollof rice was absolutely amazing! Full of flavour and the suya was perfectly grilled. Staff were so friendly.',
          },
          recentReviews: [
            { reviewerName: 'Aisha O.',  rating: 5, body: 'Best African restaurant in Charlotte!',       createdAt: new Date().toISOString() },
            { reviewerName: 'James M.',  rating: 4, body: 'Great food, friendly service.',                createdAt: new Date().toISOString() },
            { reviewerName: 'Fatima B.', rating: 5, body: 'Feels like home. Highly recommend!',            createdAt: new Date().toISOString() },
          ],
          profileViews:      234,
          searchViews:       1890,
          phoneCalls:        18,
          directionRequests: 45,
          dashboardUrl:      `${APP_URL}/dashboard`,
          unsubscribeUrl:    `${APP_URL}/unsubscribe`,
        }))
        break

      case 'welcome':
        html = pickHtml(welcomeEmailTemplate({
          name: 'Amina',
          role: 'owner',
        }))
        break

      case 'review':
        html = pickHtml(reviewNotificationTemplate({
          ownerName:    'Amina',
          reviewerName: 'Kwame A.',
          businessName: 'Mama Titi African Kitchen',
          rating:       5,
          reviewText:   'Amazing food and great service!',
          businessUrl:  `${APP_URL}/businesses/mama-titi`,
        }))
        break

      case 'sale':
        html = pickHtml(saleNotificationTemplate({
          recipientName:  'Kwame',
          businessName:   'Mama Titi African Kitchen',
          productName:    'Large Jollof Platter',
          originalPrice:  20,
          salePrice:      16,
          saleLabel:      '20% off',
          message:        'This weekend only. Authentic Nigerian jollof rice at 20% off.',
          businessUrl:    `${APP_URL}/businesses/mama-titi`,
          unsubscribeUrl: `${APP_URL}/unsubscribe`,
        }))
        break

      case 'claim':
        html = pickHtml(claimOtpTemplate({
          name:         'Amina',
          businessName: 'Mama Titi African Kitchen',
          otp:          '123456',
        }))
        break

      case 'confirm':
        html = pickHtml(confirmEmailTemplate({
          name:       'Amina',
          confirmUrl: `${APP_URL}/auth/callback?token=preview`,
        }))
        break

      case 'reset':
        html = pickHtml(resetPasswordTemplate({
          name:     'Amina',
          resetUrl: `${APP_URL}/auth/reset-password?token=preview`,
        }))
        break

      case 'magic':
        html = pickHtml(magicLinkTemplate({
          name:     'Amina',
          magicUrl: `${APP_URL}/auth/callback?token=preview`,
        }))
        break

      case 'change':
        html = pickHtml(changeEmailTemplate({
          name:       'Amina',
          newEmail:   'newemail@example.com',
          confirmUrl: `${APP_URL}/auth/callback?token=preview`,
        }))
        break

      case 'admin':
        html = pickHtml(adminMessageTemplate({
          recipientName: 'Amina',
          subject:       'Important update from Markeetee',
          message:       'This is a message from the Markeetee team about your account. Please read carefully.',
          ctaLabel:      'Go to dashboard',
          ctaUrl:        `${APP_URL}/dashboard`,
        }))
        break

      case 'broadcast':
        html = pickHtml(broadcastEmailTemplate({
          recipientName: 'Amina',
          subject:       'New feature launched!',
          headline:      'Say hello to Markeetee Pro Store',
          body:          'We just launched a new feature that will help your business grow. Check it out in your dashboard.',
          ctaLabel:      'See what\'s new',
          ctaUrl:        `${APP_URL}/dashboard`,
          unsubscribeUrl:`${APP_URL}/unsubscribe`,
        }))
        break

      case 'contact':
        html = pickHtml(contactFormTemplate({
          name:    'John Doe',
          email:   'john@example.com',
          subject: 'Question about listings',
          message: 'How do I claim my business? I own Mama Titi African Kitchen in Charlotte.',
        }))
        break

      case 'waitlist':
        html = pickHtml(waitlistTemplate({
          email: 'user@example.com',
        }))
        break

      default:
        return new NextResponse(
          `<h1>Unknown template type: ${type}</h1>
          <p>Available types:</p>
          <ul>
            <li><a href="?type=weekly">weekly</a> — Weekly summary</li>
            <li><a href="?type=welcome">welcome</a> — Welcome email</li>
            <li><a href="?type=review">review</a> — Review notification</li>
            <li><a href="?type=sale">sale</a> — Sale notification</li>
            <li><a href="?type=claim">claim</a> — Claim OTP</li>
            <li><a href="?type=confirm">confirm</a> — Confirm email</li>
            <li><a href="?type=reset">reset</a> — Reset password</li>
            <li><a href="?type=magic">magic</a> — Magic link</li>
            <li><a href="?type=change">change</a> — Change email</li>
            <li><a href="?type=admin">admin</a> — Admin message</li>
            <li><a href="?type=broadcast">broadcast</a> — Broadcast</li>
            <li><a href="?type=contact">contact</a> — Contact form</li>
            <li><a href="?type=waitlist">waitlist</a> — Waitlist</li>
          </ul>`,
          { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        )
    }

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })

  } catch (err) {
    console.error('[preview-email] Error:', err)
    return new NextResponse(
      `<h1>Preview error</h1><pre>${err instanceof Error ? err.message : String(err)}</pre>`,
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }
}