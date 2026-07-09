'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Rocket,
  Search,
  Store,
  MapPin,
  Star,
  Camera,
  BarChart3,
  MessageCircle,
  ArrowRight,
} from 'lucide-react'

const LAUNCH_END_DATE = new Date('2026-07-22T23:59:59')

const categories = [
  { icon: '🍲', name: 'Food & Groceries' },
  { icon: '🍽️', name: 'Restaurants' },
  { icon: '👗', name: 'Fashion & Fabric' },
  { icon: '💇', name: 'Beauty & Hair' },
  { icon: '🌿', name: 'Herbs & Wellness' },
  { icon: '🎵', name: 'Music & Arts' },
  { icon: '🏺', name: 'Crafts & Decor' },
  { icon: '🛠️', name: 'Services' },
]

const launchFeatures = [
  { icon: Store, text: 'Free business listing' },
  { icon: Camera, text: 'Photo galleries' },
  { icon: Search, text: 'Featured search visibility' },
  { icon: BarChart3, text: 'Business analytics' },
  { icon: MessageCircle, text: 'Customer enquiries' },
  { icon: Star, text: 'Reviews & ratings' },
]

export default function ComingSoonPage() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    function updateCountdown() {
      const now = Date.now()
      const distance = LAUNCH_END_DATE.getTime() - now

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

  return (
    <main className="min-h-screen bg-[#F8FAF9] overflow-hidden">
      <section
        className="relative text-white"
        style={{
          background:
            'radial-gradient(circle at top left,#1D9E75 0%,#085041 38%,#053528 100%)',
        }}
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

        <nav className="relative max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo1.png"
              alt="Markeetee"
              width={150}
              height={48}
              className="h-auto w-[150px]"
              priority
            />
          </Link>

          <span className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-green-100 border border-white/10">
            <Rocket size={15} />
            Launch Access
          </span>
        </nav>

        <div className="relative max-w-7xl mx-auto px-4 pt-12 pb-24 text-center">
          <span className="inline-flex items-center rounded-full bg-white/10 border border-white/10 px-5 py-2 text-sm font-bold text-green-100 mb-8">
            🚀 Early businesses get every premium feature free
          </span>

          <h1 className="text-5xl md:text-7xl font-black leading-tight max-w-4xl mx-auto">
            Africa is here.
            <br />
            <span className="text-[#9FE1CB]">Find it.</span>
          </h1>

          <p className="mt-7 text-lg md:text-xl text-green-100 leading-8 max-w-3xl mx-auto">
            Markeetee is launching soon — the discovery platform connecting the
            African diaspora with African-owned restaurants, markets, fashion,
            beauty, wellness, services, and culture across the United States.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              href="/auth/signup?role=owner"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 font-bold text-[#085041] hover:scale-105 transition"
            >
              Claim My Free Storefront
              <ArrowRight size={18} />
            </Link>

            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 border border-white/10 px-7 py-4 font-bold text-white hover:bg-white/20 transition"
            >
              Explore Markeetee
            </Link>
          </div>

          <div className="mt-14">
            <p className="text-sm font-bold uppercase tracking-widest text-green-200 mb-5">
              Launch offer ends in
            </p>

            <div className="grid grid-cols-4 gap-3 max-w-2xl mx-auto">
              <TimeBox value={timeLeft.days} label="Days" />
              <TimeBox value={timeLeft.hours} label="Hours" />
              <TimeBox value={timeLeft.minutes} label="Minutes" />
              <TimeBox value={timeLeft.seconds} label="Seconds" />
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 -mt-12 relative z-10">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8 md:p-10">
          <div className="grid lg:grid-cols-[1fr_420px] gap-10 items-center">
            <div>
              <span className="inline-flex rounded-full bg-[#E1F5EE] px-4 py-2 text-sm font-bold text-[#085041] mb-5">
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
                {launchFeatures.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#E1F5EE] text-[#085041]">
                      <Icon size={18} />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl p-7 text-white bg-[#085041]">
              <p className="text-sm uppercase tracking-widest font-bold text-[#9FE1CB] mb-3">
                Full Launch Access
              </p>

              <div className="flex items-end gap-2 mb-4">
                <span className="text-6xl font-black">$0</span>
                <span className="text-green-100 mb-2">during launch</span>
              </div>

              <p className="text-green-100 leading-7 mb-6">
                Claim your business now and unlock every premium tool while we
                prepare for public launch.
              </p>

              <Link
                href="/auth/signup?role=owner"
                className="block text-center rounded-2xl bg-white px-6 py-4 font-bold text-[#085041] hover:scale-[1.02] transition"
              >
                Get Launch Access
              </Link>
            </div>
          </div>
        </div>
      </section>

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
          {categories.map((cat) => (
            <div
              key={cat.name}
              className="bg-white border border-gray-100 rounded-3xl p-6 text-center hover:shadow-lg transition"
            >
              <div className="text-4xl mb-3">{cat.icon}</div>
              <p className="text-sm font-bold text-gray-800">{cat.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-20">
        <div className="rounded-3xl bg-white border border-gray-100 p-8 md:p-12 text-center">
          <MapPin size={34} className="mx-auto mb-5 text-[#1D9E75]" />

          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Built for the African diaspora.
          </h2>

          <p className="text-gray-600 leading-8 max-w-3xl mx-auto mb-8">
            Whether you are looking for jollof, African groceries, Ankara
            fabric, hair braiding, wellness products, music, art, or trusted
            local services — Markeetee is being built to help you find it faster.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/signup?role=customer"
              className="rounded-2xl px-7 py-4 font-bold text-white bg-[#1D9E75]"
            >
              Join Customer Waitlist
            </Link>

            <Link
              href="/auth/signup?role=owner"
              className="rounded-2xl px-7 py-4 font-bold text-[#085041] border border-gray-200 bg-white"
            >
              List My Business
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">
            © 2026 Markeetee. All rights reserved.
          </p>

          <div className="flex items-center gap-5 text-sm">
            <Link href="/about" className="text-gray-500 hover:text-[#1D9E75]">
              About
            </Link>
            <Link href="/privacy" className="text-gray-500 hover:text-[#1D9E75]">
              Privacy
            </Link>
            <Link href="/terms" className="text-gray-500 hover:text-[#1D9E75]">
              Terms
            </Link>
            <Link href="/contact" className="text-gray-500 hover:text-[#1D9E75]">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}

function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-white/10 border border-white/10 backdrop-blur p-4">
      <p className="text-3xl md:text-4xl font-black text-white">
        {String(value).padStart(2, '0')}
      </p>
      <p className="text-[11px] md:text-xs uppercase tracking-widest text-green-200 mt-1">
        {label}
      </p>
    </div>
  )
}