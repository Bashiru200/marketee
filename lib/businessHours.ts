/**
 * businessHours.ts
 * Parses hours_open strings like "9:00 AM – 6:00 PM" and returns
 * the current open/closing status of a business.
 */

export type HoursStatus = 'open' | 'closing_soon' | 'closed' | 'unknown'

export interface HoursResult {
  status:       HoursStatus
  label:        string      // human-readable e.g. "Open · Closes 6 PM" or "Closing soon · 6 PM"
  closingIn?:   number      // minutes until closing, only when closing_soon
  opensAt?:     string      // next opening time, only when closed
}

const SOON_MINUTES = 60 // show "Closing soon" if within this many minutes of closing

/**
 * Parse a time string like "9:00 AM", "9 AM", "21:00" into
 * total minutes since midnight.
 */
function parseTime(raw: string): number | null {
  if (!raw) return null
  const cleaned = raw.trim().toUpperCase()

  // 12-hour with AM/PM: "9:00 AM", "9 AM", "12:30 PM"
  const ampm = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/)
  if (ampm) {
    let h = parseInt(ampm[1], 10)
    const m = parseInt(ampm[2] ?? '0', 10)
    const period = ampm[3]
    if (period === 'PM' && h !== 12) h += 12
    if (period === 'AM' && h === 12) h = 0
    return h * 60 + m
  }

  // 24-hour: "21:00", "09:30"
  const h24 = cleaned.match(/^(\d{1,2}):(\d{2})$/)
  if (h24) {
    return parseInt(h24[1], 10) * 60 + parseInt(h24[2], 10)
  }

  return null
}

/**
 * Format minutes-since-midnight back to a readable time like "6 PM" or "9:30 AM"
 */
function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  if (m === 0) return `${h12} ${period}`
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

/**
 * Parse a full hours string like "9:00 AM – 6:00 PM"
 * Handles separators: –, -, to, until
 */
function parseHoursRange(hoursStr: string): { open: number; close: number } | null {
  if (!hoursStr) return null

  // Split on common separators
  const parts = hoursStr.split(/\s*(?:–|-|to|until)\s*/i)
  if (parts.length < 2) return null

  const open  = parseTime(parts[0])
  const close = parseTime(parts[1])

  if (open === null || close === null) return null
  return { open, close }
}

/**
 * Check if today is an open day given the days_open array.
 * days_open stores abbreviated day names: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
 */
function isTodayOpen(daysOpen: string[] | null | undefined): boolean {
  if (!daysOpen || daysOpen.length === 0) return true // assume open if not specified
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const today = dayNames[new Date().getDay()]
  return daysOpen.includes(today)
}

/**
 * Main function — call this anywhere to get the status of a business.
 */
export function getHoursStatus(
  hoursOpen:  string | null | undefined,
  daysOpen?:  string[] | null,
): HoursResult {
  if (!hoursOpen) {
    return { status: 'unknown', label: '' }
  }

  // Check if today is an open day
  if (!isTodayOpen(daysOpen)) {
    return { status: 'closed', label: 'Closed today' }
  }

  const range = parseHoursRange(hoursOpen)
  if (!range) {
    return { status: 'unknown', label: hoursOpen }
  }

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  // Handle overnight businesses (e.g. closes at 2 AM next day)
  const isOvernight = range.close < range.open

  let isOpen: boolean
  let minutesUntilClose: number

  if (isOvernight) {
    isOpen = currentMinutes >= range.open || currentMinutes < range.close
    minutesUntilClose = currentMinutes >= range.open
      ? (24 * 60 - currentMinutes) + range.close
      : range.close - currentMinutes
  } else {
    isOpen = currentMinutes >= range.open && currentMinutes < range.close
    minutesUntilClose = range.close - currentMinutes
  }

  const closeLabel = formatTime(range.close)
  const openLabel  = formatTime(range.open)

  if (!isOpen) {
    // Before opening or after closing
    if (currentMinutes < range.open) {
      return {
        status:  'closed',
        label:   `Closed · Opens ${openLabel}`,
        opensAt: openLabel,
      }
    }
    return {
      status:  'closed',
      label:   `Closed · Opens ${openLabel} tomorrow`,
      opensAt: openLabel,
    }
  }

  if (minutesUntilClose <= SOON_MINUTES) {
    return {
      status:    'closing_soon',
      label:     `Closing soon · ${closeLabel}`,
      closingIn: minutesUntilClose,
    }
  }

  return {
    status: 'open',
    label:  `Open · Closes ${closeLabel}`,
  }
}