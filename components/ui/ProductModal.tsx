'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  X, ChevronLeft, ChevronRight, Star,
  MessageCircle, Heart, Loader2,
  ShoppingCart, Send, LogIn, CheckCircle2,
  Share2, ZoomIn
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'
import Link from 'next/link'

interface Product {
  id:            string
  name:          string
  price:         number
  description:   string | null
  image_url:     string | null
  images?:       string[] | null
  available:     boolean
  like_count?:   number
  rating_avg?:   number
  rating_count?: number
  review_count?: number
  sale_price?:   number | null
  sale_active?:  boolean
  sale_label?:   string | null
}

interface ProductReview {
  id:         string
  rating:     number
  body:       string
  created_at: string
  user_id:    string
  profiles:   { name: string | null } | null
}

interface Props {
  product:       Product
  businessName:  string
  businessPhone: string | null
  businessId?:   string
  onClose:       () => void
}

// ── Fullscreen photo zoom overlay ─────────────────────────────────────────
function FullscreenPhoto({ src, onClose }: { src: string; onClose: () => void }) {
  const [scale,    setScale]    = useState(1)
  const [origin,   setOrigin]   = useState('center center')
  const lastTap    = useRef(0)

  function handleDoubleTap(e: React.MouseEvent | React.TouchEvent) {
    const now = Date.now()
    if (now - lastTap.current < 300) {
      setScale(s => s === 1 ? 2.5 : 1)
      if ('touches' in e) {
        const t   = e.touches[0] ?? e.changedTouches[0]
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        setOrigin(`${t.clientX - rect.left}px ${t.clientY - rect.top}px`)
      }
    }
    lastTap.current = now
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.96)' }}
      onClick={() => scale === 1 && onClose()}>
      <img
        src={src}
        alt=""
        draggable={false}
        onClick={handleDoubleTap}
        onTouchEnd={handleDoubleTap}
        style={{
          maxWidth:        '96vw',
          maxHeight:       '92vh',
          objectFit:       'contain',
          transform:       `scale(${scale})`,
          transformOrigin: origin,
          transition:      'transform 0.25s ease',
          cursor:          scale > 1 ? 'zoom-out' : 'zoom-in',
        }}
      />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.15)' }}>
        <X size={18} className="text-white" />
      </button>
      {scale === 1 && (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs">
          Double-tap to zoom
        </p>
      )}
    </div>
  )
}

// ── Swipeable photo gallery ───────────────────────────────────────────────
function PhotoGallery({
  photos, saleBadge, available,
  liked, likeLoading, onLike,
  onClose, onShare,
}: {
  photos:      string[]
  saleBadge?:  string | null
  available:   boolean
  liked:       boolean
  likeLoading: boolean
  onLike:      () => void
  onClose:     () => void
  onShare:     () => void
}) {
  const [slide,       setSlide]       = useState(0)
  const [dragging,    setDragging]    = useState(false)
  const [dragX,       setDragX]       = useState(0)
  const [velocity,    setVelocity]    = useState(0)
  const [fullscreen,  setFullscreen]  = useState(false)

  const touchStartX     = useRef(0)
  const touchStartY     = useRef(0)
  const touchLastX      = useRef(0)
  const touchTime       = useRef(0)
  const isHorizSwipe    = useRef<boolean | null>(null)
  const mouseStartX     = useRef(0)
  const isDraggingMouse = useRef(false)

  const prev = useCallback(() => setSlide(s => Math.max(0, s - 1)), [])
  const next = useCallback(() => setSlide(s => Math.min(photos.length - 1, s + 1)), [photos.length])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape')     onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next, onClose])

  if (photos.length === 0) {
    return (
      <div className="relative w-full flex items-center justify-center text-5xl"
        style={{ height: 260, background: '#F3F4F6' }}>
        📦
        {!available && (
          <div className="absolute inset-x-0 top-0 py-2 text-center text-xs font-bold text-white"
            style={{ background: '#EF4444' }}>
            Out of stock
          </div>
        )}
        <button onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow"
          style={{ background: '#EF4444' }}>
          <X size={15} className="text-white" />
        </button>
      </div>
    )
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current  = e.touches[0].clientX
    touchStartY.current  = e.touches[0].clientY
    touchLastX.current   = e.touches[0].clientX
    touchTime.current    = Date.now()
    isHorizSwipe.current = null
    setDragging(true); setDragX(0)
  }

  function handleTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - touchStartX.current
    const dy = e.touches[0].clientY - touchStartY.current
    if (isHorizSwipe.current === null) {
      isHorizSwipe.current = Math.abs(dx) > Math.abs(dy)
    }
    if (!isHorizSwipe.current) return
    e.preventDefault()
    const v = (e.touches[0].clientX - touchLastX.current) / (Date.now() - touchTime.current + 1)
    touchLastX.current = e.touches[0].clientX
    touchTime.current  = Date.now()
    setVelocity(v); setDragX(dx)
  }

  function handleTouchEnd() {
    setDragging(false)
    const fastSwipe = Math.abs(velocity) > 0.3
    if (dragX < -60 || (fastSwipe && dragX < 0)) next()
    else if (dragX > 60 || (fastSwipe && dragX > 0)) prev()
    setDragX(0); setVelocity(0); isHorizSwipe.current = null
  }

  function handleMouseDown(e: React.MouseEvent) {
    isDraggingMouse.current = true
    mouseStartX.current = e.clientX
    setDragging(true); setDragX(0)
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDraggingMouse.current) return
    setDragX(e.clientX - mouseStartX.current)
  }

  function handleMouseUp() {
    if (!isDraggingMouse.current) return
    isDraggingMouse.current = false
    setDragging(false)
    if (dragX < -60) next()
    else if (dragX > 60) prev()
    setDragX(0)
  }

  const canPrev = slide > 0
  const canNext = slide < photos.length - 1

  const clampedDrag = (() => {
    if (!canPrev && dragX > 0) return dragX * 0.25
    if (!canNext && dragX < 0) return dragX * 0.25
    return dragX
  })()

  return (
    <>
      <div className="relative select-none overflow-hidden"
        style={{ height: 280, touchAction: 'pan-y' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}>

        {/* Sliding track */}
        <div className="flex h-full" style={{
          transform:  `translateX(calc(-${slide * 100}% + ${clampedDrag}px))`,
          transition: dragging ? 'none' : 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)',
          willChange: 'transform',
          cursor:     dragging ? 'grabbing' : 'grab',
        }}>
          {photos.map((url, i) => (
            <div key={i} className="w-full h-full flex-shrink-0 relative">
              <img src={url} alt={`Photo ${i + 1}`}
                className="w-full h-full object-cover pointer-events-none"
                draggable={false} />
            </div>
          ))}
        </div>

        {/* Out of stock ribbon */}
        {!available && (
          <div className="absolute inset-x-0 top-0 py-1.5 text-center text-xs font-bold text-white z-10 pointer-events-none"
            style={{ background: 'rgba(239,68,68,0.92)', backdropFilter: 'blur(2px)' }}>
            Out of stock — tap WhatsApp to ask about availability
          </div>
        )}

        {/* Bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)' }} />

        {/* Close */}
        <button onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow z-10"
          style={{ background: '#EF4444' }}>
          <X size={15} className="text-white" />
        </button>

        {/* Like */}
        <button onClick={onLike} disabled={likeLoading}
          className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow z-10 disabled:opacity-60 transition-transform active:scale-90">
          <Heart size={15} fill={liked ? '#D4537E' : 'none'}
            style={{ color: liked ? '#D4537E' : '#6B7280' }} />
        </button>

        {/* Share */}
        <button onClick={onShare}
          className="absolute top-3 left-14 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow z-10 transition-transform active:scale-90">
          <Share2 size={14} className="text-gray-600" />
        </button>

        {/* Zoom */}
        <button onClick={() => setFullscreen(true)}
          className="absolute bottom-3 left-3 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow z-10 hover:bg-white transition-colors">
          <ZoomIn size={14} className="text-gray-700" />
        </button>

        {/* Sale badge */}
        {saleBadge && (
          <div className="absolute bottom-3 left-14 z-10 pointer-events-none">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: '#FEF3C7', color: '#92400E' }}>
              🏷️ {saleBadge}
            </span>
          </div>
        )}

        {/* Desktop arrows */}
        {canPrev && (
          <button onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow z-10 hover:bg-white transition-colors hidden sm:flex">
            <ChevronLeft size={16} className="text-gray-700" />
          </button>
        )}
        {canNext && (
          <button onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow z-10 hover:bg-white transition-colors hidden sm:flex">
            <ChevronRight size={16} className="text-gray-700" />
          </button>
        )}

        {/* Dot indicators */}
        {photos.length > 1 && (
          <div className="absolute bottom-3 right-3 flex gap-1 z-10">
            {photos.map((_, i) => (
              <button key={i} onClick={() => setSlide(i)}
                className="rounded-full transition-all duration-200"
                style={{
                  width:      i === slide ? 16 : 6,
                  height:     6,
                  background: i === slide ? '#fff' : 'rgba(255,255,255,0.5)',
                }} />
            ))}
          </div>
        )}

        {/* Counter */}
        {photos.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <span className="text-white text-xs font-medium bg-black/40 px-2 py-0.5 rounded-full">
              {slide + 1} / {photos.length}
            </span>
          </div>
        )}
      </div>

      {fullscreen && (
        <FullscreenPhoto src={photos[slide]} onClose={() => setFullscreen(false)} />
      )}
    </>
  )
}

// ── Review skeleton ───────────────────────────────────────────────────────
function ReviewSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2].map(i => (
        <div key={i} className="p-4 rounded-xl border border-gray-100 animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gray-200" />
              <div className="h-3 w-20 bg-gray-200 rounded" />
            </div>
            <div className="h-3 w-16 bg-gray-200 rounded" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main ProductModal ─────────────────────────────────────────────────────
export default function ProductModal({ product, businessName, businessPhone, businessId, onClose }: Props) {
  const supabase = createClient()
  const { user, isLoggedIn } = useAuth()

  const allPhotos = [
    ...(product.image_url ? [product.image_url] : []),
    ...(product.images ?? []),
  ].filter(Boolean) as string[]

  // ── Sheet drag-to-dismiss ─────────────────────────────────────────────
  const sheetRef       = useRef<HTMLDivElement>(null)
  const sheetDragStart = useRef(0)
  const sheetDragY     = useRef(0)
  const [sheetTransY,  setSheetTransY]  = useState(0)
  const [dismissing,   setDismissing]   = useState(false)

  function onSheetTouchStart(e: React.TouchEvent) {
    sheetDragStart.current = e.touches[0].clientY
    sheetDragY.current = 0
  }

  function onSheetTouchMove(e: React.TouchEvent) {
    const dy = e.touches[0].clientY - sheetDragStart.current
    if (dy < 0) return // don't allow dragging up
    sheetDragY.current = dy
    setSheetTransY(dy)
  }

  function onSheetTouchEnd() {
    if (sheetDragY.current > 120) {
      setDismissing(true)
      setSheetTransY(window.innerHeight)
      setTimeout(onClose, 300)
    } else {
      setSheetTransY(0)
    }
    sheetDragY.current = 0
  }

  // ── State ─────────────────────────────────────────────────────────────
  const [liked,          setLiked]          = useState(false)
  const [likeCount,      setLikeCount]      = useState(product.like_count ?? 0)
  const [likeLoading,    setLikeLoading]    = useState(false)
  const [userRating,     setUserRating]     = useState<number | null>(null)
  const [hoverRating,    setHoverRating]    = useState(0)
  const [ratingAvg,      setRatingAvg]      = useState(Number(product.rating_avg ?? 0))
  const [ratingCount,    setRatingCount]    = useState(product.rating_count ?? 0)
  const [ratingLoading,  setRatingLoading]  = useState(false)
  const [ratingSuccess,  setRatingSuccess]  = useState(false)
  const [reviews,        setReviews]        = useState<ProductReview[]>([])
  const [reviewsLoaded,  setReviewsLoaded]  = useState(false)
  const [reviewBody,     setReviewBody]     = useState('')
  const [reviewRating,   setReviewRating]   = useState(0)
  const [reviewHover,    setReviewHover]    = useState(0)
  const [submitting,     setSubmitting]     = useState(false)
  const [hasReviewed,    setHasReviewed]    = useState(false)
  const [reviewDone,     setReviewDone]     = useState(false)
  const [reviewError,    setReviewError]    = useState('')
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [toast,          setToast]          = useState<string | null>(null)

  // body scroll lock
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // ── Load user state ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const controller = new AbortController()
    async function load() {
      const [likeRes, ratingRes, reviewRes] = await Promise.all([
        supabase.from('product_likes').select('id')
          .eq('product_id', product.id).eq('user_id', user!.id).maybeSingle(),
        supabase.from('product_ratings').select('rating')
          .eq('product_id', product.id).eq('user_id', user!.id).maybeSingle(),
        supabase.from('product_reviews').select('id')
          .eq('product_id', product.id).eq('user_id', user!.id).maybeSingle(),
      ])
      if (controller.signal.aborted) return
      setLiked(!!likeRes.data)
      if (ratingRes.data) setUserRating(ratingRes.data.rating)
      setHasReviewed(!!reviewRes.data)
    }
    load()
    return () => controller.abort()
  }, [user, product.id])

  // ── Load reviews ──────────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      const { data } = await supabase
        .from('product_reviews')
        .select('id,rating,body,created_at,user_id,profiles(name)')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false })
      if (controller.signal.aborted) return
      setReviews((data ?? []) as ProductReview[])
      setReviewsLoaded(true)
    }
    load()
    return () => controller.abort()
  }, [product.id])

  // ── Like ──────────────────────────────────────────────────────────────
  async function toggleLike() {
    if (!isLoggedIn) { showToast('Sign in to like products'); return }
    setLikeLoading(true)
    if (liked) {
      await supabase.from('product_likes').delete()
        .eq('product_id', product.id).eq('user_id', user!.id)
      setLiked(false); setLikeCount(c => Math.max(0, c - 1))
    } else {
      await supabase.from('product_likes').insert({ product_id: product.id, user_id: user!.id })
      setLiked(true); setLikeCount(c => c + 1)
    }
    setLikeLoading(false)
  }

  // ── Rating — re-fetch from DB after save ──────────────────────────────
  async function submitRating(stars: number) {
    if (!isLoggedIn) { showToast('Sign in to rate this product'); return }
    setRatingLoading(true)
    const { error } = await supabase.from('product_ratings').upsert(
      { product_id: product.id, user_id: user!.id, rating: stars },
      { onConflict: 'product_id,user_id' }
    )
    if (error) {
      showToast('Could not save rating')
      setRatingLoading(false)
      return
    }
    // Re-fetch authoritative avg from DB
    const { data } = await supabase
      .from('products')
      .select('rating_avg,rating_count')
      .eq('id', product.id)
      .single()
    if (data) {
      setRatingAvg(Number(data.rating_avg ?? 0))
      setRatingCount(data.rating_count ?? 0)
    }
    setUserRating(stars)
    setRatingLoading(false)
    setRatingSuccess(true)
    setTimeout(() => setRatingSuccess(false), 2000)
  }

  // ── Submit review ─────────────────────────────────────────────────────
  async function submitReview(e: React.FormEvent) {
    e.preventDefault()
    if (!reviewRating) { setReviewError('Please select a rating'); return }
    if (!reviewBody.trim()) { setReviewError('Please write a review'); return }
    setSubmitting(true); setReviewError('')
    const { data, error } = await supabase.from('product_reviews').insert({
      product_id: product.id,
      user_id:    user!.id,
      rating:     reviewRating,
      body:       reviewBody.trim(),
    }).select('id,rating,body,created_at,user_id,profiles(name)').single()
    if (error) {
      setReviewError(error.code === '23505' ? 'You have already reviewed this.' : error.message)
      setSubmitting(false); return
    }
    setReviews(rs => [data as ProductReview, ...rs])
    setHasReviewed(true); setReviewDone(true)
    setShowReviewForm(false); setSubmitting(false)
  }

  // ── Share ─────────────────────────────────────────────────────────────
  async function handleShare() {
    const url  = `${window.location.origin}/businesses/${businessId ?? ''}?product=${product.id}`
    const text = `Check out ${product.name} by ${businessName} — $${product.price.toFixed(2)}`
    if (navigator.share) {
      try { await navigator.share({ title: product.name, text, url }) }
      catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
      showToast('Link copied to clipboard!')
    }
  }

  const discount = product.sale_active && product.sale_price
    ? Math.round(((product.price - product.sale_price) / product.price) * 100) : 0

  const waMsg = encodeURIComponent(
    product.available
      ? `Hi ${businessName}! I'm interested in "${product.name}" — is it available?`
      : `Hi ${businessName}! Is "${product.name}" back in stock? I'd love to order one.`
  )
  const waUrl = businessPhone
    ? `https://wa.me/${businessPhone.replace(/\D/g, '')}?text=${waMsg}`
    : null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}>

        {/* Sheet */}
        <div
          ref={sheetRef}
          className="w-full sm:max-w-lg bg-white sm:rounded-2xl overflow-hidden"
          style={{
            maxHeight:    '92vh',
            borderRadius: '24px 24px 0 0',
            overflowY:    'auto',
            boxShadow:    '0 -8px 40px rgba(0,0,0,0.25)',
            transform:    `translateY(${sheetTransY}px)`,
            transition:   dismissing ? 'transform 0.3s ease' : sheetTransY === 0 ? 'transform 0.3s ease' : 'none',
          }}
          onClick={e => e.stopPropagation()}
          onTouchStart={onSheetTouchStart}
          onTouchMove={onSheetTouchMove}
          onTouchEnd={onSheetTouchEnd}>

          {/* Drag handle — visible on mobile */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>

          {/* Photo gallery */}
          <PhotoGallery
            photos={allPhotos}
            saleBadge={product.sale_active ? product.sale_label : null}
            available={product.available}
            liked={liked}
            likeLoading={likeLoading}
            onLike={toggleLike}
            onClose={onClose}
            onShare={handleShare}
          />

          {/* Content */}
          <div className="p-5 space-y-5">

            {/* Name + price */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 leading-tight">{product.name}</h2>
                <p className="text-sm text-gray-400 mt-0.5">by {businessName}</p>
              </div>
              <div className="text-right flex-shrink-0">
                {product.sale_active && product.sale_price ? (
                  <>
                    <p className="text-xs text-gray-400 line-through">${product.price?.toFixed(2)}</p>
                    <p className="text-2xl font-black" style={{ color: '#1D9E75' }}>
                      ${product.sale_price.toFixed(2)}
                    </p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: '#FEF3C7', color: '#92400E' }}>
                      {discount}% OFF
                    </span>
                  </>
                ) : (
                  <p className="text-2xl font-black" style={{ color: '#1D9E75' }}>
                    ${product.price?.toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            {/* Like + rating summary */}
            <div className="flex items-center gap-4">
              <button onClick={toggleLike} disabled={likeLoading}
                className="flex items-center gap-1.5 text-sm disabled:opacity-60 transition-transform active:scale-90">
                <Heart size={14} fill={liked ? '#D4537E' : 'none'}
                  style={{ color: liked ? '#D4537E' : '#9CA3AF' }} />
                <span className="text-gray-600">{likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>
              </button>
              {ratingCount > 0 && (
                <div className="flex items-center gap-1 text-sm">
                  <Star size={13} fill="#F59E0B" style={{ color: '#F59E0B' }} />
                  <span className="text-gray-600">{ratingAvg.toFixed(1)} ({ratingCount})</span>
                </div>
              )}
              {reviews.length > 0 && (
                <span className="text-sm text-gray-400 flex items-center gap-1">
                  <MessageCircle size={13} /> {reviews.length}
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            )}

            {/* Rate this product */}
            <div className="p-4 rounded-2xl" style={{ background: '#f9fafb' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {userRating ? 'Your rating' : 'Rate this product'}
                </p>
                {/* Rating confirmation */}
                {ratingSuccess && (
                  <span className="flex items-center gap-1 text-xs font-medium"
                    style={{ color: '#1D9E75' }}>
                    <CheckCircle2 size={13} /> Saved!
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(s => (
                  <button key={s} disabled={ratingLoading}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => submitRating(s)}
                    className="transition-transform hover:scale-110 active:scale-90 disabled:opacity-60">
                    <Star size={24}
                      fill={(hoverRating || userRating || 0) >= s ? '#F59E0B' : 'none'}
                      style={{ color: (hoverRating || userRating || 0) >= s ? '#F59E0B' : '#D1D5DB' }} />
                  </button>
                ))}
                {ratingLoading && <Loader2 size={14} className="animate-spin text-gray-400 ml-2" />}
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-2.5">
              {waUrl && (
                <a href={waUrl} target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white py-3.5 rounded-2xl hover:opacity-90 active:scale-95 transition-all"
                  style={{ background: '#25D366' }}>
                  <MessageCircle size={16} />
                  {product.available ? 'Enquire on WhatsApp' : 'Ask about availability'}
                </a>
              )}
              <button
                onClick={() => waUrl && window.open(waUrl, '_blank')}
                className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white py-3.5 rounded-2xl hover:opacity-90 active:scale-95 transition-all"
                style={{ background: product.available ? '#1D9E75' : '#9CA3AF' }}>
                <ShoppingCart size={16} />
                {product.available ? 'Add to enquiry' : 'Ask about restock'}
              </button>
            </div>

            {/* Reviews */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900">Reviews</h3>
                {isLoggedIn && !hasReviewed && !reviewDone && (
                  <button onClick={() => setShowReviewForm(v => !v)}
                    className="text-xs font-semibold"
                    style={{ color: '#1D9E75' }}>
                    {showReviewForm ? 'Cancel' : '+ Write review'}
                  </button>
                )}
              </div>

              {/* Review form */}
              {showReviewForm && isLoggedIn && !hasReviewed && (
                <form onSubmit={submitReview}
                  className="mb-4 p-4 rounded-2xl border border-gray-200 space-y-3">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => (
                      <button key={i} type="button"
                        onClick={() => setReviewRating(i)}
                        onMouseEnter={() => setReviewHover(i)}
                        onMouseLeave={() => setReviewHover(0)}
                        className="transition-transform hover:scale-110 active:scale-90">
                        <Star size={22}
                          className={i <= (reviewHover || reviewRating)
                            ? 'text-amber-400 fill-current' : 'text-gray-200'} />
                      </button>
                    ))}
                  </div>
                  <textarea value={reviewBody} onChange={e => setReviewBody(e.target.value)}
                    placeholder="What did you think of this product?"
                    rows={3} maxLength={500}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none" />
                  {reviewError && (
                    <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{reviewError}</p>
                  )}
                  <button type="submit" disabled={submitting || !reviewRating || !reviewBody.trim()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-white rounded-xl text-sm font-semibold disabled:opacity-40"
                    style={{ background: '#1D9E75' }}>
                    {submitting
                      ? <><Loader2 size={13} className="animate-spin" /> Submitting…</>
                      : <><Send size={13} /> Submit review</>}
                  </button>
                </form>
              )}

              {!isLoggedIn && (
                <div className="mb-4 p-3 rounded-xl bg-gray-50 text-center">
                  <p className="text-xs text-gray-500 mb-1">Sign in to leave a review</p>
                  <Link href="/auth/login" className="text-xs font-semibold" style={{ color: '#1D9E75' }}>
                    Sign in <LogIn size={11} className="inline" />
                  </Link>
                </div>
              )}

              {reviewDone && (
                <div className="mb-4 p-3 rounded-xl text-center" style={{ background: '#f0faf6' }}>
                  <CheckCircle2 size={18} className="mx-auto mb-1" style={{ color: '#1D9E75' }} />
                  <p className="text-xs font-medium" style={{ color: '#085041' }}>Thanks for your review!</p>
                </div>
              )}

              {/* Review list or skeleton */}
              {!reviewsLoaded ? (
                <ReviewSkeleton />
              ) : reviews.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No reviews yet — be the first!</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map(r => (
                    <div key={r.id} className="p-4 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ background: '#085041' }}>
                            {(r.profiles?.name ?? 'A')[0].toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {r.profiles?.name ?? 'Anonymous'}
                          </span>
                        </div>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} size={11}
                              className={i <= r.rating ? 'text-amber-400 fill-current' : 'text-gray-200'} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{r.body}</p>
                      <p className="text-xs text-gray-400 mt-1.5">
                        {new Date(r.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg pointer-events-none">
          {toast}
        </div>
      )}
    </>
  )
}