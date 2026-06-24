// i18n.ts — root level, next to next.config.js
import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'

export const locales   = ['en', 'fr'] as const
export const defaultLocale = 'en' as const

export type Locale = typeof locales[number]

export default getRequestConfig(async () => {
  // 1. Check if user has manually overridden via cookie
  const cookieStore = cookies()
  const cookieLang  = (await cookieStore).get('markeetee-locale')?.value

  if (cookieLang && locales.includes(cookieLang as Locale)) {
    const messages = (await import(`./i18n/messages/${cookieLang}.json`)).default
    return { locale: cookieLang, messages }
  }

  // 2. Auto-detect from browser Accept-Language header
  const headerStore     = headers()
  const acceptLanguage  = (await headerStore).get('accept-language') ?? ''

  // Parse Accept-Language: "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7"
  const preferred = acceptLanguage
    .split(',')
    .map(part => {
      const [lang, q] = part.trim().split(';q=')
      return { lang: lang.split('-')[0].toLowerCase(), q: parseFloat(q ?? '1') }
    })
    .sort((a, b) => b.q - a.q)
    .map(p => p.lang)

  const matched = preferred.find(lang => locales.includes(lang as Locale)) ?? defaultLocale

  const messages = (await import(`./i18n/messages/${matched}.json`)).default
  return { locale: matched, messages }
})