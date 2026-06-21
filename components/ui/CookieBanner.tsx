'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface CookiePrefs {
  analytics: boolean
  marketing: boolean
}

const STORAGE_KEY = 'markeetee-cookie-consent'

export default function CookieBanner() {
  const [visible,  setVisible]  = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [prefs,    setPrefs]    = useState<CookiePrefs>({
    analytics: false,
    marketing: false,
  })

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) {
        // No consent recorded yet — show the banner after a short delay
        setTimeout(() => setVisible(true), 1200)
      }
    } catch {}
  }, [])

  function saveAndClose(chosen: CookiePrefs) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...chosen,
        essential: true,
        timestamp: Date.now(),
      }))
    } catch {}
    setVisible(false)
  }

  function acceptAll() {
    const all = { analytics: true, marketing: true }
    setPrefs(all)
    saveAndClose(all)
  }

  function essentialOnly() {
    const minimal = { analytics: false, marketing: false }
    setPrefs(minimal)
    saveAndClose(minimal)
  }

  function savePreferences() {
    saveAndClose(prefs)
  }

  function toggle(key: keyof CookiePrefs) {
    setPrefs(p => ({ ...p, [key]: !p[key] }))
  }

  if (!visible) return null

  return (
    <>
      {/* Backdrop — subtle on mobile */}
      <div
        className="fixed inset-0 z-40 md:hidden"
        style={{ background: 'rgba(0,0,0,0.3)' }}
        onClick={essentialOnly}
        aria-hidden
      />

      {/* Banner */}
      <div
        role="dialog"
        aria-label="Cookie consent"
        aria-modal="true"
        className="fixed bottom-0 left-0 right-0 z-50 md:bottom-6 md:left-6 md:right-auto md:max-w-sm"
        style={{
          background:   'white',
          borderTop:    '0.5px solid #e5e7eb',
          boxShadow:    '0 -2px 24px rgba(0,0,0,0.08)',
          borderRadius: '0',
        }}
      >
        {/* Desktop: rounded card */}
        <style>{`
          @media (min-width: 768px) {
            #cookie-banner {
              border-radius: 16px !important;
              border: 0.5px solid #e5e7eb !important;
              border-top: 0.5px solid #e5e7eb !important;
              box-shadow: 0 4px 32px rgba(0,0,0,0.12) !important;
            }
          }
        `}</style>

        <div id="cookie-banner" style={{ borderRadius: 0 }}>
          <div style={{ padding: '20px 20px 0' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: '#085041', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9FE1CB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><circle cx="9" cy="9" r="1" fill="#9FE1CB"/><circle cx="15" cy="9" r="1" fill="#9FE1CB"/><circle cx="9" cy="15" r="1" fill="#9FE1CB"/><circle cx="15" cy="15" r="1" fill="#9FE1CB"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: '14px', color: '#111827', margin: '0 0 3px' }}>
                  We use cookies
                </p>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
                  Markeetee uses cookies to improve your experience and help the African diaspora community find local businesses.
                </p>
              </div>
            </div>

            {/* Manage preferences toggle */}
            <button
              onClick={() => setExpanded(e => !e)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '12px', fontWeight: 500, color: '#1D9E75',
                background: 'none', border: 'none', padding: '0 0 12px',
                cursor: 'pointer',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
              {expanded ? 'Hide preferences' : 'Manage preferences'}
            </button>

            {/* Expandable preferences */}
            {expanded && (
              <div style={{
                border: '0.5px solid #e5e7eb', borderRadius: '10px',
                overflow: 'hidden', marginBottom: '16px',
              }}>

                {/* Essential — always on */}
                <CookieRow
                  label="Essential"
                  desc="Login sessions, security, and basic site function"
                  enabled
                  locked
                  onToggle={() => {}}
                />

                {/* Analytics */}
                <CookieRow
                  label="Analytics"
                  desc="Understand which businesses and searches are popular"
                  enabled={prefs.analytics}
                  onToggle={() => toggle('analytics')}
                  border
                />

                {/* Marketing */}
                <CookieRow
                  label="Marketing"
                  desc="Personalised business recommendations and promotions"
                  enabled={prefs.marketing}
                  onToggle={() => toggle('marketing')}
                  border
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={acceptAll} style={{
              width: '100%', padding: '11px', borderRadius: '10px',
              background: '#1D9E75', color: 'white', border: 'none',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            }}>
              Accept all
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              {expanded ? (
                <button onClick={savePreferences} style={{
                  flex: 1, padding: '9px', borderRadius: '10px',
                  background: 'white', border: '0.5px solid #d1d5db',
                  fontSize: '13px', fontWeight: 500, color: '#374151', cursor: 'pointer',
                }}>
                  Save preferences
                </button>
              ) : (
                <button onClick={() => setExpanded(true)} style={{
                  flex: 1, padding: '9px', borderRadius: '10px',
                  background: 'white', border: '0.5px solid #d1d5db',
                  fontSize: '13px', fontWeight: 500, color: '#374151', cursor: 'pointer',
                }}>
                  Customise
                </button>
              )}
              <button onClick={essentialOnly} style={{
                flex: 1, padding: '9px', borderRadius: '10px',
                background: 'white', border: '0.5px solid #d1d5db',
                fontSize: '13px', fontWeight: 500, color: '#374151', cursor: 'pointer',
              }}>
                Essential only
              </button>
            </div>

            <p style={{ fontSize: '11px', color: '#9CA3AF', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
              By clicking "Accept all" you agree to our{' '}
              <Link href="/privacy" style={{ color: '#1D9E75', textDecoration: 'none' }}>Privacy policy</Link>
              {' '}and{' '}
              <Link href="/terms" style={{ color: '#1D9E75', textDecoration: 'none' }}>Terms of service</Link>.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

function CookieRow({
  label, desc, enabled, locked = false, onToggle, border = false,
}: {
  label:    string
  desc:     string
  enabled:  boolean
  locked?:  boolean
  onToggle: () => void
  border?:  boolean
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px',
      borderTop: border ? '0.5px solid #e5e7eb' : 'none',
    }}>
      <div style={{ flex: 1, paddingRight: '12px' }}>
        <p style={{ fontSize: '13px', fontWeight: 500, color: '#111827', margin: '0 0 2px' }}>
          {label}
          {locked && (
            <span style={{
              marginLeft: '6px', fontSize: '10px', fontWeight: 600,
              color: '#085041', background: '#E1F5EE',
              padding: '1px 6px', borderRadius: '4px',
            }}>
              Always on
            </span>
          )}
        </p>
        <p style={{ fontSize: '11px', color: '#6B7280', margin: 0, lineHeight: 1.5 }}>{desc}</p>
      </div>

      {/* Toggle switch */}
      <button
        onClick={locked ? undefined : onToggle}
        disabled={locked}
        aria-label={`${enabled ? 'Disable' : 'Enable'} ${label} cookies`}
        aria-pressed={enabled}
        style={{
          width: '38px', height: '21px', borderRadius: '12px',
          background: enabled ? '#1D9E75' : '#D1D5DB',
          border: 'none', padding: '2px',
          cursor: locked ? 'not-allowed' : 'pointer',
          flexShrink: 0, position: 'relative',
          transition: 'background 0.2s',
        }}
      >
        <div style={{
          width: '17px', height: '17px', borderRadius: '50%',
          background: 'white',
          position: 'absolute', top: '2px',
          left: enabled ? '19px' : '2px',
          transition: 'left 0.2s',
        }} />
      </button>
    </div>
  )
}