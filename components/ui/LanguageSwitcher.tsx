'use client'
import { useLocale } from '@/lib/useLocale'

export default function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale()

  return (
    <div className={`flex items-center gap-1 ${className ?? ''}`}>
      <button
        onClick={() => setLocale('en')}
        className="text-xs font-semibold px-2 py-1 rounded-lg transition-colors"
        style={locale === 'en'
          ? { background: '#1D9E75', color: 'white' }
          : { color: '#6B7280' }
        }
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        onClick={() => setLocale('fr')}
        className="text-xs font-semibold px-2 py-1 rounded-lg transition-colors"
        style={locale === 'fr'
          ? { background: '#1D9E75', color: 'white' }
          : { color: '#6B7280' }
        }
        aria-label="Passer en français"
      >
        FR
      </button>
    </div>
  )
}