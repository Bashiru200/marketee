'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import UpgradeModal from '@/components/ui/UpgradeModal'

interface Props {
  className?: string
  style?:     React.CSSProperties
  children?:  React.ReactNode
}

export default function ListBusinessButton({ className, style, children }: Props) {
  const router   = useRouter()
  const supabase = createClient()
  const { isOwner, isLoggedIn, profile, user } = useAuth()
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [upgrading,   setUpgrading]   = useState(false)

  // ── Not logged in → go to signup ──
  if (!isLoggedIn) {
    return (
      <Link href="/auth/signup" className={className} style={style}>
        {children ?? 'List your business'}
      </Link>
    )
  }

  // ── Logged in as customer → upgrade role then go to business form ─────
  // Label changes to "Upgrade your business" since they already have an
  // account — they're upgrading, not signing up for the first time.
  if (!isOwner) {
    async function handleUpgrade() {
      if (!user) return
      setUpgrading(true)
      await supabase.from('profiles')
        .update({ role: 'owner' })
        .eq('id', user.id)
      router.push('/businesses/new')
      router.refresh()
    }

    return (
      <button
        type="button"
        onClick={handleUpgrade}
        disabled={upgrading}
        className={className}
        style={style}
      >
        {upgrading
          ? <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" /> Setting up…</span>
          : (children ?? 'Upgrade your business')
        }
      </button>
    )
  }

  // ── Owner, no business listed yet → go straight to setup form ─────────
  // Label says "Add your business" — they're an owner but haven't listed
  // their business yet, so "add" is more accurate than "list" or "upgrade".
  if (!profile?.business_id) {
    return (
      <Link href="/businesses/new" className={className} style={style}>
        {children ?? 'Add your business'}
      </Link>
    )
  }

  // ── Owner with a business, not premium → show upgrade modal ───────────
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

  // ── Owner, has business, already premium → go to dashboard ────────────
  return (
    <Link href="/dashboard" className={className} style={style}>
      {children ?? 'Go to dashboard'}
    </Link>
  )
}