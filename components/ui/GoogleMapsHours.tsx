'use client'
import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { getHoursStatus } from '@/lib/businessHours'

interface Props {
  hoursOpen: string | null | undefined
  daysOpen:  string[] | null | undefined
}

const DAY_ABBR: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
  Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
}
const DAY_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

export default function GoogleMapsHours({ hoursOpen, daysOpen }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [tick, setTick]         = useState(0)

  // Re-evaluate every minute
  useEffect(() => {
    const now    = new Date()
    const msLeft = (60 - now.getSeconds()) * 1000 - now.getMilliseconds()
    const t = setTimeout(() => {
      setTick(n => n + 1)
      const interval = setInterval(() => setTick(n => n + 1), 60_000)
      return () => clearInterval(interval)
    }, msLeft)
    return () => clearTimeout(t)
  }, [])

  if (!hoursOpen) return null

  const { status, label, closingIn } = getHoursStatus(hoursOpen, daysOpen)
  if (status === 'unknown') return null

  const todayFull = new Date().toLocaleDateString('en-US', { weekday: 'long' })

  const statusConfig = {
    open: {
      dot:       'bg-green-500',
      badge:     'Open',
      badgeCls:  'text-xs font-semibold px-2 py-0.5 rounded-full',
      badgeStyle:{ background: '#E1F5EE', color: '#085041' },
      detail:    label.replace('Open · ', ''),
    },
    closing_soon: {
      dot:       'bg-amber-400 animate-pulse',
      badge:     'Closing soon',
      badgeCls:  'text-xs font-semibold px-2 py-0.5 rounded-full',
      badgeStyle:{ background: '#FEF3C7', color: '#92400E' },
      detail:    `${label.replace('Closing soon · ', '')}${closingIn && closingIn <= 30 ? ` · ${closingIn}m left` : ''}`,
    },
    closed: {
      dot:       'bg-gray-400',
      badge:     'Closed',
      badgeCls:  'text-xs font-semibold px-2 py-0.5 rounded-full',
      badgeStyle:{ background: '#F3F4F6', color: '#6B7280' },
      detail:    label.replace('Closed · ', ''),
    },
  }

  const cfg = statusConfig[status]

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

      {/* ── Status row — always visible, toggles expanded ── */}
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
        aria-expanded={expanded}>

        <div className="flex items-center gap-2.5">
          {/* Dot */}
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
          {/* Badge */}
          <span className={cfg.badgeCls} style={cfg.badgeStyle}>
            {cfg.badge}
          </span>
          {/* Next event e.g. "Closes 9 PM" */}
          <span className="text-sm text-gray-500">{cfg.detail}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400 hidden sm:inline">
            {expanded ? 'Hide hours' : 'See hours'}
          </span>
          <ChevronDown
            size={16}
            className="text-gray-400 transition-transform duration-200 flex-shrink-0"
            style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </div>
      </button>

      {/* ── Expanded day list ── */}
      {expanded && (
        <div className="border-t border-gray-100">
          {DAY_ORDER.map(day => {
            const isToday  = day === todayFull
            const dayOpen  = !daysOpen || daysOpen.length === 0 || daysOpen.includes(day)
            const abbr     = DAY_ABBR[day]

            return (
              <div
                key={day}
                className="flex items-center justify-between px-5 py-2.5 text-sm"
                style={isToday ? { background: '#EFF6FF' } : {}}
              >
                <span
                  className="font-medium w-24 flex-shrink-0"
                  style={{ color: isToday ? '#2563EB' : '#374151' }}>
                  {abbr}{isToday && ' ·'}
                </span>
                <span
                  className="text-right"
                  style={{
                    color:      !dayOpen ? '#9CA3AF' : isToday ? '#2563EB' : '#374151',
                    fontStyle:  !dayOpen ? 'italic'  : 'normal',
                    fontWeight: isToday  ? 500       : 400,
                  }}>
                  {!dayOpen ? 'Closed' : hoursOpen}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}