'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Footer from '@/components/layout/Footer'

// Routes where the footer should be hidden
const HIDDEN_ON = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/callback',
  '/auth/error',
  '/auth/welcome',
  '/account/onboarding',
  '/invite/accept',
  '/coming-soon',
  '/map',
]

export default function FooterWrapper() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // On first paint (server + hydration), render nothing to avoid mismatch.
  // After mount, decide based on pathname.
  if (!mounted) return null

  const hidden = HIDDEN_ON.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  )
  if (hidden) return null

  return <Footer />
}