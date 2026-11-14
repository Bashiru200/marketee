// lib/hooks/useEventTracking.ts
// Client-side hook for tracking user events — feeds the discovery_score algorithm
// Logs to the user_events table so analytics, personalization, and freshness
// signals all flow from the same source of truth.
'use client'

import { useEffect, useCallback, useMemo, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'

export type EventType =
  | 'view'          // business page opened
  | 'call'          // phone number tapped
  | 'directions'    // directions / map button tapped
  | 'save'          // business saved/favorited
  | 'share'         // share button tapped
  | 'enquiry'       // enquiry form submitted
  | 'website'       // external website link tapped
  | 'whatsapp'      // WhatsApp button tapped
  | 'review_submit' // left a review

export type EventSource =
  | 'search'
  | 'map'
  | 'home'
  | 'blog'
  | 'city-page'
  | 'category-page'
  | 'direct'
  | 'referral'

interface TrackEventPayload {
  businessId:  string
  type:        EventType
  city?:       string | null
  category?:   string | null
  source?:     EventSource
}

// Session ID — persists in sessionStorage so the same tab stays attributed
function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr'
  let sid = sessionStorage.getItem('markeetee_session_id')
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    sessionStorage.setItem('markeetee_session_id', sid)
  }
  return sid
}

// Source attribution — reads from URL ?src= param or referrer
function inferSource(pathname: string, searchParams?: URLSearchParams): EventSource {
  const explicit = searchParams?.get('src') as EventSource | null
  if (explicit) return explicit

  if (pathname === '/')                    return 'home'
  if (pathname.startsWith('/search'))      return 'search'
  if (pathname.startsWith('/map'))         return 'map'
  if (pathname.startsWith('/blog'))        return 'blog'
  if (pathname.startsWith('/invite/'))     return 'referral'

  // Match /[city] (single-segment city landing pages)
  if (/^\/[a-z-]+$/.test(pathname)) return 'city-page'

  // Match /[city]/[category]
  if (/^\/[a-z-]+\/[a-z-]+$/.test(pathname)) return 'category-page'

  return 'direct'
}

/**
 * Hook to track user events. Returns a `track()` function you call on clicks.
 * Also auto-tracks `view` events when businessId is provided and autoView is true.
 *
 * @example
 * const { track } = useEventTracking(biz.id, { autoView: true })
 *
 * <button onClick={() => {
 *   track('call', { city: biz.city, category: biz.category })
 *   window.location.href = `tel:${biz.phone}`
 * }}>
 *   Call
 * </button>
 */
export function useEventTracking(
  businessId?: string | null,
  options: { autoView?: boolean; city?: string | null; category?: string | null } = {}
) {
  const supabase  = useMemo(() => createClient(), [])
  const pathname  = usePathname()
  const { user }  = useAuth()
  const userId = user?.id ?? null
  const viewLogged = useRef(false)

  // Core tracking function
  const track = useCallback(async (
    type: EventType,
    extra: Partial<TrackEventPayload> = {}
  ) => {
    const bizId = extra.businessId ?? businessId
    if (!bizId) return

    try {
      const searchParams = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search)
        : undefined

      await supabase.from('user_events').insert({
        user_id:     userId,
        session_id:  getSessionId(),
        business_id: bizId,
        event_type:  type,
        city:        extra.city     ?? options.city     ?? null,
        category:    extra.category ?? options.category ?? null,
        source:      extra.source ?? inferSource(pathname, searchParams),
        user_agent:  typeof window !== 'undefined' ? navigator.userAgent.slice(0, 200) : null,
      })
    } catch (err) {
      // Silently fail — tracking should never break the user experience
      if (process.env.NODE_ENV === 'development') {
        console.warn('[useEventTracking] Failed to log event:', err)
      }
    }
  }, [supabase, userId, businessId, pathname, options.city, options.category])

  // Auto-log a view event when mounted (if autoView=true)
  useEffect(() => {
    if (!options.autoView || !businessId || viewLogged.current) return
    viewLogged.current = true
    // Small delay to avoid counting bounces as views (require 2+ sec on page)
    const timer = setTimeout(() => { track('view') }, 2000)
    return () => clearTimeout(timer)
  }, [businessId, options.autoView, track])

  return { track }
}
