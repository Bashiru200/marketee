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
      dot:        'bg-green-500',
      badge:      'Open',
      badgeStyle: { background: '#E1F5EE', color: '#085041' },
      // Short detail for mobile, full for desktop
      detailShort: label.replace('Open · ', '').split('–')[0].trim(), // e.g. "Closes 9 PM"
      detailFull:  label.replace('Open · ', ''),
    },
    closing_soon: {
      dot:        'bg-amber-400 animate-pulse',
      badge:      'Closing soon',
      badgeStyle: { background: '#FEF3C7', color: '#92400E' },
      detailShort: closingIn && closingIn <= 60 ? `${closingIn}m left` : '',
      detailFull:  `${label.replace('Closing soon · ', '')}${closingIn && closingIn <= 30 ? ` · ${closingIn}m left` : ''}`,
    },
    closed: {
      dot:        'bg-gray-400',
      badge:      'Closed',
      badgeStyle: { background: '#d51d1d', color: '#af0d0d' },
      detailShort: '', // remove detail on mobile when closed — "Closed" says enough
      detailFull:  label.replace('Closed · ', ''),
    },
  }

  const cfg = statusConfig[status]

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

      {/* ── Status row ── */}
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
        aria-expanded={expanded}>

        <div className="flex items-center gap-2 min-w-0">
          {/* Status dot */}
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />

          {/* Badge — always visible */}
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
            style={cfg.badgeStyle}>
            {cfg.badge}
          </span>

          {/* Detail — short on mobile, full on sm+ */}
          {cfg.detailShort && (
            <span className="text-xs text-gray-500 truncate sm:hidden">
              {cfg.detailShort}
            </span>
          )}
          {cfg.detailFull && (
            <span className="text-sm text-gray-500 truncate hidden sm:inline">
              {cfg.detailFull}
            </span>
          )}
        </div>

        {/* Chevron */}
        <ChevronDown
          size={15}
          className="text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* ── Expanded day list ── */}
      {expanded && (
        <div className="border-t border-gray-100">
          {DAY_ORDER.map(day => {
            const isToday = day === todayFull
            const dayOpen = !daysOpen || daysOpen.length === 0 || daysOpen.includes(day)
            const abbr    = DAY_ABBR[day]

            return (
              <div
                key={day}
                className="flex items-center justify-between px-4 py-2 text-sm"
                style={isToday ? { background: '#EFF6FF' } : {}}>
                <span
                  className="font-medium flex-shrink-0"
                  style={{ color: isToday ? '#2563EB' : '#374151', width: '2.5rem' }}>
                  {abbr}
                </span>
                <span
                  className="text-right text-xs sm:text-sm"
                  style={{
                    color:      !dayOpen ? '#9CA3AF' : isToday ? '#2563EB' : '#374151',
                    fontStyle:  !dayOpen ? 'italic' : 'normal',
                    fontWeight: isToday  ? 500      : 400,
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