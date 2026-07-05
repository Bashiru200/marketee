'use client'

import Image from 'next/image'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const CATEGORIES = [
  'Food & Groceries',
  'Restaurants',
  'Fashion & Fabric',
  'Beauty & Hair',
  'Herbs & Wellness',
  'Music & Arts',
  'Crafts & Decor',
  'Services',
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
    <main className="min-h-screen overflow-hidden bg-[#F8F5EC] text-[#043528]">
      <section className="relative min-h-screen px-5 py-10 md:px-10">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-[#1D9E75]/20 blur-3xl" />
          <div className="absolute -bottom-44 -left-44 h-[520px] w-[520px] rounded-full bg-[#085041]/20 blur-3xl" />
        </div>

        <div className="relative mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-8 flex items-center gap-4">
              <Image
                src="/apple-touch-icon.png"
                alt="Markeetee logo"
                width={62}
                height={62}
                className="rounded-2xl"
                priority
              />

              <div>
                <h2 className="text-3xl font-black tracking-tight">Markeetee</h2>
                <p className="text-sm font-medium text-[#085041]/70">
                  Africa is here. Find it.
                </p>
              </div>
            </div>

            <div className="mb-5 inline-flex rounded-full border border-[#1D9E75]/20 bg-white px-4 py-2 text-sm font-semibold text-[#085041] shadow-sm">
              Coming Soon
            </div>

            <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
              All things Africa.
              <span className="block text-[#1D9E75]">All in one place.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#085041]/75">
              Discover African-owned businesses, products, services, food, fashion,
              beauty, wellness, music, art, crafts and culture across the USA.
            </p>

            <div className="mt-9 max-w-xl rounded-[2rem] border border-[#085041]/10 bg-white/80 p-3 shadow-xl shadow-[#085041]/10 backdrop-blur">
              <div className="mb-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setShowCode(false)
                    setError('')
                  }}
                  className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                    !showCode
                      ? 'bg-[#085041] text-white'
                      : 'bg-[#EAF8F1] text-[#085041]'
                  }`}
                >
                  Join Waitlist
                </button>

                <button
                  onClick={() => {
                    setShowCode(true)
                    setError('')
                  }}
                  className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                    showCode
                      ? 'bg-[#085041] text-white'
                      : 'bg-[#EAF8F1] text-[#085041]'
                  }`}
                >
                  Beta Code
                </button>
              </div>

              {!showCode ? (
                submitted ? (
                  <div className="rounded-2xl bg-[#EAF8F1] p-5 text-center font-semibold text-[#085041]">
                    🎉 You’re on the list. We’ll email you when Markeetee launches.
                  </div>
                ) : (
                  <form onSubmit={handleWaitlist} className="flex flex-col gap-3 sm:flex-row">
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      placeholder="Enter your email address"
                      className="min-w-0 flex-1 rounded-2xl border border-[#085041]/10 bg-[#F8F5EC] px-5 py-4 text-[#043528] outline-none placeholder:text-[#085041]/40 focus:border-[#1D9E75]"
                    />

                    <button
                      disabled={loading}
                      className="rounded-2xl bg-[#1D9E75] px-6 py-4 font-black text-white transition hover:bg-[#168966] disabled:opacity-60"
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
                    className="min-w-0 flex-1 rounded-2xl border border-[#085041]/10 bg-[#F8F5EC] px-5 py-4 font-black uppercase tracking-widest text-[#043528] outline-none placeholder:text-[#085041]/40 focus:border-[#1D9E75]"
                  />

                  <button
                    disabled={loading}
                    className="rounded-2xl bg-[#1D9E75] px-6 py-4 font-black text-white transition hover:bg-[#168966] disabled:opacity-60"
                  >
                    {loading ? 'Checking…' : 'Enter'}
                  </button>
                </form>
              )}

              {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}

              <p className="mt-3 text-center text-xs text-[#085041]/50">
                No spam. Just Markeetee launch updates.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-5 rounded-[3rem] bg-[#1D9E75]/10 blur-2xl" />

            <div className="relative rounded-[2.5rem] bg-[#043528] p-5 shadow-2xl">
              <div className="rounded-[2rem] bg-white p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Image
                      src="/apple-touch-icon.png"
                      alt="Markeetee logo"
                      width={42}
                      height={42}
                      className="rounded-xl"
                    />
                    <div>
                      <p className="text-lg font-black text-[#043528]">Markeetee</p>
                      <p className="text-xs text-[#085041]/60">Find African businesses</p>
                    </div>
                  </div>

                  <div className="h-9 w-9 rounded-full bg-[#EAF8F1] text-center leading-9">
                    ☰
                  </div>
                </div>

                <div className="rounded-[1.5rem] bg-[#085041] p-5 text-white">
                  <p className="text-sm text-emerald-100/80">Launching soon</p>
                  <h3 className="mt-2 text-3xl font-black leading-tight">
                    Find. Connect. Support.
                  </h3>
                </div>

                <div className="mt-5 rounded-2xl border border-[#085041]/10 bg-[#F8F5EC] px-4 py-3 text-sm text-[#085041]/50">
                  Search businesses, products, or services...
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  {CATEGORIES.map((category) => (
                    <div
                      key={category}
                      className="rounded-2xl border border-[#085041]/10 bg-[#EAF8F1] p-4"
                    >
                      <div className="mb-3 h-9 w-9 rounded-full bg-[#085041] text-center text-lg leading-9 text-white">
                        {category.includes('Food') ? '🍲' :
                         category.includes('Restaurant') ? '🍽️' :
                         category.includes('Fashion') ? '👗' :
                         category.includes('Beauty') ? '💇🏾' :
                         category.includes('Herbs') ? '🌿' :
                         category.includes('Music') ? '🎵' :
                         category.includes('Crafts') ? '🏺' : '🤝'}
                      </div>
                      <p className="text-sm font-black text-[#043528]">{category}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              {[
                ['54', 'Countries'],
                ['9+', 'Categories'],
                ['USA', 'Coverage'],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-[#085041]/10 bg-white/80 p-4 shadow-sm"
                >
                  <p className="text-2xl font-black text-[#1D9E75]">{value}</p>
                  <p className="text-xs font-semibold text-[#085041]/60">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className="relative mx-auto mt-8 flex max-w-7xl flex-wrap items-center justify-between gap-4 border-t border-[#085041]/10 py-6 text-sm text-[#085041]/60">
          <p>© {new Date().getFullYear()} Markeetee</p>
          <p>Discover. Connect. Support.</p>
          <a href="mailto:hello@markeetee.com" className="font-semibold text-[#085041]">
            hello@markeetee.com
          </a>
        </footer>
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