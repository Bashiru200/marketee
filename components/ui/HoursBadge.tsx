'use client'
import { useEffect, useState } from 'react'
import { getHoursStatus } from '@/lib/businessHours'

interface Props {
  hoursOpen?: string | null
  daysOpen?:  string[] | null
  size?:      'sm' | 'md'
}

export default function HoursBadge({ hoursOpen, daysOpen, size = 'sm' }: Props) {
  // Re-evaluate every minute so the badge updates when the business opens/closes
  const [tick, setTick] = useState(0)

  useEffect(() => {
    // Align the first tick to the next full minute boundary
    const now      = new Date()
    const msToNext = (60 - now.getSeconds()) * 1000 - now.getMilliseconds()
    const timeout  = setTimeout(() => {
      setTick(t => t + 1)
      // Then tick every full minute
      const interval = setInterval(() => setTick(t => t + 1), 60_000)
      return () => clearInterval(interval)
    }, msToNext)
    return () => clearTimeout(timeout)
  }, [])

  if (!hoursOpen) return null

  // Re-computed on every tick
  const { status, label, closingIn } = getHoursStatus(hoursOpen, daysOpen)
  if (status === 'unknown') return null

  const styles = {
    open:         { bg: '#f0faf6', text: '#085041', dot: '#1D9E75' },
    closing_soon: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
    closed:       { bg: '#F9FAFB', text: '#6B7280', dot: '#D1D5DB' },
  }

  const s       = styles[status] ?? styles.closed
  const textSize = size === 'md' ? '13px' : '11px'
  const dotSize  = size === 'md' ? '7px'  : '6px'
  const padding  = size === 'md' ? '5px 10px' : '3px 8px'

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap"
      style={{ background: s.bg, color: s.text, fontSize: textSize, padding }}
    >
      {/* Pulsing dot for closing soon */}
      {status === 'closing_soon' ? (
        <span className="relative flex-shrink-0" style={{ width: dotSize, height: dotSize }}>
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ background: s.dot }}
          />
          <span
            className="relative inline-flex rounded-full"
            style={{ width: dotSize, height: dotSize, background: s.dot }}
          />
        </span>
      ) : (
        <span
          className="flex-shrink-0 rounded-full"
          style={{ width: dotSize, height: dotSize, background: s.dot }}
        />
      )}

      {label}

      {/* Show minutes remaining when very close to closing */}
      {status === 'closing_soon' && closingIn !== undefined && closingIn <= 30 && (
        <span style={{ opacity: 0.7 }}>· {closingIn}m left</span>
      )}
    </span>
  )
}