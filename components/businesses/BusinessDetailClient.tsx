'use client'

import { AFRICAN_FLAGS } from '@/lib/africanCountries'
import { useEffect, useState, useCallback, useRef } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  MapPin, Phone, Mail, Globe,
  Star, ArrowLeft, Share2, MessageCircle,
  X, ChevronLeft, ChevronRight, Grid2x2
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'
import ReviewCard    from '@/components/reviews/ReviewCard'
import ReviewForm    from '@/components/reviews/ReviewForm'
import SaveButton    from '@/components/ui/SaveButton'
import ProductModal      from '@/components/ui/ProductModal'
import GoogleMapsHours    from '@/components/ui/GoogleMapsHours'

// ── Airbnb-style full-screen gallery ─────────────────────────────────────
function Gallery({
  photos,
  startIdx,
  onClose,
}: {
  photos:   string[]
  startIdx: number
  onClose:  () => void
}) {
  const [idx, setIdx]       = useState(startIdx)
  const touchStartX         = useRef<number | null>(null)
  const touchStartY         = useRef<number | null>(null)

  // Keyboard nav
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft')  setIdx(i => (i - 1 + photos.length) % photos.length)
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % photos.length)
      if (e.key === 'Escape')     onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [photos.length, onClose])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function prev() { setIdx(i => (i - 1 + photos.length) % photos.length) }
  function next() { setIdx(i => (i + 1) % photos.length) }

  // Touch / swipe
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      dx < 0 ? next() : prev()
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: '#000' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.15)' }}>
          <X size={18} className="text-white" />
        </button>
        <span className="text-white text-sm font-medium">
          {idx + 1} / {photos.length}
        </span>
        <div className="w-9" /> {/* spacer */}
      </div>

      {/* Main image */}
      <div className="flex-1 relative flex items-center justify-center px-2">
        <div className="relative w-full h-full max-h-[75vh]">
          <Image
            src={photos[idx]}
            alt={`Photo ${idx + 1}`}
            fill
            sizes="100vw"
            className="object-contain"
            priority
          />
        </div>

        {/* Prev / Next — hidden on mobile, visible on desktop */}
        {photos.length > 1 && (
          <>
            <button
              onClick={prev}
              className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.2)' }}>
              <ChevronLeft size={20} className="text-white" />
            </button>
            <button
              onClick={next}
              className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.2)' }}>
              <ChevronRight size={20} className="text-white" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div className="flex-shrink-0 px-4 pb-4 pt-3">
          <div className="flex gap-2 overflow-x-auto justify-center">
            {photos.map((url, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className="flex-shrink-0 rounded-lg overflow-hidden transition-all duration-150"
                style={{
                  width:         52,
                  height:        52,
                  opacity:       i === idx ? 1 : 0.45,
                  outline:       i === idx ? '2px solid #1D9E75' : 'none',
                  outlineOffset: '2px',
                }}>
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
          {/* Swipe hint — mobile only */}
          <p className="text-center text-xs mt-2 sm:hidden" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Swipe to browse
          </p>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────
export default function BusinessDetailClient({ id }: { id: string }) {
  const supabase = createClient()
  const { user } = useAuth()

  const [biz,             setBiz]             = useState<any>(null)
  const [reviews,         setReviews]         = useState<any[]>([])
  const [products,        setProducts]        = useState<any[]>([])
  const [loading,         setLoading]         = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [galleryIdx,      setGalleryIdx]      = useState<number | null>(null)
  const [copied,          setCopied]          = useState(false)

  const loadAll = useCallback(async () => {
    const [bizRes, reviewRes, productRes] = await Promise.all([
      supabase.from('businesses').select('*').eq('id', id).single(),
      supabase.from('reviews')
        .select('id,rating,title,body,created_at,helpful,verified,user_id,owner_reply,reply_at,images,profiles(name,avatar_url)')
        .eq('business_id', id)
        .order('created_at', { ascending: false }),
      supabase.from('products')
        .select('id,name,price,description,image_url,images,available,sale_price,sale_active,sale_label,like_count,rating_avg,rating_count')
        .eq('business_id', id)
        .order('created_at', { ascending: false }),
    ])
    if (!bizRes.data) notFound()
    setBiz(bizRes.data)
    setReviews(reviewRes.data || [])
    setProducts(productRes.data || [])
    setLoading(false)
  }, [id, supabase])

  useEffect(() => { loadAll() }, [loadAll])

  // ── Check ownership ───────────────────────────────────────────────────
  const isThisOwner = !!(user && biz && user.id === biz.owner_id)

  // ── Owner reply to a review ───────────────────────────────────────────
  async function handleReply(reviewId: string, text: string) {
    const { error } = await supabase.from('reviews').update({
      owner_reply: text,
      reply_at:    new Date().toISOString(),
    }).eq('id', reviewId)
    if (!error) {
      setReviews(rs => rs.map(r =>
        r.id === reviewId
          ? { ...r, owner_reply: text, reply_at: new Date().toISOString() }
          : r
      ))
    }
  }

  if (loading) return (
    <div className="p-10 text-center text-gray-400">Loading…</div>
  )

  if (!biz) return null

  const fullAddress  = [biz.address, biz.city, biz.state].filter(Boolean).join(', ')
  const mapsUrl      = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
  const allPhotos    = [biz.cover_image, ...(biz.images || [])].filter(Boolean) as string[]
  const extraPhotos  = allPhotos.slice(1, 5) // up to 4 grid thumbnails

  function handleShare() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
    <div className="max-w-6xl mx-auto px-4 py-6">

      {/* ── AIRBNB-STYLE PHOTO GRID ── */}
      <div className="relative rounded-3xl overflow-hidden"
        style={{ height: '380px' }}>

        {allPhotos.length === 0 ? (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
            No photos yet
          </div>
        ) : allPhotos.length === 1 ? (
          // Single photo — full width
          <div
            className="relative w-full h-full cursor-zoom-in"
            onClick={() => setGalleryIdx(0)}>
            <Image src={allPhotos[0]} alt={biz.name} fill sizes="100vw"
              className="object-cover" priority />
          </div>
        ) : (
          // Airbnb grid: big left + 2×2 right
          <div className="grid h-full gap-1"
            style={{ gridTemplateColumns: '1fr 1fr' }}>

            {/* Left — hero */}
            <div
              className="relative cursor-zoom-in overflow-hidden"
              onClick={() => setGalleryIdx(0)}>
              <Image src={allPhotos[0]} alt={biz.name} fill sizes="50vw"
                className="object-cover hover:scale-105 transition-transform duration-500" priority />
            </div>

            {/* Right — 2×2 grid */}
            <div className="grid gap-1"
              style={{ gridTemplateRows: '1fr 1fr', gridTemplateColumns: '1fr 1fr' }}>
              {[1, 2, 3, 4].map(i => {
                const photo = allPhotos[i]
                const isLast = i === 4 && allPhotos.length > 5
                return photo ? (
                  <div
                    key={i}
                    className="relative cursor-zoom-in overflow-hidden"
                    onClick={() => setGalleryIdx(i)}>
                    <Image src={photo} alt="" fill sizes="25vw"
                      className="object-cover hover:scale-105 transition-transform duration-500" />
                    {/* Show remaining count on last cell */}
                    {isLast && (
                      <div className="absolute inset-0 flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.5)' }}>
                        <span className="text-white text-xl font-bold">
                          +{allPhotos.length - 5}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div key={i} className="bg-gray-100" />
                )
              })}
            </div>
          </div>
        )}

        {/* Top bar overlaid on grid */}
        <div className="absolute top-4 left-4 right-4 flex justify-between z-10">
          <Link href="/search"
            className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-xl flex items-center gap-1.5 text-sm font-medium hover:bg-white transition-colors">
            <ArrowLeft size={14} /> Back
          </Link>
          <div className="flex gap-2">
            <SaveButton businessId={biz.id} size="md" />
            <button
              onClick={handleShare}
              className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-xl text-sm font-medium hover:bg-white transition-colors">
              {copied ? 'Copied!' : <Share2 size={16} />}
            </button>
          </div>
        </div>

        {/* "Show all photos" button — bottom right */}
        {allPhotos.length > 1 && (
          <button
            onClick={() => setGalleryIdx(0)}
            className="absolute bottom-4 right-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white transition-colors shadow-sm">
            <Grid2x2 size={14} />
            Show all {allPhotos.length} photos
          </button>
        )}

        {/* Business name overlaid bottom-left */}
        <div className="absolute bottom-4 left-4 z-10">
          <div className="bg-black/50 backdrop-blur-sm rounded-2xl px-4 py-3">
            <h1 className="text-white font-bold text-xl">{biz.name}</h1>
            <p className="text-white/80 text-sm mt-0.5">
              {biz.category}
              {biz.country && ` · ${AFRICAN_FLAGS[biz.country] ?? '🌍'} ${biz.country}`}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <Star size={12} className="text-yellow-400 fill-current" />
              <span className="text-white text-sm font-medium">{biz.rating || '—'}</span>
              <span className="text-white/60 text-xs">({reviews.length} reviews)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── ACTION BAR ── */}
      <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
        {biz.phone && (
          <a
            href={`https://wa.me/${biz.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi! I found ${biz.name} on Markeetee. I'd like to enquire.`)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 flex-shrink-0 text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
            style={{ background: '#25D366' }}>
            <MessageCircle size={15} /> WhatsApp
          </a>
        )}
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 flex-shrink-0 text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
          style={{ background: '#1D9E75' }}>
          <MapPin size={15} /> Directions
        </a>
        {biz.phone && (
          <a href={`tel:${biz.phone}`}
            className="flex items-center gap-2 flex-shrink-0 border border-gray-200 text-gray-700 text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
            <Phone size={15} /> Call
          </a>
        )}
        {biz.website && (
          <a href={biz.website.startsWith('http') ? biz.website : `https://${biz.website}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 flex-shrink-0 border border-gray-200 text-gray-700 text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
            <Globe size={15} /> Website
          </a>
        )}
      </div>

      {/* ── HOURS — Google Maps style ── */}
      {biz.hours_open && (
        <div className="mt-4">
          <GoogleMapsHours
            hoursOpen={biz.hours_open}
            daysOpen={biz.days_open}
          />
        </div>
      )}

      {/* ── ABOUT ── */}
      <div className="bg-white rounded-2xl p-6 mt-6 border border-gray-100">
        <h2 className="font-bold text-lg mb-3 text-gray-900">About</h2>
        <p className="text-gray-600 leading-relaxed">
          {biz.description || 'No description available.'}
        </p>
        {biz.tags && biz.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {biz.tags.map((t: string) => (
              <span key={t} className="text-xs px-3 py-1 rounded-full font-medium"
                style={{ background: '#E1F5EE', color: '#085041' }}>{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* ── PRODUCTS ── */}
      <div className="mt-6">
        <h2 className="font-bold text-lg mb-4 text-gray-900">Products & Menu</h2>
        {products.length === 0 ? (
          <div className="text-center py-8 rounded-2xl border border-dashed border-gray-200">
            <p className="text-2xl mb-2">📦</p>
            <p className="text-sm text-gray-400">No products listed yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {products.map(p => {
              const photoCount = [p.image_url, ...(p.images ?? [])].filter(Boolean).length
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
  console.log('product clicked:', p.id, p.name)
  setSelectedProduct(p)
}}
                  className="cursor-pointer group rounded-2xl border border-gray-100 hover:border-green-300 hover:shadow-md transition-all duration-200 text-left w-full bg-white">
                  <div className="relative h-44 bg-gray-100 overflow-hidden rounded-t-2xl pointer-events-none">
                    {p.image_url ? (
                      <Image src={p.image_url} alt={p.name} fill sizes="200px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl pointer-events-none">📦</div>
                    )}
                    {/* Sale badge */}
                    {p.sale_active && p.sale_label && (
                      <div className="absolute top-2 left-2 pointer-events-none">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: '#FEF3C7', color: '#92400E' }}>
                          🏷️ {p.sale_label}
                        </span>
                      </div>
                    )}
                    {/* Photo count */}
                    {photoCount > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full pointer-events-none">
                        +{photoCount - 1} photos
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                    {p.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{p.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        {p.sale_active && p.sale_price ? (
                          <>
                            <span className="text-xs text-gray-400 line-through mr-1">${p.price}</span>
                            <span className="text-sm font-bold" style={{ color: '#1D9E75' }}>${p.sale_price}</span>
                          </>
                        ) : (
                          <span className="text-sm font-bold" style={{ color: '#1D9E75' }}>${p.price}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 group-hover:text-green-600 transition-colors">
                        View →
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── REVIEWS ── */}
      <div className="mt-6 bg-white p-6 rounded-2xl border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-gray-900">Reviews</h2>
          {biz.rating > 0 && (
            <div className="flex items-center gap-1">
              <Star size={14} className="text-amber-400 fill-current" />
              <span className="font-bold text-gray-900">{biz.rating.toFixed(1)}</span>
              <span className="text-xs text-gray-400">({reviews.length})</span>
            </div>
          )}
        </div>
        <div className="space-y-4 mb-6">
          {reviews.length === 0
            ? <p className="text-gray-400 text-sm text-center py-4">No reviews yet — be the first!</p>
            : reviews.map(r => (
              <div key={r.id} className="bg-gray-50 p-4 rounded-xl">
                <ReviewCard
                  review={r}
                  businessName={biz.name}
                  isOwner={isThisOwner}
                  onReply={handleReply}
                />
              </div>
            ))
          }
        </div>
        <ReviewForm businessId={id} hasReviewed={false} onSubmitted={loadAll} />
      </div>

      {/* ── CONTACT ── */}
      <div className="mt-6 bg-white p-6 rounded-2xl border border-gray-100">
        <h2 className="font-bold text-lg mb-4 text-gray-900">Contact & Location</h2>
        <div className="space-y-3 text-sm">
          {biz.phone && (
            <a href={`tel:${biz.phone}`} className="flex items-center gap-3 text-gray-600 hover:text-green-700 transition-colors">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#E1F5EE' }}>
                <Phone size={14} style={{ color: '#1D9E75' }} />
              </div>
              {biz.phone}
            </a>
          )}
          {biz.email && (
            <a href={`mailto:${biz.email}`} className="flex items-center gap-3 text-gray-600 hover:text-green-700 transition-colors">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#E1F5EE' }}>
                <Mail size={14} style={{ color: '#1D9E75' }} />
              </div>
              {biz.email}
            </a>
          )}
          {biz.website && (
            <a href={biz.website.startsWith('http') ? biz.website : `https://${biz.website}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 hover:text-green-700 transition-colors"
              style={{ color: '#1D9E75' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#E1F5EE' }}>
                <Globe size={14} style={{ color: '#1D9E75' }} />
              </div>
              {biz.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          {fullAddress && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-3 text-gray-600 hover:text-green-700 transition-colors">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#E1F5EE' }}>
                <MapPin size={14} style={{ color: '#1D9E75' }} />
              </div>
              <span className="underline decoration-dashed underline-offset-2">{fullAddress}</span>
            </a>
          )}
        </div>
      </div>

    </div>

      {/* ── PRODUCT MODAL ── */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          businessName={biz.name}
          businessPhone={biz.phone}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* ── FULL SCREEN GALLERY ── */}
      {galleryIdx !== null && allPhotos.length > 0 && (
        <Gallery
          photos={allPhotos}
          startIdx={galleryIdx}
          onClose={() => setGalleryIdx(null)}
        />
      )}
    </>
  )
}