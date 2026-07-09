'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, Rocket, Clock } from 'lucide-react'

/**
 * CHANGE THIS DATE TO YOUR OFFICIAL LAUNCH DATE
 *
 * Example:
 * July 22, 2026 @ 11:59 PM
 */

const LAUNCH_DATE = new Date('2026-07-22T23:59:59')

export default function LaunchBanner() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  const [hidden, setHidden] = useState(false)
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('markeetee-launch-banner')

    if (dismissed === 'hidden') {
      setHidden(true)
    }

    const timer = setInterval(() => {
      const now = new Date().getTime()
      const distance = LAUNCH_DATE.getTime() - now

      if (distance <= 0) {
        clearInterval(timer)
        setExpired(true)
        return
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (distance % (1000 * 60 * 60 * 24)) /
            (1000 * 60 * 60)
        ),
        minutes: Math.floor(
          (distance % (1000 * 60 * 60)) /
            (1000 * 60)
        ),
        seconds: Math.floor(
          (distance % (1000 * 60)) /
            1000
        ),
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  function closeBanner() {
    localStorage.setItem(
      'markeetee-launch-banner',
      'hidden'
    )

    setHidden(true)
  }

  if (hidden || expired) return null

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background:
          'linear-gradient(90deg,#053528,#085041,#1D9E75)',
      }}
    >
      {/* Glow */}

      <div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            'radial-gradient(circle at center,#9FE1CB 0%,transparent 70%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 py-3">

        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">

          {/* LEFT */}

          <div className="flex items-center gap-4">

            <div className="relative">

              <div className="absolute inset-0 rounded-full animate-ping bg-green-300 opacity-40" />

              <div className="relative w-10 h-10 rounded-full bg-white flex items-center justify-center">

                <Rocket
                  size={18}
                  color="#085041"
                />

              </div>

            </div>

            <div>

              <div className="flex items-center gap-2 flex-wrap">

                <span className="text-white font-bold">
                  🚀 Launch Offer
                </span>

                <span className="text-green-200 text-sm">
                  All Premium Business Features are FREE
                </span>

              </div>

              <p className="text-green-100 text-sm mt-1">
                Join Markeetee before launch and unlock
                every Pro Store feature at absolutely no
                cost.
              </p>

            </div>

          </div>

          {/* CENTER COUNTDOWN */}

          <div className="flex items-center gap-3">

            <Clock
              size={18}
              className="text-green-200"
            />

            <div className="flex gap-2">

              <TimeBox
                value={timeLeft.days}
                label="Days"
              />

              <TimeBox
                value={timeLeft.hours}
                label="Hours"
              />

              <TimeBox
                value={timeLeft.minutes}
                label="Minutes"
              />

              <TimeBox
                value={timeLeft.seconds}
                label="Seconds"
              />

            </div>

          </div>

          {/* RIGHT */}

          <div className="flex items-center gap-3">

            <Link
              href="/launch"
              className="px-5 py-2.5 rounded-xl bg-white font-semibold transition hover:scale-105"
              style={{
                color: '#085041',
              }}
            >
              Claim Your Business
            </Link>

            <button
              onClick={closeBanner}
              className="text-green-200 hover:text-white transition"
            >
              <X size={18} />
            </button>

          </div>

        </div>

      </div>
    </div>
  )
}

function TimeBox({
  value,
  label,
}: {
  value: number
  label: string
}) {
  return (
    <div className="rounded-xl bg-white/10 backdrop-blur px-3 py-2 min-w-[65px] text-center border border-white/10">

      <p className="text-white font-bold text-lg">
        {String(value).padStart(2, '0')}
      </p>

      <p className="text-[11px] uppercase tracking-wider text-green-200">
        {label}
      </p>

    </div>
  )
}