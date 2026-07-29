'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight, BriefcaseBusiness, Building2, Check, ChevronDown,
  Eye, EyeOff, Globe2, Heart, LockKeyhole, Mail, MapPin, Phone,
  Store, Tag, TrendingUp, UserRound, UsersRound, Loader2, AlertCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'
import { AFRICAN_FLAGS } from '@/lib/africanFlags'
import ImageUpload from '@/components/ui/ImageUpload'

// ── Types ─────────────────────────────────────────────────────────────────
type LocationType = 'physical' | 'online' | 'both'

interface BusinessFormData {
  businessName:      string
  category:          string
  locationType:      LocationType
  country:           string
  city:              string
  state:             string
  zipCode:           string
  address:           string
  addressLine2:      string
  phone:             string
  businessEmail:     string
  website:           string
  onlineOrderingUrl: string
  serviceArea:       string
  description:       string
  ownerName:         string
  ownerRole:         string
  accountEmail:      string
  password:          string
  confirmPassword:   string
  agreed:            boolean
}

const INITIAL_FORM: BusinessFormData = {
  businessName:'', category:'', locationType:'physical',
  country:'', city:'', state:'', zipCode:'', address:'', addressLine2:'',
  phone:'', businessEmail:'', website:'', onlineOrderingUrl:'', serviceArea:'',
  description:'',
  ownerName:'', ownerRole:'Owner', accountEmail:'', password:'', confirmPassword:'',
  agreed:false,
}

// Match your existing category IDs from africanFlags.ts / dashboard
const CATEGORIES = [
  { id:'food',       label:'Food & Groceries'   },
  { id:'restaurant', label:'Restaurants'         },
  { id:'fashion',    label:'Fashion & Fabric'    },
  { id:'beauty',     label:'Beauty & Hair'       },
  { id:'herbs',      label:'Herbs & Wellness'    },
  { id:'music',      label:'Music & Arts'        },
  { id:'crafts',     label:'Crafts & Decor'      },
  { id:'services',   label:'Professional Services'},
  { id:'nightlife',  label:'Bars & Nightlife'    },
]

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
]

const BRAND = {
  dark:      '#053528',
  primary:   '#085041',
  green:     '#1D9E75',
  mint:      '#E1F5EE',
  lightMint: '#F4FBF8',
}

// ── Main component ────────────────────────────────────────────────────────
export default function BusinessNewPage() {
  const router   = useRouter()
  const supabase = createClient()
  const { user, isLoggedIn } = useAuth()

  const [form,                setForm]                = React.useState<BusinessFormData>(INITIAL_FORM)
  const [showPassword,        setShowPassword]        = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [coverUrl,            setCoverUrl]            = React.useState<string | null>(null)
  const [logoUrl,             setLogoUrl]             = React.useState<string | null>(null)
  const [submitting,          setSubmitting]          = React.useState(false)
  const [error,               setError]               = React.useState('')
  const [success,             setSuccess]             = React.useState(false)

  // Pre-fill for logged-in users
  React.useEffect(() => {
    if (isLoggedIn && user) {
      setForm(f => ({
        ...f,
        accountEmail: user.email ?? '',
        ownerName:    (user.user_metadata as any)?.name ?? '',
      }))
    }
  }, [isLoggedIn, user])

  const hasPhysicalLocation = form.locationType === 'physical' || form.locationType === 'both'
  const hasOnlineLocation   = form.locationType === 'online'   || form.locationType === 'both'

  function updateField<K extends keyof BusinessFormData>(field: K, value: BusinessFormData[K]) {
    setForm(current => ({ ...current, [field]: value }))
    setError('')
  }

  function selectLocationType(type: LocationType) {
    setForm(current => ({ ...current, locationType: type }))
  }

  function validateForm(): string | null {
    if (!form.businessName.trim())               return 'Enter your business name.'
    if (!form.category)                          return 'Select a business category.'
    if (hasPhysicalLocation) {
      if (!form.address.trim())                  return 'Enter the physical business address.'
      if (!form.city.trim())                     return 'Enter the business city.'
      if (!form.state)                           return 'Select the business state.'
      if (!form.zipCode.trim())                  return 'Enter the business ZIP code.'
    }
    if (hasOnlineLocation && !form.website.trim()) return 'Enter the website for your online business.'
    if (!form.phone.trim())                      return 'Enter the business phone number.'
    if (form.description.trim().length < 40)     return 'Write a business description of at least 40 characters.'
    if (!form.ownerName.trim())                  return 'Enter your full name.'
    if (!isLoggedIn) {
      if (!form.accountEmail.trim())             return 'Enter the email you will use to sign in.'
      if (form.password.length < 8)              return 'Your password must contain at least 8 characters.'
      if (form.password !== form.confirmPassword) return 'The passwords do not match.'
    }
    if (!form.agreed)                            return 'You must agree to the Terms of Service and Privacy Policy.'
    return null
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationError = validateForm()
    if (validationError) { setError(validationError); return }

    setSubmitting(true); setError('')

    try {
      let userId = user?.id

      // ── Step 1: Create auth account if not logged in ─────────────────────
      if (!isLoggedIn) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email:    form.accountEmail,
          password: form.password,
          options: {
            data: { name: form.ownerName, role: 'owner' },
            emailRedirectTo: `${location.origin}/auth/callback`,
          },
        })
        if (signUpError) throw new Error(signUpError.message)
        userId = data.user?.id
      }

      if (!userId) throw new Error('Could not create user account.')

      // ── Step 2: Geocode address (best effort) ────────────────────────────
      let lat: number | null = null
      let lng: number | null = null
      if (hasPhysicalLocation && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
        try {
          const addr = encodeURIComponent(`${form.address}, ${form.city}, ${form.state}, USA`)
          const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${addr}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`)
          const geo = await geoRes.json()
          if (geo.results?.[0]?.geometry?.location) {
            lat = geo.results[0].geometry.location.lat
            lng = geo.results[0].geometry.location.lng
          }
        } catch {}
      }

      // ── Step 3: Create business row ──────────────────────────────────────
      const { data: biz, error: bizError } = await supabase
        .from('businesses')
        .insert({
          owner_id:    userId,
          name:        form.businessName,
          category:    form.category,
          description: form.description,
          street:      hasPhysicalLocation ? form.address       : null,
          address:     hasPhysicalLocation ? form.address       : null,
          city:        hasPhysicalLocation ? form.city          : null,
          state:       hasPhysicalLocation ? form.state         : null,
          zip:         hasPhysicalLocation ? form.zipCode       : null,
          country:     form.country || null,
          phone:       form.phone,
          email:       form.businessEmail || null,
          website:     form.website || null,
          cover_image: coverUrl,
          logo_url:    logoUrl,
          lat, lng,
        })
        .select('id').single()

      if (bizError) throw new Error(bizError.message)

      // ── Step 4: Link profile to business ─────────────────────────────────
      await supabase.from('profiles')
        .update({ business_id: biz.id, role: 'owner', name: form.ownerName })
        .eq('id', userId)

      // ── Step 5: Fire welcome email (fire-and-forget) ─────────────────────
      fetch('/api/send-welcome', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId, role: 'owner' }),
      }).catch(() => {})

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Your business account could not be created.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success screen ────────────────────────────────────────────────────
  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-xl rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: BRAND.mint }}>
            <Check size={34} style={{ color: BRAND.green }} />
          </div>
          <h1 className="mt-6 text-2xl font-extrabold text-gray-950">
            Your listing is live! 🎉
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-gray-500">
            Welcome to Markeetee. Check your email to confirm your address and finish setting up your listing.
          </p>
          <Link href="/dashboard"
            className="mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white"
            style={{ backgroundColor: BRAND.primary }}>
            Continue to dashboard <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[320px_1fr] lg:gap-10">

          <BenefitsSidebar />

          <form onSubmit={handleSubmit} className="mt-8 space-y-8 lg:mt-0">

            {/* Header (mobile) */}
            <div className="lg:hidden">
              <div className="flex items-center gap-3 mb-4">
                <Image src="/apple-touch-icon.png" alt="Markeetee" width={40} height={40}
                  style={{ borderRadius: 10 }} />
                <span className="text-xl font-extrabold" style={{ color: BRAND.dark }}>Markeetee</span>
              </div>
              <h1 className="text-2xl font-extrabold text-gray-950">List your business</h1>
              <p className="mt-2 text-sm text-gray-500">Join African-owned businesses growing on Markeetee.</p>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="space-y-10">

                {/* ── Business info ── */}
                <FormSection icon={Store} title="Business information"
                  description="Tell us about your business — this is what customers will see.">
                  <FormField label="Business name" required className="sm:col-span-2">
                    <TextInput value={form.businessName}
                      onChange={v => updateField('businessName', v)}
                      placeholder="e.g. Oga Suya CLT" icon={BriefcaseBusiness} required />
                  </FormField>

                  <FormField label="Category" required>
                    <SelectInput value={form.category}
                      onChange={v => updateField('category', v)}
                      options={CATEGORIES.map(c => c.label)}
                      values={CATEGORIES.map(c => c.id)}
                      placeholder="Select category" icon={Tag} required />
                  </FormField>

                  <FormField label="Country of origin">
                    <SelectInput value={form.country}
                      onChange={v => updateField('country', v)}
                      options={['— None —', ...Object.entries(AFRICAN_FLAGS).map(([n, f]) => `${f} ${n}`)]}
                      values={['', ...Object.keys(AFRICAN_FLAGS)]}
                      placeholder="Where is your business rooted?"
                      icon={Globe2} />
                  </FormField>

                  <FormField label="Description" required className="sm:col-span-2"
                    hint={`${form.description.length}/500`}>
                    <textarea value={form.description}
                      onChange={e => updateField('description', e.target.value)}
                      placeholder="What makes your business special? What do customers love about you?"
                      required rows={4} maxLength={500}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 resize-none" />
                  </FormField>
                </FormSection>

                {/* ── Location type ── */}
                <FormSection icon={MapPin} title="Where do you operate?"
                  description="Customers use this to find you on the map and in search.">
                  <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <LocationOption icon={Store}    title="Physical store" description="Customers visit in person"
                      selected={form.locationType === 'physical'} onClick={() => selectLocationType('physical')} />
                    <LocationOption icon={Globe2}   title="Online only"    description="You sell online only"
                      selected={form.locationType === 'online'}   onClick={() => selectLocationType('online')} />
                    <LocationOption icon={Building2} title="Both"          description="Physical + online"
                      selected={form.locationType === 'both'}     onClick={() => selectLocationType('both')} />
                  </div>

                  {hasPhysicalLocation && (
                    <>
                      <FormField label="Street address" required className="sm:col-span-2">
                        <TextInput value={form.address}
                          onChange={v => updateField('address', v)}
                          placeholder="123 Main Street" icon={MapPin} required />
                      </FormField>
                      <FormField label="Suite / apt (optional)" className="sm:col-span-2">
                        <TextInput value={form.addressLine2}
                          onChange={v => updateField('addressLine2', v)} placeholder="Suite 200" />
                      </FormField>
                      <FormField label="City" required>
                        <TextInput value={form.city}
                          onChange={v => updateField('city', v)} placeholder="Charlotte" required />
                      </FormField>
                      <FormField label="State" required>
                        <SelectInput value={form.state}
                          onChange={v => updateField('state', v)}
                          options={US_STATES} placeholder="Select state" required />
                      </FormField>
                      <FormField label="ZIP code" required>
                        <TextInput value={form.zipCode}
                          onChange={v => updateField('zipCode', v)}
                          placeholder="28215" required inputMode="numeric" />
                      </FormField>
                    </>
                  )}

                  {hasOnlineLocation && (
                    <>
                      <FormField label="Website URL" required={hasOnlineLocation} className="sm:col-span-2">
                        <TextInput value={form.website}
                          onChange={v => updateField('website', v)}
                          placeholder="https://yourbusiness.com" icon={Globe2}
                          required={hasOnlineLocation && !hasPhysicalLocation}
                          type="url" />
                      </FormField>
                      <FormField label="Online ordering URL (optional)" className="sm:col-span-2">
                        <TextInput value={form.onlineOrderingUrl}
                          onChange={v => updateField('onlineOrderingUrl', v)}
                          placeholder="e.g. yourbusiness.com/order" type="url" />
                      </FormField>
                    </>
                  )}
                </FormSection>

                {/* ── Contact ── */}
                <FormSection icon={Phone} title="How can customers reach you?"
                  description="At least one contact method is required.">
                  <FormField label="Phone number" required>
                    <TextInput value={form.phone}
                      onChange={v => updateField('phone', v)}
                      placeholder="(704) 555-1234" icon={Phone}
                      required inputMode="tel" type="tel" />
                  </FormField>
                  <FormField label="Public business email">
                    <TextInput value={form.businessEmail}
                      onChange={v => updateField('businessEmail', v)}
                      placeholder="hello@yourbusiness.com" icon={Mail} type="email" />
                  </FormField>
                </FormSection>

                {/* ── Photos ── */}
                <FormSection icon={Heart} title="Photos"
                  description="Businesses with photos get 3x more views.">
                  <FormField label="Cover photo" className="sm:col-span-1">
                    <ImageUpload bucket="businesses" folder="temp"
                      currentUrl={coverUrl}
                      onUpload={setCoverUrl}
                      onRemove={() => setCoverUrl(null)}
                      label="Upload cover" />
                  </FormField>
                  <FormField label="Logo (optional)" className="sm:col-span-1">
                    <ImageUpload bucket="businesses" folder="temp"
                      currentUrl={logoUrl}
                      onUpload={setLogoUrl}
                      onRemove={() => setLogoUrl(null)}
                      label="Upload logo" />
                  </FormField>
                </FormSection>

                {/* ── Owner info ── */}
                <FormSection icon={UserRound} title="About you"
                  description={isLoggedIn ? "Confirm your name for your business listing." : "You'll manage the listing with this account."}>
                  <FormField label="Your full name" required>
                    <TextInput value={form.ownerName}
                      onChange={v => updateField('ownerName', v)}
                      placeholder="Adaeze Okafor" icon={UserRound} required />
                  </FormField>
                  <FormField label="Your role">
                    <TextInput value={form.ownerRole}
                      onChange={v => updateField('ownerRole', v)}
                      placeholder="Owner" icon={UsersRound} />
                  </FormField>

                  {!isLoggedIn && (
                    <>
                      <FormField label="Account email" required className="sm:col-span-2">
                        <TextInput value={form.accountEmail}
                          onChange={v => updateField('accountEmail', v)}
                          placeholder="you@email.com" icon={Mail}
                          type="email" required autoComplete="email" />
                      </FormField>
                      <FormField label="Password" required
                        hint="8+ characters">
                        <PasswordInput value={form.password}
                          onChange={v => updateField('password', v)}
                          visible={showPassword}
                          onToggle={() => setShowPassword(v => !v)}
                          placeholder="Create a password"
                          autoComplete="new-password" />
                      </FormField>
                      <FormField label="Confirm password" required>
                        <PasswordInput value={form.confirmPassword}
                          onChange={v => updateField('confirmPassword', v)}
                          visible={showConfirmPassword}
                          onToggle={() => setShowConfirmPassword(v => !v)}
                          placeholder="Re-enter password"
                          autoComplete="new-password" />
                      </FormField>
                    </>
                  )}
                </FormSection>

                {/* ── Terms ── */}
                <label className="flex items-start gap-3 rounded-2xl border border-gray-200 p-4 cursor-pointer"
                  style={{ background: BRAND.lightMint }}>
                  <input type="checkbox"
                    checked={form.agreed}
                    onChange={e => updateField('agreed', e.target.checked)}
                    className="mt-0.5 h-5 w-5 flex-shrink-0 rounded accent-emerald-600" />
                  <span className="text-sm text-gray-700 leading-relaxed">
                    I agree to Markeetee's{' '}
                    <Link href="/terms" className="font-bold underline" style={{ color: BRAND.primary }}>
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="font-bold underline" style={{ color: BRAND.primary }}>
                      Privacy Policy
                    </Link>.
                  </span>
                </label>

                {/* ── Error ── */}
                {error && (
                  <div className="flex items-start gap-2 px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-200">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* ── Submit ── */}
                <button type="submit" disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold text-white disabled:opacity-60"
                  style={{ background: BRAND.primary }}>
                  {submitting
                    ? <><Loader2 size={16} className="animate-spin" /> Creating your listing…</>
                    : <>List my business — free during launch <ArrowRight size={16} /></>
                  }
                </button>

                <p className="text-xs text-center text-gray-400">
                  🚀 Every business gets <strong>6 months of free Pro Store access</strong> during our launch period
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────
function BenefitsSidebar() {
  const benefits = [
    { icon: TrendingUp, title: 'Get discovered',    description: 'Show up in map, search, and category results across North Carolina.' },
    { icon: UsersRound, title: 'Build community',    description: 'Connect with African diaspora customers looking for what you offer.' },
    { icon: Heart,      title: 'Free to start',      description: 'List for free forever. Upgrade only when you\'re ready to grow.' },
    { icon: BriefcaseBusiness, title: 'Full Pro Store access', description: '6 months of premium features free — worth $60/month during launch.' },
  ]

  return (
    <aside className="hidden lg:flex sticky top-8 h-fit flex-col rounded-3xl p-8 text-white"
      style={{ background: `linear-gradient(180deg, ${BRAND.dark}, ${BRAND.primary})` }}>

      <div>
        <div className="flex items-center gap-3 mb-6">
          <Image src="/apple-touch-icon.png" alt="Markeetee" width={44} height={44}
            style={{ borderRadius: 11 }} />
          <span className="text-2xl font-extrabold text-white">Markeetee</span>
        </div>

        <h2 className="text-3xl font-extrabold leading-tight">
          List your<br />business
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-emerald-100/80">
          Join African-owned businesses growing their visibility and reaching more customers.
        </p>
      </div>

      <div className="mt-10 space-y-6">
        {benefits.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
              style={{ background: 'rgba(159, 225, 203, 0.15)' }}>
              <Icon size={18} style={{ color: '#9FE1CB' }} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{title}</p>
              <p className="mt-1 text-xs leading-5 text-emerald-100/60">{description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl p-4"
        style={{ background: 'rgba(255,255,255,0.08)' }}>
        <p className="text-xs font-medium text-emerald-100/70">Already have an account?</p>
        <Link href="/auth/login"
          className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-white">
          Sign in <ArrowRight size={15} />
        </Link>
      </div>
    </aside>
  )
}

// ── Form section wrapper ──────────────────────────────────────────────────
function FormSection({ icon: Icon, title, description, children }: {
  icon: React.ElementType
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: BRAND.mint }}>
          <Icon size={18} style={{ color: BRAND.primary }} />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-gray-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-gray-500">{description}</p>
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  )
}

// ── Form field wrapper ────────────────────────────────────────────────────
function FormField({ label, required, hint, className='', children }: {
  label: string; required?: boolean; hint?: string
  className?: string; children: React.ReactNode
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-bold text-gray-800">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
        {hint && <span className="ml-2 text-xs font-normal text-gray-400">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

// ── Text input ────────────────────────────────────────────────────────────
function TextInput({
  value, onChange, placeholder, icon: Icon,
  type='text', inputMode, autoComplete, required,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  icon?: React.ElementType
  type?: React.HTMLInputTypeAttribute
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  autoComplete?: string
  required?: boolean
}) {
  return (
    <div className="relative">
      {Icon && (
        <Icon size={17}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
      )}
      <input
        type={type} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        required={required}
        className={`w-full rounded-xl border border-gray-200 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 ${Icon ? 'pl-11 pr-4' : 'px-4'}`} />
    </div>
  )
}

// ── Select input (supports label/value pairs) ──────────────────────────────
function SelectInput({
  value, onChange, options, values, placeholder, icon: Icon, required,
}: {
  value: string
  onChange: (value: string) => void
  options: string[]
  values?: string[]
  placeholder?: string
  icon?: React.ElementType
  required?: boolean
}) {
  return (
    <div className="relative">
      {Icon && (
        <Icon size={17}
          className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-gray-400" />
      )}
      <select value={value} onChange={e => onChange(e.target.value)} required={required}
        className={`w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 text-sm text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 ${Icon ? 'pl-11 pr-10' : 'pl-4 pr-10'}`}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt, i) => (
          <option key={opt} value={values ? values[i] : opt}>{opt}</option>
        ))}
      </select>
      <ChevronDown size={17}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
    </div>
  )
}

// ── Password input ────────────────────────────────────────────────────────
function PasswordInput({
  value, onChange, visible, onToggle, placeholder, autoComplete,
}: {
  value: string
  onChange: (value: string) => void
  visible: boolean
  onToggle: () => void
  placeholder?: string
  autoComplete?: string
}) {
  return (
    <div className="relative">
      <LockKeyhole size={17}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
      <input type={visible ? 'text' : 'password'}
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} autoComplete={autoComplete} required
        className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" />
      <button type="button" onClick={onToggle}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-700">
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}

// ── Location option card ──────────────────────────────────────────────────
function LocationOption({
  selected, icon: Icon, title, description, onClick,
}: {
  selected: boolean
  icon: React.ElementType
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected}
      className="relative rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
      style={{
        borderColor:     selected ? BRAND.green    : '#E5E7EB',
        backgroundColor: selected ? BRAND.lightMint : '#FFFFFF',
      }}>
      {selected && (
        <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full"
          style={{ backgroundColor: BRAND.green }}>
          <Check size={12} className="text-white" />
        </div>
      )}
      <div className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: selected ? BRAND.mint : '#F3F4F6' }}>
        <Icon size={18} style={{ color: selected ? BRAND.primary : '#6B7280' }} />
      </div>
      <p className="mt-3 text-sm font-bold text-gray-900">{title}</p>
      <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
    </button>
  )
}