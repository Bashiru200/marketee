'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, Rocket } from 'lucide-react'

const LAUNCH_END_DATE = new Date('2026-07-20T23:59:59')

const BENEFITS = [
  { icon: '⌕', title: 'Discover', text: 'Find authentic African businesses near you.' },
  { icon: '👥', title: 'Connect', text: 'Build relationships that matter.' },
  { icon: '♡', title: 'Support', text: 'Empower communities. Grow together.' },
]

const CATEGORIES = [
  ['🍲', 'Food & Groceries'],
  ['🍽️', 'Restaurants'],
  ['👗', 'Fashion & Fabric'],
  ['💇🏾', 'Beauty & Hair'],
  ['🌿', 'Herbs & Wellness'],
  ['🎵', 'Music & Arts'],
  ['🏺', 'Crafts & Decor'],
  ['🤝', 'Services'],
  ['•••', 'More'],
]

const LAUNCH_FEATURES = [
  'Free business listing',
  'Photo galleries',
  'Products & menu',
  'Featured search visibility',
  'Business analytics',
  'Customer enquiries',
  'Reviews & ratings',
  'Custom storefront URL',
]

function ComingSoonInner() {
  const params = useSearchParams()

  const [showCode, setShowCode] = useState(false)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    setShowCode(params.get('beta') === '1')
  }, [params])

  useEffect(() => {
    function updateCountdown() {
      const distance = LAUNCH_END_DATE.getTime() - Date.now()

      if (distance <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((distance / (1000 * 60)) % 60),
        seconds: Math.floor((distance / 1000) % 60),
      })
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)

    return () => clearInterval(timer)
  }, [])

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      await supabase.from('early_access').upsert({ email }, { onConflict: 'email' })

      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!code.trim()) {
      setError('Enter your access code.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/beta-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Invalid access code.')
        setLoading(false)
        return
      }

      // Hard redirect — picks up the beta cookie in one shot
      window.location.href = '/'
    } catch {
      setError('Something went wrong. Try again.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#FBF8F1] text-[#043528]">
      <section className="relative min-h-screen px-5 py-10 md:px-10">
        <div className="absolute right-[-180px] top-20 h-[620px] w-[620px] rounded-full bg-[#EAF4E8]" />
        <div className="absolute bottom-[-180px] left-[-180px] h-[360px] w-[360px] rounded-full bg-[#EEF7E9]" />

        <div className="relative mx-auto max-w-6xl text-center">
          <div className="mx-auto flex flex-col items-center">
            <Image
              src="/apple-touch-icon.png"
              alt="Markeetee logo"
              width={72}
              height={72}
              className="rounded-2xl"
              priority
            />

            <h2 className="mt-4 text-3xl font-black tracking-tight">Markeetee</h2>

            <p className="text-base text-[#043528]/70">Africa is here. Find it.</p>
          </div>

          <div className="mt-10 inline-flex items-center gap-2 rounded-full bg-[#E8F2E3] px-7 py-3 text-sm font-black uppercase tracking-wide text-[#085041]">
            <Rocket size={16} />
            Launch Access
          </div>

          <h1 className="mx-auto mt-8 max-w-5xl text-5xl font-black leading-[1.02] tracking-tight sm:text-7xl lg:text-8xl">
            All things Africa.
            <span className="block text-[#168966]">All in one place.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-[#043528]/65">
            Markeetee connects African-owned businesses, products, services and
            culture across the USA. Early businesses get every premium feature
            free during launch.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/auth/signup?role=owner"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#085041] px-7 py-4 font-bold text-white transition hover:bg-[#0B634F]"
            >
              Claim My Free Storefront
              <ArrowRight size={18} />
            </Link>

            <Link
              href="/search"
              className="rounded-2xl border border-[#043528]/10 bg-white px-7 py-4 font-bold text-[#085041] transition hover:border-[#1D9E75]"
            >
              Explore Markeetee
            </Link>
          </div>

          <div className="relative mt-12 grid items-center gap-12 lg:grid-cols-[1fr_360px] lg:text-left">
            <div>
              <div className="mx-auto max-w-2xl rounded-[2rem] border border-[#043528]/10 bg-white p-8 shadow-2xl shadow-[#043528]/10">
                <h3 className="text-center text-2xl font-black text-[#043528]">
                  {showCode ? 'Enter your beta access code' : 'Be the first to know when we launch!'}
                </h3>

                <p className="mt-2 text-center text-sm text-[#043528]/60">
                  {showCode ? 'Use your access code to preview Markeetee early.' : 'Join our waitlist for updates and early access.'}
                </p>

                <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-[#F2F7EE] p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCode(false)
                      setError('')
                    }}
                    className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                      !showCode ? 'bg-[#085041] text-white' : 'text-[#085041]/60'
                    }`}
                  >
                    Join Waitlist
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowCode(true)
                      setError('')
                    }}
                    className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                      showCode ? 'bg-[#085041] text-white' : 'text-[#085041]/60'
                    }`}
                  >
                    Beta Code
                  </button>
                </div>

                {!showCode ? (
                  submitted ? (
                    <div className="mt-6 rounded-2xl bg-[#EAF8F1] p-5 text-center font-semibold text-[#085041]">
                      🎉 You’re on the list. We’ll email you when Markeetee launches.
                    </div>
                  ) : (
                    <form onSubmit={handleWaitlist} className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-[#043528]/10 bg-white px-5 py-4">
                        <span className="text-xl text-[#043528]/50">✉</span>
                        <input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          type="email"
                          placeholder="Enter your email address"
                          className="min-w-0 flex-1 bg-transparent text-[#043528] outline-none placeholder:text-[#043528]/40"
                        />
                      </div>

                      <button
                        disabled={loading}
                        className="rounded-2xl bg-[#085041] px-8 py-4 font-bold text-white transition hover:bg-[#0B634F] disabled:opacity-60"
                      >
                        {loading ? 'Adding…' : 'Notify Me'}
                      </button>
                    </form>
                  )
                ) : (
                  <form onSubmit={handleCode} className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-[#043528]/10 bg-white px-5 py-4">
                      <span className="text-xl text-[#043528]/50">🔒</span>
                      <input
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        type="text"
                        placeholder="ENTER ACCESS CODE"
                        className="min-w-0 flex-1 bg-transparent font-bold uppercase tracking-widest text-[#043528] outline-none placeholder:text-[#043528]/40"
                      />
                    </div>

                    <button
                      disabled={loading}
                      className="rounded-2xl bg-[#085041] px-8 py-4 font-bold text-white transition hover:bg-[#0B634F] disabled:opacity-60"
                    >
                      {loading ? 'Checking…' : 'Enter'}
                    </button>
                  </form>
                )}

                {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

                <p className="mt-5 text-center text-sm text-[#043528]/55">
                  🔒 No spam. Just updates about our launch.
                </p>
              </div>

              <div className="mx-auto mt-12 grid max-w-3xl gap-8 sm:grid-cols-3">
                {BENEFITS.map((item) => (
                  <div key={item.title} className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EDF6E9] text-3xl text-[#085041]">
                      {item.icon}
                    </div>

                    <h4 className="mt-4 font-black text-[#085041]">{item.title}</h4>

                    <p className="mt-2 text-sm leading-6 text-[#043528]/65">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mx-auto w-full max-w-[360px] lg:mx-0">
              <div className="rotate-3 rounded-[2.2rem] bg-[#111] p-3 shadow-2xl shadow-[#043528]/25">
                <div className="rounded-[1.8rem] bg-white p-5 text-left">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Image
                        src="/apple-touch-icon.png"
                        alt="Markeetee"
                        width={34}
                        height={34}
                        className="rounded-lg"
                      />
                      <div>
                        <p className="text-sm font-black">Markeetee</p>
                        <p className="text-[10px] text-[#043528]/50">Africa is here. Find it.</p>
                      </div>
                    </div>

                    <span className="text-xl">☰</span>
                  </div>

                  <div className="rounded-xl border border-[#043528]/10 px-3 py-3 text-xs text-[#043528]/40">
                    Search businesses, products, services...
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    {CATEGORIES.map(([icon, label]) => (
                      <div
                        key={label}
                        className="rounded-2xl border border-[#043528]/10 bg-[#FAF8F1] p-3 text-center"
                      >
                        <div className="text-xl">{icon}</div>
                        <p className="mt-2 text-[10px] font-bold leading-tight">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl bg-[#085041] p-4 text-white">
                    <p className="text-sm font-bold">Launch Access Active</p>
                    <p className="text-xs text-white/70">Every premium tool is free during launch.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-16 max-w-5xl rounded-[2rem] border border-[#043528]/10 bg-white/70 p-8 shadow-sm">
            <p className="mb-6 text-center font-black text-[#168966]">Launch offer ends in</p>

            <div className="grid grid-cols-4 gap-4 text-center">
              <TimeBox value={timeLeft.days} label="Days" />
              <TimeBox value={timeLeft.hours} label="Hours" />
              <TimeBox value={timeLeft.minutes} label="Minutes" />
              <TimeBox value={timeLeft.seconds} label="Seconds" />
            </div>
          </div>

          <div className="mx-auto mt-10 max-w-5xl rounded-[2rem] border border-[#043528]/10 bg-white p-8 text-left shadow-sm">
            <div className="grid gap-8 md:grid-cols-[1fr_360px] md:items-center">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-[#168966]">
                  Full Launch Access
                </p>

                <h3 className="mt-3 text-3xl font-black text-[#043528]">
                  Every Pro Store feature is free during launch.
                </h3>

                <p className="mt-4 leading-7 text-[#043528]/65">
                  Early business owners can add photos, products, menus,
                  analytics, promotions, enquiries, reviews, and a custom
                  storefront — at no cost during our launch period.
                </p>
              </div>

              <div className="rounded-[1.5rem] bg-[#085041] p-6 text-white">
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-black">$0</span>
                  <span className="mb-1 text-white/70">during launch</span>
                </div>

                <ul className="mt-5 space-y-2">
                  {LAUNCH_FEATURES.map((feature) => (
                    <li key={feature} className="text-sm text-white/85">
                      ✓ {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/auth/signup?role=owner"
                  className="mt-6 inline-flex w-full justify-center rounded-2xl bg-white px-5 py-3 font-bold text-[#085041]"
                >
                  Get Launch Access
                </Link>
              </div>
            </div>
          </div>

          <footer className="mt-14 pb-8 text-sm text-[#043528]/70">
            <p>All things Africa, all in one place.</p>
          </footer>
        </div>
      </section>
    </main>
  )
}

function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-4xl font-black text-[#085041]">
        {String(value).padStart(2, '0')}
      </p>
      <p className="mt-1 text-sm text-[#043528]/60">{label}</p>
    </div>
  )
}

export default function ComingSoonPage() {
  return (
    <Suspense>
      <ComingSoonInner />
    </Suspense>
  )
}