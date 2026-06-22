'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  MapPin, Phone, Mail, Globe, Clock, MessageCircle,
  Star, BadgeCheck, ArrowLeft, Share2, Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'
import ReviewCard from '@/components/reviews/ReviewCard'
import ReviewForm from '@/components/reviews/ReviewForm'
import SaveButton from '@/components/ui/SaveButton'
import HoursBadge from '@/components/ui/HoursBadge'

const FLAGS: Record<string, string> = {
  Nigeria:'🇳🇬', Ghana:'🇬🇭', Kenya:'🇰🇪',
  Senegal:'🇸🇳', 'South Africa':'🇿🇦', Ethiopia:'🇪🇹',
}

const GRADIENTS: Record<string, string> = {
  food:       'linear-gradient(135deg,#c5eadb,#9fdcc3)',
  restaurant: 'linear-gradient(135deg,#EEEDFE,#AFA9EC)',
  fashion:    'linear-gradient(135deg,#FAEEDA,#FAC775)',
  beauty:     'linear-gradient(135deg,#FBEAF0,#ED93B1)',
  herbs:      'linear-gradient(135deg,#EAF3DE,#C0DD97)',
  music:      'linear-gradient(135deg,#FAECE7,#F0997B)',
  crafts:     'linear-gradient(135deg,#E6F1FB,#85B7EB)',
  services:   'linear-gradient(135deg,#F1EFE8,#B4B2A9)',
}

interface Business {
  id: string; name: string; category: string | null; subcategory: string | null
  description: string | null; address: string | null; street: string | null
  city: string | null; state: string | null; zip: string | null
  phone: string | null; email: string | null; website: string | null
  country: string | null; cover_image: string | null; logo_url: string | null
  rating: number; review_count: number; price_range: string | null
  tags: string[] | null; lat: number | null; lng: number | null
  verified: boolean; premium: boolean; featured: boolean
  hours_open: string | null; days_open: string[] | null
}

interface Review {
  id: string; rating: number; title: string | null; body: string | null
  created_at: string; helpful: number; verified: boolean
  profiles: { name: string | null; avatar_url?: string | null } | null
}

interface Product {
  id: string; name: string; price: number
  description: string | null; image_url: string | null; available: boolean
}

export default function BusinessDetailPage() {
  const params   = useParams()
  const id       = params.id as string
  const supabase = createClient()
  const { user } = useAuth()

  const [biz,         setBiz]         = useState<Business | null>(null)
  const [reviews,     setReviews]     = useState<Review[]>([])
  const [products,    setProducts]    = useState<Product[]>([])
  const [loading,     setLoading]     = useState(true)
  const [hasReviewed, setHasReviewed] = useState(false)
  const [notFound,    setNotFound]    = useState(false)
  const [copied,      setCopied]      = useState(false)

  const loadAll = useCallback(async () => {
    const [bizRes, reviewRes, productRes] = await Promise.all([
      supabase.from('businesses').select('*').eq('id', id).single(),
      supabase.from('reviews')
        .select('id, rating, title, body, created_at, helpful, verified, profiles(name, avatar_url)')
        .eq('business_id', id)
        .order('created_at', { ascending: false }),
      supabase.from('products')
        .select('id, name, price, description, image_url, available')
        .eq('business_id', id)
        .eq('available', true),
    ])

    if (bizRes.error || !bizRes.data) { setNotFound(true); setLoading(false); return }
    setBiz(bizRes.data)
    setReviews((reviewRes.data ?? []) as Review[])
    setProducts(productRes.data ?? [])
    setLoading(false)
  }, [id, supabase])

  // Check if current user already reviewed
  const checkHasReviewed = useCallback(async () => {
    if (!user?.id) return
    const { data } = await supabase
      .from('reviews')
      .select('id')
      .eq('business_id', id)
      .eq('user_id', user.id)
      .single()
    setHasReviewed(!!data)
  }, [id, user?.id, supabase])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  useEffect(() => {
    checkHasReviewed()
  }, [checkHasReviewed])

  // After review submitted — reload reviews + check status
  async function handleReviewSubmitted() {
    await loadAll()
    setHasReviewed(true)
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Loading skeleton ──────────────────────────────────────────────────
  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="h-4 w-48 bg-gray-100 rounded mb-6" style={{ animation: 'pulse 2s infinite' }} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-72 bg-gray-100 rounded-2xl" style={{ animation: 'pulse 2s infinite' }} />
          <div className="grid grid-cols-3 gap-3">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl" style={{ animation: 'pulse 2s infinite' }} />)}
          </div>
          <div className="h-40 bg-gray-100 rounded-2xl" style={{ animation: 'pulse 2s infinite' }} />
          <div className="h-64 bg-gray-100 rounded-2xl" style={{ animation: 'pulse 2s infinite' }} />
        </div>
        <div className="space-y-4">
          <div className="h-64 bg-gray-100 rounded-2xl" style={{ animation: 'pulse 2s infinite' }} />
          <div className="h-48 bg-gray-100 rounded-2xl" style={{ animation: 'pulse 2s infinite' }} />
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}' }} />
    </div>
  )

  if (notFound || !biz) return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <p className="text-5xl mb-4">🔍</p>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Business not found</h1>
      <p className="text-sm text-gray-500 mb-6">This listing may have been removed or the link is incorrect.</p>
      <Link href="/search" className="inline-block text-sm font-semibold text-white px-5 py-2.5 rounded-xl" style={{ background: '#1D9E75' }}>
        Browse businesses
      </Link>
    </div>
  )

  const ratingBreakdown = [5,4,3,2,1].map(s => ({
    s,
    count: reviews.filter(r => Math.round(r.rating) === s).length,
    pct:   reviews.length
      ? reviews.filter(r => Math.round(r.rating) === s).length / reviews.length * 100
      : 0,
  }))

  const fullAddress = [biz.street, biz.city, biz.state, biz.zip].filter(Boolean).join(', ')
  const grad        = GRADIENTS[biz.category ?? ''] ?? GRADIENTS.services

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-green-600 transition-colors">Home</Link>
        <span>/</span>
        <Link href="/search" className="hover:text-green-600 transition-colors">Businesses</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate">{biz.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Main column ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Cover */}
          <div className="relative rounded-2xl overflow-hidden" style={{ height: '280px' }}>
            {biz.cover_image
              ? <img src={biz.cover_image} alt={biz.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full" style={{ background: grad }} />
            }
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

            <Link href="/search"
              className="absolute top-4 left-4 flex items-center gap-1 bg-white/90 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full hover:bg-white transition-colors">
              <ArrowLeft size={11} /> Back
            </Link>

            <div className="absolute top-4 right-4 flex gap-2">
              {biz.verified && (
                <span className="flex items-center gap-1 text-white text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: '#1D9E75' }}>
                  <BadgeCheck size={11} /> Verified
                </span>
              )}
              {biz.featured && (
                <span className="bg-amber-500 text-white text-xs font-medium px-3 py-1.5 rounded-full">Featured</span>
              )}
            </div>

            <div className="absolute bottom-4 left-4 text-white">
              <p className="text-2xl font-bold">{biz.name}</p>
              <p className="text-white/80 text-sm">
                {biz.subcategory ?? biz.category}
                {biz.country && ` · ${FLAGS[biz.country] ?? '🌍'} ${biz.country}`}
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <p className="font-bold text-gray-900 mb-1 flex items-center justify-center gap-1">
                <Star size={14} className="text-amber-400 fill-current" />
                {biz.rating > 0 ? biz.rating.toFixed(1) : '—'}
              </p>
              <p className="text-xs text-gray-400">{biz.review_count} reviews</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <p className="font-bold text-gray-900 mb-1">{biz.price_range ?? '—'}</p>
              <p className="text-xs text-gray-400">Price range</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              {biz.hours_open ? (
                <>
                  <HoursBadge hoursOpen={biz.hours_open} daysOpen={biz.days_open} size="md" />
                  <p className="text-xs text-gray-400 mt-1">{biz.hours_open}</p>
                  <p className="text-xs text-gray-400">Opening hours</p>
                </>
              ) : (
                <>
                  <p className="font-bold text-gray-400 mb-1 text-sm">—</p>
                  <p className="text-xs text-gray-400">Hours not set</p>
                </>
              )}
            </div>
          </div>

          {/* About */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h2 className="font-bold text-xl text-gray-900 mb-3">About</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              {biz.description || 'No description available for this business yet.'}
            </p>
            {biz.tags && biz.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {biz.tags.map(t => (
                  <span key={t} className="text-xs px-3 py-1 rounded-full font-medium"
                    style={{ background: '#E1F5EE', color: '#085041' }}>{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Products */}
          {products.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="font-bold text-xl text-gray-900 mb-4">Products & Menu</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products.map(p => (
                  <div key={p.id} className="flex gap-3 p-3 rounded-xl border border-gray-100">
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                      : <div className="w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center text-xl" style={{ background: '#F3F4F6' }}>📦</div>
                    }
                    <div>
                      <p className="font-medium text-sm text-gray-900">{p.name}</p>
                      {p.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{p.description}</p>}
                      <p className="font-bold text-sm mt-1" style={{ color: '#1D9E75' }}>${p.price?.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h2 className="font-bold text-xl text-gray-900 mb-4">Reviews</h2>

            {/* Rating summary */}
            {reviews.length > 0 && (
              <div className="flex gap-6 mb-6 pb-6 border-b border-gray-100">
                <div className="text-center">
                  <p className="text-5xl font-bold text-gray-900">{biz.rating.toFixed(1)}</p>
                  <div className="flex gap-0.5 justify-center my-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={14}
                        className={i <= Math.round(biz.rating) ? 'text-amber-400 fill-current' : 'text-gray-200'} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">{biz.review_count} reviews</p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {ratingBreakdown.map(({ s, count, pct }) => (
                    <div key={s} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-3">{s}</span>
                      <Star size={10} className="text-amber-400 fill-current" />
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#1D9E75' }} />
                      </div>
                      <span className="text-xs text-gray-400 w-4">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Review list */}
            <div className="space-y-4 mb-6">
              {reviews.length === 0
                ? <p className="text-gray-400 text-sm text-center py-4">No reviews yet — be the first!</p>
                : reviews.map(r => <ReviewCard key={r.id} review={r} />)
              }
            </div>

            {/* Review form */}
            <ReviewForm
              businessId={id}
              hasReviewed={hasReviewed}
              onSubmitted={handleReviewSubmitted}
            />
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">

          {/* Contact & map */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Location & Contact</h3>

            {/* Mini map placeholder */}
            <div className="rounded-xl mb-4 flex items-center justify-center"
              style={{ height: '130px', background: 'linear-gradient(135deg,#e8f7f1,#c5eadb)' }}>
              <div className="text-center">
                <MapPin size={22} className="mx-auto mb-1" style={{ color: '#1D9E75' }} />
                <p className="text-xs font-medium" style={{ color: '#085041' }}>
                  {biz.city}{biz.state ? `, ${biz.state}` : ''}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              {fullAddress && (
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#1D9E75' }} />
                  <span className="text-gray-600">{fullAddress}</span>
                </div>
              )}
              {biz.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} className="flex-shrink-0" style={{ color: '#1D9E75' }} />
                  <a href={`tel:${biz.phone}`} className="text-gray-600 hover:text-green-600 transition-colors">{biz.phone}</a>
                  <a
                    href={`https://wa.me/${biz.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="WhatsApp"
                    className="ml-auto flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors"
                    style={{ background: '#25D366', color: 'white' }}
                  >
                    <MessageCircle size={12} />
                    WhatsApp
                  </a>
                </div>
              )}
              {biz.email && (
                <div className="flex items-center gap-2">
                  <Mail size={14} className="flex-shrink-0" style={{ color: '#1D9E75' }} />
                  <a href={`mailto:${biz.email}`} className="text-gray-600 hover:text-green-600 transition-colors truncate">{biz.email}</a>
                </div>
              )}
              {biz.website && (
                <div className="flex items-center gap-2">
                  <Globe size={14} className="flex-shrink-0" style={{ color: '#1D9E75' }} />
                  <a href={biz.website} target="_blank" rel="noopener noreferrer"
                    className="hover:text-green-600 transition-colors truncate" style={{ color: '#1D9E75' }}>
                    {biz.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 mt-4">
              {/* WhatsApp — primary CTA for diaspora audience */}
              {biz.phone && (
                <a
                  href={`https://wa.me/${biz.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi! I found your business on Markeetee — ${biz.name}. I'd like to enquire about your products/services.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white py-3 rounded-xl hover:opacity-90 transition-opacity"
                  style={{ background: '#25D366' }}
                >
                  <MessageCircle size={16} />
                  Chat on WhatsApp
                </a>
              )}
              <div className="flex gap-2">
                {biz.lat && biz.lng && (
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${biz.lat},${biz.lng}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium text-white py-2.5 rounded-xl hover:opacity-90 transition-opacity"
                    style={{ background: '#1D9E75' }}>
                    <MapPin size={14} /> Directions
                  </a>
                )}
                <SaveButton businessId={biz.id} size="md" />
                <button onClick={handleShare}
                  className="flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-2.5 rounded-xl hover:border-green-300 hover:text-green-600 transition-colors text-sm">
                  <Share2 size={14} />
                  {copied ? 'Copied!' : ''}
                </button>
              </div>
            </div>
          </div>

          {/* Hours */}
          {(biz.hours_open || (biz.days_open && biz.days_open.length > 0)) && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock size={15} style={{ color: '#1D9E75' }} /> Opening Hours
              </h3>
              {biz.hours_open && (
                <p className="text-sm text-gray-700 font-medium mb-2">{biz.hours_open}</p>
              )}
              {biz.days_open && biz.days_open.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => {
                    const fullDay = { Mon:'Monday',Tue:'Tuesday',Wed:'Wednesday',Thu:'Thursday',Fri:'Friday',Sat:'Saturday',Sun:'Sunday' }[day]!
                    const isOpen  = biz.days_open!.includes(fullDay)
                    return (
                      <span key={day} className="text-xs px-2 py-1 rounded-lg font-medium"
                        style={{
                          background: isOpen ? '#E1F5EE' : '#F3F4F6',
                          color:      isOpen ? '#085041' : '#9CA3AF',
                        }}>
                        {day}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Upgrade CTA for non-premium */}
          {!biz.premium && (
            <div className="text-white rounded-2xl p-5" style={{ background: 'linear-gradient(135deg,#0F6E56,#085041)' }}>
              <p className="font-bold text-lg mb-1">Is this your business?</p>
              <p className="text-sm mb-4" style={{ color: '#9FE1CB' }}>
                Claim and upgrade your listing to add photos, products, and get featured placement.
              </p>
              <Link href="/auth/signup"
                className="block text-center text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity"
                style={{ background: 'white', color: '#085041' }}>
                Claim this listing
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}