// components/ui/TrackedAction.tsx
// Drop-in wrappers that auto-log events. No boilerplate needed.
'use client'

import type { CSSProperties, MouseEvent, ReactNode } from 'react'
import { useEventTracking, EventType } from '@/lib/hooks/useEventTracking'

interface TrackedButtonProps {
  businessId:  string
  type:        EventType
  city?:       string | null
  category?:   string | null
  onClick?:    () => void | Promise<void>
  className?:  string
  style?:      CSSProperties
  children:    ReactNode
  disabled?:   boolean
}

/**
 * Button that logs an event when clicked, then runs your onClick handler.
 *
 * @example
 * <TrackedButton businessId={biz.id} type="save"
 *   city={biz.city} category={biz.category}
 *   onClick={handleSave}>
 *   ❤️ Save
 * </TrackedButton>
 */
export function TrackedButton({
  businessId, type, city, category, onClick, className, style, children, disabled,
}: TrackedButtonProps) {
  const { track } = useEventTracking(businessId, { city, category })

  async function handleClick() {
    if (disabled) return
    await track(type)
    await onClick?.()
  }

  return (
    <button onClick={handleClick} disabled={disabled} className={className} style={style}>
      {children}
    </button>
  )
}

interface TrackedLinkProps {
  businessId:  string
  type:        EventType
  href:        string
  city?:       string | null
  category?:   string | null
  target?:     string
  rel?:        string
  className?:  string
  style?:      CSSProperties
  children:    ReactNode
}

/**
 * Anchor tag that logs an event before navigating.
 * Perfect for phone (tel:), WhatsApp (wa.me), website, directions links.
 *
 * @example
 * <TrackedLink businessId={biz.id} type="call"
 *   href={`tel:${biz.phone}`} city={biz.city}>
 *   📞 Call
 * </TrackedLink>
 */
export function TrackedLink({
  businessId, type, href, city, category, target, rel, className, style, children,
}: TrackedLinkProps) {
  const { track } = useEventTracking(businessId, { city, category })

  async function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const shouldOpenNewContext = target === '_blank' || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
    if (shouldOpenNewContext) {
      void track(type)
      return
    }

    event.preventDefault()
    await Promise.race([
      track(type),
      new Promise((resolve) => setTimeout(resolve, 250)),
    ])
    window.location.href = href
  }

  return (
    <a href={href} target={target} rel={rel}
      onClick={handleClick} className={className} style={style}>
      {children}
    </a>
  )
}

/**
 * Auto-track a `view` event on mount. Place inside any business page.
 * Includes a 2-second delay so bounces don't count.
 *
 * @example
 * <ViewTracker businessId={biz.id} city={biz.city} category={biz.category} />
 */
export function ViewTracker({
  businessId, city, category,
}: {
  businessId: string
  city?:      string | null
  category?:  string | null
}) {
  useEventTracking(businessId, { autoView: true, city, category })
  return null
}
