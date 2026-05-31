import * as React from 'react'

interface Props {
  ownerName:    string
  businessName: string
  weekReviews:  number
  totalReviews: number
  avgRating:    number
  topReview:    { reviewerName: string; rating: number; body: string } | null
  dashboardUrl: string
}

export function WeeklySummaryEmail({
  ownerName, businessName, weekReviews,
  totalReviews, avgRating, topReview, dashboardUrl,
}: Props) {
  const stars = (n: number) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n))

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
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#9FE1CB' }}>Your weekly summary</p>
                  </td>
                </tr>

                {/* Greeting */}
                <tr>
                  <td style={{ padding: '28px 32px 0' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '15px', color: '#111827' }}>
                      Hi <strong>{ownerName}</strong>,
                    </p>
                    <p style={{ margin: '0 0 24px', fontSize: '15px', color: '#374151', lineHeight: '1.6' }}>
                      Here&apos;s how <strong>{businessName}</strong> performed this week.
                    </p>
                  </td>
                </tr>

                {/* Stats row */}
                <tr>
                  <td style={{ padding: '0 32px 24px' }}>
                    <table width="100%" cellPadding="0" cellSpacing="0">
                      <tr>
                        {[
                          { label: 'Reviews this week', value: String(weekReviews) },
                          { label: 'Total reviews',     value: String(totalReviews) },
                          { label: 'Average rating',    value: avgRating > 0 ? avgRating.toFixed(1) + ' ★' : '—' },
                        ].map((s, i) => (
                          <td key={i} width="33%" style={{ textAlign: 'center', padding: '16px 8px', background: '#f0faf6', borderRadius: '10px', marginRight: i < 2 ? '8px' : '0' }}>
                            <p style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 700, color: '#085041' }}>{s.value}</p>
                            <p style={{ margin: 0, fontSize: '11px', color: '#6B7280' }}>{s.label}</p>
                          </td>
                        ))}
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Top review */}
                {topReview && (
                  <tr>
                    <td style={{ padding: '0 32px 24px' }}>
                      <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Top review this week
                      </p>
                      <table width="100%" cellPadding="0" cellSpacing="0"
                        style={{ background: '#f9fafb', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
                        <tr>
                          <td>
                            <p style={{ margin: '0 0 6px', fontSize: '18px', color: '#F59E0B' }}>
                              {stars(topReview.rating)}
                            </p>
                            <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
                              &ldquo;{topReview.body.slice(0, 200)}{topReview.body.length > 200 ? '…' : ''}&rdquo;
                            </p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#9CA3AF' }}>
                              — {topReview.reviewerName}
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                )}

                {/* No reviews this week */}
                {weekReviews === 0 && (
                  <tr>
                    <td style={{ padding: '0 32px 24px' }}>
                      <table width="100%" cellPadding="0" cellSpacing="0"
                        style={{ background: '#fffbeb', borderRadius: '12px', padding: '16px', border: '1px solid #fde68a' }}>
                        <tr>
                          <td>
                            <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: '#92400e' }}>
                              No reviews this week
                            </p>
                            <p style={{ margin: 0, fontSize: '13px', color: '#b45309', lineHeight: '1.5' }}>
                              Share your listing link with customers to start collecting more reviews.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                )}

                {/* CTA */}
                <tr>
                  <td style={{ padding: '0 32px 28px' }}>
                    <table width="100%" cellPadding="0" cellSpacing="0">
                      <tr>
                        <td align="center">
                          <a href={dashboardUrl}
                            style={{ display: 'inline-block', background: '#1D9E75', color: '#ffffff', fontSize: '14px', fontWeight: 600, padding: '12px 28px', borderRadius: '10px', textDecoration: 'none' }}>
                            View your dashboard →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td style={{ background: '#f3f4f6', padding: '16px 32px', borderTop: '1px solid #e5e7eb' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#9CA3AF', textAlign: 'center' }}>
                      © 2025 Markeetee · You&apos;re receiving this as a business owner on Markeetee.
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