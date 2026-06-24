'use client'
/**
 * lib/useLocale.ts
 * Client-side hook for reading translations and switching locale.
 * Usage:
 *   const { t, locale, setLocale } = useLocale()
 *   <p>{t('nav.explore')}</p>
 *   <button onClick={() => setLocale('fr')}>Français</button>
 */
import { useState, useEffect, useCallback } from 'react'
import type { Locale } from '@/i18n'

type Messages = Record<string, Record<string, string>>

const COOKIE_KEY = 'markeetee-locale'
const SUPPORTED  = ['en', 'fr'] as Locale[]

// Flat dot-notation getter: t('nav.explore') → messages.nav.explore
function get(messages: Messages, key: string): string {
  const parts = key.split('.')
  let current: any = messages
  for (const part of parts) {
    if (!current || typeof current !== 'object') return key
    current = current[part]
  }
  return typeof current === 'string' ? current : key
}

// Simple template substitution: t('validation.required', { field: 'Email' })
function interpolate(str: string, vars?: Record<string, string>): string {
  if (!vars) return str
  return str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`)
}

export function useLocale() {
  const [locale,   setLocaleState] = useState<Locale>('en')
  const [messages, setMessages]    = useState<Messages>({})
  const [loading,  setLoading]     = useState(true)

  useEffect(() => {
    async function detectAndLoad() {
      // Check cookie first
      const cookie = document.cookie
        .split(';')
        .find(c => c.trim().startsWith(`${COOKIE_KEY}=`))
        ?.split('=')[1]

      let detected: Locale = 'en'

      if (cookie && SUPPORTED.includes(cookie as Locale)) {
        detected = cookie as Locale
      } else {
        // Use browser language
        const lang = navigator.language.split('-')[0].toLowerCase()
        if (SUPPORTED.includes(lang as Locale)) {
          detected = lang as Locale
        }
      }

      const msgs = await import(`@/i18n/messages/${detected}.json`)
      setLocaleState(detected)
      setMessages(msgs.default)
      setLoading(false)
    }

    detectAndLoad()
  }, [])

  const setLocale = useCallback(async (newLocale: Locale) => {
    if (!SUPPORTED.includes(newLocale)) return

    // Save preference as cookie (1 year)
    document.cookie = `${COOKIE_KEY}=${newLocale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`

    const msgs = await import(`@/i18n/messages/${newLocale}.json`)
    setLocaleState(newLocale)
    setMessages(msgs.default)
  }, [])

  const t = useCallback((key: string, vars?: Record<string, string>): string => {
    const raw = get(messages, key)
    return interpolate(raw, vars)
  }, [messages])

  return { t, locale, setLocale, loading }
}