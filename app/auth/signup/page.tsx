'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Mail, Lock, Eye, EyeOff, User, Building2,
  MapPin, ChevronLeft, Check
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import BusinessDetailsForm, {
  BusinessFormValues, EMPTY_BUSINESS_FORM, COUNTRIES,
} from '@/components/businesses/BusinessDetailsForm'

type Role = 'customer' | 'owner' | null
type Step = 0 | 1 | 2 | 3

const INTERESTS = [
  { icon:'🍲', label:'Food & Groceries' }, { icon:'🍽️', label:'Restaurants' },
  { icon:'👗', label:'Fashion & Fabric' }, { icon:'💆', label:'Beauty & Hair' },
  { icon:'🌿', label:'Herbs & Wellness' }, { icon:'🎵', label:'Music & Arts' },
]

export default function SignupPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [role,             setRole]             = useState<Role>(null)
  const [step,             setStep]             = useState<Step>(0)
  const [showPass,         setShowPass]         = useState(false)
  const [showConfirm,      setShowConfirm]      = useState(false)
  const [interests,        setInterests]        = useState<string[]>([])
  const [error,            setError]            = useState('')
  const [loading,          setLoading]          = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  const [form, setForm] = useState({
    name:'', email:'', password:'', confirmPassword:'',
    businessName:'', category:'', country:'',
    street:'', city:'', state:'', zip:'', phone:'',
    cover_image:'',
    // ── new fields ──
    gender:'',
    origin:'african',
  })

  function upd(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  function toggleInterest(label: string) {
    setInterests(p => p.includes(label) ? p.filter(i => i !== label) : [...p, label])
  }

  // ── Auth event logger ─────────────────────────────────────────────────
  async function logAuthEvent(
    userId: string,
    eventType: string,
    metadata?: Record<string, unknown>
  ) {
    try {
      await fetch('/api/auth-event', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId, eventType, metadata }),
      })
    } catch {} // never block signup for logging failures
  }

  // ── Google sign-up ────────────────────────────────────────────────────
  // Creates an account with the selected role (defaults to customer if
  // no role chosen yet). Handled in /auth/callback?intent=signup&role=...
  async function handleGoogleSignup() {
    const chosenRole = role ?? 'customer'
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback?intent=signup&role=${chosenRole}`,
      },
    })
  }

  // ── Step 1 → 2: create Supabase auth user ────────────────────────────
  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email:    form.email,
      password: form.password,
      options: {
        data: { name: form.name, role },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user && !data.session) {
      // Email confirmation required
      setConfirmationSent(true)
      setLoading(false)
      setStep(2)

      // Log signup event even without session
      await logAuthEvent(data.user.id, 'signup', {
        role,
        origin:  form.origin,
        gender:  form.gender  || null,
        country: form.country || null,
        requires_confirmation: true,
      })
      return
    }

    if (data.user && data.session) {
      await supabase.from('profiles').upsert({
        id:     data.user.id,
        name:   form.name,
        email:  form.email,
        role,
        gender: form.gender  || null,
        origin: form.origin  || 'african',
      })

      await logAuthEvent(data.user.id, 'signup', {
        role,
        origin:  form.origin,
        gender:  form.gender  || null,
        country: form.country || null,
      })
    }

    setLoading(false)
    setStep(2)
  }

  // ── Step 2 (owner): save business with geocoding ──────────────────────
  // Receives the full BusinessFormValues from <BusinessDetailsForm>
  async function handleSaveBusiness(values: BusinessFormValues) {
    setError('')
    setLoading(true)

    let lat: number | null = null
    let lng: number | null = null
    const addressStr = [values.street, values.city, values.state, values.zip, 'USA'].filter(Boolean).join(', ')
    if (addressStr && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      try {
        const geoRes  = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressStr)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
        )
        const geoData = await geoRes.json()
        if (geoData.results?.[0]?.geometry?.location) {
          lat = geoData.results[0].geometry.location.lat
          lng = geoData.results[0].geometry.location.lng
        }
      } catch { /* Geocoding optional */ }
    }

    const tagsArray = values.tags.split(',').map(t => t.trim()).filter(Boolean)

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: biz } = await supabase.from('businesses').insert({
        owner_id:    user.id,
        name:        values.name,
        category:    values.category,
        subcategory: values.subcategory || null,
        description: values.description || null,
        country:     values.country,
        address:     values.street || null,
        street:      values.street || null,
        city:        values.city,
        state:       values.state,
        zip:         values.zip || null,
        phone:       values.phone,
        email:       values.email || null,
        website:     values.website || null,
        price_range: values.price_range || null,
        tags:        tagsArray.length ? tagsArray : null,
        days_open:   values.days_open.length ? values.days_open : null,
        hours_open:  values.hours_open || null,
        cover_image: values.cover_image || null,
        logo_url:    values.logo_url || null,
        lat,
        lng,
        verified:    false,
        premium:     false,
        featured:    false,
        plan:        'free',
      }).select().single()

      if (biz) {
        await supabase.from('profiles')
          .update({ business_id: biz.id })
          .eq('id', user.id)
      }
    }

    setLoading(false)
    setStep(3)
  }

  // ── Step 2 (customer): save preferences ──────────────────────────────
  async function handleSavePreferences() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user && (interests.length > 0 || form.city)) {
      await supabase.from('profiles')
        .update({ interests, city: form.city })
        .eq('id', user.id)
    }
    setStep(3)
  }

  const leftContent = {
    customer: {
      title: 'Join the African diaspora community',
      sub: 'Discover African businesses, leave reviews, and shop with confidence.',
      features: ['420+ African businesses in Houston','Map view with one-tap directions','Community reviews you can trust','Search by product, category or name'],
    },
    owner: {
      title: 'Get discovered by diaspora customers',
      sub: 'List your African business and reach thousands of community members.',
      features: ['Free listing — live in minutes','Map pin so customers find you','Virtual storefront with products','Reviews build your reputation'],
    },
  }
  const left = role ? leftContent[role] : leftContent.customer

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:border-transparent transition-all"
  const labelCls = "block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5"

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 py-10">
      <div className="w-full max-w-4xl bg-white border border-gray-100 rounded-2xl overflow-hidden flex" style={{ minHeight: '620px' }}>

        {/* ── Left panel ── */}
        <div className="hidden lg:flex flex-col justify-between w-2/5 p-10" style={{ background: '#085041' }}>
          <div>
            <h2 className="text-white text-2xl font-semibold leading-snug mb-3">{left.title}</h2>
            <p className="text-sm leading-relaxed mb-8" style={{ color: '#9FE1CB' }}>{left.sub}</p>
            <ul className="space-y-3">
              {left.features.map(f => (
                <li key={f} className="flex items-center gap-3 text-sm" style={{ color: '#9FE1CB' }}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#5DCAA5' }} />
                  {f}
                </li>
              ))}
            </ul>
            <div className="flex gap-2 mt-8 text-xl">
              {['🇳🇬','🇬🇭','🇰🇪','🇸🇳','🇿🇦'].map(f => <span key={f}>{f}</span>)}
            </div>
          </div>
          <p className="text-xs" style={{ color: '#085041' }}>© 2025 Markeetee</p>
        </div>

        {/* ── Right panel ── */}
        <div className="flex-1 flex flex-col justify-center p-8 lg:p-10 overflow-y-auto">

          {step < 3 && !confirmationSent && (
            <div className="flex items-center justify-center gap-1.5 mb-6">
              {[0,1,2].map(i => (
                <div key={i} className="h-1.5 rounded-full transition-all duration-300"
                  style={{ width: i === step ? '20px' : '6px', background: i === step ? '#1D9E75' : '#E5E7EB' }} />
              ))}
            </div>
          )}

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-100">{error}</div>
          )}

          {/* ── Step 0: Role selection ── */}
          {step === 0 && (
            <>
              <h1 className="text-xl font-semibold text-gray-900 mb-1">Create your account</h1>
              <p className="text-sm text-gray-500 mb-6">How will you use Markeetee?</p>
              <div className="space-y-3 mb-6">
                {([
                  ['customer', User,      'Customer',       'Browse and discover African businesses near me'],
                  ['owner',    Building2, 'Business owner', 'List my African business and get discovered'],
                ] as const).map(([r, Icon, label, desc]) => (
                  <button key={r} type="button" onClick={() => setRole(r)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all"
                    style={{ borderColor: role === r ? '#1D9E75' : undefined, background: role === r ? '#f0faf6' : undefined }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#E1F5EE' }}>
                      <Icon size={20} style={{ color: '#085041' }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                      style={{ borderColor: role === r ? '#1D9E75' : '#D1D5DB', background: role === r ? '#1D9E75' : 'transparent' }}>
                      {role === r && <Check size={11} className="text-white" />}
                    </div>
                  </button>
                ))}
              </div>
              <button disabled={!role} onClick={() => setStep(1)}
                className="w-full py-2.5 text-white rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: '#1D9E75' }}>
                Continue
              </button>

              <div className="flex items-center gap-3 my-4 text-xs text-gray-400">
                <div className="flex-1 h-px bg-gray-100" />or<div className="flex-1 h-px bg-gray-100" />
              </div>

              <button type="button" onClick={handleGoogleSignup}
                className="w-full flex items-center justify-center gap-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-green-400 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.615 24 12.255 24z"/><path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"/><path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.64 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
                {role === 'owner'
                  ? 'Continue with Google as business owner'
                  : 'Continue with Google'}
              </button>

              <p className="text-center text-sm text-gray-500 mt-4">
                Already have an account?{' '}
                <Link href="/auth/login" className="font-semibold" style={{ color: '#0F6E56' }}>Sign in</Link>
              </p>
            </>
          )}

          {/* ── Step 1: Account details ── */}
          {step === 1 && (
            <>
              <button type="button" onClick={() => setStep(0)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-5 transition-colors">
                <ChevronLeft size={14} /> Back
              </button>
              <h1 className="text-xl font-semibold text-gray-900 mb-1">Your details</h1>
              <p className="text-sm text-gray-500 mb-5">Create your Markeetee account</p>

              <form onSubmit={handleCreateAccount} className="space-y-3">

                {/* Full name */}
                <div>
                  <label className={labelCls}>Full name *</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input type="text" value={form.name} onChange={e => upd('name', e.target.value)}
                      placeholder="Enter your full name" required className={`${inputCls} pl-9`} />
                  </div>
                </div>

                {/* Gender + Background in a row */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Gender */}
                  <div>
                    <label className={labelCls}>Gender</label>
                    <select value={form.gender} onChange={e => upd('gender', e.target.value)}
                      className={inputCls}>
                      <option value="">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non_binary">Non-binary</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Country of origin (for non-owner step 1) */}
                  <div>
                    <label className={labelCls}>Country of origin</label>
                    <select value={form.country} onChange={e => upd('country', e.target.value)}
                      className={inputCls}>
                      <option value="">Select country</option>
                      {COUNTRIES.map(c => (
                        <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Background toggle */}
                <div>
                  <label className={labelCls}>Background</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value:'african',     label:'African / diaspora', icon:'🌍' },
                      { value:'non_african', label:'Non-African',         icon:'🌐' },
                    ].map(o => (
                      <button key={o.value} type="button"
                        onClick={() => upd('origin', o.value)}
                        className="flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all text-left"
                        style={form.origin === o.value
                          ? { borderColor:'#1D9E75', background:'#f0faf6', color:'#085041' }
                          : { borderColor:'#E5E7EB', color:'#6B7280' }
                        }>
                        <span className="text-xl">{o.icon}</span>
                        <span className="text-xs leading-tight">{o.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className={labelCls}>Email address *</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input type="email" value={form.email} onChange={e => upd('email', e.target.value)}
                      placeholder="Enter your email" required className={`${inputCls} pl-9`} />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className={labelCls}>Password *</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input type={showPass ? 'text' : 'password'} value={form.password}
                      onChange={e => upd('password', e.target.value)}
                      placeholder="Min. 8 characters" required minLength={8}
                      className={`${inputCls} pl-9 pr-10`} />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className={labelCls}>Confirm password *</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword}
                      onChange={e => upd('confirmPassword', e.target.value)}
                      placeholder="Repeat your password" required
                      className={`${inputCls} pl-9 pr-10`} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                  {form.confirmPassword && form.password === form.confirmPassword && form.confirmPassword.length >= 8 && (
                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#1D9E75' }}>
                      <Check size={11} /> Passwords match
                    </p>
                  )}
                </div>

                <button type="submit" disabled={loading || form.password !== form.confirmPassword}
                  className="w-full py-2.5 text-white rounded-xl text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  style={{ background: '#1D9E75' }}>
                  {loading ? 'Creating account…' : 'Continue'}
                </button>
              </form>
            </>
          )}

          {/* ── Step 2a: Business details (owner) ── */}
          {step === 2 && role === 'owner' && !confirmationSent && (
            <>
              <button type="button" onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-5 transition-colors">
                <ChevronLeft size={14} /> Back
              </button>
              <h1 className="text-xl font-semibold text-gray-900 mb-1">Your business</h1>
              <p className="text-sm text-gray-500 mb-4">
                Tell us about your African business. Fields marked * are required —
                everything else can be added or edited later from your dashboard.
              </p>

              <BusinessDetailsForm
                initialValues={{
                  ...EMPTY_BUSINESS_FORM,
                  country:    form.country,
                  cover_image: form.cover_image,
                }}
                onSubmit={handleSaveBusiness}
                loading={loading}
                submitLabel="List my business"
                imageFolder={form.email.replace(/[@.]/g, '_')}
              />
            </>
          )}

          {/* ── Step 2b: Customer interests ── */}
          {step === 2 && role === 'customer' && !confirmationSent && (
            <>
              <button type="button" onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-5 transition-colors">
                <ChevronLeft size={14} /> Back
              </button>
              <h1 className="text-xl font-semibold text-gray-900 mb-1">What are you looking for?</h1>
              <p className="text-sm text-gray-500 mb-5">Pick your interests to personalise your feed</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
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
              <div className="mb-5">
                <label className={labelCls}>Your city</label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input type="text" value={form.city} onChange={e => upd('city', e.target.value)}
                    placeholder="Enter your city" className={`${inputCls} pl-9`} />
                </div>
              </div>
              <button type="button" onClick={handleSavePreferences}
                className="w-full py-2.5 text-white rounded-xl text-sm font-semibold"
                style={{ background: '#1D9E75' }}>
                Create my account
              </button>
            </>
          )}

          {/* ── Email confirmation screen ── */}
          {step === 2 && confirmationSent && (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#E1F5EE' }}>
                <Mail size={24} style={{ color: '#0F6E56' }} />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">Check your email</h1>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                We sent a confirmation link to <strong>{form.email}</strong>.<br />
                Click it to activate your account.
              </p>
              <p className="text-xs text-gray-400">
                Didn&apos;t receive it? Check your spam folder or{' '}
                <button onClick={() => setStep(1)} className="font-medium" style={{ color: '#0F6E56' }}>try again</button>
              </p>
            </div>
          )}

          {/* ── Step 3: Success ── */}
          {step === 3 && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#E1F5EE' }}>
                <Check size={24} style={{ color: '#0F6E56' }} />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                {role === 'owner' ? 'Your business is live!' : "You're in!"}
              </h1>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                {role === 'owner'
                  ? 'Customers can now find, review, and navigate to your business.'
                  : 'Welcome to Markeetee. Start exploring African businesses near you.'}
              </p>
              {role === 'owner' && (
                <div className="space-y-2 text-left mb-6">
                  {[
                    ['Business listed',   'Your store is now live on Markeetee'],
                    ['Map pin added',     'Customers can find and navigate to you'],
                    ['Ready for reviews', 'Share your link to collect your first review'],
                  ].map(([title, sub]) => (
                    <div key={title} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#f0faf6' }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#E1F5EE' }}>
                        <Check size={12} style={{ color: '#0F6E56' }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button type="button"
                onClick={() => router.push(role === 'owner' ? '/dashboard' : '/search')}
                className="w-full max-w-xs mx-auto py-2.5 text-white rounded-xl text-sm font-semibold block"
                style={{ background: '#1D9E75' }}>
                {role === 'owner' ? 'Go to dashboard' : 'Explore businesses'}
              </button>
              <p className="text-xs text-gray-400 mt-3">
                or <Link href="/auth/login" className="font-medium" style={{ color: '#0F6E56' }}>sign in to an existing account</Link>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}