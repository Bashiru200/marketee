'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Check, MapPin, User } from 'lucide-react'

export const dynamic = 'force-dynamic'

const INTERESTS = [
  { icon:'🍲', label:'Food & Groceries' }, { icon:'🍽️', label:'Restaurants' },
  { icon:'👗', label:'Fashion & Fabric' }, { icon:'💆', label:'Beauty & Hair' },
  { icon:'🌿', label:'Herbs & Wellness' }, { icon:'🎵', label:'Music & Arts' },
]

function OnboardingContent() {
  const router   = useRouter()
  const params   = useSearchParams()
  const supabase = createClient()

  const isWelcome = params.get('welcome') === '1'

  const [loadingUser, setLoadingUser] = useState(true)
  const [user,        setUser]        = useState<any>(null)
  const [saving,      setSaving]      = useState(false)

  const [origin,    setOrigin]    = useState<'african' | 'non_african'>('african')
  const [interests, setInterests] = useState<string[]>([])
  const [city,      setCity]      = useState('')

  useEffect(() => {
    async function loadUserAndPrefill() {
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        router.push('/auth/login')
        return
      }
      setUser(data.user)

      // ── Pre-fill from previously saved profile, not blank ──────────────
      const { data: profile } = await supabase
        .from('profiles')
        .select('city, origin, interests')
        .eq('id', data.user.id)
        .single()

      if (profile) {
        if (profile.city)   setCity(profile.city)
        if (profile.origin) setOrigin(profile.origin as 'african' | 'non_african')
        if (profile.interests?.length) setInterests(profile.interests)
      }

      setLoadingUser(false)
    }

    loadUserAndPrefill()
  }, [])

  function toggleInterest(label: string) {
    setInterests(p => p.includes(label) ? p.filter(i => i !== label) : [...p, label])
  }

  async function finishOnboarding() {
    if (!user) return
    setSaving(true)

    await supabase.from('profiles')
      .update({ origin, interests, city: city || null })
      .eq('id', user.id)

    setSaving(false)
    router.push('/search')
    router.refresh()
  }

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={28} className="animate-spin" style={{ color: '#1D9E75' }} />
      </div>
    )
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:border-transparent transition-all"
  const labelCls = "block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5"

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl p-8">

        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#E1F5EE' }}>
          <User size={24} style={{ color: '#0F6E56' }} />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 text-center mb-1">
          {isWelcome ? 'Welcome to Markeetee!' : 'Update your preferences'}
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Just a couple quick things to personalise your experience
        </p>

        {/* Background toggle */}
        <div className="mb-4">
          <label className={labelCls}>Background</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value:'african',     label:'African / diaspora', icon:'🌍' },
              { value:'non_african', label:'Non-African',         icon:'🌐' },
            ].map(o => (
              <button key={o.value} type="button"
                onClick={() => setOrigin(o.value as 'african' | 'non_african')}
                className="flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all text-left"
                style={origin === o.value
                  ? { borderColor:'#1D9E75', background:'#f0faf6', color:'#085041' }
                  : { borderColor:'#E5E7EB', color:'#6B7280' }
                }>
                <span className="text-xl">{o.icon}</span>
                <span className="text-xs leading-tight">{o.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div className="mb-4">
          <label className={labelCls}>What are you looking for?</label>
          <div className="grid grid-cols-2 gap-2">
            {INTERESTS.map(({ icon, label }) => {
              const active = interests.includes(label)
              return (
                <button key={label} type="button" onClick={() => toggleInterest(label)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left"
                  style={{
                    borderColor: active ? '#1D9E75' : undefined,
                    background:  active ? '#f0faf6' : undefined,
                    color:       active ? '#085041' : undefined,
                  }}>
                  <span>{icon}</span>
                  <span className="text-xs">{label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* City — pre-filled from saved profile, not blank */}
        <div className="mb-6">
          <label className={labelCls}>Your city</label>
          <div className="relative">
            <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input type="text" value={city} onChange={e => setCity(e.target.value)}
              placeholder="e.g. Houston" className={`${inputCls} pl-9`} />
          </div>
        </div>

        <button
          onClick={finishOnboarding}
          disabled={saving}
          className="w-full py-2.5 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors"
          style={{ background: '#1D9E75' }}
        >
          {saving ? 'Saving…' : 'Start exploring'}
        </button>

        {isWelcome && (
          <button
            onClick={() => router.push('/search')}
            className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 mt-2 transition-colors"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  )
}

export default function AccountOnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={28} className="animate-spin" style={{ color: '#1D9E75' }} />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}