import * as React from 'react'

interface Props {
  ownerName: string
  businessName: string
  reviewerName: string
  rating: number
  title?: string | null
  body: string
  businessUrl: string
}

const BRAND_DARK = '#053528'
const BRAND_GREEN = '#1D9E75'
const BRAND_MINT = '#9FE1CB'
const TEXT_DARK = '#111827'
const TEXT_BODY = '#374151'
const TEXT_MUTED = '#6B7280'
const BORDER = '#E5E7EB'

export function ReviewNotificationEmail({
  ownerName,
  businessName,
  reviewerName,
  rating,
  title,
  body,
  businessUrl,
}: Props) {
  const safeRating = Math.max(1, Math.min(5, Math.round(rating)))
  const stars = `${'★'.repeat(safeRating)}${'☆'.repeat(5 - safeRating)}`

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="x-apple-disable-message-reformatting" />
        <title>New review for {businessName}</title>
      </head>

      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: '#F3F4F6',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
          color: TEXT_DARK,
        }}
      >
        <div
          style={{
            display: 'none',
            maxHeight: 0,
            overflow: 'hidden',
            opacity: 0,
            color: 'transparent',
          }}
        >
          {reviewerName} left a {safeRating}-star review for {businessName}.
        </div>

        <table
          role="presentation"
          width="100%"
          cellPadding="0"
          cellSpacing="0"
          style={{
            width: '100%',
            backgroundColor: '#F3F4F6',
            padding: '32px 16px',
          }}
        >
          <tbody>
            <tr>
              <td align="center">
                <table
                  role="presentation"
                  width="100%"
                  cellPadding="0"
                  cellSpacing="0"
                  style={{
                    width: '100%',
                    maxWidth: '600px',
                    backgroundColor: '#FFFFFF',
                    border: `1px solid ${BORDER}`,
                    borderRadius: '20px',
                    overflow: 'hidden',
                  }}
                >
                  <tbody>
                    <tr>
                      <td
                        style={{
                          backgroundColor: BRAND_DARK,
                          padding: '32px',
                        }}
                      >
                        <table
                          role="presentation"
                          width="100%"
                          cellPadding="0"
                          cellSpacing="0"
                        >
                          <tbody>
                            <tr>
                              <td>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: '22px',
                                    lineHeight: '1.2',
                                    fontWeight: 800,
                                    color: '#FFFFFF',
                                  }}
                                >
                                  Markeetee
                                </p>

                                <p
                                  style={{
                                    margin: '5px 0 0',
                                    fontSize: '13px',
                                    lineHeight: '1.5',
                                    color: BRAND_MINT,
                                  }}
                                >
                                  Africa is here. Find it.
                                </p>
                              </td>

                              <td align="right">
                                <span
                                  style={{
                                    display: 'inline-block',
                                    backgroundColor: 'rgba(159,225,203,0.18)',
                                    color: BRAND_MINT,
                                    padding: '6px 12px',
                                    borderRadius: '999px',
                                    fontSize: '11px',
                                    lineHeight: '1',
                                    fontWeight: 700,
                                    letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  New Review
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <h1
                          style={{
                            margin: '26px 0 6px',
                            fontSize: '28px',
                            lineHeight: '1.3',
                            fontWeight: 800,
                            color: '#FFFFFF',
                          }}
                        >
                          You received a new review
                        </h1>

                        <p
                          style={{
                            margin: 0,
                            fontSize: '14px',
                            lineHeight: '1.6',
                            color: BRAND_MINT,
                          }}
                        >
                          A customer shared feedback about {businessName}.
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td
                        style={{
                          padding: '36px 32px',
                          backgroundColor: '#FFFFFF',
                        }}
                      >
                        <p
                          style={{
                            margin: '0 0 18px',
                            fontSize: '16px',
                            lineHeight: '1.7',
                            color: TEXT_DARK,
                          }}
                        >
                          Hi <strong>{ownerName}</strong>,
                        </p>

                        <p
                          style={{
                            margin: '0 0 24px',
                            fontSize: '15px',
                            lineHeight: '1.8',
                            color: TEXT_BODY,
                          }}
                        >
                          <strong>{reviewerName}</strong> just left a review for{' '}
                          <strong>{businessName}</strong>.
                        </p>

                        <table
                          role="presentation"
                          width="100%"
                          cellPadding="0"
                          cellSpacing="0"
                          style={{
                            width: '100%',
                            backgroundColor: '#FFFBEB',
                            border: '1px solid #FDE68A',
                            borderRadius: '16px',
                          }}
                        >
                          <tbody>
                            <tr>
                              <td style={{ padding: '22px' }}>
                                <p
                                  aria-label={`${safeRating} out of 5 stars`}
                                  style={{
                                    margin: '0 0 10px',
                                    fontSize: '20px',
                                    lineHeight: '1',
                                    letterSpacing: '2px',
                                    color: '#F59E0B',
                                  }}
                                >
                                  {stars}
                                </p>

                                <p
                                  style={{
                                    margin: '0 0 12px',
                                    fontSize: '13px',
                                    lineHeight: '1.5',
                                    fontWeight: 700,
                                    color: TEXT_MUTED,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                  }}
                                >
                                  {safeRating} out of 5
                                </p>

                                {title ? (
                                  <h2
                                    style={{
                                      margin: '0 0 10px',
                                      fontSize: '17px',
                                      lineHeight: '1.5',
                                      fontWeight: 700,
                                      color: TEXT_DARK,
                                    }}
                                  >
                                    {title}
                                  </h2>
                                ) : null}

                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: '15px',
                                    lineHeight: '1.8',
                                    color: TEXT_BODY,
                                    fontStyle: 'italic',
                                  }}
                                >
                                  “{body}”
                                </p>

                                <p
                                  style={{
                                    margin: '16px 0 0',
                                    fontSize: '13px',
                                    lineHeight: '1.6',
                                    color: TEXT_MUTED,
                                  }}
                                >
                                  — {reviewerName}
                                </p>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <table
                          role="presentation"
                          cellPadding="0"
                          cellSpacing="0"
                          align="center"
                          style={{ margin: '28px auto 0' }}
                        >
                          <tbody>
                            <tr>
                              <td
                                align="center"
                                style={{
                                  backgroundColor: BRAND_GREEN,
                                  borderRadius: '12px',
                                }}
                              >
                                <a
                                  href={businessUrl}
                                  style={{
                                    display: 'inline-block',
                                    padding: '14px 30px',
                                    borderRadius: '12px',
                                    fontSize: '15px',
                                    lineHeight: '1.2',
                                    fontWeight: 700,
                                    color: '#FFFFFF',
                                    textDecoration: 'none',
                                  }}
                                >
                                  View your listing
                                </a>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <p
                          style={{
                            margin: '26px 0 0',
                            fontSize: '13px',
                            lineHeight: '1.7',
                            color: '#9CA3AF',
                            textAlign: 'center',
                          }}
                        >
                          Log in to your dashboard to review customer feedback
                          and keep your business information up to date.
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td
                        style={{
                          backgroundColor: '#FAFAF9',
                          borderTop: `1px solid ${BORDER}`,
                          padding: '28px 32px',
                          textAlign: 'center',
                        }}
                      >
                        <p
                          style={{
                            margin: '0 0 5px',
                            fontSize: '14px',
                            lineHeight: '1.5',
                            fontWeight: 700,
                            color: BRAND_DARK,
                          }}
                        >
                          Markeetee
                        </p>

                        <p
                          style={{
                            margin: '0 0 16px',
                            fontSize: '12px',
                            lineHeight: '1.7',
                            color: TEXT_MUTED,
                          }}
                        >
                          Connecting African-owned businesses with the
                          communities that support them.
                        </p>

                        <p
                          style={{
                            margin: '0 0 10px',
                            fontSize: '12px',
                            lineHeight: '1.7',
                          }}
                        >
                          <a
                            href="https://markeetee.com"
                            style={{
                              color: BRAND_GREEN,
                              textDecoration: 'none',
                            }}
                          >
                            Website
                          </a>
                          <span style={{ color: '#D1D5DB' }}>
                            {' '}
                            ·{' '}
                          </span>
                          <a
                            href="https://markeetee.com/privacy"
                            style={{
                              color: BRAND_GREEN,
                              textDecoration: 'none',
                            }}
                          >
                            Privacy
                          </a>
                          <span style={{ color: '#D1D5DB' }}>
                            {' '}
                            ·{' '}
                          </span>
                          <a
                            href="https://markeetee.com/contact"
                            style={{
                              color: BRAND_GREEN,
                              textDecoration: 'none',
                            }}
                          >
                            Contact
                          </a>
                        </p>

                        <p
                          style={{
                            margin: 0,
                            fontSize: '11px',
                            lineHeight: '1.6',
                            color: '#B0B7C3',
                          }}
                        >
                          © 2026 Markeetee. Made for the African diaspora.
                        </p>

                        <p
                          style={{
                            margin: '8px 0 0',
                            fontSize: '11px',
                            lineHeight: '1.6',
                            color: '#B0B7C3',
                          }}
                        >
                          You received this email because you manage{' '}
                          {businessName} on Markeetee.
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  )
}