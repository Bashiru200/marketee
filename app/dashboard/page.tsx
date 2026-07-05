'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Eye, Star, MessageSquare, MapPin, Edit,
  BadgeCheck, Plus, ArrowUpRight, Save, Loader2, Trash2,
  Clock, Calendar, Lightbulb, CheckCircle2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'
import ImageUpload from '@/components/ui/ImageUpload'
import ProductManager from '@/components/dashboard/ProductManager'
import GalleryUploader from '@/components/dashboard/GalleryUploader'
import CountriesBar from '@/components/ui/CountriesBar'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

const CATEGORIES = [
  { id: 'food',       label: 'Food & Groceries'  },
  { id: 'restaurant', label: 'Restaurant'         },
  { id: 'fashion',    label: 'Fashion & Fabric'   },
  { id: 'beauty',     label: 'Beauty & Hair'      },
  { id: 'herbs',      label: 'Herbs & Wellness'   },
  { id: 'music',      label: 'Music & Arts'       },
  { id: 'crafts',     label: 'Crafts & Decor'     },
  { id: 'services',   label: 'Services'           },
  { id: 'nightlife',  label: 'Bars & Nightlife'   },
]

interface Business {
  id: string; name: string; description: string | null
  category: string | null; city: string | null; state: string | null
  street: string | null; address: string | null
  zip: string | null; phone: string | null; email: string | null
  website: string | null; country: string | null
  cover_image: string | null; logo_url: string | null; images: string[] | null; slug: string | null; plan: string | null
  hours_open: string | null; days_open: string[] | null
  rating: number; review_count: number
  verified: boolean; premium: boolean; featured: boolean
  tags: string[] | null; lat: number | null; lng: number | null
}

interface Review {
  id: string; rating: number; title: string | null; body: string | null
  created_at: string; profiles: { name: string } | null
}

interface Product {
  id: string; name: string; price: number; description: string | null
  image_url: string | null; available: boolean
}

function getPlans(currentPlan: string | null) {
  const plan = currentPlan ?? 'free'
  return [
    { id:'free',       name:'Free',       price:'$0',  period:'/month', highlight:false,
      current: plan === 'free',
      features:['Basic listing','Map pin','Contact info','Category listing'] },
    { id:'premium',    name:'Premium',    price:'$29', period:'/month', highlight:true,
      current: plan === 'premium',
      features:['Everything in Free','Photos gallery','Featured placement','Product listings','Priority search','Analytics'] },
    { id:'storefront', name:'Storefront', price:'$49', period:'/month', highlight:false,
      current: plan === 'storefront',
      features:['Everything in Premium','Full product catalogue','Online enquiry','WhatsApp integration','Custom store URL'] },
  ]
}

function getRecommendations(
  biz: Business, reviews: Review[], products: Product[]
): { icon: string; title: string; body: string; done: boolean }[] {
  return [
    { icon:'🖼️', title:'Add a cover photo',       body:'Businesses with cover photos get 3x more profile views.',    done:!!biz.cover_image },
    { icon:'📝', title:'Write a description',      body:'Tell customers what makes your business special.',           done:!!(biz.description && biz.description.length > 50) },
    { icon:'📦', title:'Add at least 3 products',  body:'Listings with products get 2x more enquiries.',             done:products.length >= 3 },
    { icon:'🕐', title:'Set your opening hours',   body:"Customers want to know when you're open.",                  done:!!(biz.hours_open && biz.days_open && biz.days_open.length > 0) },
    { icon:'📍', title:'Add your full address',    body:'A complete address helps customers find you on the map.',   done:!!(biz.street ?? biz.address) && !!biz.city && !!biz.state },
    { icon:'⭐', title:'Get your first 5 reviews', body:'Share your listing link with happy customers to build trust.', done:reviews.length >= 5 },
    { icon:'📱', title:'Add your phone number',    body:'Make it easy for customers to call or WhatsApp you.',       done:!!biz.phone },
  ]
}

function ProfileStrength({
  recommendations, profileScore, onFix,
}: {
  recommendations: { icon:string; title:string; body:string; done:boolean }[]
  profileScore: number
  onFix: () => void
}) {
  const [open, setOpen] = useState(false)
  const missing = recommendations.filter(r => !r.done)
  const color   = profileScore >= 80 ? '#1D9E75' : profileScore >= 50 ? '#BA7517' : '#EF4444'
  const label   = profileScore >= 80 ? 'Strong'  : profileScore >= 50 ? 'Good'    : 'Needs work'
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors">
        <Lightbulb size={17} style={{ color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-semibold text-gray-900">Profile strength</span>
            <span className="text-sm font-bold" style={{ color }}>{profileScore}% · {label}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${profileScore}%`, background: color }} />
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className="flex-shrink-0 text-gray-400 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-gray-100 px-5 pb-4 pt-3 space-y-2">
          {missing.length === 0 ? (
            <div className="flex items-center gap-2 py-2 text-sm text-green-700">
              <CheckCircle2 size={16} style={{ color:'#1D9E75' }} /> All items complete!
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                {missing.length} item{missing.length !== 1 ? 's' : ''} to complete
              </p>
              {missing.map(tip => (
                <div key={tip.title} className="flex items-start gap-3 p-3 rounded-xl" style={{ background:'#FAFAF9' }}>
                  <span className="text-base flex-shrink-0 mt-0.5">{tip.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{tip.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{tip.body}</p>
                  </div>
                  <button onClick={onFix} className="flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-lg"
                    style={{ background:'#1D9E75', color:'white' }}>Fix</button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const router   = useRouter()
  const supabase = createClient()
  const { user, profile, isOwner, isLoggedIn, loading: authLoading, refreshProfile } = useAuth()

  const [tab,      setTab]      = useState<'overview'|'listing'|'products'|'reviews'|'upgrade'>('overview')
  const [biz,      setBiz]      = useState<Business | null>(null)
  const [reviews,  setReviews]  = useState<Review[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState('')
  const [avatarUrl,setAvatarUrl]= useState<string | null>(null)
  const [newProduct,     setNewProduct]     = useState({ name:'', price:'', description:'', image_url:'' })
  const [addingProduct,  setAddingProduct]  = useState(false)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [slugInput,      setSlugInput]      = useState('')
  const [slugSaving,     setSlugSaving]     = useState(false)
  const [slugMsg,        setSlugMsg]        = useState<{ text: string; ok: boolean } | null>(null)

  const [form, setForm] = useState({
    name:'', description:'', phone:'', email:'', website:'',
    street:'', city:'', state:'', zip:'',
    cover_image:'', logo_url:'', images:[] as string[],
    hours_open:'', days_open:[] as string[],
    category:'', country:'', slug:'',
  })

  useEffect(() => {
    if (authLoading) return
    if (!isLoggedIn) { router.replace('/auth/login'); return }
    if (!isOwner)    { router.replace('/dashboard/access-denied'); return }
    setAvatarUrl(profile?.avatar_url ?? null)
    if (profile?.business_id) {
      fetchAll(profile.business_id)
    } else if (user?.id) {
      supabase.from('businesses').select('id').eq('owner_id', user.id).single()
        .then(({ data }: { data: { id: string } | null }) => {
          if (data?.id) {
            supabase.from('profiles').update({ business_id: data.id }).eq('id', user.id)
            fetchAll(data.id)
          } else { setLoading(false) }
        })
    } else { setLoading(false) }
  }, [authLoading, isLoggedIn, isOwner, profile, user])

  async function fetchAll(bizId: string) {
    setLoading(true)
    const [bizRes, reviewRes, productRes] = await Promise.all([
      supabase.from('businesses').select('*').eq('id', bizId).single(),
      supabase.from('reviews')
        .select('id, rating, title, body, created_at, profiles(name)')
        .eq('business_id', bizId).order('created_at', { ascending: false }),
      supabase.from('products').select('*').eq('business_id', bizId).order('created_at', { ascending: false }),
    ])
    if (bizRes.data) {
      setBiz(bizRes.data)
    setSlugInput(bizRes.data.slug ?? '')
      // Pre-fill ALL fields from signup data — including street fallback to address
      setForm({
        name:        bizRes.data.name        ?? '',
        description: bizRes.data.description ?? '',
        phone:       bizRes.data.phone       ?? '',
        email:       bizRes.data.email       ?? '',
        website:     bizRes.data.website     ?? '',
        street:      bizRes.data.street      ?? bizRes.data.address ?? '',
        city:        bizRes.data.city        ?? '',
        state:       bizRes.data.state       ?? '',
        zip:         bizRes.data.zip         ?? '',
        cover_image: bizRes.data.cover_image ?? '',
        logo_url:    bizRes.data.logo_url    ?? '',
        images:      bizRes.data.images ?? [],
        slug:        bizRes.data.slug ?? '',
        hours_open:  bizRes.data.hours_open  ?? '',
        days_open:   bizRes.data.days_open   ?? [],
        category:    bizRes.data.category    ?? '',
        country:     bizRes.data.country     ?? '',
      })
    }
    if (reviewRes.data)  setReviews(reviewRes.data as Review[])
    if (productRes.data) setProducts(productRes.data)
    setLoading(false)
  }

  async function saveSlug() {
    const cleaned = slugInput.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    if (!cleaned) { setSlugMsg({ text: 'Enter a valid store name', ok: false }); return }
    if (biz!.plan !== 'storefront') { setSlugMsg({ text: 'Upgrade to Storefront to use a custom URL', ok: false }); return }
    setSlugSaving(true); setSlugMsg(null)
    // Check uniqueness
    const { data: existing } = await supabase.from('businesses').select('id').eq('slug', cleaned).neq('id', biz!.id).single()
    if (existing) { setSlugMsg({ text: 'That URL is already taken — try another', ok: false }); setSlugSaving(false); return }
    const { error } = await supabase.from('businesses').update({ slug: cleaned }).eq('id', biz!.id)
    if (error) { setSlugMsg({ text: error.message, ok: false }) }
    else {
      setSlugMsg({ text: `Store URL set: markeetee.com/store/${cleaned}`, ok: true })
      setBiz(b => b ? { ...b, slug: cleaned } : b)
      setSlugInput(cleaned)
    }
    setSlugSaving(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!biz) return
    setSaving(true); setError('')

    let lat = biz.lat ?? null
    let lng = biz.lng ?? null
    if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      try {
        const addr = encodeURIComponent(`${form.street ? form.street + ', ' : ''}${form.city}, ${form.state}, USA`)
        const geoRes  = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${addr}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`)
        const geoData = await geoRes.json()
        if (geoData.results?.[0]?.geometry?.location) {
          lat = geoData.results[0].geometry.location.lat
          lng = geoData.results[0].geometry.location.lng
        }
      } catch { /* geocoding optional */ }
    }

    const { error: saveError } = await supabase.from('businesses').update({
      name:        form.name,
      description: form.description,
      phone:       form.phone,
      email:       form.email,
      website:     form.website,
      street:      form.street   || null,
      address:     form.street   || null,
      city:        form.city,
      state:       form.state,
      zip:         form.zip      || null,
      category:    form.category || null,
      country:     form.country  || null,
      cover_image: form.cover_image || null,
      logo_url:    form.logo_url    || null,
      hours_open:  form.hours_open  || null,
      days_open:   form.days_open.length > 0 ? form.days_open : null,
      lat, lng,
    }).eq('id', biz.id)

    if (saveError) { setError(saveError.message) }
    else { setBiz(b => b ? { ...b, ...form } : b); setSaved(true); setTimeout(() => setSaved(false), 3000) }
    setSaving(false)
  }

  async function handleAvatarUpload(url: string) {
    setAvatarUrl(url)
    if (user?.id) {
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id)
      await refreshProfile()
    }
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault()
    if (!biz || !newProduct.name) return
    setAddingProduct(true)
    const { data, error: prodError } = await supabase.from('products').insert({
      business_id: biz.id,
      name:        newProduct.name,
      price:       parseFloat(newProduct.price) || 0,
      description: newProduct.description || null,
      image_url:   newProduct.image_url   || null,
      available:   true,
    }).select().single()
    if (prodError) { setError(prodError.message) }
    else if (data) { setProducts(p => [data, ...p]); setNewProduct({ name:'', price:'', description:'', image_url:'' }); setShowAddProduct(false) }
    setAddingProduct(false)
  }

  async function handleDeleteProduct(id: string) {
    await supabase.from('products').delete().eq('id', id)
    setProducts(p => p.filter(x => x.id !== id))
  }

  function upd(k: string, v: string | string[] | null) { setForm(f => ({ ...f, [k]: v })) }
  function updProduct(k: string, v: string) { setNewProduct(p => ({ ...p, [k]: v })) }

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
  const labelCls = "block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide"

  if (authLoading || loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-24 h-24 rounded-full bg-gray-100" style={{ animation:'pulse 2s infinite' }} />
        <div className="space-y-2">
          <div className="h-7 w-48 bg-gray-100 rounded-lg" style={{ animation:'pulse 2s infinite' }} />
          <div className="h-4 w-32 bg-gray-100 rounded" style={{ animation:'pulse 2s infinite' }} />
        </div>
      </div>
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {[80,60,72,64,70].map((w,i) => (
          <div key={i} className="h-9 rounded-lg bg-gray-200 flex-shrink-0" style={{ width:`${w}px`, animation:'pulse 2s infinite' }} />
        ))}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="w-5 h-5 bg-gray-100 rounded mb-3" style={{ animation:'pulse 2s infinite' }} />
            <div className="h-8 w-16 bg-gray-100 rounded mb-2" style={{ animation:'pulse 2s infinite' }} />
            <div className="h-3 w-24 bg-gray-100 rounded" style={{ animation:'pulse 2s infinite' }} />
          </div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{ __html:'@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}' }} />
    </div>
  )

  if (!isLoggedIn || !isOwner) return null

  if (!biz) return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-4">🏪</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">No business linked yet</h2>
      <p className="text-sm text-gray-500 mb-6">Register your business to get started.</p>
      <Link href="/auth/signup" className="inline-block text-sm font-semibold text-white px-6 py-3 rounded-xl" style={{ background:'#1D9E75' }}>
        Register your business
      </Link>
    </div>
  )

  const stats = [
    { label:'Profile views',  value:'—',                                          icon:Eye           },
    { label:'Average rating', value:biz.rating>0?biz.rating.toFixed(1):'—',      icon:Star          },
    { label:'Total reviews',  value:String(reviews.length||biz.review_count||0),  icon:MessageSquare },
    { label:'Products listed',value:String(products.length),                      icon:Plus          },
  ]
  const recommendations = getRecommendations(biz, reviews, products)
  const profileScore    = Math.round(recommendations.filter(r => r.done).length / recommendations.length * 100)
  const TABS = ['overview','listing','products','reviews','upgrade'] as const

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <ImageUpload bucket="avatars" folder={user?.id ?? 'unknown'}
            currentUrl={avatarUrl} onUpload={handleAvatarUpload} shape="circle" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {profile?.name?.split(' ')[0] ?? 'Owner'}</h1>
            <p className="text-gray-500 text-sm flex items-center gap-1.5">
              {biz.verified && <BadgeCheck size={14} style={{ color:'#1D9E75' }} />}
              {biz.name}
              {biz.premium && <span className="text-xs text-white px-2 py-0.5 rounded-full" style={{ background:'#1D9E75' }}>Premium</span>}
            </p>
          </div>
        </div>
        <Link href={`/businesses/${biz.id}`}
          className="hidden sm:flex items-center gap-2 text-sm font-medium text-white px-4 py-2 rounded-xl hover:opacity-90"
          style={{ background:'#1D9E75' }}>
          <Eye size={14} /> View listing
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${tab===t?'bg-white shadow-sm text-gray-900':'text-gray-500 hover:text-gray-700'}`}>
            {t==='upgrade'?'⭐ Upgrade':t}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab==='overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(({ label, value, icon:Icon }) => (
              <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100">
                <Icon size={17} className="mb-3" style={{ color:'#1D9E75' }} />
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400 mt-1">{label}</p>
              </div>
            ))}
          </div>
          <ProfileStrength recommendations={recommendations} profileScore={profileScore} onFix={() => setTab('listing')} />
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Your listing</h2>
              <button onClick={() => setTab('listing')} className="text-sm font-medium flex items-center gap-1" style={{ color:'#1D9E75' }}>
                Edit <Edit size={13} />
              </button>
            </div>
            <div className="flex gap-4 p-5">
              {biz.cover_image
                ? <img src={biz.cover_image} alt={biz.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                : <div className="w-20 h-20 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl" style={{ background:'#E1F5EE' }}>🏪</div>
              }
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-900">{biz.name}</span>
                  {biz.verified && <BadgeCheck size={15} style={{ color:'#1D9E75' }} />}
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">{biz.description || 'No description yet.'}</p>
                <p className="text-xs text-gray-400 mt-2">
                  📍 {[biz.street ?? biz.address, biz.city, biz.state, biz.zip].filter(Boolean).join(', ') || 'No location set'}
                  {biz.rating>0 && ` · ⭐ ${biz.rating.toFixed(1)}`}
                </p>
                {biz.category && <p className="text-xs text-gray-400 mt-0.5">📂 {CATEGORIES.find(c => c.id === biz.category)?.label ?? biz.category}</p>}
                {biz.country && <p className="text-xs text-gray-400 mt-0.5">🌍 {biz.country}</p>}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Recent reviews</h2>
            {reviews.length===0
              ? <p className="text-sm text-gray-400 text-center py-6">No reviews yet. Share your listing to get your first review!</p>
              : <div className="space-y-3">
                  {reviews.slice(0,2).map(r => (
                    <div key={r.id} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{ background:'#085041' }}>
                        {r.profiles?.name?.[0] ?? '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{r.profiles?.name ?? 'Anonymous'} · {'⭐'.repeat(r.rating)}</p>
                        <p className="text-xs text-gray-500 line-clamp-2">{r.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
            }
            {reviews.length>2 && (
              <button onClick={() => setTab('reviews')} className="mt-3 text-sm font-medium flex items-center gap-1" style={{ color:'#1D9E75' }}>
                See all {reviews.length} reviews <ArrowUpRight size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* LISTING EDITOR */}
      {tab==='listing' && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
          <h2 className="font-bold text-xl text-gray-900">Edit your listing</h2>
          {error && <div className="px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-100">{error}</div>}
          {saved && <div className="px-4 py-3 rounded-xl text-sm text-green-700 bg-green-50 border border-green-100">✓ Changes saved successfully</div>}

          {/* Images */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GalleryUploader
              businessId={biz.id}
              coverImage={form.cover_image || null}
              images={form.images}
              onChange={({ cover_image, images }) => {
                upd('cover_image', cover_image ?? '')
                upd('images', images)
              }}
            />
            <ImageUpload bucket="businesses" folder={`${profile?.business_id ?? 'unknown'}/logo`}
              currentUrl={form.logo_url||null} onUpload={url => upd('logo_url', url)}
              onRemove={() => upd('logo_url', '')} label="Logo / profile photo" />
          </div>

          {/* Business info */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Business info</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Business name</label>
                <input type="text" value={form.name} onChange={e => upd('name', e.target.value)} placeholder="Enter your business name" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Phone number</label>
                <input type="tel" value={form.phone} onChange={e => upd('phone', e.target.value)} placeholder="Enter your phone number" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={form.email} onChange={e => upd('email', e.target.value)} placeholder="Enter your email" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Website</label>
                <input type="url" value={form.website} onChange={e => upd('website', e.target.value)} placeholder="Enter your website URL" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <select value={form.category} onChange={e => upd('category', e.target.value)} className={inputCls}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Country of origin</label>
                <select value={form.country} onChange={e => upd('country', e.target.value)} className={inputCls}>
                  <option value="">Select country</option>
                  <CountriesBar />
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Description</label>
                <textarea value={form.description} onChange={e => upd('description', e.target.value)}
                  placeholder="Tell customers about your business, what you sell, and what makes you special..."
                  rows={3} className={`${inputCls} resize-none`} />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <MapPin size={13} /> Location
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
              <div className="sm:col-span-6">
                <label className={labelCls}>Street address</label>
                <input value={form.street} onChange={e => upd('street', e.target.value)} placeholder="Enter your street address" className={inputCls} />
              </div>
              <div className="sm:col-span-3">
                <label className={labelCls}>City</label>
                <input value={form.city} onChange={e => upd('city', e.target.value)} placeholder="Enter your city" className={inputCls} />
              </div>
              <div className="sm:col-span-1">
                <label className={labelCls}>State</label>
                <input value={form.state} onChange={e => upd('state', e.target.value)} placeholder="Enter your state" maxLength={2} className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>ZIP code</label>
                <input value={form.zip} onChange={e => upd('zip', e.target.value)} placeholder="Enter your ZIP code" maxLength={10} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Hours */}
          <div>
            <div>
              <label className={`${labelCls} flex items-center gap-1.5`}><Calendar size={13} /> Days open</label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(day => {
                  const isOn = form.days_open.includes(day)
                  return (
                    <button key={day} type="button"
                      onClick={() => setForm(f => ({ ...f, days_open: f.days_open.includes(day) ? f.days_open.filter(d => d !== day) : [...f.days_open, day] }))}
                      className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                      style={{ background: isOn?'#1D9E75':'transparent', borderColor: isOn?'#1D9E75':'#E5E7EB', color: isOn?'white':'#6B7280' }}>
                      {day.slice(0, 3)}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Custom store URL (Storefront plan only) ── */}
          <div className="border border-gray-100 rounded-2xl p-5" style={{ background: biz.plan === 'storefront' ? '#fafafa' : '#f9fafb' }}>
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-gray-900 text-sm">Custom store URL</p>
              {biz.plan !== 'storefront' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:'#FEF3C7', color:'#92400E' }}>
                  Storefront plan
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-3">
              {biz.plan === 'storefront'
                ? 'Your store is accessible at markeetee.com/store/your-url'
                : 'Upgrade to Storefront to get a shareable custom URL like markeetee.com/store/your-business'}
            </p>
            {biz.plan === 'storefront' ? (
              <>
                <div className="flex gap-2">
                  <div className="flex items-center bg-gray-100 rounded-l-xl px-3 text-xs text-gray-500 border border-r-0 border-gray-200 flex-shrink-0 whitespace-nowrap">
                    markeetee.com/store/
                  </div>
                  <input
                    type="text"
                    value={slugInput}
                    onChange={e => { setSlugInput(e.target.value); setSlugMsg(null) }}
                    placeholder="your-business-name"
                    className="flex-1 border border-gray-200 rounded-r-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all min-w-0"
                  />
                  <button type="button" onClick={saveSlug} disabled={slugSaving}
                    className="flex-shrink-0 text-sm font-semibold text-white px-4 py-2 rounded-xl disabled:opacity-60"
                    style={{ background: '#1D9E75' }}>
                    {slugSaving ? <Loader2 size={14} className="animate-spin" /> : 'Save URL'}
                  </button>
                </div>
                <p className="text-xs mt-1">
                  {slugMsg && (
                    <span style={{ color: slugMsg.ok ? '#1D9E75' : '#DC2626' }}>{slugMsg.text}</span>
                  )}
                  {!slugMsg && biz.slug && (
                    <span className="text-gray-400">
                      Current: <a href={`/store/${biz.slug}`} target="_blank" rel="noopener noreferrer" className="underline" style={{ color:'#1D9E75' }}>markeetee.com/store/{biz.slug}</a>
                    </span>
                  )}
                </p>
              </>
            ) : (
              <button type="button" onClick={() => setTab('upgrade')}
                className="text-xs font-semibold text-white px-4 py-2 rounded-xl"
                style={{ background: '#085041' }}>
                Upgrade to Storefront →
              </button>
            )}
          </div>

          <button type="submit" disabled={saving}
            className="w-full text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background:'#1D9E75' }}>
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <><Save size={16} /> Save changes</>}
          </button>
        </form>
      )}

      {/* PRODUCTS */}
      {tab==='products' && (
        <div className="space-y-4">
          <h2 className="font-bold text-xl text-gray-900">Products</h2>
          <ProductManager businessId={biz.id} />
        </div>
      )}

      {/* REVIEWS */}
      {tab==='reviews' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-900">{biz.rating>0?biz.rating.toFixed(1):'—'}</p>
              <p className="text-sm text-gray-400">{reviews.length} reviews</p>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              {reviews.length===0
                ? 'No reviews yet. Share your listing link to start collecting reviews.'
                : `You have ${reviews.length} review${reviews.length!==1?'s':''}. Keep up the great work!`}
            </p>
          </div>
          {reviews.length===0 ? (
            <div className="text-center py-12 text-gray-400"><MessageSquare size={32} className="mx-auto mb-3 opacity-30" /><p className="text-sm">No reviews yet</p></div>
          ) : reviews.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background:'#085041' }}>
                  {r.profiles?.name?.[0] ?? '?'}
                </div>
                <span className="font-medium text-sm text-gray-800">{r.profiles?.name ?? 'Anonymous'}</span>
                <span className="text-xs text-gray-400 ml-auto">{new Date(r.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
              </div>
              <p className="text-xs font-bold text-gray-400 mb-1">{'⭐'.repeat(r.rating)}</p>
              {r.title && <p className="font-semibold text-sm text-gray-800 mb-1">{r.title}</p>}
              <p className="text-sm text-gray-600">{r.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* UPGRADE */}
      {tab==='upgrade' && (
        <div className="space-y-6">
          {/* Current plan banner */}
          <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: '#f0faf6', border: '1px solid #9FE1CB' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
              style={{ background: '#1D9E75' }}>
              {biz.plan === 'storefront' ? '🏪' : biz.plan === 'premium' ? '⭐' : '🆓'}
            </div>
            <div>
              <p className="font-semibold text-gray-900 capitalize">
                You are on the <strong>{biz.plan ?? 'Free'}</strong> plan
              </p>
              <p className="text-xs text-gray-500">
                {biz.plan === 'storefront'
                  ? 'You have access to all Markeetee features.'
                  : biz.plan === 'premium'
                  ? 'Upgrade to Storefront to unlock a custom store URL and more.'
                  : 'Upgrade to unlock more features and reach more customers.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {getPlans(biz.plan).map(plan => (
            <div key={plan.name}
              className="rounded-2xl border p-6 flex flex-col"
              style={plan.highlight
                ? { background:'#085041', borderColor:'#085041', color:'white' }
                : plan.current
                ? { background:'#f9fafb', borderColor:'#1D9E75', borderWidth: 2 }
                : { background:'white', borderColor:'#F3F4F6' }}>

              {/* Badges */}
              <div className="flex items-center gap-2 mb-4">
                {plan.highlight && (
                  <div className="text-xs font-bold bg-amber-400 text-amber-900 px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                {plan.current && (
                  <div className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{ background: '#E1F5EE', color: '#085041' }}>
                    ✓ Your plan
                  </div>
                )}
              </div>

              <p className="text-xl font-bold mb-1">{plan.name}</p>
              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span style={{ color: plan.highlight ? '#9FE1CB' : '#9CA3AF' }}>{plan.period}</span>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map(f => (
                  <li key={f} className={`flex items-center gap-2 text-sm ${plan.highlight ? 'text-green-100' : 'text-gray-600'}`}>
                    <span style={{ color: plan.highlight ? '#9FE1CB' : '#1D9E75' }}>✓</span>{f}
                  </li>
                ))}
              </ul>

              {plan.current ? (
                <div className="w-full py-3 rounded-xl text-sm font-semibold text-center"
                  style={{ background: '#E1F5EE', color: '#085041' }}>
                  Current plan
                </div>
              ) : plan.id === 'free' ? (
                <div className="w-full py-3 rounded-xl text-sm font-semibold text-center"
                  style={{ background: '#F3F4F6', color: '#9CA3AF' }}>
                  Downgrade
                </div>
              ) : (
                <a
                  href={`mailto:hello@markeetee.com?subject=Upgrade to ${plan.name}&body=Hi, I would like to upgrade my Markeetee listing (Business ID: ${biz.id}) to the ${plan.name} plan ($${plan.price}/month). Please send me payment details.`}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-center block hover:opacity-90 transition-opacity"
                  style={{
                    background: plan.highlight ? '#ffffff' : '#1D9E75',
                    color:      plan.highlight ? '#085041' : '#ffffff',
                  }}>
                  Upgrade to {plan.name} →
                </a>
              )}
            </div>
          ))}
          </div>

          {/* Contact to upgrade */}
          <div className="rounded-2xl border border-gray-100 p-5 bg-gray-50 text-center">
            <p className="text-sm text-gray-600 mb-1">
              Need help choosing a plan or want to pay by bank transfer?
            </p>
            <a href="mailto:hello@markeetee.com"
              className="text-sm font-semibold"
              style={{ color: '#1D9E75' }}>
              Contact us at hello@markeetee.com
            </a>
          </div>
        </div>
      )}
    </div>
  )
}