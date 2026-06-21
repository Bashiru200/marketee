import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import FooterWrapper from '@/components/layout/FooterWrapper'
import { AuthProvider } from '@/lib/auth'
import AnnouncementBanner  from '@/components/ui/AnnouncementBanner'
import MobileBottomNav     from '@/components/ui/MobileBottomNav'
import LocationPrompt      from '@/components/ui/LocationPrompt'
import CookieBanner from '@/components/ui/CookieBanner'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://markeetee.com'

export const metadata: Metadata = {
  title: {
    default:  'Markeetee — African Businesses for the Diaspora',
    template: '%s — Markeetee',
  },
  description: 'Discover African-owned grocery stores, restaurants, fashion, beauty salons, and more across the USA. Built for the African diaspora.',
  icons: {
    icon: '/favicon.ico',
  },
  metadataBase: new URL(APP_URL),
  openGraph: {
    siteName:    'Markeetee',
    type:        'website',
    locale:      'en_US',
    title:       'Markeetee — African Businesses for the Diaspora',
    description: 'Discover African-owned businesses across the USA. Built for the diaspora.',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Markeetee' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Markeetee — African Businesses for the Diaspora',
    description: 'Discover African-owned businesses across the USA.',
    images:      ['/og-default.png'],
  },
  keywords: [
    'African businesses', 'African diaspora', 'Nigerian businesses USA',
    'African food Houston', 'African restaurant', 'African grocery store',
    'African fashion', 'African beauty salon', 'African market',
  ],
}

// Inline script runs synchronously before first paint —
// reads localStorage and applies dark class before React hydrates.
// suppressHydrationWarning prevents mismatch warning on <html>.
const darkModeScript = `
(function(){
  try {
    var mode = localStorage.getItem('markeetee-dark-mode');
    if (mode === 'true') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  } catch(e) {}
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: darkModeScript }} />
      </head>
      <body>
        <AuthProvider>
          <Navbar />
          <AnnouncementBanner />
          <main>{children}</main>
          <FooterWrapper />
          <MobileBottomNav />
          <LocationPrompt />
          <CookieBanner />
        </AuthProvider>
      </body>
    </html>
  )
}