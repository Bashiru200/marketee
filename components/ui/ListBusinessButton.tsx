'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import UpgradeModal from '@/components/ui/UpgradeModal'

interface Props {
  className?: string
  style?:     React.CSSProperties
  children?:  React.ReactNode
}

export default function ListBusinessButton({ className, style, children }: Props) {
  const { isOwner, isLoggedIn, profile } = useAuth()
  const [showUpgrade, setShowUpgrade] = useState(false)

  // Not logged in → go to signup
  if (!isLoggedIn) {
    return (
      <Link href="/auth/signup" className={className} style={style}>
        {children ?? 'List your business'}
      </Link>
    )
  }

  // Logged in as owner → show upgrade modal if not premium
  if (isOwner) {
    const isPremium = (profile as any)?.premium === true
    if (!isPremium) {
      return (
        <>
          <button
            type="button"
            onClick={() => setShowUpgrade(true)}
            className={className}
            style={style}
          >
            {children ?? 'Upgrade your listing'}
          </button>
          {showUpgrade && (
            <UpgradeModal
              onClose={() => setShowUpgrade(false)}
              businessName={profile?.name ?? undefined}
            />
          )}
        </>
      )
    }
    // Already premium → go to dashboard
    return (
      <Link href="/dashboard" className={className} style={style}>
        {children ?? 'Go to dashboard'}
      </Link>
    )
  }

  // Logged in as customer → go to signup as owner
  return (
    <Link href="/auth/signup" className={className} style={style}>
      {children ?? 'List your business'}
    </Link>
  )
}