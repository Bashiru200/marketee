'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { UserX, Check, MapPin, Loader2 } from 'lucide-react'

const INTERESTS = [
  { icon:'🍲', label:'Food & Groceries' }, { icon:'🍽️', label:'Restaurants' },
  { icon:'👗', label:'Fashion & Fabric' }, { icon:'💆', label:'Beauty & Hair' },
  { icon:'🌿', label:'Herbs & Wellness' }, { icon:'🎵', label:'Music & Arts' },
]

function WelcomeContent() {
  const router   = useRouter()
  const params   = useSearchParams()
  const supabase = createClient()

  const cameFromLogin  = params.get('new') === 'true'
  const needsOnboarding = params.get('onboarding') === '1'

  const [loadingUser, setLoadingUser] = useState(true)
  const [user,        setUser]        = useState<any>(null)
  const [creating,    setCreating]    = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')
  const [chosenRole,  setChosenRole]   = useState<'customer' | 'owner'>('customer')

  // Onboarding fields
  const [origin,    setOrigin]    = useState<'african' | 'non_african'>('african')
  const [interests, setInterests] = useState<string[]>([])
  const [city,      setCity]      = useState('')

  // 'no-account' | 'onboarding'
  const [stage, setStage] = useState<'no-account' | 'onboarding'>(
    needsOnboarding ? 'onboarding' : 'no-account'
  )

  useEffect(() => {
    async function loadUserAndPrefill() {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)

      // Pre-fill from any previously saved profile data rather than blank —
      // covers the case where a user already has partial data saved.
      if (data.user) {
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
      }

      setLoadingUser(false)
    }

    loadUserAndPrefill()
  }, [])

  function toggleInterest(label: string) {
    setInterests(p => p.includes(label) ? p.filter(i => i !== label) : [...p, label])
  }

  // ── Create an account for a Google sign-in that had no profile ──────────
  // Respects whichever role they choose on this screen (Customer or
  // Business owner), since the original login click had no role context.
  async function createAccount() {
    if (!user) return
    setCreating(true)
    setError('')

    const fullName =
      user.user_metadata?.full_name ?? user.user_metadata?.name ?? ''

    const { error: upsertError } = await supabase.from('profiles').upsert({
      id:     user.id,
      name:   fullName,
      email:  user.email,
      role:   chosenRole,
      origin: 'african',
    })

    if (upsertError) {
      setError(upsertError.message)
      setCreating(false)
      return
    }

    // Log signup event (best-effort)
    try {
      await fetch('/api/auth-event', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          userId:    user.id,
          eventType: 'signup',
          metadata:  { role: chosenRole, via: 'google', recovered_from_login: true },
        }),
      })
    } catch {}

    setCreating(false)

    // Owners go straight to the business form, not customer onboarding
    if (chosenRole === 'owner') {
      router.push('/business/new?welcome=1')
      return
    }
    setStage('onboarding')
  }

  // ── Finish onboarding — save preferences and continue ────────────────────
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

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
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

        {/* ── Stage: no account found ── */}
        {stage === 'no-account' && (
          <>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#FEF3C7' }}>
              <UserX size={24} style={{ color: '#D97706' }} />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 text-center mb-2">
              No account found
            </h1>
            <p className="text-sm text-gray-500 text-center mb-1 leading-relaxed">
              We couldn&apos;t find a Markeetee account for
            </p>
            <p className="text-sm font-semibold text-gray-900 text-center mb-6">
              {user?.email}
            </p>
            <p className="text-sm text-gray-500 text-center mb-4 leading-relaxed">
              It looks like this is your first time signing in with Google.
              How would you like to use Markeetee?
            </p>

            {/* Role picker */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              {[
                { value:'customer', label:'Customer',       desc:'Browse businesses', icon:'🛍️' },
                { value:'owner',    label:'Business owner', desc:'List my business',  icon:'🏪' },
              ].map(r => (
                <button key={r.value} type="button"
                  onClick={() => setChosenRole(r.value as 'customer' | 'owner')}
                  className="flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 text-center transition-all"
                  style={chosenRole === r.value
                    ? { borderColor:'#1D9E75', background:'#f0faf6' }
                    : { borderColor:'#E5E7EB' }
                  }>
                  <span className="text-2xl">{r.icon}</span>
                  <span className="text-sm font-semibold text-gray-900">{r.label}</span>
                  <span className="text-xs text-gray-400">{r.desc}</span>
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-100">{error}</div>
            )}

            <button
              onClick={createAccount}
              disabled={creating}
              className="w-full py-2.5 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors mb-3"
              style={{ background: '#1D9E75' }}
            >
              {creating ? 'Creating account…' : 'Create my free account'}
            </button>

            <button
              onClick={signOut}
              className="w-full py-2.5 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Not you? Sign out
            </button>
          </>
        )}

        {/* ── Stage: onboarding (after account created) ── */}
        {stage === 'onboarding' && (
          <>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#E1F5EE' }}>
              <Check size={24} style={{ color: '#0F6E56' }} />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 text-center mb-1">
              Welcome to Markeetee!
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

            {/* City */}
            <div className="mb-6">
              <label className={labelCls}>Your city</label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input type="text" value={city} onChange={e => setCity(e.target.value)}
                  placeholder="Enter your city" className={`${inputCls} pl-9`} />
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

            <button
              onClick={() => router.push('/search')}
              className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 mt-2 transition-colors"
            >
              Skip for now
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function WelcomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={28} className="animate-spin" style={{ color: '#1D9E75' }} />
      </div>
    }>
      <WelcomeContent />
    </Suspense>
  )
}