// Add this function to /lib/emailTemplates.ts

/**
 * Rich business message email — with images, link buttons, and markdown formatting.
 * Used by SendEmailModal to send messages from business owners to customers.
 */
export function businessMessageTemplate({
  recipientName,
  businessName,
  messageBody,
  images,
  links,
  businessId,
}: {
  recipientName: string
  businessName:  string
  messageBody:   string
  images:        string[]
  links:         Array<{ label: string; url: string }>
  businessId?:   string
}): string {
  const APP_URL     = process.env.NEXT_PUBLIC_APP_URL || 'https://markeetee.com'
  const BRAND_DARK  = '#053528'
  const BRAND_MID   = '#085041'
  const BRAND_GREEN = '#1D9E75'
  const BRAND_MINT  = '#9FE1CB'
  const BRAND_LIGHT = '#E1F5EE'

  // Convert markdown-lite to HTML — bold, italic, bullets
  const formattedBody = escapeHtml(messageBody)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g,       '<em>$1</em>')
    .split('\n')
    .map(line => {
      const trimmed = line.trim()
      if (trimmed.startsWith('• ')) {
        return `<li style="margin-bottom:6px;">${trimmed.slice(2)}</li>`
      }
      return line ? `<p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#374151;">${line}</p>` : ''
    })
    .join('')
    .replace(/(<li[^>]*>[\s\S]*?<\/li>)+/g, m => `<ul style="padding-left:20px;margin:0 0 16px;color:#374151;">${m}</ul>`)

  // Image grid — up to 5 photos
  const imageGrid = images.length === 0 ? '' : `
    <div style="margin:24px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          ${images.slice(0, 3).map(img => `
            <td width="${100 / Math.min(images.length, 3)}%" style="padding:2px;">
              <img src="${img}" alt="" style="display:block;width:100%;height:auto;border-radius:8px;" />
            </td>
          `).join('')}
        </tr>
        ${images.length > 3 ? `
          <tr>
            ${images.slice(3, 5).map(img => `
              <td width="50%" style="padding:2px;">
                <img src="${img}" alt="" style="display:block;width:100%;height:auto;border-radius:8px;" />
              </td>
            `).join('')}
            ${images.length === 4 ? '<td width="50%"></td>' : ''}
          </tr>
        ` : ''}
      </table>
    </div>`

  // Link buttons — stacked on mobile
  const linkButtons = links.length === 0 ? '' : `
    <div style="margin:28px 0;">
      ${links.map((link, i) => `
        <div style="margin-bottom:${i === links.length - 1 ? '0' : '10px'};">
          <a href="${link.url}"
            style="display:block;background:${i === 0 ? BRAND_GREEN : BRAND_LIGHT};color:${i === 0 ? '#ffffff' : BRAND_DARK};font-size:14px;font-weight:700;padding:14px 24px;border-radius:12px;text-decoration:none;text-align:center;">
            ${escapeHtml(link.label)} →
          </a>
        </div>
      `).join('')}
    </div>`

  const businessLink = businessId ? `${APP_URL}/businesses/${businessId}` : APP_URL

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#F4F7F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7F6;padding:32px 12px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:20px;overflow:hidden;">

  <!-- Header -->
  <tr><td style="background:${BRAND_DARK};padding:28px 32px;">
    <p style="margin:0;font-size:22px;font-weight:800;color:#fff;">Markeetee</p>
    <p style="margin:4px 0 0;font-size:12px;color:${BRAND_MINT};">Africa is here. Find it.</p>
  </td></tr>

  <!-- Sender badge -->
  <tr><td style="padding:28px 32px 0;">
    <div style="display:inline-block;background:${BRAND_LIGHT};padding:6px 14px;border-radius:20px;">
      <p style="margin:0;font-size:11px;font-weight:700;color:${BRAND_DARK};text-transform:uppercase;letter-spacing:0.05em;">
        Message from ${escapeHtml(businessName)}
      </p>
    </div>
  </td></tr>

  <!-- Greeting -->
  <tr><td style="padding:16px 32px 0;">
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#111827;">
      Hi ${escapeHtml(recipientName ?? 'there')} 👋
    </h1>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:16px 32px 8px;">
    ${formattedBody}
    ${imageGrid}
    ${linkButtons}
  </td></tr>

  <!-- Business card footer -->
  <tr><td style="padding:16px 32px 32px;">
    <div style="background:${BRAND_LIGHT};border-radius:16px;padding:20px;text-align:center;">
      <p style="margin:0 0 4px;font-size:13px;color:${BRAND_MID};font-weight:600;">Sent by</p>
      <p style="margin:0 0 12px;font-size:16px;color:${BRAND_DARK};font-weight:800;">${escapeHtml(businessName)}</p>
      <a href="${businessLink}"
        style="display:inline-block;background:${BRAND_GREEN};color:#fff;font-size:13px;font-weight:700;padding:10px 20px;border-radius:10px;text-decoration:none;">
        View business →
      </a>
    </div>
  </td></tr>

  <!-- Small footer -->
  <tr><td style="background:#F9FBFA;padding:20px 32px;border-top:1px solid #E5E7EB;text-align:center;">
    <p style="margin:0 0 6px;font-size:11px;color:#6B7280;">
      This email was sent via Markeetee, the African business directory.
    </p>
    <p style="margin:0;font-size:11px;">
      <a href="${APP_URL}" style="color:${BRAND_GREEN};text-decoration:none;font-weight:600;">markeetee.com</a>
      <span style="padding:0 6px;color:#D1D5DB;">·</span>
      <a href="${APP_URL}/contact" style="color:${BRAND_GREEN};text-decoration:none;font-weight:600;">Report abuse</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`
}

function escapeHtml(s: string | null | undefined): string {
  if (!s) return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}