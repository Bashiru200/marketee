'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Rocket, Search, Store, MapPin, Star,
  Camera, BarChart3, MessageCircle, ArrowRight, X,
} from 'lucide-react'

// ── Launch date: July 18, 2026 ────────────────────────────────────────────
const LAUNCH_DATE = new Date('2026-07-18T00:00:00').getTime()

const CATEGORIES = [
  { icon: '🍲', name: 'Food & Groceries' },
  { icon: '🍽️', name: 'Restaurants'      },
  { icon: '👗', name: 'Fashion & Fabric' },
  { icon: '💇', name: 'Beauty & Hair'    },
  { icon: '🌿', name: 'Herbs & Wellness' },
  { icon: '🎵', name: 'Music & Arts'     },
  { icon: '🏺', name: 'Crafts & Decor'   },
  { icon: '🛠️', name: 'Services'         },
]

const LAUNCH_FEATURES = [
  { icon: Store,         text: 'Free business listing'       },
  { icon: Camera,        text: 'Unlimited photo galleries'   },
  { icon: Search,        text: 'Priority search visibility'  },
  { icon: BarChart3,     text: 'Advanced analytics'          },
  { icon: MessageCircle, text: 'Customer enquiry form'       },
  { icon: Star,          text: 'Reviews & ratings'           },
  { icon: MapPin,        text: 'Multiple branch locations'   },
  { icon: Rocket,        text: 'Custom store URL'            },
]

function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-white/10 border border-white/10 backdrop-blur p-4 text-center">
      <p className="text-3xl md:text-5xl font-black text-white leading-none">
        {String(value).padStart(2, '0')}
      </p>
      <p className="text-[10px] md:text-xs uppercase tracking-widest text-green-200 mt-2">
        {label}
      </p>
    </div>
  )
}

// ── Inner (reads searchParams) ────────────────────────────────────────────
function ComingSoonInner() {
  const params  = useSearchParams()
  const router  = useRouter()
  const isBeta  = params.get('beta') === '1'

  // ── Countdown ─────────────────────────────────────────────────────────
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    function tick() {
      const diff = Math.max(0, LAUNCH_DATE - Date.now())
      setTimeLeft({
        days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours:   Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // ── Waitlist ───────────────────────────────────────────────────────────
  const [email,      setEmail]      = useState('')
  const [submitted,  setSubmitted]  = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [emailError, setEmailError] = useState('')

  // ── Beta code ──────────────────────────────────────────────────────────
  const [code,        setCode]        = useState('')
  const [codeError,   setCodeError]   = useState('')
  const [codeLoading, setCodeLoading] = useState(false)
  const [showCode,    setShowCode]    = useState(false)

  useEffect(() => { setShowCode(isBeta) }, [isBeta])

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address'); return
    }
    setSubmitting(true); setEmailError('')
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.from('early_access').upsert({ email }, { onConflict: 'email' })
      setSubmitted(true)
    } catch {
      setEmailError('Something went wrong — please try again.')
    } finally { setSubmitting(false) }
  }

  async function handleCode(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) { setCodeError('Enter your access code'); return }
    setCodeLoading(true); setCodeError('')
    try {
      const res  = await fetch('/api/beta-access', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setCodeError(data.error ?? 'Invalid code.'); setCodeLoading(false); return }
      router.push('/'); router.refresh()
    } catch {
      setCodeError('Something went wrong. Try again.')
      setCodeLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F8FAF9] overflow-hidden">

      {/* ── Hero section ── */}
      <section className="relative text-white"
        style={{ background:'radial-gradient(circle at top left,#1D9E75 0%,#085041 38%,#053528 100%)' }}>

        {/* Dot grid overlay */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

        {/* Navbar */}
        <nav className="relative max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/apple-touch-icon.png" alt="Markeetee" width={36} height={36}
              style={{ borderRadius: 9 }} priority />
            <span className="font-bold text-lg text-white">Markeetee</span>
          </Link>
          <span className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-green-100 border border-white/10">
            <Rocket size={14} />
            {showCode ? 'Beta Access' : 'Coming Soon · July 18'}
          </span>
        </nav>

        {/* Hero content */}
        <div className="relative max-w-7xl mx-auto px-4 pt-10 pb-28 text-center">
          <span className="inline-flex items-center rounded-full bg-white/10 border border-white/10 px-5 py-2 text-sm font-bold text-green-100 mb-8">
            🚀 Early businesses get every premium feature free
          </span>

          <h1 className="text-5xl md:text-7xl font-black leading-tight max-w-4xl mx-auto">
            Africa is here.<br />
            <span style={{ color:'#9FE1CB' }}>Find it.</span>
          </h1>

          <p className="mt-7 text-lg md:text-xl text-green-100 leading-8 max-w-3xl mx-auto">
            Markeetee is launching July 18th — the discovery platform connecting the
            African diaspora with African-owned restaurants, markets, fashion,
            beauty, wellness, services, and culture across the United States.
          </p>

          {/* CTA buttons */}
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/auth/signup?role=owner"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 font-bold text-[#085041] hover:scale-105 transition">
              🎉 Claim My Free Storefront <ArrowRight size={18} />
            </Link>
            <Link href="/search"
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 border border-white/10 px-7 py-4 font-bold text-white hover:bg-white/20 transition">
              Explore Markeetee
            </Link>
          </div>

          {/* Countdown */}
          <div className="mt-14">
            <p className="text-sm font-bold uppercase tracking-widest text-green-200 mb-5">
              ⏳ Launch offer ends in
            </p>
            <div className="grid grid-cols-4 gap-3 max-w-2xl mx-auto">
              <TimeBox value={timeLeft.days}    label="Days"    />
              <TimeBox value={timeLeft.hours}   label="Hours"   />
              <TimeBox value={timeLeft.minutes} label="Minutes" />
              <TimeBox value={timeLeft.seconds} label="Seconds" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Waitlist / Beta code card ── */}
      <section className="max-w-xl mx-auto px-4 -mt-8 relative z-20 mb-4">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-7">

          {/* Tab switcher */}
          <div className="flex gap-2 mb-5 bg-gray-100 rounded-xl p-1">
            {[
              { label:'Join waitlist', active:!showCode, onClick:() => setShowCode(false) },
              { label:'I have a code', active:showCode,  onClick:() => setShowCode(true)  },
            ].map(t => (
              <button key={t.label} onClick={t.onClick}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{ background: t.active ? '#1D9E75' : 'transparent', color: t.active ? 'white' : '#6B7280' }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Waitlist form */}
          {!showCode && (
            submitted ? (
              <div className="flex items-center gap-3 justify-center py-4 rounded-xl text-sm font-medium"
                style={{ background:'#E1F5EE', color:'#085041' }}>
                🎉 You're on the list! We'll email you when we launch.
              </div>
            ) : (
              <form onSubmit={handleWaitlist} className="flex gap-2">
                <input type="email" value={email}
                  onChange={e => { setEmail(e.target.value); setEmailError('') }}
                  placeholder="Enter your email address"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent" />
                <button type="submit" disabled={submitting}
                  className="px-5 py-3 rounded-xl text-sm font-bold text-white flex-shrink-0 disabled:opacity-60"
                  style={{ background:'#1D9E75' }}>
                  {submitting ? 'Adding…' : 'Notify me'}
                </button>
              </form>
            )
          )}
          {!showCode && emailError && (
            <p className="text-xs text-red-500 mt-2 text-center">{emailError}</p>
          )}
          {!showCode && !submitted && (
            <p className="text-xs text-gray-400 mt-2 text-center">No spam. One email when we launch.</p>
          )}

          {/* Beta code form */}
          {showCode && (
            <form onSubmit={handleCode} className="flex gap-2">
              <input type="text" value={code}
                onChange={e => { setCode(e.target.value.toUpperCase()); setCodeError('') }}
                placeholder="ENTER YOUR ACCESS CODE"
                autoFocus
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold tracking-widest focus:outline-none focus:ring-2 focus:border-transparent uppercase" />
              <button type="submit" disabled={codeLoading}
                className="px-5 py-3 rounded-xl text-sm font-bold text-white flex-shrink-0 disabled:opacity-60"
                style={{ background:'#1D9E75' }}>
                {codeLoading ? 'Checking…' : 'Enter →'}
              </button>
            </form>
          )}
          {showCode && codeError && (
            <p className="text-xs text-red-500 mt-2 text-center">{codeError}</p>
          )}
          {showCode && (
            <p className="text-xs text-gray-400 mt-2 text-center">Have a beta code? Enter it above to get in now.</p>
          )}
        </div>
      </section>

      {/* ── Launch features card ── */}
      <section className="max-w-7xl mx-auto px-4 mt-8 relative z-10">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8 md:p-10">
          <div className="grid lg:grid-cols-[1fr_400px] gap-10 items-center">
            <div>
              <span className="inline-flex rounded-full px-4 py-2 text-sm font-bold mb-5"
                style={{ background:'#E1F5EE', color:'#085041' }}>
                Launch Access
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Every Pro Store feature is free during launch.
              </h2>
              <p className="text-gray-600 leading-8 mb-8">
                Early business owners get full access to tools that help them
                get discovered, showcase products, collect reviews, receive
                enquiries, and grow online — at no cost during the launch period.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {LAUNCH_FEATURES.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background:'#E1F5EE', color:'#085041' }}>
                      <Icon size={18} />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing card */}
            <div className="rounded-3xl p-7 text-white" style={{ background:'#085041' }}>
              <p className="text-sm uppercase tracking-widest font-bold mb-3" style={{ color:'#9FE1CB' }}>
                Full Launch Access
              </p>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-6xl font-black">$0</span>
                <span className="text-green-100 mb-2">during launch</span>
              </div>
              <p className="text-green-200 text-sm line-through mb-4">Normally $49/month</p>
              <p className="text-green-100 leading-7 mb-6">
                Claim your business now and unlock every premium tool while we
                prepare for public launch on July 18th.
              </p>
              <Link href="/auth/signup?role=owner"
                className="block text-center rounded-2xl bg-white px-6 py-4 font-bold hover:scale-[1.02] transition"
                style={{ color:'#085041' }}>
                🚀 Get Launch Access
              </Link>
              <p className="text-center text-xs mt-3" style={{ color:'rgba(159,225,203,0.6)' }}>
                No credit card required
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Discover all things Africa, all in one place.
          </h2>
          <p className="mt-4 text-gray-500 leading-7">
            Markeetee helps customers find the businesses, products, food, and
            services that feel like home.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map(cat => (
            <div key={cat.name}
              className="bg-white border border-gray-100 rounded-3xl p-6 text-center hover:shadow-lg transition cursor-default">
              <div className="text-4xl mb-3">{cat.icon}</div>
              <p className="text-sm font-bold text-gray-800">{cat.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="max-w-7xl mx-auto px-4 pb-20">
        <div className="rounded-3xl bg-white border border-gray-100 p-8 md:p-12 text-center">
          <MapPin size={34} className="mx-auto mb-5" style={{ color:'#1D9E75' }} />
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Built for the African diaspora.
          </h2>
          <p className="text-gray-600 leading-8 max-w-3xl mx-auto mb-8">
            Whether you are looking for jollof, African groceries, Ankara
            fabric, hair braiding, wellness products, music, art, or trusted
            local services — Markeetee is being built to help you find it faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/signup?role=customer"
              className="rounded-2xl px-7 py-4 font-bold text-white"
              style={{ background:'#1D9E75' }}>
              Join Customer Waitlist
            </Link>
            <Link href="/auth/signup?role=owner"
              className="rounded-2xl px-7 py-4 font-bold border border-gray-200 bg-white"
              style={{ color:'#085041' }}>
              List My Business
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/apple-touch-icon.png" alt="Markeetee" width={28} height={28}
              style={{ borderRadius: 7 }} />
            <p className="text-sm text-gray-400">© 2026 Markeetee · Made for the African diaspora</p>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <Link href="/about"   className="text-gray-500 hover:text-[#1D9E75]">About</Link>
            <Link href="/privacy" className="text-gray-500 hover:text-[#1D9E75]">Privacy</Link>
            <Link href="/terms"   className="text-gray-500 hover:text-[#1D9E75]">Terms</Link>
            <Link href="/contact" className="text-gray-500 hover:text-[#1D9E75]">Contact</Link>
          </div>
        </div>
      </footer>

    </main>
  )
}

export default function ComingSoonPage() {
  return (
    <Suspense>
      <ComingSoonInner />
    </Suspense>
  )
}