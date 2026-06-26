/**
 * lib/emailTemplates.ts
 * All Markeetee transactional email templates.
 * Uses the confirmed HTML structure: dark green header + white body + light footer.
 * Variables use {{double_braces}} style for easy Resend/template substitution.
 */

// ── Shared footer HTML (reused in every template) ─────────────────────────
const FOOTER = (unsubscribeUrl?: string) => `
  <tr><td style="background:#f9fafb;padding:28px 32px;text-align:center;border:1px solid #eeeeee;border-top:none;border-radius:0 0 16px 16px;">
    <img src="https://markeetee.com/Cartography_of_Africa.png" width="55" height="55" alt="Africa" style="display:block;margin:0 auto 14px;"/>
    <p style="margin:0;font-size:14px;font-weight:600;color:#374151;">Africa is here. Find it.</p>
    <p style="margin:6px 0 20px;font-size:13px;color:#6B7280;">The African business directory for the US diaspora.</p>
    <table align="center" cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
      <tr>
        <td style="padding:0 5px;"><a href="https://instagram.com/markeetee" style="display:inline-block;width:38px;height:38px;background:#f0faf6;border-radius:10px;text-align:center;"><img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" width="20" height="20" alt="Instagram" style="margin-top:9px;display:inline-block;"/></a></td>
        <td style="padding:0 5px;"><a href="https://tiktok.com/@markeetee" style="display:inline-block;width:38px;height:38px;background:#f0faf6;border-radius:10px;text-align:center;"><img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" width="20" height="20" alt="TikTok" style="margin-top:9px;display:inline-block;"/></a></td>
        <td style="padding:0 5px;"><a href="https://twitter.com/markeetee" style="display:inline-block;width:38px;height:38px;background:#f0faf6;border-radius:10px;text-align:center;font-size:17px;line-height:38px;text-decoration:none;color:#374151;font-weight:700;">𝕏</a></td>
        <td style="padding:0 5px;"><a href="https://facebook.com/markeetee" style="display:inline-block;width:38px;height:38px;background:#f0faf6;border-radius:10px;text-align:center;"><img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" width="20" height="20" alt="Facebook" style="margin-top:9px;display:inline-block;"/></a></td>
        <td style="padding:0 5px;"><a href="https://wa.me/markeetee" style="display:inline-block;width:38px;height:38px;background:#f0faf6;border-radius:10px;text-align:center;"><img src="https://cdn-icons-png.flaticon.com/512/733/733585.png" width="20" height="20" alt="WhatsApp" style="margin-top:9px;display:inline-block;"/></a></td>
      </tr>
    </table>
    <p style="font-size:11px;color:#9CA3AF;margin:0 0 6px;">© 2026 Markeetee · Made for the African diaspora</p>
    <p style="font-size:11px;color:#9CA3AF;margin:0;">
      ${unsubscribeUrl ? `<a href="${unsubscribeUrl}" style="color:#9CA3AF;text-decoration:underline;">Unsubscribe</a> &nbsp;·&nbsp;` : ''}
      <a href="https://markeetee.com/privacy" style="color:#9CA3AF;text-decoration:none;">Privacy</a> &nbsp;·&nbsp;
      <a href="https://markeetee.com/contact" style="color:#9CA3AF;text-decoration:none;">Contact</a>
    </p>
  </td></tr>
`

// ── Shared logo header row ────────────────────────────────────────────────
const LOGO_ROW = `
  <table cellpadding="0" cellspacing="0"><tr>
    <td><img src="https://markeetee.com/logo1.png" width="42" height="42" alt="Markeetee" style="display:block;border-radius:10px;"/></td>
    <td style="padding-left:12px;color:#ffffff;font-size:24px;font-weight:700;">Markeetee</td>
  </tr></table>
`

// ── Wrapper function ──────────────────────────────────────────────────────
function wrap(headerTitle: string, headerSubtitle: string, body: string, unsubscribeUrl?: string): string {
  return `
    <div style="background:#f3f4f6;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:auto;background:#ffffff;border-radius:16px;overflow:hidden;">

      <tr><td style="background:#085041;padding:32px;">
        ${LOGO_ROW}
        <p style="margin:28px 0 6px;font-size:22px;font-weight:700;color:#ffffff;">${headerTitle}</p>
        <p style="margin:0;font-size:13px;color:#9FE1CB;">${headerSubtitle}</p>
      </td></tr>

      <tr><td style="padding:32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
        ${body}
      </td></tr>

      ${FOOTER(unsubscribeUrl)}

    </table>
    </div>
  `
}

// ══════════════════════════════════════════════════════════════════════════
// 1. EMAIL CONFIRMATION
// ══════════════════════════════════════════════════════════════════════════
export function emailConfirmationTemplate({
  name,
  confirmUrl,
  unsubscribeUrl,
}: {
  name:            string
  confirmUrl:      string
  unsubscribeUrl?: string
}) {
  return wrap(
    'Confirm your email',
    'One last step to activate your account',
    `
      <p style="font-size:15px;color:#111827;margin:0 0 16px;">Hi <strong>${name}</strong>,</p>
      <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 24px;">Welcome to Markeetee! Click the button below to confirm your email address and activate your account.</p>
      <div style="text-align:center;margin:30px 0;">
        <a href="${confirmUrl}" style="display:inline-block;background:#1D9E75;color:#ffffff;font-size:15px;font-weight:600;padding:14px 36px;border-radius:12px;text-decoration:none;">Confirm email address</a>
      </div>
      <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0;">This link expires in 24 hours. If you did not create an account, you can safely ignore this email.</p>
    `,
    unsubscribeUrl,
  )
}

// ══════════════════════════════════════════════════════════════════════════
// 2. RESET PASSWORD
// ══════════════════════════════════════════════════════════════════════════
export function resetPasswordTemplate({
  name,
  resetUrl,
}: {
  name:     string
  resetUrl: string
}) {
  return wrap(
    'Reset your password',
    'We received a request to reset your password',
    `
      <p style="font-size:15px;color:#111827;margin:0 0 16px;">Hi <strong>${name}</strong>,</p>
      <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 24px;">We received a request to reset the password on your Markeetee account. Click the button below to choose a new password.</p>
      <div style="text-align:center;margin:30px 0;">
        <a href="${resetUrl}" style="display:inline-block;background:#1D9E75;color:#ffffff;font-size:15px;font-weight:600;padding:14px 36px;border-radius:12px;text-decoration:none;">Reset password</a>
      </div>
      <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0 0 8px;">This link expires in 1 hour for your security.</p>
      <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0;">If you did not request a password reset, you can safely ignore this email — your password will not be changed.</p>
    `,
  )
}

// ══════════════════════════════════════════════════════════════════════════
// 3. MAGIC LINK / OTP
// ══════════════════════════════════════════════════════════════════════════
export function magicLinkTemplate({
  name,
  magicUrl,
  otpCode,
}: {
  name:      string
  magicUrl?: string
  otpCode?:  string
}) {
  return wrap(
    'Your sign-in link',
    'No password needed',
    `
      <p style="font-size:15px;color:#111827;margin:0 0 16px;">Hi <strong>${name}</strong>,</p>
      <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 24px;">Use the ${magicUrl && otpCode ? 'link or code' : magicUrl ? 'link' : 'code'} below to sign in to your Markeetee account instantly.</p>
      ${magicUrl ? `
        <div style="text-align:center;margin:30px 0;">
          <a href="${magicUrl}" style="display:inline-block;background:#1D9E75;color:#ffffff;font-size:15px;font-weight:600;padding:14px 36px;border-radius:12px;text-decoration:none;">Sign in to Markeetee</a>
        </div>
      ` : ''}
      ${otpCode ? `
        <p style="font-size:12px;color:#9CA3AF;text-align:center;margin:0 0 10px;">— or enter this one-time code —</p>
        <div style="text-align:center;margin:0 0 24px;">
          <span style="display:inline-block;background:#f0faf6;color:#085041;font-size:30px;font-weight:700;letter-spacing:0.2em;padding:14px 28px;border-radius:12px;">${otpCode}</span>
        </div>
      ` : ''}
      <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0;">This ${magicUrl && otpCode ? 'link and code expire' : magicUrl ? 'link expires' : 'code expires'} in 10 minutes. If you did not request this, you can safely ignore this email.</p>
    `,
  )
}

// ══════════════════════════════════════════════════════════════════════════
// 4. CHANGE EMAIL ADDRESS
// ══════════════════════════════════════════════════════════════════════════
export function changeEmailTemplate({
  name,
  oldEmail,
  newEmail,
  confirmUrl,
}: {
  name:       string
  oldEmail:   string
  newEmail:   string
  confirmUrl: string
}) {
  return wrap(
    'Confirm your new email',
    'Verify your new email address to complete the change',
    `
      <p style="font-size:15px;color:#111827;margin:0 0 16px;">Hi <strong>${name}</strong>,</p>
      <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 16px;">We received a request to change the email address on your Markeetee account.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr><td style="background:#f9fafb;border-radius:10px;padding:14px 18px;">
          <p style="margin:0 0 6px;font-size:13px;color:#6B7280;">Current: <strong style="color:#111827;">${oldEmail}</strong></p>
          <p style="margin:0;font-size:13px;color:#6B7280;">New: <strong style="color:#1D9E75;">${newEmail}</strong></p>
        </td></tr>
      </table>
      <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 24px;">Click the button below to confirm this change. Until confirmed, your account will continue to use your current email address.</p>
      <div style="text-align:center;margin:30px 0;">
        <a href="${confirmUrl}" style="display:inline-block;background:#1D9E75;color:#ffffff;font-size:15px;font-weight:600;padding:14px 36px;border-radius:12px;text-decoration:none;">Confirm new email</a>
      </div>
      <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0;">This link expires in 24 hours. If you did not request this change, please contact us immediately — do not click the button above.</p>
    `,
  )
}

// ══════════════════════════════════════════════════════════════════════════
// 5. REVIEW NOTIFICATION (to business owner)
// ══════════════════════════════════════════════════════════════════════════
export function reviewNotificationTemplate({
  ownerName,
  reviewerName,
  businessName,
  rating,
  body,
  businessId,
  appUrl,
  unsubscribeUrl,
}: {
  ownerName:       string
  reviewerName:    string
  businessName:    string
  rating:          number
  body:            string
  businessId:      string
  appUrl:          string
  unsubscribeUrl?: string
}) {
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating)
  return wrap(
    `New ⭐ review on ${businessName}`,
    'Someone just left feedback on your listing',
    `
      <p style="font-size:15px;color:#111827;margin:0 0 16px;">Hi <strong>${ownerName}</strong>,</p>
      <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 20px;"><strong>${reviewerName}</strong> just left a review on <strong>${businessName}</strong>.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr><td style="background:#f0faf6;border-radius:12px;padding:20px;">
          <p style="margin:0 0 10px;font-size:22px;color:#F59E0B;">${stars}</p>
          <p style="margin:0 0 10px;font-size:14px;color:#374151;line-height:1.7;font-style:italic;">&ldquo;${body}&rdquo;</p>
          <p style="margin:0;font-size:12px;color:#6B7280;">— ${reviewerName}</p>
        </td></tr>
      </table>
      <div style="text-align:center;margin:24px 0;">
        <a href="${appUrl}/businesses/${businessId}" style="display:inline-block;background:#1D9E75;color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;text-decoration:none;">View your listing →</a>
      </div>
    `,
    unsubscribeUrl,
  )
}

// ══════════════════════════════════════════════════════════════════════════
// 6. TEAM / ADMIN INVITE
// ══════════════════════════════════════════════════════════════════════════
export function emailInviteTemplate({
  inviteeName,
  inviterName,
  roleLabel,
  businessName,
  inviteUrl,
}: {
  inviteeName:   string
  inviterName:   string
  roleLabel:     string
  businessName?: string
  inviteUrl:     string
}) {
  return wrap(
    "You've been invited",
    `Join ${businessName ?? 'Markeetee'}`,
    `
      <p style="font-size:15px;color:#111827;margin:0 0 16px;">Hi <strong>${inviteeName}</strong>,</p>
      <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 24px;">
        <strong>${inviterName}</strong> has invited you to join Markeetee as a <strong>${roleLabel}</strong>${businessName ? ` for <strong>${businessName}</strong>` : ''}.
        Click below to accept the invitation and set up your account.
      </p>
      <div style="text-align:center;margin:30px 0;">
        <a href="${inviteUrl}" style="display:inline-block;background:#1D9E75;color:#ffffff;font-size:15px;font-weight:600;padding:14px 36px;border-radius:12px;text-decoration:none;">Accept invitation</a>
      </div>
      <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0;">This invitation expires in 7 days. If you weren't expecting this, you can safely ignore this email.</p>
    `,
  )
}

// ══════════════════════════════════════════════════════════════════════════
// 7. BROADCAST / COMMUNITY UPDATE
// ══════════════════════════════════════════════════════════════════════════
export function broadcastEmailTemplate({
  name,
  subject,
  body,
  unsubscribeUrl,
}: {
  name:            string
  subject:         string
  body:            string
  unsubscribeUrl?: string
}) {
  const paragraphs = body
    .split('\n\n')
    .filter(Boolean)
    .map(p => `<p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 16px;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('')

  return wrap(
    subject,
    'A message from the Markeetee team',
    `
      <p style="font-size:15px;color:#111827;margin:0 0 20px;">Hi <strong>${name}</strong>,</p>
      ${paragraphs}
    `,
    unsubscribeUrl,
  )
}

// ══════════════════════════════════════════════════════════════════════════
// 8. ADMIN → USER (1-on-1 message)
// ══════════════════════════════════════════════════════════════════════════
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
    .map(p => `<p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 16px;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('')

  return wrap(
    subject,
    'Message from the Markeetee team',
    `
      <p style="font-size:15px;color:#111827;margin:0 0 20px;">Hi <strong>${toName}</strong>,</p>
      ${paragraphs}
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="border-top:1px solid #f3f4f6;padding-top:16px;">
          <p style="margin:0;font-size:13px;color:#6B7280;">This message was sent by <strong>${fromAdminName}</strong> from the Markeetee team.</p>
        </td></tr>
      </table>
    `,
  )
}

// ══════════════════════════════════════════════════════════════════════════
// 9. CONTACT FORM (to team inbox)
// ══════════════════════════════════════════════════════════════════════════
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
  return wrap(
    'New contact form submission',
    'Someone reached out via the Markeetee contact form',
    `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
        <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;width:70px;">Name</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111827;"><strong>${name}</strong></td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;">Email</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;"><a href="mailto:${email}" style="color:#1D9E75;">${email}</a></td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280;">Subject</td><td style="padding:8px 0;font-size:14px;color:#111827;">${subject}</td></tr>
      </table>
      <div style="background:#f9fafb;border-radius:8px;padding:16px;font-size:14px;color:#374151;line-height:1.7;white-space:pre-wrap;">${message}</div>
      <div style="margin-top:20px;">
        <a href="mailto:${email}?subject=Re: ${subject}" style="display:inline-block;background:#1D9E75;color:#ffffff;font-size:13px;font-weight:600;padding:10px 20px;border-radius:8px;text-decoration:none;">Reply to ${name} →</a>
      </div>
    `,
  )
}