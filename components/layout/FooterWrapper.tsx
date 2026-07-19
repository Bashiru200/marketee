'use client'
import { usePathname } from 'next/navigation'
import Footer from '@/components/layout/Footer'

// Routes where the footer should be hidden — auth pages and onboarding
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

  // Hide footer if current path starts with any of the hidden routes
  const hidden = HIDDEN_ON.some(route => pathname === route || pathname.startsWith(route + '/'))

  if (hidden) return null
  return <Footer />
}