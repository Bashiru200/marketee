import * as React from 'react'

interface Props {
  ownerName: string
  businessName: string
  weekReviews: number
  totalReviews: number
  avgRating: number
  topReview: {
    reviewerName: string
    rating: number
    body: string
  } | null
  dashboardUrl: string
}

const BRAND_DARK = '#053528'
const BRAND_GREEN = '#1D9E75'
const BRAND_MINT = '#9FE1CB'
const TEXT_DARK = '#111827'
const TEXT_BODY = '#374151'
const TEXT_MUTED = '#6B7280'
const BORDER = '#E5E7EB'

function clampRating(rating: number) {
  return Math.max(0, Math.min(5, Math.round(rating)))
}

function ratingStars(rating: number) {
  const safeRating = clampRating(rating)
  return `${'★'.repeat(safeRating)}${'☆'.repeat(5 - safeRating)}`
}

function StatCard({
  value,
  label,
}: {
  value: string
  label: string
}) {
  return (
    <table
      role="presentation"
      width="100%"
      cellPadding="0"
      cellSpacing="0"
      style={{
        width: '100%',
        backgroundColor: '#F0FAF6',
        border: `1px solid ${BRAND_MINT}`,
        borderRadius: '14px',
      }}
    >
      <tbody>
        <tr>
          <td
            align="center"
            style={{
              padding: '18px 12px',
            }}
          >
            <p
              style={{
                margin: '0 0 5px',
                fontSize: '24px',
                lineHeight: '1.2',
                fontWeight: 800,
                color: BRAND_DARK,
              }}
            >
              {value}
            </p>

            <p
              style={{
                margin: 0,
                fontSize: '11px',
                lineHeight: '1.5',
                color: TEXT_MUTED,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {label}
            </p>
          </td>
        </tr>
      </tbody>
    </table>
  )
}

export function WeeklySummaryEmail({
  ownerName,
  businessName,
  weekReviews,
  totalReviews,
  avgRating,
  topReview,
  dashboardUrl,
}: Props) {
  const safeWeekReviews = Math.max(0, weekReviews)
  const safeTotalReviews = Math.max(0, totalReviews)
  const safeAverageRating = Math.max(0, Math.min(5, avgRating))

  const topReviewRating = topReview
    ? clampRating(topReview.rating)
    : 0

  const topReviewBody = topReview?.body.trim() ?? ''
  const truncatedReview =
    topReviewBody.length > 220
      ? `${topReviewBody.slice(0, 220).trim()}…`
      : topReviewBody

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <meta
          name="x-apple-disable-message-reformatting"
        />

        <title>
          Weekly summary for {businessName}
        </title>
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
          {businessName} received {safeWeekReviews}{' '}
          {safeWeekReviews === 1 ? 'review' : 'reviews'} this week.
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
                    maxWidth: '620px',
                    backgroundColor: '#FFFFFF',
                    border: `1px solid ${BORDER}`,
                    borderRadius: '20px',
                    overflow: 'hidden',
                  }}
                >
                  <tbody>
                    {/* Header */}
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
                                    backgroundColor:
                                      'rgba(159,225,203,0.18)',
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
                                  Weekly Summary
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
                          Your week on Markeetee
                        </h1>

                        <p
                          style={{
                            margin: 0,
                            fontSize: '14px',
                            lineHeight: '1.6',
                            color: BRAND_MINT,
                          }}
                        >
                          A quick performance update for {businessName}.
                        </p>
                      </td>
                    </tr>

                    {/* Main body */}
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
                            margin: '0 0 26px',
                            fontSize: '15px',
                            lineHeight: '1.8',
                            color: TEXT_BODY,
                          }}
                        >
                          Here is how{' '}
                          <strong>{businessName}</strong> performed
                          this week.
                        </p>

                        {/* Stats */}
                        <table
                          role="presentation"
                          width="100%"
                          cellPadding="0"
                          cellSpacing="0"
                          style={{
                            width: '100%',
                            marginBottom: '28px',
                          }}
                        >
                          <tbody>
                            <tr>
                              <td
                                width="33.33%"
                                valign="top"
                                style={{ paddingRight: '5px' }}
                              >
                                <StatCard
                                  value={String(safeWeekReviews)}
                                  label="Reviews this week"
                                />
                              </td>

                              <td
                                width="33.33%"
                                valign="top"
                                style={{
                                  paddingLeft: '5px',
                                  paddingRight: '5px',
                                }}
                              >
                                <StatCard
                                  value={String(safeTotalReviews)}
                                  label="Total reviews"
                                />
                              </td>

                              <td
                                width="33.33%"
                                valign="top"
                                style={{ paddingLeft: '5px' }}
                              >
                                <StatCard
                                  value={
                                    safeAverageRating > 0
                                      ? `${safeAverageRating.toFixed(1)} ★`
                                      : '—'
                                  }
                                  label="Average rating"
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Top review */}
                        {topReview && truncatedReview ? (
                          <>
                            <p
                              style={{
                                margin: '0 0 12px',
                                fontSize: '12px',
                                lineHeight: '1.5',
                                fontWeight: 700,
                                color: BRAND_GREEN,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                              }}
                            >
                              Featured review this week
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
                                marginBottom: '28px',
                              }}
                            >
                              <tbody>
                                <tr>
                                  <td
                                    style={{
                                      padding: '22px',
                                    }}
                                  >
                                    <p
                                      aria-label={`${topReviewRating} out of 5 stars`}
                                      style={{
                                        margin: '0 0 10px',
                                        fontSize: '19px',
                                        lineHeight: '1',
                                        letterSpacing: '2px',
                                        color: '#F59E0B',
                                      }}
                                    >
                                      {ratingStars(topReview.rating)}
                                    </p>

                                    <p
                                      style={{
                                        margin: '0 0 14px',
                                        fontSize: '15px',
                                        lineHeight: '1.8',
                                        color: TEXT_BODY,
                                        fontStyle: 'italic',
                                      }}
                                    >
                                      “{truncatedReview}”
                                    </p>

                                    <p
                                      style={{
                                        margin: 0,
                                        fontSize: '13px',
                                        lineHeight: '1.6',
                                        color: TEXT_MUTED,
                                      }}
                                    >
                                      — {topReview.reviewerName}
                                    </p>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </>
                        ) : null}

                        {/* No reviews state */}
                        {safeWeekReviews === 0 ? (
                          <table
                            role="presentation"
                            width="100%"
                            cellPadding="0"
                            cellSpacing="0"
                            style={{
                              width: '100%',
                              backgroundColor: '#FFF7ED',
                              border: '1px solid #FED7AA',
                              borderRadius: '16px',
                              marginBottom: '28px',
                            }}
                          >
                            <tbody>
                              <tr>
                                <td
                                  style={{
                                    padding: '20px',
                                  }}
                                >
                                  <p
                                    style={{
                                      margin: '0 0 6px',
                                      fontSize: '15px',
                                      lineHeight: '1.5',
                                      fontWeight: 700,
                                      color: '#9A3412',
                                    }}
                                  >
                                    No new reviews this week
                                  </p>

                                  <p
                                    style={{
                                      margin: 0,
                                      fontSize: '14px',
                                      lineHeight: '1.7',
                                      color: '#B45309',
                                    }}
                                  >
                                    Share your Markeetee listing with
                                    recent customers and invite them to
                                    leave honest feedback.
                                  </p>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        ) : (
                          <table
                            role="presentation"
                            width="100%"
                            cellPadding="0"
                            cellSpacing="0"
                            style={{
                              width: '100%',
                              backgroundColor: '#F0FAF6',
                              border: `1px solid ${BRAND_MINT}`,
                              borderRadius: '16px',
                              marginBottom: '28px',
                            }}
                          >
                            <tbody>
                              <tr>
                                <td
                                  style={{
                                    padding: '20px',
                                  }}
                                >
                                  <p
                                    style={{
                                      margin: '0 0 6px',
                                      fontSize: '15px',
                                      lineHeight: '1.5',
                                      fontWeight: 700,
                                      color: BRAND_DARK,
                                    }}
                                  >
                                    Keep the momentum going
                                  </p>

                                  <p
                                    style={{
                                      margin: 0,
                                      fontSize: '14px',
                                      lineHeight: '1.7',
                                      color: TEXT_BODY,
                                    }}
                                  >
                                    Respond to customer feedback, keep
                                    your hours current, and add fresh
                                    photos or products to strengthen
                                    your listing.
                                  </p>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        )}

                        {/* CTA */}
                        <table
                          role="presentation"
                          cellPadding="0"
                          cellSpacing="0"
                          align="center"
                          style={{ margin: '0 auto' }}
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
                                  href={dashboardUrl}
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
                                  View your dashboard
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
                          Your dashboard includes reviews, listing
                          details, products, performance tools, and
                          customer activity.
                        </p>
                      </td>
                    </tr>

                    {/* Footer */}
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
                          Helping African-owned businesses become
                          easier to find, support, and grow.
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
                          © 2026 Markeetee. All rights reserved.
                        </p>

                        <p
                          style={{
                            margin: '8px 0 0',
                            fontSize: '11px',
                            lineHeight: '1.6',
                            color: '#B0B7C3',
                          }}
                        >
                          You received this weekly summary because you
                          manage {businessName} on Markeetee.
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