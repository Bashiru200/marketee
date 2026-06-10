'use client'
import { useEffect, useState } from 'react'
import { Heart, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'

interface Props {
  businessId: string
  size?: 'sm' | 'md'
}

export default function SaveButton({ businessId, size = 'md' }: Props) {
  const supabase   = createClient()
  const router     = useRouter()
  const { user, isLoggedIn } = useAuth()
  const [saved,    setSaved]    = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [saveId,   setSaveId]   = useState<string | null>(null)

  useEffect(() => {
    if (!isLoggedIn || !user) return
    supabase
      .from('saved_businesses')
      .select('id')
      .eq('user_id', user.id)
      .eq('business_id', businessId)
      .single()
      .then((result: any ) => {
        const { data } = result
        if (data) { setSaved(true); setSaveId(data.id) }
      })
  }, [isLoggedIn, user, businessId])

  async function toggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (!isLoggedIn) {
      router.push('/auth/login')
      return
    }

    setLoading(true)

    if (saved && saveId) {
      await supabase.from('saved_businesses').delete().eq('id', saveId)
      setSaved(false)
      setSaveId(null)
    } else {
      const { data } = await supabase
        .from('saved_businesses')
        .insert({ user_id: user!.id, business_id: businessId })
        .select('id')
        .single()
      if (data) { setSaved(true); setSaveId(data.id) }
    }

    setLoading(false)
  }

  const btnSize = size === 'sm'
    ? 'w-7 h-7'
    : 'w-9 h-9'
  const iconSize = size === 'sm' ? 13 : 16

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={saved ? 'Remove from saved' : 'Save business'}
      className={`${btnSize} rounded-full flex items-center justify-center transition-all hover:scale-110 disabled:cursor-not-allowed flex-shrink-0`}
      style={{
        background: saved ? '#ff4d6d' : 'rgba(255,255,255,0.92)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
      }}
    >
      {loading
        ? <Loader2 size={iconSize} className="animate-spin" style={{ color: saved ? 'white' : '#9ca3af' }} />
        : <Heart
            size={iconSize}
            className={saved ? 'fill-current' : ''}
            style={{ color: saved ? 'white' : '#9ca3af' }}
          />
      }
    </button>
  )
}