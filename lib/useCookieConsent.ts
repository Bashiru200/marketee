'use client'
import { useState, useEffect } from 'react'

interface CookieConsent {
  essential: boolean
  analytics: boolean
  marketing: boolean
  timestamp?: number
}

const STORAGE_KEY = 'markeetee-cookie-consent'

export function useCookieConsent(): CookieConsent | null {
  const [consent, setConsent] = useState<CookieConsent | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setConsent(JSON.parse(saved))
    } catch {}
  }, [])

  return consent
}

// Call this anywhere to check a specific category
export function hasConsent(category: keyof CookieConsent): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return false
    const parsed = JSON.parse(saved)
    return Boolean(parsed[category])
  } catch {
    return false
  }
}