'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Check, Building2 } from 'lucide-react'
import BusinessDetailsForm, {
  BusinessFormValues, EMPTY_BUSINESS_FORM,
} from '@/components/businesses/BusinessDetailsForm'

function NewBusinessContent() {
  const router   = useRouter()
  const params   = useSearchParams()
  const supabase = createClient()

  const isWelcome = params.get('welcome') === '1' // came from Google signup

  const [loadingUser, setLoadingUser] = useState(true)
  const [user,        setUser]        = useState<any>(null)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: { data: { user: any | null } }) => {
      if (!data.user) {
        router.push('/auth/login')
        return
      }
      setUser(data.user)
      setLoadingUser(false)
    })
  }, [])

  async function handleSubmit(values: BusinessFormValues) {
    if (!user) return
    setSaving(true)
    setError('')

    // Geocode address
    let lat: number | null = null
    let lng: number | null = null
    const addressStr = [values.street, values.city, values.state, values.zip, 'USA']
      .filter(Boolean).join(', ')

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
      } catch { /* geocoding optional */ }
    }

    const tagsArray = values.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)

    const { data: biz, error: insertError } = await supabase
      .from('businesses')
      .insert({
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
        lat, lng,
        verified:    false,
        premium:     false,
        featured:    false,
        plan:        'free',
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    // Ensure profile is upgraded to owner and linked to this business
    await supabase.from('profiles')
      .update({ role: 'owner', business_id: biz.id })
      .eq('id', user.id)

    setSaving(false)
    router.push('/dashboard')
    router.refresh()
  }

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={28} className="animate-spin" style={{ color: '#1D9E75' }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:'#E1F5EE' }}>
              <Building2 size={20} style={{ color:'#085041' }} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {isWelcome ? 'Welcome! Let\'s set up your business' : 'List your business'}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {isWelcome
                  ? 'Add your business details to get discovered by the diaspora community.'
                  : 'Tell us about your African business — your listing goes live immediately.'}
              </p>
            </div>
          </div>

          {isWelcome && (
            <div className="flex items-center gap-2 mt-4 px-4 py-3 rounded-xl" style={{ background:'#f0faf6' }}>
              <Check size={14} style={{ color:'#1D9E75' }} className="flex-shrink-0" />
              <p className="text-xs text-gray-600">
                Your account is ready. You can add your business now, or{' '}
                <Link href="/dashboard" className="font-semibold" style={{ color:'#0F6E56' }}>
                  skip to your dashboard
                </Link>{' '}
                and add it later.
              </p>
            </div>
          )}
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-100">{error}</div>
          )}

          <BusinessDetailsForm
            initialValues={EMPTY_BUSINESS_FORM}
            onSubmit={handleSubmit}
            loading={saving}
            submitLabel="List my business"
            imageFolder={user?.email?.replace(/[@.]/g, '_') ?? 'general'}
          />
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          You can edit all of this later from your{' '}
          <Link href="/dashboard" className="font-medium" style={{ color:'#0F6E56' }}>dashboard</Link>.
          Upgrade to Premium or Storefront anytime from there too.
        </p>
      </div>
    </div>
  )
}

export default function NewBusinessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={28} className="animate-spin" style={{ color: '#1D9E75' }} />
      </div>
    }>
      <NewBusinessContent />
    </Suspense>
  )
}