import * as React from 'react'

interface Props {
  ownerName:    string
  businessName: string
  reviewerName: string
  rating:       number
  title:        string | null
  body:         string
  businessUrl:  string
}

export function ReviewNotificationEmail({
  ownerName, businessName, reviewerName,
  rating, title, body, businessUrl,
}: Props) {
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating)

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#f9fafb' }}>
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ background: '#f9fafb', padding: '32px 16px' }}>
          <tr>
            <td align="center">
              <table width="100%" cellPadding="0" cellSpacing="0" style={{ maxWidth: '520px', background: '#ffffff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>

                {/* Header */}
                <tr>
                  <td style={{ background: '#085041', padding: '28px 32px' }}>
                    <p style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#ffffff' }}>Markeetee</p>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#9FE1CB' }}>African business directory</p>
                  </td>
                </tr>

                {/* Body */}
                <tr>
                  <td style={{ padding: '28px 32px' }}>
                    <p style={{ margin: '0 0 6px', fontSize: '15px', color: '#111827' }}>
                      Hi <strong>{ownerName}</strong>,
                    </p>
                    <p style={{ margin: '0 0 20px', fontSize: '15px', color: '#374151', lineHeight: '1.6' }}>
                      <strong>{reviewerName}</strong> just left a review on{' '}
                      <strong>{businessName}</strong>.
                    </p>

                    {/* Review card */}
                    <table width="100%" cellPadding="0" cellSpacing="0"
                      style={{ background: '#f0faf6', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                      <tr>
                        <td>
                          <p style={{ margin: '0 0 6px', fontSize: '22px', letterSpacing: '2px', color: '#F59E0B' }}>{stars}</p>
                          {title && (
                            <p style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 600, color: '#111827' }}>{title}</p>
                          )}
                          <p style={{ margin: 0, fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
                            &ldquo;{body}&rdquo;
                          </p>
                          <p style={{ margin: '12px 0 0', fontSize: '12px', color: '#6B7280' }}>
                            — {reviewerName}
                          </p>
                        </td>
                      </tr>
                    </table>

                    {/* CTA */}
                    <table width="100%" cellPadding="0" cellSpacing="0">
                      <tr>
                        <td align="center">
                          <a href={businessUrl}
                            style={{ display: 'inline-block', background: '#1D9E75', color: '#ffffff', fontSize: '14px', fontWeight: 600, padding: '12px 28px', borderRadius: '10px', textDecoration: 'none' }}>
                            View your listing →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style={{ margin: '24px 0 0', fontSize: '13px', color: '#9CA3AF', textAlign: 'center' }}>
                      You received this because you own a business on Markeetee.
                    </p>
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td style={{ background: '#f3f4f6', padding: '16px 32px', borderTop: '1px solid #e5e7eb' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#9CA3AF', textAlign: 'center' }}>
                      © 2025 Markeetee · Made for the African diaspora
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  )
}