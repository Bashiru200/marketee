/**
 * lib/emailTemplates.ts
 * Markeetee production-ready transactional email templates
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.markeetee.com'
const LOGO_URL = `${APP_URL}/apple-touch-icon.png`

const BRAND_DARK = '#053528'
const BRAND_GREEN = '#1D9E75'
const BRAND_MINT = '#C5EADB'
const TEXT_DARK = '#111827'
const TEXT_MUTED = '#6B7280'
const BORDER = '#E5E7EB'

function escapeHtml(value?: string | null) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function safeUrl(url?: string | null) {
  const fallback = APP_URL
  if (!url) return fallback

  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'mailto:') {
      return parsed.toString()
    }
    return fallback
  } catch {
    return fallback
  }
}

function money(value: number) {
  return `$${Number(value || 0).toFixed(2)}`
}

function textPreview(html: string) {
  return escapeHtml(html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 120))
}

function preheader(text: string) {
  return `
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${escapeHtml(text)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
    </div>
  `
}

function greeting(name?: string | null) {
  return `
    <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:${TEXT_DARK};">
      Hi${name ? ` <strong>${escapeHtml(name)}</strong>` : ''},
    </p>
  `
}

function button(label: string, url: string, secondary = false) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:28px auto 0;">
      <tr>
        <td align="center" style="border-radius:12px;background:${secondary ? '#ffffff' : BRAND_GREEN};border:${secondary ? `2px solid ${BRAND_GREEN}` : '0'};">
          <a href="${safeUrl(url)}" style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:700;color:${secondary ? BRAND_GREEN : '#ffffff'};text-decoration:none;border-radius:12px;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>
  `
}

function infoBox(content: string, color = '#F0FAF6', border = BRAND_MINT) {
  return `
    <div style="background:${color};border-left:4px solid ${border};border-radius:0 12px 12px 0;padding:16px 18px;margin:22px 0;font-size:14px;line-height:1.7;color:#374151;">
      ${content}
    </div>
  `
}

function divider() {
  return `<hr style="border:none;border-top:1px solid #F3F4F6;margin:26px 0;" />`
}

function wrap({
  subject,
  preheaderText,
  badge,
  headline,
  subline,
  body,
  cta,
  unsubscribeUrl,
}: {
  subject: string
  preheaderText?: string
  badge?: string
  headline: string
  subline?: string
  body: string
  cta?: { label: string; url: string; secondary?: boolean }
  unsubscribeUrl?: string
}) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${escapeHtml(subject)}</title>
</head>

<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:${TEXT_DARK};">
  ${preheaderText ? preheader(preheaderText) : ''}

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:32px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid ${BORDER};">

          <tr>
            <td style="background:${BRAND_DARK};padding:34px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td><img src="${LOGO_URL}" width="40" height="40" alt="M" style="display:block;border-radius:10px;" /></td>
                        <td style="padding-left:10px;font-size:22px;font-weight:800;color:#ffffff;vertical-align:middle;letter-spacing:-0.02em;">Markeetee</td>
                      </tr>
                    </table>
                  </td>
                  ${
                    badge
                      ? `<td align="right"><span style="display:inline-block;background:rgba(159,225,203,.18);color:${BRAND_MINT};font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:6px 12px;border-radius:999px;">${escapeHtml(badge)}</span></td>`
                      : ''
                  }
                </tr>
              </table>

              <h1 style="margin:28px 0 8px;font-size:28px;line-height:1.25;color:#ffffff;font-weight:800;">
                ${escapeHtml(headline)}
              </h1>

              ${
                subline
                  ? `<p style="margin:0;font-size:14px;line-height:1.6;color:${BRAND_MINT};">${escapeHtml(subline)}</p>`
                  : ''
              }
            </td>
          </tr>

          <tr>
            <td style="padding:36px 32px;background:#ffffff;">
              ${body}
              ${cta ? button(cta.label, cta.url, cta.secondary) : ''}
            </td>
          </tr>

          <tr>
            <td style="background:#FAFAF9;border-top:1px solid ${BORDER};padding:30px 32px;text-align:center;">
              <p style="margin:0 0 6px;font-size:15px;font-weight:800;color:${BRAND_DARK};">
                Markeetee
              </p>

              <p style="margin:0 0 18px;font-size:13px;line-height:1.7;color:${TEXT_MUTED};">
                Africa is here. Find it.<br />
                The African business directory for the diaspora.
              </p>

              <p style="margin:0 0 14px;font-size:12px;line-height:1.8;color:#9CA3AF;">
                <a href="${APP_URL}" style="color:${BRAND_GREEN};text-decoration:none;">Website</a>
                &nbsp;·&nbsp;
                <a href="${APP_URL}/privacy" style="color:${BRAND_GREEN};text-decoration:none;">Privacy</a>
                &nbsp;·&nbsp;
                <a href="${APP_URL}/terms" style="color:${BRAND_GREEN};text-decoration:none;">Terms</a>
                &nbsp;·&nbsp;
                <a href="${APP_URL}/contact" style="color:${BRAND_GREEN};text-decoration:none;">Contact</a>
              </p>

              ${
                unsubscribeUrl
                  ? `<p style="margin:0 0 12px;font-size:12px;color:#9CA3AF;">
                      <a href="${safeUrl(unsubscribeUrl)}" style="color:#9CA3AF;text-decoration:underline;">Unsubscribe</a>
                    </p>`
                  : ''
              }

              <p style="margin:0;font-size:11px;line-height:1.6;color:#B0B7C3;">
                © 2026 Markeetee. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function confirmEmailTemplate({
  name,
  confirmUrl,
}: {
  name?: string | null
  confirmUrl: string
}) {
  const subject = 'Confirm your Markeetee account'

  return {
    subject,
    html: wrap({
      subject,
      preheaderText: 'Confirm your email to activate your Markeetee account.',
      badge: 'Welcome',
      headline: "You're almost in",
      subline: 'Confirm your email to activate your account.',
      body: `
        ${greeting(name)}
        <p style="margin:0 0 18px;font-size:15px;line-height:1.8;color:#374151;">
          Welcome to Markeetee — your place to discover African-owned restaurants, markets, beauty, fashion, wellness, services, and more.
        </p>
        ${infoBox('This confirmation link may expire soon. If it expires, request a new one from the sign-in page.')}
        <p style="margin:22px 0 0;font-size:12px;line-height:1.7;color:#9CA3AF;text-align:center;">
          If the button does not work, copy and paste this link:<br />
          <a href="${safeUrl(confirmUrl)}" style="color:${BRAND_GREEN};word-break:break-all;">${escapeHtml(confirmUrl)}</a>
        </p>
      `,
      cta: { label: 'Confirm my email', url: confirmUrl },
    }),
  }
}

export function resetPasswordTemplate({
  name,
  resetUrl,
}: {
  name?: string | null
  resetUrl: string
}) {
  const subject = 'Reset your Markeetee password'

  return {
    subject,
    html: wrap({
      subject,
      preheaderText: 'Use this secure link to reset your Markeetee password.',
      badge: 'Security',
      headline: 'Reset your password',
      subline: 'Create a new password for your account.',
      body: `
        ${greeting(name)}
        <p style="margin:0 0 18px;font-size:15px;line-height:1.8;color:#374151;">
          We received a request to reset your Markeetee password. Use the button below to create a new one.
        </p>
        ${infoBox("If you did not request this, you can safely ignore this email. Your password will not change.", '#FFF7F0', '#FED7AA')}
      `,
      cta: { label: 'Reset password', url: resetUrl },
    }),
  }
}

export function magicLinkTemplate({
  name,
  magicUrl,
}: {
  name?: string | null
  magicUrl: string
}) {
  const subject = 'Your Markeetee sign-in link'

  return {
    subject,
    html: wrap({
      subject,
      preheaderText: 'Use this one-time link to sign in to Markeetee.',
      badge: 'Sign in',
      headline: 'Your sign-in link',
      subline: 'One click to securely access your account.',
      body: `
        ${greeting(name)}
        <p style="margin:0 0 18px;font-size:15px;line-height:1.8;color:#374151;">
          Click the button below to sign in to your Markeetee account.
        </p>
        ${infoBox('This link can only be used once. Do not share it with anyone.')}
      `,
      cta: { label: 'Sign in to Markeetee', url: magicUrl },
    }),
  }
}

export function welcomeEmailTemplate({
  name,
  role,
}: {
  name?: string | null
  role: 'customer' | 'owner'
}) {
  const isOwner = role === 'owner'
  const subject = isOwner ? 'Welcome to Markeetee Business' : 'Welcome to Markeetee'

  return {
    subject,
    html: wrap({
      subject,
      preheaderText: isOwner
        ? 'Your business dashboard is ready.'
        : 'Start discovering African-owned businesses near you.',
      badge: isOwner ? 'Business Owner' : 'Welcome',
      headline: isOwner ? 'Your business dashboard is ready' : 'Welcome to the community',
      subline: isOwner ? 'Set up your listing and start reaching customers.' : 'Africa is here. Find it.',
      body: `
        ${greeting(name)}
        <p style="margin:0 0 18px;font-size:15px;line-height:1.8;color:#374151;">
          ${
            isOwner
              ? 'You can now manage your business profile, add photos, list products, update hours, and track customer activity from your dashboard.'
              : 'You can now search, save, review, and support African-owned businesses across the Markeetee community.'
          }
        </p>

        ${infoBox(
          isOwner
            ? 'Next step: complete your business profile with photos, hours, contact details, and products.'
            : 'Start by exploring restaurants, grocery stores, beauty, fashion, wellness, services, and more.'
        )}
      `,
      cta: {
        label: isOwner ? 'Go to dashboard' : 'Explore businesses',
        url: isOwner ? `${APP_URL}/dashboard` : `${APP_URL}/search`,
      },
    }),
  }
}

export function reviewNotificationTemplate({
  ownerName,
  reviewerName,
  businessName,
  rating,
  reviewText,
  businessUrl,
}: {
  ownerName?: string | null
  reviewerName?: string | null
  businessName: string
  rating: number
  reviewText: string
  businessUrl: string
}) {
  const safeRating = Math.max(1, Math.min(5, Math.round(rating)))
  const subject = `New ${safeRating}-star review for ${businessName}`

  return {
    subject: escapeHtml(subject),
    html: wrap({
      subject,
      preheaderText: `${reviewerName || 'A customer'} left a review for ${businessName}.`,
      badge: 'New Review',
      headline: 'You received a new review',
      subline: businessName,
      body: `
        ${greeting(ownerName)}
        <p style="margin:0 0 18px;font-size:15px;line-height:1.8;color:#374151;">
          ${escapeHtml(reviewerName || 'A customer')} left a ${safeRating}-star review for <strong>${escapeHtml(businessName)}</strong>.
        </p>

        <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:14px;padding:20px;margin:22px 0;">
          <p style="margin:0 0 10px;font-size:18px;color:#F59E0B;">${'★'.repeat(safeRating)}${'☆'.repeat(5 - safeRating)}</p>
          <p style="margin:0;font-size:14px;line-height:1.8;color:#374151;font-style:italic;">
            “${escapeHtml(reviewText)}”
          </p>
        </div>
      `,
      cta: { label: 'View review', url: businessUrl },
    }),
  }
}

export function saleNotificationTemplate({
  recipientName,
  businessName,
  productName,
  originalPrice,
  salePrice,
  saleLabel,
  message,
  businessUrl,
  unsubscribeUrl,
}: {
  recipientName?: string | null
  businessName: string
  productName: string
  originalPrice: number
  salePrice: number
  saleLabel: string
  message?: string
  businessUrl: string
  unsubscribeUrl?: string
}) {
  const discount =
    originalPrice > 0 ? Math.max(0, Math.round(((originalPrice - salePrice) / originalPrice) * 100)) : 0

  const subject = `${discount}% off at ${businessName}`

  return {
    subject,
    html: wrap({
      subject,
      preheaderText: `${businessName} has a special offer on ${productName}.`,
      badge: `${discount}% OFF`,
      headline: 'Sale alert',
      subline: businessName,
      body: `
        ${greeting(recipientName)}
        <p style="margin:0 0 18px;font-size:15px;line-height:1.8;color:#374151;">
          One of your saved businesses has a new offer.
        </p>

        <div style="background:#F0FAF6;border:1px solid ${BRAND_MINT};border-radius:16px;padding:24px;text-align:center;margin:22px 0;">
          <p style="margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:${TEXT_MUTED};">
            ${escapeHtml(productName)}
          </p>
          <p style="margin:0;font-size:16px;color:#9CA3AF;text-decoration:line-through;">${money(originalPrice)}</p>
          <p style="margin:6px 0 10px;font-size:34px;font-weight:800;color:${BRAND_GREEN};">${money(salePrice)}</p>
          <p style="margin:0;font-size:12px;font-weight:700;color:#92400E;background:#FEF3C7;display:inline-block;padding:5px 12px;border-radius:999px;">
            ${escapeHtml(saleLabel)}
          </p>
        </div>

        ${message ? infoBox(`Message from ${escapeHtml(businessName)}: <em>${escapeHtml(message)}</em>`) : ''}
      `,
      cta: { label: 'View offer', url: businessUrl },
      unsubscribeUrl,
    }),
  }
}

export function claimOtpTemplate({
  name,
  businessName,
  otp,
}: {
  name?: string | null
  businessName: string
  otp: string
}) {
  const subject = `${otp} is your Markeetee verification code`

  return {
    subject,
    html: wrap({
      subject,
      preheaderText: `Use ${otp} to verify your business claim.`,
      badge: 'Verify',
      headline: 'Verification code',
      subline: `Claiming ${businessName}`,
      body: `
        ${greeting(name)}
        <p style="margin:0 0 22px;font-size:15px;line-height:1.8;color:#374151;">
          Use this code to verify ownership of <strong>${escapeHtml(businessName)}</strong>.
        </p>

        <div style="text-align:center;margin:26px 0;">
          <div style="display:inline-block;background:#F0FAF6;border:2px solid ${BRAND_MINT};border-radius:18px;padding:20px 36px;">
            <p style="margin:0;font-family:monospace;font-size:40px;font-weight:800;letter-spacing:.18em;color:${BRAND_GREEN};">
              ${escapeHtml(otp)}
            </p>
          </div>
        </div>

        ${infoBox('This code expires soon. Do not share it with anyone.', '#FFF7F0', '#FED7AA')}
      `,
    }),
  }
}

export function changeEmailTemplate({
  name,
  newEmail,
  confirmUrl,
}: {
  name?: string | null
  newEmail: string
  confirmUrl: string
}) {
  const subject = 'Confirm your new Markeetee email'

  return {
    subject,
    html: wrap({
      subject,
      preheaderText: `Confirm your new email address: ${newEmail}`,
      badge: 'Email Change',
      headline: 'Confirm your new email',
      subline: newEmail,
      body: `
        ${greeting(name)}
        <p style="margin:0 0 18px;font-size:15px;line-height:1.8;color:#374151;">
          You requested to change your Markeetee email address to:
        </p>
        ${infoBox(`<strong>${escapeHtml(newEmail)}</strong>`)}
        <p style="margin:0;font-size:14px;line-height:1.8;color:#374151;">
          If you did not request this change, contact us immediately.
        </p>
      `,
      cta: { label: 'Confirm new email', url: confirmUrl },
    }),
  }
}

export function adminMessageTemplate({
  recipientName,
  subject,
  message,
  ctaLabel,
  ctaUrl,
}: {
  recipientName?: string | null
  subject: string
  message: string
  ctaLabel?: string
  ctaUrl?: string
}) {
  const finalSubject = `Markeetee: ${subject}`

  return {
    subject: finalSubject,
    html: wrap({
      subject: finalSubject,
      preheaderText: message.slice(0, 120),
      badge: 'Markeetee',
      headline: subject,
      body: `
        ${greeting(recipientName)}
        <div style="font-size:15px;line-height:1.8;color:#374151;white-space:pre-line;">
          ${escapeHtml(message)}
        </div>
      `,
      cta: ctaLabel && ctaUrl ? { label: ctaLabel, url: ctaUrl } : undefined,
    }),
  }
}

export function broadcastEmailTemplate({
  recipientName,
  subject,
  headline,
  body,
  ctaLabel,
  ctaUrl,
  unsubscribeUrl,
}: {
  recipientName?: string | null
  subject: string
  headline: string
  body: string
  ctaLabel?: string
  ctaUrl?: string
  unsubscribeUrl?: string
}) {
  return {
    subject,
    html: wrap({
      subject,
      preheaderText: textPreview(body),
      badge: 'Update',
      headline,
      body: `
        ${recipientName ? greeting(recipientName) : ''}
        <div style="font-size:15px;line-height:1.8;color:#374151;">
          ${body}
        </div>
      `,
      cta: ctaLabel && ctaUrl ? { label: ctaLabel, url: ctaUrl } : undefined,
      unsubscribeUrl,
    }),
  }
}

export function contactFormTemplate({
  name,
  email,
  subject,
  message,
}: {
  name: string
  email: string
  subject: string
  message: string
}) {
  const finalSubject = `New contact form message: ${subject}`

  return {
    subject: finalSubject,
    html: wrap({
      subject: finalSubject,
      preheaderText: `New message from ${name}`,
      badge: 'Contact',
      headline: 'New contact message',
      subline: name,
      body: `
        ${infoBox(`<strong>Name:</strong> ${escapeHtml(name)}<br/><strong>Email:</strong> ${escapeHtml(email)}<br/><strong>Subject:</strong> ${escapeHtml(subject)}`)}
        <div style="background:#F9FAFB;border-radius:14px;padding:18px;font-size:14px;line-height:1.8;color:#374151;white-space:pre-line;">
          ${escapeHtml(message)}
        </div>
      `,
      cta: { label: `Reply to ${name}`, url: `mailto:${email}?subject=Re:%20${encodeURIComponent(subject)}` },
    }),
  }
}

export function waitlistTemplate({ email }: { email: string }) {
  const subject = "You're on the Markeetee waitlist"

  return {
    subject,
    html: wrap({
      subject,
      preheaderText: "You're on the list. We'll keep you updated.",
      badge: 'Waitlist',
      headline: "You're on the list",
      subline: 'We will notify you as Markeetee grows.',
      body: `
        <p style="margin:0 0 18px;font-size:15px;line-height:1.8;color:#374151;">
          Thank you for joining the Markeetee waitlist with <strong>${escapeHtml(email)}</strong>.
        </p>
        ${infoBox('We are building a trusted place to discover African-owned businesses, products, services, and community favorites.')}
      `,
      cta: { label: 'Visit Markeetee', url: APP_URL },
    }),
  }
}


// ── 13. Weekly summary (to business owner) ────────────────────────────────
export function weeklySummaryTemplate({
  ownerName,
  businessName,
  businessLogoUrl,
  publicProfileUrl,
  reviewsThisWeek,
  totalReviews,
  averageRating,
  topReview,
  recentReviews,
  profileViews,
  searchViews,
  phoneCalls,
  directionRequests,
  dashboardUrl,
  unsubscribeUrl,
}: {
  ownerName:          string | null
  businessName:       string
  businessLogoUrl?:   string | null
  publicProfileUrl?:  string | null
  reviewsThisWeek:    number
  totalReviews:       number
  averageRating:      number
  topReview?: {
    reviewerName: string
    rating:       number
    body:         string
    avatarUrl?:   string | null
  } | null
  recentReviews: Array<{
    reviewerName: string
    rating:       number
    body:         string
    createdAt:    string
    avatarUrl?:   string | null
  }>
  profileViews:       number
  searchViews:        number
  phoneCalls:         number
  directionRequests:  number
  dashboardUrl:       string
  unsubscribeUrl?:    string
}): { subject: string; html: string } {
  const safeRating = Number.isFinite(averageRating) ? averageRating : 0
  const stars = (n: number) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n))

  const subject = `${businessName} received ${reviewsThisWeek} ${reviewsThisWeek === 1 ? 'review' : 'reviews'} this week`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#F4F7F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">

<div style="display:none;max-height:0;overflow:hidden;">
${escapeHtml(businessName)} received ${reviewsThisWeek} ${reviewsThisWeek === 1 ? 'review' : 'reviews'} this week.
&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
</div>

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7F6;padding:32px 12px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;background:#ffffff;border-radius:20px;overflow:hidden;">

  <!-- Header -->
  <tr><td style="background:${BRAND_DARK};padding:36px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <p style="margin:0;font-size:29px;font-weight:800;color:#ffffff;line-height:1;">Markeetee</p>
          <p style="margin:8px 0 0;font-size:13px;font-weight:600;color:${BRAND_MINT};">Africa is here. Find it.</p>
        </td>
        <td align="right" style="vertical-align:top;">
          <span style="display:inline-block;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.24);color:#ffffff;font-size:10px;font-weight:700;padding:8px 14px;border-radius:20px;letter-spacing:0.1em;text-transform:uppercase;">Weekly summary</span>
        </td>
      </tr>
    </table>

    <h1 style="margin:32px 0 8px;font-size:30px;font-weight:800;color:#ffffff;line-height:1.2;">Hi ${escapeHtml(ownerName ?? 'there')},</h1>
    <p style="margin:0;font-size:17px;line-height:1.6;color:#E6F5EF;">
      Here's how <strong style="color:${BRAND_MINT};">${escapeHtml(businessName)}</strong> performed this week.
    </p>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:36px 32px;">
    <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#47524E;">
      Here is a quick look at your latest reviews, customer activity, and business visibility on Markeetee.
    </p>

    <!-- Stat cards -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      <tr>
        <td width="33%" style="padding-right:6px;vertical-align:top;">
          <div style="background:#F0FAF6;border-radius:14px;padding:18px 12px;text-align:center;border:1px solid #CFE9DF;">
            <p style="margin:0 0 8px;font-size:24px;line-height:1;color:${BRAND_GREEN};">☆</p>
            <p style="margin:0;font-size:22px;font-weight:800;color:#17211E;line-height:1;">${reviewsThisWeek}</p>
            <p style="margin:6px 0 0;font-size:11px;font-weight:600;color:#64706C;text-transform:uppercase;letter-spacing:0.05em;">Reviews this week</p>
          </div>
        </td>
        <td width="33%" style="padding:0 3px;vertical-align:top;">
          <div style="background:#F0FAF6;border-radius:14px;padding:18px 12px;text-align:center;border:1px solid #CFE9DF;">
            <p style="margin:0 0 8px;font-size:24px;line-height:1;">💬</p>
            <p style="margin:0;font-size:22px;font-weight:800;color:#17211E;line-height:1;">${totalReviews}</p>
            <p style="margin:6px 0 0;font-size:11px;font-weight:600;color:#64706C;text-transform:uppercase;letter-spacing:0.05em;">Total reviews</p>
          </div>
        </td>
        <td width="33%" style="padding-left:6px;vertical-align:top;">
          <div style="background:#F0FAF6;border-radius:14px;padding:18px 12px;text-align:center;border:1px solid #CFE9DF;">
            <p style="margin:0 0 8px;font-size:24px;line-height:1;color:${BRAND_GREEN};">↗</p>
            <p style="margin:0;font-size:22px;font-weight:800;color:#17211E;line-height:1;">${safeRating > 0 ? safeRating.toFixed(1) + ' ★' : '—'}</p>
            <p style="margin:6px 0 0;font-size:11px;font-weight:600;color:#64706C;text-transform:uppercase;letter-spacing:0.05em;">Average rating</p>
          </div>
        </td>
      </tr>
    </table>

    ${topReview ? `
    <!-- Top review -->
    <div style="margin-top:32px;">
      <h2 style="margin:0 0 16px;font-size:17px;font-weight:800;color:#17211E;">🏆 Top review this week</h2>
      <div style="background:#F0FAF6;border:1px solid #CFE9DF;border-radius:16px;padding:24px;">
        <p style="margin:0 0 10px;font-size:16px;color:#F59E0B;letter-spacing:2px;">${stars(topReview.rating)}</p>
        <p style="margin:0 0 12px;font-size:15px;font-style:italic;line-height:1.6;color:#2F3936;">"${escapeHtml(topReview.body)}"</p>
        <p style="margin:0;font-size:13px;font-weight:700;color:#64706C;">— ${escapeHtml(topReview.reviewerName)}</p>
      </div>
    </div>
    ` : `
    <div style="margin-top:32px;background:#F0FAF6;border:1px solid #CFE9DF;border-radius:16px;padding:24px;text-align:center;">
      <h2 style="margin:0;font-size:17px;font-weight:800;color:${BRAND_DARK};">Keep building your reputation</h2>
      <p style="margin:8px 0 0;font-size:14px;line-height:1.5;color:#64706C;">Share your Markeetee profile and invite customers to leave a review.</p>
    </div>
    `}

    <!-- CTA button -->
    <div style="margin:32px 0;text-align:center;">
      <a href="${safeUrl(dashboardUrl)}" style="display:inline-block;background:${BRAND_GREEN};color:#ffffff;font-size:15px;font-weight:800;padding:16px 32px;border-radius:12px;text-decoration:none;">
        View your dashboard →
      </a>
    </div>

    <!-- Insights summary -->
    <div style="background:#ffffff;border:1px solid #DCE8E3;border-radius:16px;padding:20px;">
      <h2 style="margin:0 0 20px;font-size:17px;font-weight:800;color:#17211E;">Insights summary</h2>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          ${[
            { icon:'◉', value: profileViews,      label:'Profile views' },
            { icon:'⌕', value: searchViews,       label:'Search views'  },
            { icon:'☎', value: phoneCalls,        label:'Phone calls'   },
            { icon:'↗', value: directionRequests, label:'Directions'    },
          ].map((s, i, a) => `
          <td width="25%" style="padding:${i === 0 ? '0 3px 0 0' : i === a.length - 1 ? '0 0 0 3px' : '0 3px'};vertical-align:top;text-align:center;">
            <div style="background:#F9FBFA;border-radius:12px;padding:14px 8px;">
              <p style="margin:0 0 4px;font-size:18px;line-height:1;color:${BRAND_GREEN};">${s.icon}</p>
              <p style="margin:0;font-size:18px;font-weight:800;color:#17211E;line-height:1;">${s.value}</p>
              <p style="margin:6px 0 0;font-size:10px;font-weight:600;color:#64706C;text-transform:uppercase;letter-spacing:0.05em;">${s.label}</p>
            </div>
          </td>`).join('')}
        </tr>
      </table>
      <p style="margin:20px 0 0;text-align:center;">
        <a href="${safeUrl(dashboardUrl)}/insights" style="font-size:13px;font-weight:800;color:${BRAND_GREEN};text-decoration:underline;">See full insights →</a>
      </p>
    </div>

    ${recentReviews.length > 0 ? `
    <!-- Recent reviews -->
    <div style="margin-top:28px;background:#ffffff;border:1px solid #DCE8E3;border-radius:16px;padding:20px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
        <tr>
          <td><h2 style="margin:0;font-size:17px;font-weight:800;color:#17211E;">Recent reviews</h2></td>
          <td align="right"><a href="${safeUrl(dashboardUrl)}/reviews" style="font-size:13px;font-weight:800;color:${BRAND_GREEN};text-decoration:underline;">View all</a></td>
        </tr>
      </table>
      ${recentReviews.slice(0, 3).map((r, i, arr) => `
      <div style="padding:12px 0;${i < arr.length - 1 ? 'border-bottom:1px solid #EDF1EF;' : ''}">
        <p style="margin:0 0 4px;font-size:13px;color:#F59E0B;letter-spacing:1px;">${stars(r.rating)}</p>
        <p style="margin:0 0 6px;font-size:14px;line-height:1.6;color:#2F3936;">${escapeHtml(textPreview(r.body))}</p>
        <p style="margin:0;font-size:12px;font-weight:600;color:#64706C;">— ${escapeHtml(r.reviewerName)}</p>
      </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- Momentum callout -->
    <div style="margin-top:28px;background:#F0FAF6;border-left:4px solid ${BRAND_GREEN};border-radius:0 12px 12px 0;padding:20px;">
      <h3 style="margin:0 0 8px;font-size:15px;font-weight:800;color:${BRAND_DARK};">Keep the momentum going</h3>
      <p style="margin:0;font-size:13px;line-height:1.6;color:#4C5652;">
        Respond to new reviews and keep your profile, photos, business hours, products, and services updated to attract more customers.
      </p>
    </div>

    ${businessLogoUrl || publicProfileUrl ? `
    <div style="margin-top:28px;background:#ffffff;border:1px solid #DCE8E3;border-radius:16px;padding:16px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          ${businessLogoUrl ? `
          <td width="64" style="vertical-align:middle;">
            <img src="${safeUrl(businessLogoUrl)}" width="48" height="48" alt="${escapeHtml(businessName)}" style="display:block;border-radius:50%;object-fit:cover;" />
          </td>` : ''}
          <td style="vertical-align:middle;">
            <p style="margin:0 0 4px;font-size:14px;font-weight:800;color:#17211E;">${escapeHtml(businessName)}</p>
            ${publicProfileUrl ? `<a href="${safeUrl(publicProfileUrl)}" style="font-size:13px;font-weight:800;color:${BRAND_GREEN};text-decoration:underline;">View public profile →</a>` : ''}
          </td>
        </tr>
      </table>
    </div>
    ` : ''}
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#F8FAF9;border-top:1px solid #DCE8E3;padding:32px 28px;text-align:center;">
    <p style="margin:0 0 8px;font-size:18px;font-weight:800;color:${BRAND_GREEN};">Markeetee</p>
    <p style="margin:0 auto 16px;max-width:420px;font-size:12px;line-height:1.6;color:#64706C;">
      Helping people discover and support African-owned businesses.
    </p>
    <p style="margin:0 0 16px;font-size:12px;">
      <a href="${APP_URL}" style="color:${BRAND_GREEN};font-weight:700;text-decoration:underline;">Website</a>
      <span style="padding:0 8px;color:#A2AAA7;">•</span>
      <a href="${APP_URL}/contact" style="color:${BRAND_GREEN};font-weight:700;text-decoration:underline;">Support</a>
      ${unsubscribeUrl ? `<span style="padding:0 8px;color:#A2AAA7;">•</span><a href="${safeUrl(unsubscribeUrl)}" style="color:${BRAND_GREEN};font-weight:700;text-decoration:underline;">Unsubscribe</a>` : ''}
    </p>
    <p style="margin:0;font-size:11px;line-height:1.5;color:#9AA19F;">
      © ${new Date().getFullYear()} Markeetee. All rights reserved.
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`

  return { subject, html }
}