// lib/emailTemplates.ts
// Centralised branded email HTML templates

const BASE_STYLES = `
  font-family: system-ui, -apple-system, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  padding: 32px 16px;
`

const HEADER = (title: string, subtitle?: string) => `
  <div style="background:#085041;padding:28px 32px;border-radius:12px 12px 0 0">
    <img src="https://markeetee.com/markeetee-logo.png" alt="Markeetee" height="36" style="margin-bottom:12px" />
    <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff">${title}</p>
    ${subtitle ? `<p style="margin:6px 0 0;font-size:13px;color:#9FE1CB">${subtitle}</p>` : ''}
  </div>
`

const FOOTER = `
  <div style="padding:20px 32px;border-top:1px solid #f3f4f6">
    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6">
      You received this email from Markeetee — the African business directory for the US diaspora.<br/>
      <a href="https://markeetee.com" style="color:#1D9E75">markeetee.com</a>
    </p>
  </div>
`

export function emailConfirmationTemplate({
  name,
  confirmUrl,
}: {
  name: string
  confirmUrl: string
}) {
  return `
    <div style="${BASE_STYLES}">
      ${HEADER('Confirm your email', 'One last step to activate your account')}
      <div style="background:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        <p style="font-size:15px;color:#111827;margin:0 0 16px">Hi <strong>${name}</strong>,</p>
        <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 24px">
          Welcome to Markeetee! Click the button below to confirm your email address
          and activate your account.
        </p>
        <div style="text-align:center;margin:28px 0">
          <a href="${confirmUrl}"
            style="display:inline-block;background:#1D9E75;color:#ffffff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:12px;text-decoration:none">
            Confirm email address
          </a>
        </div>
        <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0">
          This link expires in 24 hours. If you did not create an account,
          you can safely ignore this email.
        </p>
      </div>
      ${FOOTER}
    </div>
  `
}

export function reviewNotificationTemplate({
  ownerName,
  reviewerName,
  businessName,
  rating,
  body,
  businessId,
  appUrl,
}: {
  ownerName:    string
  reviewerName: string
  businessName: string
  rating:       number
  body:         string
  businessId:   string
  appUrl:       string
}) {
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating)
  return `
    <div style="${BASE_STYLES}">
      ${HEADER(`New ${rating}★ review on ${businessName}`)}
      <div style="background:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        <p style="font-size:15px;color:#111827;margin:0 0 16px">Hi <strong>${ownerName}</strong>,</p>
        <p style="font-size:14px;color:#374151;margin:0 0 20px">
          <strong>${reviewerName}</strong> left a review on <strong>${businessName}</strong>.
        </p>
        <div style="background:#f0faf6;border-radius:12px;padding:20px;margin:0 0 24px">
          <p style="margin:0 0 10px;font-size:22px;color:#F59E0B">${stars}</p>
          <p style="margin:0;font-size:14px;color:#374151;line-height:1.7">&ldquo;${body}&rdquo;</p>
          <p style="margin:12px 0 0;font-size:12px;color:#6B7280">— ${reviewerName}</p>
        </div>
        <a href="${appUrl}/businesses/${businessId}"
          style="display:inline-block;background:#1D9E75;color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;text-decoration:none">
          View your listing →
        </a>
      </div>
      ${FOOTER}
    </div>
  `
}

export function contactFormTemplate({
  name,
  email,
  subject,
  message,
}: {
  name:    string
  email:   string
  subject: string
  message: string
}) {
  return `
    <div style="${BASE_STYLES}">
      ${HEADER('New contact form submission')}
      <div style="background:#ffffff;padding:28px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;width:80px">Name</td>
            <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111827"><strong>${name}</strong></td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280">Email</td>
            <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px">
              <a href="mailto:${email}" style="color:#1D9E75">${email}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#6b7280">Subject</td>
            <td style="padding:8px 0;font-size:14px;color:#111827">${subject}</td>
          </tr>
        </table>
        <div style="background:#f9fafb;border-radius:8px;padding:16px;font-size:14px;color:#374151;line-height:1.7;white-space:pre-wrap">${message}</div>
        <div style="margin-top:20px">
          <a href="mailto:${email}?subject=Re: ${subject}"
            style="display:inline-block;background:#1D9E75;color:#ffffff;font-size:13px;font-weight:600;padding:10px 20px;border-radius:8px;text-decoration:none">
            Reply to ${name} →
          </a>
        </div>
      </div>
      ${FOOTER}
    </div>
  `
}

export function broadcastEmailTemplate({
  name,
  subject,
  body,
}: {
  name:    string
  subject: string
  body:    string
}) {
  const paragraphs = body
    .split('\n\n')
    .filter(Boolean)
    .map(p => `<p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.7">${p.replace(/\n/g, '<br>')}</p>`)
    .join('')

  return `
    <div style="${BASE_STYLES}">
      ${HEADER(subject)}
      <div style="background:#ffffff;padding:28px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        <p style="margin:0 0 20px;font-size:15px;color:#111827">Hi <strong>${name}</strong>,</p>
        ${paragraphs}
      </div>
      ${FOOTER}
    </div>
  `
}

export function adminToUserTemplate({
  toName,
  fromAdminName,
  subject,
  body,
}: {
  toName:        string
  fromAdminName: string
  subject:       string
  body:          string
}) {
  const paragraphs = body
    .split('\n\n')
    .filter(Boolean)
    .map(p => `<p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.7">${p.replace(/\n/g, '<br>')}</p>`)
    .join('')

  return `
    <div style="${BASE_STYLES}">
      ${HEADER(subject, `Message from the Markeetee team`)}
      <div style="background:#ffffff;padding:28px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        <p style="margin:0 0 20px;font-size:15px;color:#111827">Hi <strong>${toName}</strong>,</p>
        ${paragraphs}
        <div style="margin-top:24px;padding-top:20px;border-top:1px solid #f3f4f6">
          <p style="margin:0;font-size:13px;color:#6b7280">
            This message was sent by <strong>${fromAdminName}</strong> from the Markeetee team.
          </p>
        </div>
      </div>
      ${FOOTER}
    </div>
  `
}