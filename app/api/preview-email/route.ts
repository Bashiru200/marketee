// app/api/preview-email/route.ts
// Visit http://localhost:3000/api/preview-email?type=weekly to preview
// Add ?type=welcome, ?type=review, ?type=weekly etc.

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

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') ?? 'weekly'
  let template: { subject: string; html: string }

  switch (type) {
    case 'weekly':
      template = weeklySummaryTemplate({
        ownerName:         'Adaeze',
        businessName:      'Oga Suya CLT',
        reviewsThisWeek:   4,
        totalReviews:      27,
        averageRating:     4.6,
        profileViews:      142,
        searchViews:       89,
        phoneCalls:        12,
        directionRequests: 8,
        topReview: {
          reviewerName: 'Kwame O.',
          body:         'Best jollof in Charlotte, hands down. The suya is out of this world!',
          rating:       5,
        },
        recentReviews: [
          { reviewerName: 'Amara N.',  body: 'Amazing food, felt like home.', rating: 5 },
          { reviewerName: 'David M.',  body: 'Great service and portions.',    rating: 4 },
          { reviewerName: 'Ifeoma O.', body: 'Will definitely come back!',     rating: 5 },
        ],
        publicProfileUrl: 'https://markeetee.com/businesses/example',
        dashboardUrl:     'https://markeetee.com/dashboard',
        unsubscribeUrl:   'https://markeetee.com/unsubscribe',
      })
      break

    case 'welcome':
      template = welcomeEmailTemplate({ name: 'Amara', role: 'owner' })
      break

    case 'review':
      template = reviewNotificationTemplate({
        ownerName:    'Adaeze',
        reviewerName: 'Kwame O.',
        businessName: 'Oga Suya CLT',
        rating:       5,
        reviewText:   'Best jollof in Charlotte, hands down.',
        businessUrl:  'https://markeetee.com/dashboard',
      })
      break

    case 'sale':
      template = saleNotificationTemplate({
        recipientName: 'Amara',
        businessName:  'Dress Afrika',
        productName:   'Ankara Wax Print — 6 yards',
        originalPrice: 79.99,
        salePrice:     49.99,
        saleLabel:     'This weekend only',
        businessUrl:   'https://markeetee.com/businesses/example',
      })
      break

    case 'otp':
      template = claimOtpTemplate({
        name:         'Adaeze',
        businessName: 'Oga Suya CLT',
        otp:          '842091',
      })
      break

    case 'confirm':
      template = confirmEmailTemplate({
        name:       'Amara',
        confirmUrl: 'https://markeetee.com/auth/confirm?token=xyz',
      })
      break

    case 'reset':
      template = resetPasswordTemplate({
        name:     'Amara',
        resetUrl: 'https://markeetee.com/auth/reset?token=xyz',
      })
      break

    case 'waitlist':
      template = waitlistTemplate({ email: 'user@example.com' })
      break

    default:
      return NextResponse.json({
        error: 'Unknown type',
        available: ['weekly','welcome','review','sale','otp','confirm','reset','waitlist'],
      }, { status: 400 })
  }

  return new NextResponse(template.html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}