'use client'

import { AFRICAN_FLAGS } from '@/lib/africanFlags'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Eye, Star, MessageSquare, MapPin, Edit, BadgeCheck,
  Plus, ArrowUpRight, Save, Loader2, Clock, Calendar,
  Lightbulb, CheckCircle2, Menu, X, LayoutDashboard,
  Package, BarChart2, Building2, Tag, Mail, Zap, Crown,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'
import ImageUpload        from '@/components/ui/ImageUpload'
import ProductManager     from '@/components/dashboard/ProductManager'
import GalleryUploader    from '@/components/dashboard/GalleryUploader'
import AnalyticsDashboard from '@/components/dashboard/AnalyticDashboard'
import LocationsManager   from '@/components/dashboard/LocationsManager'
import PromotionsManager  from '@/components/dashboard/PromotionsManager'
import LeadInbox          from '@/components/dashboard/LeadInbox'

// ── Constants ─────────────────────────────────────────────────────────────
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

const CATEGORIES = [
  { id:'food',       label:'Food & Groceries'  },
  { id:'restaurant', label:'Restaurant'         },
  { id:'fashion',    label:'Fashion & Fabric'   },
  { id:'beauty',     label:'Beauty & Hair'      },
  { id:'herbs',      label:'Herbs & Wellness'   },
  { id:'music',      label:'Music & Arts'       },
  { id:'crafts',     label:'Crafts & Decor'     },
  { id:'services',   label:'Services'           },
  { id:'nightlife',  label:'Bars & Nightlife'   },
]

type PlanId  = 'starter' | 'growth' | 'pro_store'
type Billing = 'monthly' | 'annual'
type TabId   = 'overview' | 'listing' | 'products' | 'analytics' | 'locations' | 'promotions' | 'enquiries' | 'reviews' | 'upgrade'

// ── Sidebar nav items ─────────────────────────────────────────────────────
const NAV_ITEMS: { id: TabId; label: string; icon: React.ElementType; planRequired?: PlanId }[] = [
  { id:'overview',   label:'Overview',    icon: LayoutDashboard },
  { id:'listing',    label:'Listing',     icon: Edit            },
  { id:'products',   label:'Products',    icon: Package         },
  { id:'analytics',  label:'Analytics',   icon: BarChart2,    planRequired:'growth'    },
  { id:'locations',  label:'Locations',   icon: MapPin,       planRequired:'pro_store' },
  { id:'promotions', label:'Promotions',  icon: Tag,          planRequired:'pro_store' },
  { id:'enquiries',  label:'Enquiries',   icon: Mail,         planRequired:'pro_store' },
  { id:'reviews',    label:'Reviews',     icon: Star            },
  { id:'upgrade',    label:'Upgrade',     icon: Crown           },
]

// ── Plan helpers ──────────────────────────────────────────────────────────
function normalizePlan(plan: string | null | undefined): PlanId {
  if (plan === 'premium'   || plan === 'growth')    return 'growth'
  if (plan === 'storefront'|| plan === 'pro_store') return 'pro_store'
  return 'starter'
}

function planLabel(plan: PlanId) {
  return plan === 'pro_store' ? 'Pro Store' : plan === 'growth' ? 'Growth' : 'Starter'
}

function canAccess(userPlan: PlanId, required?: PlanId): boolean {
  if (!required) return true
  if (required === 'growth')    return userPlan === 'growth' || userPlan === 'pro_store'
  if (required === 'pro_store') return userPlan === 'pro_store'
  return true
}

function getPlans(currentPlan: string | null) {
  const plan = normalizePlan(currentPlan)
  return [
    {
      id: 'starter' as PlanId,
      name: '🟢 Starter', subtitle: 'Get discovered online',
      monthlyPrice: 0, annualPrice: 0,
      highlight: false, current: plan === 'starter',
      features: ['Business listing','Map & search','Customer reviews','Contact info','WhatsApp button','1 photo'],
    },
    {
      id: 'growth' as PlanId,
      name: '🟡 Growth', subtitle: 'Reach more customers',
      monthlyPrice: 29, annualPrice: 23,
      highlight: true, current: plan === 'growth',
      features: ['Everything in Starter','Priority search','Up to 20 photos','Products & menu','Analytics','Verified badge','Priority support'],
    },
    {
      id: 'pro_store' as PlanId,
      name: '🔵 Pro Store', subtitle: 'Your full digital storefront',
      monthlyPrice: 49, annualPrice: 39,
      highlight: false, current: plan === 'pro_store',
      features: ['Everything in Growth','Custom store URL','Unlimited photos & products','Advanced analytics','Promotions','Lead enquiry form','Multiple locations','Product reviews','Dedicated support'],
    },
  ]
}

// ── Interfaces ────────────────────────────────────────────────────────────
interface Business {
  id: string; owner_id: string | null; name: string
  description: string | null; category: string | null
  city: string | null; state: string | null
  street: string | null; address: string | null
  zip: string | null; phone: string | null
  email: string | null; website: string | null; country: string | null
  cover_image: string | null; logo_url: string | null
  images: string[] | null; slug: string | null
  plan: string | null; plan_interval: string | null
  plan_status: string | null; plan_expires_at: string | null
  plan_cancel_at: string | null
  stripe_customer_id: string | null; stripe_subscription_id: string | null
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
  id: string; name: string; price: number
  description: string | null; image_url: string | null; available: boolean
}

// ── Profile strength ──────────────────────────────────────────────────────
function getRecommendations(biz: Business, reviews: Review[], products: Product[]) {
  return [
    { icon:'🖼️', title:'Add a cover photo',       done: !!biz.cover_image },
    { icon:'📝', title:'Write a description',       done: !!(biz.description && biz.description.length > 50) },
    { icon:'📦', title:'Add at least 3 products',  done: products.length >= 3 },
    { icon:'🕐', title:'Set your opening hours',   done: !!(biz.hours_open && biz.days_open?.length) },
    { icon:'📍', title:'Complete your address',    done: !!(biz.street ?? biz.address) && !!biz.city },
    { icon:'⭐', title:'Get your first 5 reviews', done: reviews.length >= 5 },
    { icon:'📱', title:'Add your phone number',    done: !!biz.phone },
  ]
}

// ── Sidebar component ─────────────────────────────────────────────────────
function Sidebar({
  tab, setTab, biz, mobileOpen, setMobileOpen,
}: {
  tab: TabId
  setTab: (t: TabId) => void
  biz: Business
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
}) {
  const plan = normalizePlan(biz.plan)

  const content = (
    <div className="flex flex-col h-full">
      {/* Business info */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {biz.cover_image
            ? <img src={biz.cover_image} alt={biz.name}
                className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
            : <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background:'#E1F5EE' }}>🏪</div>
          }
          <div className="min-w-0">
            <p className="font-bold text-sm text-gray-900 truncate">{biz.name}</p>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: plan === 'pro_store' ? '#085041' : plan === 'growth' ? '#FEF3C7' : '#F3F4F6',
                       color:      plan === 'pro_store' ? 'white'   : plan === 'growth' ? '#92400E' : '#6B7280' }}>
              {planLabel(plan)}
            </span>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon, planRequired }) => {
          const locked  = !canAccess(plan, planRequired)
          const active  = tab === id
          return (
            <button key={id} type="button"
              onClick={() => { setTab(id); setMobileOpen(false) }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
              style={active
                ? { background:'#1D9E75', color:'white' }
                : { color: locked ? '#CBD5E1' : '#374151' }}>
              <Icon size={16} className="flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {locked && <span className="text-[10px]">🔒</span>}
              {id === 'upgrade' && plan === 'starter' && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  NEW
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* View listing */}
      <div className="p-3 border-t border-gray-100">
        <Link href={`/businesses/${biz.id}`}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-700 transition-colors">
          <Eye size={14} /> View listing
        </Link>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 bg-white border border-gray-100 rounded-2xl overflow-hidden h-fit sticky top-6">
        {content}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <p className="font-bold text-gray-900">Dashboard</p>
              <button onClick={() => setMobileOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            {content}
          </aside>
        </div>
      )}
    </>
  )
}

// ── Plan gate ─────────────────────────────────────────────────────────────
function PlanGate({ plan, featureName, requiredPlan = 'pro_store', children, onUpgrade }: {
  plan: string | null; featureName: string; requiredPlan?: PlanId
  children: React.ReactNode; onUpgrade: () => void
}) {
  const current = normalizePlan(plan)
  if (canAccess(current, requiredPlan)) return <>{children}</>
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
      <div className="text-5xl mb-4">🔒</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Upgrade required</h2>
      <p className="text-sm text-gray-500 mb-6">
        {featureName} is available on the{' '}
        <strong>{requiredPlan === 'growth' ? 'Growth ($29/mo)' : 'Pro Store ($49/mo)'}</strong> plan.
      </p>
      <button onClick={onUpgrade}
        className="text-sm font-semibold text-white px-6 py-3 rounded-xl hover:opacity-90"
        style={{ background:'#1D9E75' }}>
        See upgrade options →
      </button>
    </div>
  )
}

// ── Main dashboard ────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router   = useRouter()
  const supabase = createClient()
  const { user, profile, isLoggedIn, loading: authLoading, refreshProfile } = useAuth()

  const [tab,           setTab]           = useState<TabId>('overview')
  const [mobileOpen,    setMobileOpen]    = useState(false)
  const [biz,           setBiz]           = useState<Business | null>(null)
  const [reviews,       setReviews]       = useState<Review[]>([])
  const [products,      setProducts]      = useState<Product[]>([])
  const [loading,       setLoading]       = useState(true)
  const [saving,        setSaving]        = useState(false)
  const [saved,         setSaved]         = useState(false)
  const [error,         setError]         = useState('')
  const [avatarUrl,     setAvatarUrl]     = useState<string | null>(null)
  const [slugInput,     setSlugInput]     = useState('')
  const [slugSaving,    setSlugSaving]    = useState(false)
  const [slugMsg,       setSlugMsg]       = useState<{ text: string; ok: boolean } | null>(null)
  const [billing,       setBilling]       = useState<Billing>('monthly')
  const [checkoutLoad,  setCheckoutLoad]  = useState<string | null>(null)
  const [portalLoad,    setPortalLoad]    = useState(false)
  const [toast,         setToast]         = useState<{ msg: string; ok: boolean } | null>(null)

  const [form, setForm] = useState({
    name:'', description:'', phone:'', email:'', website:'',
    street:'', city:'', state:'', zip:'',
    cover_image:'', logo_url:'', images:[] as string[],
    hours_open:'', days_open:[] as string[],
    category:'', country:'', slug:'',
  })

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  function upd(k: keyof typeof form, v: string | string[]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all'
  const labelCls = 'block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide'

  // ── Auth check ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return
    if (!isLoggedIn) { router.replace('/auth/login'); return }
    setAvatarUrl(profile?.avatar_url ?? null)
    if (profile?.business_id) { fetchAll(profile.business_id); return }
    if (user?.id) {
      async function findBiz() {
        const { data } = await supabase
          .from('businesses').select('id').eq('owner_id', user!.id).single()
        if (data?.id) {
          await supabase.from('profiles')
            .update({ business_id: data.id, role: 'owner' }).eq('id', user!.id)
          fetchAll(data.id)
        } else { setLoading(false) }
      }
      findBiz()
    } else { setLoading(false) }
  }, [authLoading, isLoggedIn, profile?.business_id, user?.id])

  // ── Fetch all data ────────────────────────────────────────────────────────
  async function fetchAll(bizId: string) {
    setLoading(true)
    const [bizRes, reviewRes, productRes] = await Promise.all([
      supabase.from('businesses').select('*').eq('id', bizId).single(),
      supabase.from('reviews')
        .select('id,rating,title,body,created_at,profiles(name)')
        .eq('business_id', bizId).order('created_at', { ascending: false }),
      supabase.from('products').select('*')
        .eq('business_id', bizId).order('created_at', { ascending: false }),
    ])
    if (bizRes.data) {
      const b = bizRes.data as Business
      setBiz(b)
      setSlugInput(b.slug ?? '')
      setForm({
        name:        b.name        ?? '',
        description: b.description ?? '',
        phone:       b.phone       ?? '',
        email:       b.email       ?? '',
        website:     b.website     ?? '',
        street:      b.street ?? b.address ?? '',
        city:        b.city        ?? '',
        state:       b.state       ?? '',
        zip:         b.zip         ?? '',
        cover_image: b.cover_image ?? '',
        logo_url:    b.logo_url    ?? '',
        images:      b.images      ?? [],
        hours_open:  b.hours_open  ?? '',
        days_open:   b.days_open   ?? [],
        category:    b.category    ?? '',
        country:     b.country     ?? '',
        slug:        b.slug        ?? '',
      })
    }
    if (reviewRes.data)  setReviews(reviewRes.data as Review[])
    if (productRes.data) setProducts(productRes.data as Product[])
    setLoading(false)
  }

  // ── Save listing ──────────────────────────────────────────────────────────
  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!biz) return
    setSaving(true); setError('')
    let lat = biz.lat, lng = biz.lng
    if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      try {
        const addr   = encodeURIComponent(`${form.street}, ${form.city}, ${form.state}, USA`)
        const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${addr}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`)
        const geo    = await geoRes.json()
        if (geo.results?.[0]?.geometry?.location) {
          lat = geo.results[0].geometry.location.lat
          lng = geo.results[0].geometry.location.lng
        }
      } catch {}
    }
    const { error: err } = await supabase.from('businesses').update({
      name: form.name, description: form.description || null,
      phone: form.phone || null, email: form.email || null,
      website: form.website || null,
      street: form.street || null, address: form.street || null,
      city: form.city || null, state: form.state || null, zip: form.zip || null,
      category: form.category || null, country: form.country || null,
      cover_image: form.cover_image || null, logo_url: form.logo_url || null,
      images: form.images,
      hours_open: form.hours_open || null,
      days_open: form.days_open.length > 0 ? form.days_open : null,
      lat, lng,
    }).eq('id', biz.id)
    if (err) { setError(err.message) }
    else {
      setBiz(b => b ? { ...b, ...form, lat: lat ?? null, lng: lng ?? null } : b)
      setSaved(true); setTimeout(() => setSaved(false), 3000)
      showToast('Listing saved!')
    }
    setSaving(false)
  }

  // ── Save slug ─────────────────────────────────────────────────────────────
  async function saveSlug() {
    if (!biz) return
    const cleaned = slugInput.toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')
    if (!cleaned) { setSlugMsg({ text:'Enter a valid store name', ok:false }); return }
    if (normalizePlan(biz.plan) !== 'pro_store') {
      setSlugMsg({ text:'Upgrade to Pro Store to use a custom URL', ok:false }); return
    }
    setSlugSaving(true); setSlugMsg(null)
    const { data: existing } = await supabase.from('businesses').select('id')
      .eq('slug', cleaned).neq('id', biz.id).maybeSingle()
    if (existing) { setSlugMsg({ text:'That URL is taken — try another', ok:false }); setSlugSaving(false); return }
    const { error } = await supabase.from('businesses').update({ slug: cleaned }).eq('id', biz.id)
    if (error) setSlugMsg({ text: error.message, ok:false })
    else {
      setSlugMsg({ text:`markeetee.com/store/${cleaned}`, ok:true })
      setBiz(b => b ? { ...b, slug:cleaned } : b)
    }
    setSlugSaving(false)
  }

  // ── Stripe ────────────────────────────────────────────────────────────────
  async function handleUpgrade(plan: PlanId) {
    if (!biz || !user) return
    setCheckoutLoad(plan)
    try {
      const res  = await fetch('/api/stripe/checkout', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ businessId:biz.id, plan, interval:billing, userId:user.id }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else showToast(data.error ?? 'Something went wrong', false)
    } catch { showToast('Could not start checkout', false) }
    setCheckoutLoad(null)
  }

  async function handlePortal() {
    if (!biz) return
    setPortalLoad(true)
    try {
      const res  = await fetch('/api/stripe/portal', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ businessId:biz.id }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else showToast(data.error ?? 'Could not open portal', false)
    } catch { showToast('Could not open portal', false) }
    setPortalLoad(false)
  }

  async function handleAvatarUpload(url: string) {
    setAvatarUrl(url)
    if (user?.id) {
      await supabase.from('profiles').update({ avatar_url:url }).eq('id', user.id)
      await refreshProfile()
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex items-center gap-3 text-gray-400">
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm">Loading dashboard…</span>
      </div>
    </div>
  )

  if (!isLoggedIn) return null

  if (!biz) return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-4">🏪</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">No business linked yet</h2>
      <p className="text-sm text-gray-500 mb-6">Register your business to get started.</p>
      <Link href="/business/new"
        className="inline-block text-sm font-semibold text-white px-6 py-3 rounded-xl"
        style={{ background:'#1D9E75' }}>
        Register your business
      </Link>
    </div>
  )

  const plan = normalizePlan(biz.plan)
  const recs = getRecommendations(biz, reviews, products)
  const profileScore = Math.round((recs.filter(r => r.done).length / recs.length) * 100)

  return (
    <div className="min-h-screen" style={{ background:'#F6F8F7' }}>

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-[100] px-4 py-3 rounded-xl text-sm font-medium shadow-lg"
          style={{ background: toast.ok ? '#E1F5EE' : '#FEF2F2', color: toast.ok ? '#085041' : '#DC2626' }}>
          {toast.msg}
        </div>
      )}

      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-4 bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg border border-gray-200 text-gray-600">
            <Menu size={18} />
          </button>
          <div>
            <p className="font-bold text-sm text-gray-900">{biz.name}</p>
            <p className="text-xs text-gray-400 capitalize">{tab}</p>
          </div>
        </div>
        <Link href={`/businesses/${biz.id}`}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 text-gray-600">
          <Eye size={12} /> View
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8">
        <div className="flex gap-6 items-start">

          {/* Sidebar */}
          <Sidebar tab={tab} setTab={setTab} biz={biz}
            mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

          {/* Main content */}
          <main className="flex-1 min-w-0 space-y-6">

            {/* Desktop page header */}
            <div className="hidden lg:flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ImageUpload bucket="avatars" folder={user?.id ?? 'unknown'}
                  currentUrl={avatarUrl} onUpload={handleAvatarUpload} shape="circle" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {profile?.name?.split(' ')[0] ? `Welcome, ${profile.name.split(' ')[0]}` : 'Dashboard'}
                  </h1>
                  <p className="text-sm text-gray-400">{biz.name}</p>
                </div>
              </div>
            </div>

            {/* ── OVERVIEW ── */}
            {tab === 'overview' && (
              <div className="space-y-5">
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label:'Rating',   value: biz.rating > 0 ? biz.rating.toFixed(1) : '—', icon: Star,         color:'#F59E0B' },
                    { label:'Reviews',  value: String(reviews.length),                         icon: MessageSquare, color:'#1D9E75' },
                    { label:'Products', value: String(products.length),                        icon: Package,       color:'#8B5CF6' },
                    { label:'Plan',     value: planLabel(plan),                                icon: Crown,         color:'#085041' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100">
                      <Icon size={16} className="mb-3" style={{ color }} />
                      <p className="text-2xl font-bold text-gray-900">{value}</p>
                      <p className="text-xs text-gray-400 mt-1">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Profile strength */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Lightbulb size={15} style={{ color:'#1D9E75' }} />
                      <span className="font-semibold text-sm text-gray-900">Profile strength</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: profileScore >= 80 ? '#1D9E75' : profileScore >= 50 ? '#D97706' : '#EF4444' }}>
                      {profileScore}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width:`${profileScore}%`, background: profileScore >= 80 ? '#1D9E75' : profileScore >= 50 ? '#D97706' : '#EF4444' }} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {recs.map(r => (
                      <div key={r.title} className="flex items-center gap-2.5 text-sm">
                        <span>{r.done ? '✅' : r.icon}</span>
                        <span className={r.done ? 'text-gray-400 line-through' : 'text-gray-700'}>{r.title}</span>
                      </div>
                    ))}
                  </div>
                  {recs.filter(r => !r.done).length > 0 && (
                    <button onClick={() => setTab('listing')}
                      className="mt-4 text-xs font-semibold text-white px-4 py-2 rounded-xl"
                      style={{ background:'#1D9E75' }}>
                      Complete your profile →
                    </button>
                  )}
                </div>

                {/* Listing snapshot */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900">Your listing</h2>
                    <button onClick={() => setTab('listing')}
                      className="text-sm font-medium flex items-center gap-1" style={{ color:'#1D9E75' }}>
                      Edit <Edit size={13} />
                    </button>
                  </div>
                  <div className="flex gap-4 p-5">
                    {biz.cover_image
                      ? <img src={biz.cover_image} alt={biz.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                      : <div className="w-20 h-20 rounded-xl flex-shrink-0 flex items-center justify-center text-3xl" style={{ background:'#E1F5EE' }}>🏪</div>
                    }
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900">{biz.name}</span>
                        {biz.verified && <BadgeCheck size={15} style={{ color:'#1D9E75' }} />}
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2">{biz.description || 'No description yet.'}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        📍 {[biz.street ?? biz.address, biz.city, biz.state].filter(Boolean).join(', ') || 'No address set'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recent reviews */}
                {reviews.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold text-gray-900">Recent reviews</h2>
                      <button onClick={() => setTab('reviews')}
                        className="text-sm font-medium flex items-center gap-1" style={{ color:'#1D9E75' }}>
                        All {reviews.length} <ArrowUpRight size={13} />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {reviews.slice(0,2).map(r => (
                        <div key={r.id} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{ background:'#085041' }}>
                            {r.profiles?.name?.[0] ?? '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{r.profiles?.name ?? 'Anonymous'} · {'⭐'.repeat(r.rating)}</p>
                            <p className="text-xs text-gray-500 line-clamp-1">{r.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── LISTING ── */}
            {tab === 'listing' && (
              <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
                <h2 className="font-bold text-xl text-gray-900">Edit your listing</h2>
                {error && <div className="px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-100">{error}</div>}
                {saved && <div className="px-4 py-3 rounded-xl text-sm text-green-700 bg-green-50 border border-green-100">✓ Saved successfully</div>}

                {/* Photos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <GalleryUploader businessId={biz.id}
                    coverImage={form.cover_image || null} images={form.images}
                    onChange={({ cover_image, images }) => {
                      upd('cover_image', cover_image ?? '')
                      upd('images', images)
                    }} />
                  <ImageUpload bucket="businesses" folder={`${biz.id}/logo`}
                    currentUrl={form.logo_url || null}
                    onUpload={url => upd('logo_url', url)}
                    onRemove={() => upd('logo_url', '')}
                    label="Logo / profile photo" />
                </div>

                {/* Business info */}
                <div>
                  <p className={labelCls}>Business info</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Business name</label>
                      <input value={form.name} onChange={e => upd('name', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Phone</label>
                      <input value={form.phone} onChange={e => upd('phone', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Email</label>
                      <input value={form.email} onChange={e => upd('email', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Website</label>
                      <input value={form.website} onChange={e => upd('website', e.target.value)} className={inputCls} />
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
                        {Object.entries(AFRICAN_FLAGS).map(([name, flag]) => (
                          <option key={name} value={name}>{flag} {name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Description</label>
                      <textarea value={form.description} onChange={e => upd('description', e.target.value)}
                        rows={3} className={`${inputCls} resize-none`} />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <p className={labelCls + ' flex items-center gap-1.5'}><MapPin size={11} /> Location</p>
                  <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                    <div className="sm:col-span-6">
                      <label className={labelCls}>Street address</label>
                      <input value={form.street} onChange={e => upd('street', e.target.value)} className={inputCls} />
                    </div>
                    <div className="sm:col-span-3">
                      <label className={labelCls}>City</label>
                      <input value={form.city} onChange={e => upd('city', e.target.value)} className={inputCls} />
                    </div>
                    <div className="sm:col-span-1">
                      <label className={labelCls}>State</label>
                      <input value={form.state} onChange={e => upd('state', e.target.value)} maxLength={2} className={inputCls} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelCls}>ZIP</label>
                      <input value={form.zip} onChange={e => upd('zip', e.target.value)} className={inputCls} />
                    </div>
                  </div>
                </div>

                {/* Hours */}
                <div>
                  <p className={labelCls + ' flex items-center gap-1.5'}><Clock size={11} /> Opening hours</p>
                  <div className="mb-3">
                    <input value={form.hours_open} onChange={e => upd('hours_open', e.target.value)}
                      placeholder="9:00 AM – 9:00 PM" className={inputCls} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map(day => {
                      const on = form.days_open.includes(day)
                      return (
                        <button key={day} type="button"
                          onClick={() => setForm(f => ({
                            ...f,
                            days_open: f.days_open.includes(day)
                              ? f.days_open.filter(d => d !== day)
                              : [...f.days_open, day],
                          }))}
                          className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                          style={{ background: on ? '#1D9E75' : 'transparent', borderColor: on ? '#1D9E75' : '#E5E7EB', color: on ? 'white' : '#6B7280' }}>
                          {day.slice(0,3)}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Custom URL */}
                <div className="rounded-2xl border border-gray-100 p-5" style={{ background:'#fafafa' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <p className="font-semibold text-sm text-gray-900">Custom store URL</p>
                    {plan !== 'pro_store' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:'#FEF3C7', color:'#92400E' }}>
                        Pro Store only
                      </span>
                    )}
                  </div>
                  {plan === 'pro_store' ? (
                    <>
                      <div className="flex gap-2">
                        <div className="flex items-center bg-gray-100 rounded-l-xl px-3 text-xs text-gray-500 border border-r-0 border-gray-200 flex-shrink-0">
                          markeetee.com/store/
                        </div>
                        <input type="text" value={slugInput}
                          onChange={e => { setSlugInput(e.target.value); setSlugMsg(null) }}
                          placeholder="your-business-name"
                          className="flex-1 border border-gray-200 rounded-r-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent min-w-0" />
                        <button type="button" onClick={saveSlug} disabled={slugSaving}
                          className="flex-shrink-0 text-sm font-semibold text-white px-4 py-2 rounded-xl disabled:opacity-60"
                          style={{ background:'#1D9E75' }}>
                          {slugSaving ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
                        </button>
                      </div>
                      {slugMsg && <p className="text-xs mt-2" style={{ color: slugMsg.ok ? '#1D9E75' : '#DC2626' }}>{slugMsg.text}</p>}
                    </>
                  ) : (
                    <button type="button" onClick={() => setTab('upgrade')}
                      className="text-xs font-semibold text-white px-4 py-2 rounded-xl"
                      style={{ background:'#085041' }}>
                      Upgrade to Pro Store →
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

            {/* ── PRODUCTS ── */}
            {tab === 'products' && <ProductManager businessId={biz.id} />}

            {/* ── ANALYTICS ── */}
            {tab === 'analytics' && (
              <PlanGate plan={biz.plan} featureName="Analytics" requiredPlan="growth" onUpgrade={() => setTab('upgrade')}>
                <AnalyticsDashboard businessId={biz.id} />
              </PlanGate>
            )}

            {/* ── LOCATIONS ── */}
            {tab === 'locations' && (
              <PlanGate plan={biz.plan} featureName="Multiple locations" onUpgrade={() => setTab('upgrade')}>
                <LocationsManager businessId={biz.id} />
              </PlanGate>
            )}

            {/* ── PROMOTIONS ── */}
            {tab === 'promotions' && (
              <PlanGate plan={biz.plan} featureName="Promotions" onUpgrade={() => setTab('upgrade')}>
                <PromotionsManager businessId={biz.id} />
              </PlanGate>
            )}

            {/* ── ENQUIRIES ── */}
            {tab === 'enquiries' && (
              <PlanGate plan={biz.plan} featureName="Lead enquiries" onUpgrade={() => setTab('upgrade')}>
                <LeadInbox businessId={biz.id} />
              </PlanGate>
            )}

            {/* ── REVIEWS ── */}
            {tab === 'reviews' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="font-bold text-lg text-gray-900 mb-4">Reviews ({reviews.length})</h2>
                {reviews.length === 0 ? (
                  <p className="text-sm text-gray-400">No reviews yet. Share your listing to get your first review.</p>
                ) : (
                  <div className="space-y-3">
                    {reviews.map(r => (
                      <div key={r.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-gray-900">{r.profiles?.name ?? 'Anonymous'}</p>
                          <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</p>
                        </div>
                        <p className="text-xs mb-1">{'⭐'.repeat(r.rating)}</p>
                        {r.title && <p className="text-sm font-semibold text-gray-800 mb-1">{r.title}</p>}
                        <p className="text-sm text-gray-600">{r.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── UPGRADE ── */}
            {tab === 'upgrade' && (
              <div className="space-y-6">
                {/* Current plan banner */}
                <div className="rounded-2xl p-4 flex items-center justify-between gap-3"
                  style={{ background:'#f0faf6', border:'1px solid #9FE1CB' }}>
                  <div>
                    <p className="font-semibold text-gray-900">
                      You are on the <strong>{planLabel(plan)}</strong> plan
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {plan === 'pro_store' ? 'You have access to all Markeetee features.'
                        : plan === 'growth'  ? 'Upgrade to Pro Store for custom URL, locations, and more.'
                        : 'Upgrade to unlock photos, products, analytics and more.'}
                    </p>
                  </div>
                  {plan !== 'starter' && (
                    <button onClick={handlePortal} disabled={portalLoad}
                      className="text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 flex items-center gap-1.5 flex-shrink-0"
                      style={{ color:'#1D9E75' }}>
                      {portalLoad && <Loader2 size={12} className="animate-spin" />}
                      Manage billing
                    </button>
                  )}
                </div>

                {/* Billing toggle */}
                <div className="flex items-center justify-center gap-3">
                  <span className={`text-sm font-medium ${billing === 'monthly' ? 'text-gray-900' : 'text-gray-400'}`}>Monthly</span>
                  <button type="button"
                    onClick={() => setBilling(b => b === 'monthly' ? 'annual' : 'monthly')}
                    className="relative w-12 h-6 rounded-full transition-colors"
                    style={{ background: billing === 'annual' ? '#1D9E75' : '#D1D5DB' }}>
                    <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                      style={{ transform: billing === 'annual' ? 'translateX(26px)' : 'translateX(2px)' }} />
                  </button>
                  <span className={`text-sm font-medium ${billing === 'annual' ? 'text-gray-900' : 'text-gray-400'}`}>
                    Annual
                    <span className="ml-1.5 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:'#E1F5EE', color:'#085041' }}>
                      Save 20%
                    </span>
                  </span>
                </div>

                {/* Plan cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {getPlans(biz.plan).map(p => {
                    const price = billing === 'annual' ? p.annualPrice : p.monthlyPrice
                    const annualNote = billing === 'annual' && p.monthlyPrice > 0 ? `Billed $${p.annualPrice * 12}/year` : ''
                    return (
                      <div key={p.id} className="rounded-2xl border p-6 flex flex-col"
                        style={p.highlight
                          ? { background:'#085041', borderColor:'#085041', color:'white' }
                          : p.current
                          ? { background:'#f9fafb', borderColor:'#1D9E75', borderWidth:2 }
                          : { background:'white', borderColor:'#F3F4F6' }}>
                        <div className="flex items-center gap-2 mb-3">
                          {p.highlight && <div className="text-xs font-bold bg-amber-400 text-amber-900 px-2.5 py-0.5 rounded-full">Popular</div>}
                          {p.current   && <div className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background:'#E1F5EE', color:'#085041' }}>✓ Current</div>}
                        </div>
                        <p className="text-lg font-bold mb-0.5">{p.name}</p>
                        <p className="text-xs mb-4" style={{ color: p.highlight ? '#9FE1CB' : '#6B7280' }}>{p.subtitle}</p>
                        <div className="flex items-baseline gap-1 mb-1">
                          <span className="text-4xl font-black">${price}</span>
                          {p.monthlyPrice > 0 && <span className="text-sm" style={{ color: p.highlight ? '#9FE1CB' : '#9CA3AF' }}>/mo</span>}
                        </div>
                        {annualNote && <p className="text-xs mb-4" style={{ color: p.highlight ? '#9FE1CB' : '#6B7280' }}>{annualNote}</p>}
                        <ul className="space-y-2 mb-6 flex-1 mt-3">
                          {p.features.map(f => (
                            <li key={f} className={`flex items-start gap-2 text-sm ${p.highlight ? 'text-green-100' : 'text-gray-600'}`}>
                              <span className="mt-0.5 flex-shrink-0" style={{ color: p.highlight ? '#9FE1CB' : '#1D9E75' }}>✓</span>
                              {f}
                            </li>
                          ))}
                        </ul>
                        {p.current ? (
                          <div className="w-full py-3 rounded-xl text-sm font-semibold text-center" style={{ background:'#E1F5EE', color:'#085041' }}>
                            Current plan
                          </div>
                        ) : p.id === 'starter' ? (
                          <div className="w-full py-3 rounded-xl text-sm font-semibold text-center" style={{ background:'#F3F4F6', color:'#9CA3AF' }}>
                            Free forever
                          </div>
                        ) : (
                          <button onClick={() => handleUpgrade(p.id)} disabled={checkoutLoad === p.id}
                            className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition-all"
                            style={{ background: p.highlight ? '#fff' : '#1D9E75', color: p.highlight ? '#085041' : '#fff' }}>
                            {checkoutLoad === p.id
                              ? <><Loader2 size={14} className="animate-spin" /> Starting…</>
                              : `Upgrade to ${p.name} →`}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="rounded-2xl border border-gray-100 p-5 bg-gray-50 text-center">
                  <p className="text-sm text-gray-600 mb-1">Need help or want to pay by bank transfer?</p>
                  <a href="mailto:hello@markeetee.com" className="text-sm font-semibold" style={{ color:'#1D9E75' }}>
                    Contact us at hello@markeetee.com
                  </a>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  )
}