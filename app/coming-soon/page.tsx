'use client'
import { useState } from 'react'

export default function ComingSoonPage() {
  const [email,     setEmail]     = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return
    }
    setLoading(true)
    setError('')

    try {
      // Save email to Supabase early_access table
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.from('early_access').upsert({ email }, { onConflict: 'email' })
      setSubmitted(true)
    } catch {
      setError('Something went wrong — please try again.')
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { icon: '🍲', title: 'Food & Restaurants',    desc: 'From jollof rice to suya — find authentic African cuisine near you.' },
    { icon: '💇', title: 'Beauty & Hair',          desc: 'Braiding, locs, wigs and skincare from trusted African stylists.' },
    { icon: '👗', title: 'Fashion & Fabric',       desc: 'Ankara, Kente, tailoring and African fashion in your city.' },
    { icon: '🌿', title: 'Herbs & Wellness',       desc: 'Traditional medicine, shea butter and natural wellness products.' },
    { icon: '🛠️', title: 'Services',               desc: 'Accounting, legal, immigration — from people who understand you.' },
    { icon: '🎵', title: 'Music & Events',         desc: 'Afrobeats, DJs, studios and live entertainment near you.' },
  ]

  // African city dots — positioned as abstract scatter on a dark canvas
  const cityDots = [
    { top: '18%', left: '52%', delay: '0s',    size: 4, label: 'Lagos'       },
    { top: '22%', left: '48%', delay: '0.3s',  size: 3, label: 'Accra'       },
    { top: '15%', left: '44%', delay: '0.6s',  size: 3, label: 'Dakar'       },
    { top: '28%', left: '55%', delay: '0.9s',  size: 3, label: 'Yaoundé'     },
    { top: '35%', left: '62%', delay: '1.2s',  size: 4, label: 'Nairobi'     },
    { top: '32%', left: '50%', delay: '1.5s',  size: 3, label: 'Kinshasa'    },
    { top: '42%', left: '54%', delay: '1.8s',  size: 3, label: 'Dar es Salaam'},
    { top: '48%', left: '50%', delay: '2.1s',  size: 4, label: 'Lusaka'      },
    { top: '55%', left: '52%', delay: '2.4s',  size: 5, label: 'Johannesburg'},
    { top: '25%', left: '58%', delay: '2.7s',  size: 3, label: 'Kampala'     },
    { top: '12%', left: '55%', delay: '3.0s',  size: 3, label: 'Addis Ababa' },
    { top: '10%', left: '50%', delay: '3.3s',  size: 3, label: 'Khartoum'    },
    { top: '8%',  left: '46%', delay: '3.6s',  size: 4, label: 'Cairo'       },
    { top: '6%',  left: '40%', delay: '3.9s',  size: 3, label: 'Tunis'       },
    { top: '20%', left: '38%', delay: '4.2s',  size: 3, label: 'Abidjan'     },
    { top: '14%', left: '42%', delay: '4.5s',  size: 3, label: 'Bamako'      },
    { top: '18%', left: '60%', delay: '4.8s',  size: 3, label: 'Kampala'     },
    { top: '44%', left: '46%', delay: '5.1s',  size: 3, label: 'Harare'      },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #053528; }

        .cs-page {
          min-height: 100vh;
          background: #053528;
          color: #F5F0E8;
          font-family: 'Inter', system-ui, sans-serif;
          overflow-x: hidden;
        }

        /* ── Nav ── */
        .cs-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 50;
          padding: 20px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(to bottom, rgba(5,53,40,0.95), transparent);
        }
        .cs-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .cs-logo-mark {
          width: 34px; height: 34px;
          background: #1D9E75;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Playfair Display', serif;
          font-weight: 900;
          font-size: 18px;
          color: white;
        }
        .cs-logo-text {
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 16px;
          color: #F5F0E8;
          letter-spacing: -0.02em;
        }
        .cs-nav-badge {
          font-size: 11px;
          font-weight: 600;
          color: #9FE1CB;
          background: rgba(29, 158, 117, 0.15);
          border: 1px solid rgba(159, 225, 203, 0.25);
          padding: 5px 12px;
          border-radius: 20px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        /* ── Hero ── */
        .cs-hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 120px 24px 80px;
          position: relative;
          text-align: center;
        }

        /* Africa silhouette — pure CSS polygon approximation */
        .cs-continent {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: min(420px, 75vw);
          height: min(520px, 93vw);
          opacity: 0.06;
          pointer-events: none;
        }
        .cs-continent svg {
          width: 100%;
          height: 100%;
        }

        /* City dots */
        .cs-dot {
          position: absolute;
          border-radius: 50%;
          background: #1D9E75;
          opacity: 0;
          animation: dotAppear 0.4s ease-out forwards, dotPulse 3s ease-in-out infinite;
          box-shadow: 0 0 8px rgba(29, 158, 117, 0.8);
        }
        @keyframes dotAppear {
          to { opacity: 1; }
        }
        @keyframes dotPulse {
          0%, 100% { box-shadow: 0 0 6px rgba(29,158,117,0.6); }
          50%       { box-shadow: 0 0 14px rgba(29,158,117,0.9); }
        }

        /* Eyebrow */
        .cs-eyebrow {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #9FE1CB;
          margin-bottom: 20px;
          opacity: 0;
          animation: fadeUp 0.6s ease-out 0.2s forwards;
        }

        /* Hero headline */
        .cs-h1 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(40px, 8vw, 80px);
          font-weight: 900;
          line-height: 1.05;
          color: #F5F0E8;
          letter-spacing: -0.02em;
          margin-bottom: 24px;
          max-width: 760px;
          opacity: 0;
          animation: fadeUp 0.7s ease-out 0.4s forwards;
        }
        .cs-h1 span {
          color: #1D9E75;
          font-style: italic;
        }

        /* Subhead */
        .cs-sub {
          font-size: clamp(15px, 2.5vw, 18px);
          font-weight: 400;
          color: rgba(245, 240, 232, 0.65);
          line-height: 1.7;
          max-width: 520px;
          margin: 0 auto 48px;
          opacity: 0;
          animation: fadeUp 0.7s ease-out 0.6s forwards;
        }

        /* Email capture */
        .cs-form {
          opacity: 0;
          animation: fadeUp 0.7s ease-out 0.8s forwards;
          width: 100%;
          max-width: 460px;
          margin: 0 auto;
        }
        .cs-input-row {
          display: flex;
          gap: 10px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(159,225,203,0.2);
          border-radius: 14px;
          padding: 6px 6px 6px 18px;
          transition: border-color 0.2s;
        }
        .cs-input-row:focus-within {
          border-color: rgba(29,158,117,0.6);
        }
        .cs-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          color: #F5F0E8;
          min-width: 0;
        }
        .cs-input::placeholder { color: rgba(245,240,232,0.35); }
        .cs-btn {
          background: #1D9E75;
          color: white;
          border: none;
          border-radius: 10px;
          padding: 11px 22px;
          font-size: 13px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.2s, transform 0.1s;
          flex-shrink: 0;
        }
        .cs-btn:hover { background: #18886A; }
        .cs-btn:active { transform: scale(0.98); }
        .cs-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .cs-error {
          font-size: 12px;
          color: #F87171;
          margin-top: 8px;
          text-align: center;
        }

        /* Success state */
        .cs-success {
          display: flex;
          align-items: center;
          gap: 10px;
          justify-content: center;
          padding: 14px 20px;
          background: rgba(29,158,117,0.12);
          border: 1px solid rgba(29,158,117,0.3);
          border-radius: 12px;
          font-size: 14px;
          color: #9FE1CB;
          font-weight: 500;
        }

        /* Scroll hint */
        .cs-scroll-hint {
          position: absolute;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          opacity: 0;
          animation: fadeUp 0.5s ease-out 1.4s forwards;
        }
        .cs-scroll-hint span {
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(245,240,232,0.3);
        }
        .cs-scroll-line {
          width: 1px;
          height: 40px;
          background: linear-gradient(to bottom, rgba(159,225,203,0.4), transparent);
          animation: scrollLine 1.8s ease-in-out 1.4s infinite;
        }
        @keyframes scrollLine {
          0%   { transform: scaleY(0); transform-origin: top; opacity: 0; }
          50%  { transform: scaleY(1); transform-origin: top; opacity: 1; }
          100% { transform: scaleY(1); transform-origin: bottom; opacity: 0; }
        }

        /* ── What is Markeetee ── */
        .cs-what {
          padding: 80px 24px;
          max-width: 960px;
          margin: 0 auto;
          text-align: center;
        }
        .cs-section-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #1D9E75;
          margin-bottom: 16px;
        }
        .cs-h2 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(28px, 5vw, 48px);
          font-weight: 700;
          color: #F5F0E8;
          line-height: 1.15;
          margin-bottom: 16px;
          letter-spacing: -0.02em;
        }
        .cs-h2 em { color: #9FE1CB; font-style: normal; }
        .cs-what-body {
          font-size: 16px;
          color: rgba(245,240,232,0.6);
          line-height: 1.8;
          max-width: 600px;
          margin: 0 auto 64px;
        }

        /* Feature grid */
        .cs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
          text-align: left;
        }
        .cs-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(159,225,203,0.1);
          border-radius: 16px;
          padding: 24px;
          transition: border-color 0.2s, background 0.2s;
        }
        .cs-card:hover {
          border-color: rgba(29,158,117,0.35);
          background: rgba(29,158,117,0.06);
        }
        .cs-card-icon {
          font-size: 28px;
          margin-bottom: 12px;
          display: block;
        }
        .cs-card-title {
          font-size: 15px;
          font-weight: 600;
          color: #F5F0E8;
          margin-bottom: 6px;
        }
        .cs-card-desc {
          font-size: 13px;
          color: rgba(245,240,232,0.5);
          line-height: 1.6;
        }

        /* ── Stats strip ── */
        .cs-stats {
          border-top: 1px solid rgba(159,225,203,0.1);
          border-bottom: 1px solid rgba(159,225,203,0.1);
          padding: 48px 24px;
          display: flex;
          justify-content: center;
          gap: clamp(32px, 8vw, 96px);
          flex-wrap: wrap;
        }
        .cs-stat {
          text-align: center;
        }
        .cs-stat-num {
          font-family: 'Playfair Display', serif;
          font-size: clamp(36px, 6vw, 56px);
          font-weight: 900;
          color: #1D9E75;
          line-height: 1;
          margin-bottom: 6px;
        }
        .cs-stat-label {
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(245,240,232,0.45);
        }

        /* ── For owners ── */
        .cs-owners {
          padding: 80px 24px;
          max-width: 960px;
          margin: 0 auto;
        }
        .cs-owners-inner {
          background: linear-gradient(135deg, rgba(29,158,117,0.12), rgba(8,80,65,0.2));
          border: 1px solid rgba(29,158,117,0.2);
          border-radius: 24px;
          padding: clamp(32px, 5vw, 56px);
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          align-items: center;
        }
        @media (max-width: 640px) {
          .cs-owners-inner { grid-template-columns: 1fr; }
        }
        .cs-owners-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(24px, 4vw, 38px);
          font-weight: 700;
          color: #F5F0E8;
          line-height: 1.2;
          margin-bottom: 16px;
          letter-spacing: -0.02em;
        }
        .cs-owners-body {
          font-size: 15px;
          color: rgba(245,240,232,0.6);
          line-height: 1.7;
          margin-bottom: 24px;
        }
        .cs-owners-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .cs-owners-list li {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 14px;
          color: rgba(245,240,232,0.7);
        }
        .cs-owners-list li::before {
          content: '';
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #1D9E75;
          margin-top: 7px;
          flex-shrink: 0;
        }

        /* Flags */
        .cs-flags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
        }
        .cs-flag {
          font-size: 28px;
          line-height: 1;
          opacity: 0.85;
          transition: transform 0.2s, opacity 0.2s;
          cursor: default;
        }
        .cs-flag:hover { transform: scale(1.2); opacity: 1; }

        /* ── Footer ── */
        .cs-footer {
          border-top: 1px solid rgba(159,225,203,0.1);
          padding: 32px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          max-width: 960px;
          margin: 0 auto;
        }
        .cs-footer-copy {
          font-size: 12px;
          color: rgba(245,240,232,0.3);
        }
        .cs-footer-links {
          display: flex;
          gap: 20px;
        }
        .cs-footer-links a {
          font-size: 12px;
          color: rgba(245,240,232,0.35);
          text-decoration: none;
          transition: color 0.2s;
        }
        .cs-footer-links a:hover { color: #9FE1CB; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0);    }
        }

        @media (max-width: 480px) {
          .cs-input-row { flex-direction: column; padding: 10px; }
          .cs-btn { width: 100%; text-align: center; }
          .cs-nav { padding: 16px 20px; }
        }
      `}</style>

      <div className="cs-page">

        {/* ── Navbar ── */}
        <nav className="cs-nav">
          <div className="cs-logo">
            <div className="cs-logo-mark">M</div>
            <span className="cs-logo-text">Markeetee</span>
          </div>
          <div className="cs-nav-badge">Coming soon</div>
        </nav>

        {/* ── Hero ── */}
        <section className="cs-hero">

          {/* Africa silhouette background */}
          <div className="cs-continent">
            <svg viewBox="0 0 300 380" xmlns="http://www.w3.org/2000/svg">
              <path
                fill="#9FE1CB"
                d="M150,8 C138,8 124,14 112,26 C98,40 90,60 86,78
                   C80,92 68,100 62,114 C54,130 52,150 54,170
                   C56,188 64,204 68,222 C72,240 68,260 70,278
                   C72,296 82,314 96,328 C108,340 124,350 150,358
                   C176,350 192,340 204,328 C218,314 228,296 230,278
                   C232,260 228,240 232,222 C236,204 244,188 246,170
                   C248,150 246,130 238,114 C232,100 220,92 214,78
                   C210,60 202,40 188,26 C176,14 162,8 150,8 Z"
              />
              {/* Madagascar */}
              <ellipse cx="248" cy="260" rx="11" ry="26" fill="#9FE1CB" opacity="0.7" transform="rotate(-12 248 260)"/>
            </svg>
          </div>

          {/* City dots */}
          {cityDots.map((dot, i) => (
            <div
              key={i}
              className="cs-dot"
              style={{
                top:            dot.top,
                left:           dot.left,
                width:          dot.size + 'px',
                height:         dot.size + 'px',
                animationDelay: dot.delay,
                animationDuration: `0.4s, ${2 + (i % 3) * 0.5}s`,
              }}
              title={dot.label}
            />
          ))}

          {/* Content */}
          <p className="cs-eyebrow">African businesses · US diaspora · Coming soon</p>

          <h1 className="cs-h1">
            Home has never<br />
            felt this <span>close.</span>
          </h1>

          <p className="cs-sub">
            Markeetee is the go-to directory for African-owned businesses in the US —
            food, beauty, fashion, services and more. Built for the community that makes home feel like home.
          </p>

          {submitted ? (
            <div className="cs-success" style={{ maxWidth: 460, margin: '0 auto' }}>
              <span style={{ fontSize: 20 }}>🎉</span>
              <span>You&apos;re on the list! We&apos;ll let you know the moment we launch.</span>
            </div>
          ) : (
            <form className="cs-form" onSubmit={handleSubmit}>
              <div className="cs-input-row">
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  placeholder="Enter your email address"
                  className="cs-input"
                  required
                />
                <button type="submit" className="cs-btn" disabled={loading}>
                  {loading ? 'Adding…' : 'Notify me'}
                </button>
              </div>
              {error && <p className="cs-error">{error}</p>}
              <p style={{ fontSize: 11, color: 'rgba(245,240,232,0.3)', marginTop: 10, textAlign: 'center' }}>
                No spam. Just a single email when we launch.
              </p>
            </form>
          )}

          {/* Scroll hint */}
          <div className="cs-scroll-hint">
            <span>Discover</span>
            <div className="cs-scroll-line" />
          </div>
        </section>

        {/* ── What is Markeetee ── */}
        <section className="cs-what">
          <p className="cs-section-label">What we&apos;re building</p>
          <h2 className="cs-h2">
            Your community&apos;s businesses,<br />
            <em>finally in one place</em>
          </h2>
          <p className="cs-what-body">
            Finding African businesses in the US is harder than it should be. Markeetee changes that —
            a searchable, mapable directory built specifically for the diaspora,
            covering every city, every category.
          </p>

          <div className="cs-grid">
            {features.map(f => (
              <div key={f.title} className="cs-card">
                <span className="cs-card-icon">{f.icon}</span>
                <p className="cs-card-title">{f.title}</p>
                <p className="cs-card-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Stats ── */}
        <div className="cs-stats">
          {[
            { num: '54',   label: 'African nations represented' },
            { num: '9',    label: 'Business categories'         },
            { num: 'Free', label: 'To list your business'       },
            { num: 'US',   label: 'Nationwide coverage'         },
          ].map(s => (
            <div key={s.label} className="cs-stat">
              <div className="cs-stat-num">{s.num}</div>
              <div className="cs-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── For business owners ── */}
        <section className="cs-owners">
          <div className="cs-owners-inner">
            <div>
              <p className="cs-section-label">For business owners</p>
              <h2 className="cs-owners-title">
                Get discovered by<br />your community
              </h2>
              <p className="cs-owners-body">
                List your African business for free and reach thousands of diaspora
                customers actively searching for what you offer.
              </p>
              <ul className="cs-owners-list">
                <li>Free listing with photo, hours and WhatsApp contact</li>
                <li>Show up on map and search results immediately</li>
                <li>Collect reviews from real customers</li>
                <li>Upgrade to Premium for featured placement</li>
              </ul>
            </div>

            <div>
              <p className="cs-section-label" style={{ marginBottom: 16 }}>Serving the diaspora from</p>
              <div className="cs-flags">
                {['🇳🇬','🇬🇭','🇰🇪','🇸🇳','🇿🇦','🇪🇹','🇨🇲','🇨🇮','🇹🇿','🇺🇬',
                  '🇷🇼','🇿🇼','🇲🇦','🇹🇳','🇩🇿','🇦🇴','🇧🇯','🇧🇫','🇲🇿','🇲🇬',
                  '🇸🇱','🇱🇷','🇬🇳','🇨🇬','🇨🇩','🇬🇦','🇳🇪','🇲🇱'].map(f => (
                  <span key={f} className="cs-flag">{f}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="cs-footer">
          <p className="cs-footer-copy">© 2026 Markeetee · Made for the African diaspora</p>
          <div className="cs-footer-links">
            <a href="https://instagram.com/markeetee">Instagram</a>
            <a href="https://twitter.com/markeetee">X</a>
            <a href="mailto:hello@markeetee.com">Contact</a>
          </div>
        </footer>

      </div>
    </>
  )
}