'use client'

import Image from 'next/image'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const FLAGS = ['🇳🇬','🇬🇭','🇰🇪','🇸🇳','🇿🇦','🇪🇹','🇨🇲','🇨🇮','🇹🇿','🇺🇬','🇷🇼','🇿🇼']

const STATS = [
  { value: '54', label: 'Countries' },
  { value: '9+', label: 'Categories' },
  { value: 'Free', label: 'Business listing' },
]

function ComingSoonInner() {
  const params = useSearchParams()
  const router = useRouter()
  const [showCode, setShowCode] = useState(false)

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setShowCode(params.get('beta') === '1')
  }, [params])

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

      await supabase
        .from('early_access')
        .upsert({ email }, { onConflict: 'email' })

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
        return
      }

      router.push('/')
      router.refresh()
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#043528] text-white">
      <section className="relative min-h-screen px-6 py-8">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-emerald-500 blur-[120px]" />
          <div className="absolute -bottom-40 -left-40 h-[420px] w-[420px] rounded-full bg-[#1D9E75] blur-[110px]" />
        </div>

        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/apple-touch-icon.png"
              alt="Markeetee logo"
              width={46}
              height={46}
              className="rounded-xl"
              priority
            />
            <div>
              <p className="text-xl font-bold tracking-tight">Markeetee</p>
              <p className="text-xs text-emerald-100/70">Africa is here. Find it.</p>
            </div>
          </div>

          <button
            onClick={() => setShowCode(!showCode)}
            className="rounded-full border border-emerald-300/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-100 backdrop-blur"
          >
            {showCode ? 'Waitlist' : 'Beta Access'}
          </button>
        </nav>

        <div className="relative z-10 mx-auto grid min-h-[calc(100vh-90px)] max-w-7xl items-center gap-12 py-16 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-100">
              African businesses · Products · Services · Culture
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
              All things Africa.
              <span className="block text-[#28C98B]">All in one place.</span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-white/70">
              Markeetee helps people discover African-owned businesses across the USA —
              from food and groceries to fashion, beauty, wellness, music, art, services,
              crafts and decor.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {STATS.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.07] px-5 py-4 backdrop-blur"
                >
                  <p className="text-2xl font-black text-[#28C98B]">{item.value}</p>
                  <p className="text-xs text-white/60">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 max-w-xl rounded-3xl border border-white/10 bg-white/[0.08] p-3 backdrop-blur">
              <div className="mb-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setShowCode(false)
                    setError('')
                  }}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    !showCode
                      ? 'bg-[#1D9E75] text-white'
                      : 'text-white/60 hover:bg-white/10'
                  }`}
                >
                  Join Waitlist
                </button>

                <button
                  onClick={() => {
                    setShowCode(true)
                    setError('')
                  }}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    showCode
                      ? 'bg-[#1D9E75] text-white'
                      : 'text-white/60 hover:bg-white/10'
                  }`}
                >
                  I Have a Code
                </button>
              </div>

              {!showCode ? (
                submitted ? (
                  <div className="rounded-2xl bg-emerald-400/10 p-5 text-center text-emerald-100">
                    🎉 You’re on the list. We’ll email you when Markeetee launches.
                  </div>
                ) : (
                  <form onSubmit={handleWaitlist} className="flex flex-col gap-3 sm:flex-row">
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      placeholder="Enter your email address"
                      className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/40 focus:border-emerald-300/50"
                    />
                    <button
                      disabled={loading}
                      className="rounded-2xl bg-[#28C98B] px-6 py-4 font-bold text-[#043528] transition hover:bg-[#5DCAA5] disabled:opacity-60"
                    >
                      {loading ? 'Adding…' : 'Notify Me'}
                    </button>
                  </form>
                )
              ) : (
                <form onSubmit={handleCode} className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    type="text"
                    placeholder="ENTER ACCESS CODE"
                    className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/10 px-5 py-4 font-bold uppercase tracking-widest text-white outline-none placeholder:text-white/40 focus:border-emerald-300/50"
                  />
                  <button
                    disabled={loading}
                    className="rounded-2xl bg-[#28C98B] px-6 py-4 font-bold text-[#043528] transition hover:bg-[#5DCAA5] disabled:opacity-60"
                  >
                    {loading ? 'Checking…' : 'Enter'}
                  </button>
                </form>
              )}

              {error && <p className="mt-3 text-center text-sm text-red-300">{error}</p>}

              <p className="mt-3 text-center text-xs text-white/40">
                No spam. Just updates about Markeetee.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.08] p-6 shadow-2xl backdrop-blur">
              <div className="rounded-[1.5rem] bg-[#F7F4EC] p-6 text-[#063B2E]">
                <div className="mb-6 flex items-center gap-3">
                  <Image
                    src="/apple-touch-icon.png"
                    alt="Markeetee logo"
                    width={42}
                    height={42}
                    className="rounded-xl"
                  />
                  <div>
                    <p className="text-xl font-black">Markeetee</p>
                    <p className="text-xs text-[#085041]/70">Africa is here. Find it.</p>
                  </div>
                </div>

                <h2 className="text-3xl font-black leading-tight">
                  Find African businesses near you.
                </h2>

                <div className="mt-5 rounded-2xl border border-[#085041]/10 bg-white px-4 py-3 text-sm text-[#085041]/50">
                  Search businesses, products, or services...
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    ['🍲', 'Food'],
                    ['🍽️', 'Restaurants'],
                    ['👗', 'Fashion'],
                    ['💇🏾', 'Beauty'],
                    ['🌿', 'Wellness'],
                    ['🎵', 'Music'],
                    ['🏺', 'Decor'],
                    ['🤝', 'Services'],
                    ['🛍️', 'More'],
                  ].map(([icon, label]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-[#085041]/10 bg-[#EAF8F1] p-4 text-center"
                    >
                      <p className="text-2xl">{icon}</p>
                      <p className="mt-1 text-xs font-bold">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {FLAGS.map((flag) => (
                <span
                  key={flag}
                  className="rounded-full bg-white/10 px-3 py-2 text-xl backdrop-blur"
                >
                  {flag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
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