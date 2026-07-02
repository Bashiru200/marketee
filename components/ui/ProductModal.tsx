'use client'
import { useState, useEffect } from 'react'
import {
  X, ChevronLeft, ChevronRight, Star,
  MessageCircle, Heart, Loader2, ZoomIn,
  ShoppingCart, Send, LogIn, CheckCircle2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'
import Link from 'next/link'

interface Product {
  id:           string
  name:         string
  price:        number
  description:  string | null
  image_url:    string | null
  images?:      string[] | null
  available:    boolean
  like_count?:  number
  rating_avg?:  number
  rating_count?: number
  review_count?: number
  sale_price?:  number | null
  sale_active?: boolean
  sale_label?:  string | null
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
  product:      Product
  businessName: string
  businessPhone: string | null
  onClose:      () => void
}

export default function ProductModal({ product, businessName, businessPhone, onClose }: Props) {
  const supabase = createClient()
  const { user, isLoggedIn } = useAuth()

  // ── All photos ────────────────────────────────────────────────────────
  const allPhotos = [
    ...(product.image_url  ? [product.image_url]  : []),
    ...(product.images ?? []),
  ].filter(Boolean) as string[]

  // ── Gallery state ─────────────────────────────────────────────────────
  const [slide,  setSlide]  = useState(0)
  const [zoomed, setZoomed] = useState(false)

  // ── Likes ─────────────────────────────────────────────────────────────
  const [liked,        setLiked]        = useState(false)
  const [likeCount,    setLikeCount]    = useState(product.like_count ?? 0)
  const [likeLoading,  setLikeLoading]  = useState(false)

  // ── Star rating ───────────────────────────────────────────────────────
  const [userRating,    setUserRating]    = useState<number | null>(null)
  const [hoverRating,   setHoverRating]   = useState(0)
  const [ratingAvg,     setRatingAvg]     = useState(Number(product.rating_avg  ?? 0))
  const [ratingCount,   setRatingCount]   = useState(product.rating_count ?? 0)
  const [ratingLoading, setRatingLoading] = useState(false)

  // ── Product reviews ───────────────────────────────────────────────────
  const [reviews,       setReviews]       = useState<ProductReview[]>([])
  const [reviewsLoaded, setReviewsLoaded] = useState(false)
  const [reviewBody,    setReviewBody]    = useState('')
  const [reviewRating,  setReviewRating]  = useState(0)
  const [reviewHover,   setReviewHover]   = useState(0)
  const [submitting,    setSubmitting]    = useState(false)
  const [hasReviewed,   setHasReviewed]   = useState(false)
  const [reviewDone,    setReviewDone]    = useState(false)
  const [reviewError,   setReviewError]   = useState('')
  const [showReviewForm,setShowReviewForm]= useState(false)

  // ── Toast ─────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<string | null>(null)
  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // ── Load user's existing like / rating / review ───────────────────────
  useEffect(() => {
    if (!user) return
    async function loadUserState() {
      const [likeRes, ratingRes, reviewRes] = await Promise.all([
        supabase.from('product_likes').select('id')
          .eq('product_id', product.id).eq('user_id', user!.id).maybeSingle(),
        supabase.from('product_ratings').select('rating')
          .eq('product_id', product.id).eq('user_id', user!.id).maybeSingle(),
        supabase.from('product_reviews').select('id')
          .eq('product_id', product.id).eq('user_id', user!.id).maybeSingle(),
      ])
      setLiked(!!likeRes.data)
      if (ratingRes.data) setUserRating(ratingRes.data.rating)
      setHasReviewed(!!reviewRes.data)
    }
    loadUserState()
  }, [user, product.id])

  // ── Load reviews on mount ─────────────────────────────────────────────
  useEffect(() => {
    async function loadReviews() {
      const { data } = await supabase
        .from('product_reviews')
        .select('id,rating,body,created_at,user_id,profiles(name)')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false })
      setReviews((data ?? []) as ProductReview[])
      setReviewsLoaded(true)
    }
    loadReviews()
  }, [product.id])

  // ── Helpers ───────────────────────────────────────────────────────────
  const prev = () => setSlide(s => (s - 1 + allPhotos.length) % allPhotos.length)
  const next = () => setSlide(s => (s + 1) % allPhotos.length)
  const discount = product.sale_active && product.sale_price
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : 0

  // ── Toggle like ───────────────────────────────────────────────────────
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

  // ── Star rating ───────────────────────────────────────────────────────
  async function submitRating(stars: number) {
    if (!isLoggedIn) { showToast('Sign in to rate this product'); return }
    setRatingLoading(true)
    const prev = userRating
    setUserRating(stars)
    const { error } = await supabase.from('product_ratings').upsert(
      { product_id: product.id, user_id: user!.id, rating: stars },
      { onConflict: 'product_id,user_id' }
    )
    if (error) { setUserRating(prev); showToast('Could not save rating'); setRatingLoading(false); return }
    if (prev === null) {
      const newCount = ratingCount + 1
      setRatingAvg(Math.round(((ratingAvg * ratingCount) + stars) / newCount * 10) / 10)
      setRatingCount(newCount)
    } else {
      setRatingAvg(Math.round(((ratingAvg * ratingCount) - prev + stars) / ratingCount * 10) / 10)
    }
    setRatingLoading(false)
  }

  // ── Submit review ─────────────────────────────────────────────────────
  async function submitReview(e: React.FormEvent) {
    e.preventDefault()
    if (!reviewRating) { setReviewError('Please select a star rating'); return }
    if (!reviewBody.trim()) { setReviewError('Please write a review'); return }
    setSubmitting(true); setReviewError('')
    const { data, error } = await supabase.from('product_reviews').insert({
      product_id: product.id,
      user_id:    user!.id,
      rating:     reviewRating,
      body:       reviewBody.trim(),
    }).select('id,rating,body,created_at,user_id,profiles(name)').single()
    if (error) {
      setReviewError(error.code === '23505' ? 'You have already reviewed this product.' : error.message)
      setSubmitting(false); return
    }
    setReviews(rs => [data as ProductReview, ...rs])
    setHasReviewed(true)
    setReviewDone(true)
    setShowReviewForm(false)
    setSubmitting(false)
  }

  const waMsg = encodeURIComponent(
    `Hi ${businessName}! I'm interested in "${product.name}" (${product.sale_active && product.sale_price ? `$${product.sale_price.toFixed(2)}` : `$${product.price?.toFixed(2)}`}) — is it available?`
  )
  const waUrl = businessPhone
    ? `https://wa.me/${businessPhone.replace(/\D/g, '')}?text=${waMsg}`
    : null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}>

        {/* Modal */}
        <div
          className="bg-white rounded-2xl overflow-hidden w-full max-w-2xl max-h-[92vh] overflow-y-auto"
          style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}
          onClick={e => e.stopPropagation()}>

          {/* ── Photo gallery ── */}
          <div className="relative bg-gray-100" style={{ height: '260px' }}>
            {allPhotos.length > 0 ? (
              <>
                <img src={allPhotos[slide]} alt={product.name}
                  className="w-full h-full object-cover cursor-zoom-in"
                  onClick={() => setZoomed(true)} />
                {allPhotos.length > 1 && (
                  <>
                    <button onClick={prev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow hover:bg-white transition-colors">
                      <ChevronLeft size={16} className="text-gray-700" />
                    </button>
                    <button onClick={next}
                      className="absolute right-10 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow hover:bg-white transition-colors">
                      <ChevronRight size={16} className="text-gray-700" />
                    </button>
                  </>
                )}
                <button onClick={() => setZoomed(true)}
                  className="absolute bottom-3 right-10 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow hover:bg-white transition-colors">
                  <ZoomIn size={14} className="text-gray-700" />
                </button>
                {/* Thumbnail strip */}
                {allPhotos.length > 1 && (
                  <div className="absolute bottom-3 left-3 flex gap-1.5">
                    {allPhotos.map((url, i) => (
                      <button key={i} onClick={() => setSlide(i)}
                        className="w-10 h-10 rounded-lg overflow-hidden border-2 transition-colors flex-shrink-0"
                        style={{ borderColor: i === slide ? '#1D9E75' : 'transparent' }}>
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
            )}

            {/* Like button */}
            <button onClick={toggleLike} disabled={likeLoading}
              className="absolute top-3 right-12 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow hover:bg-white transition-colors disabled:opacity-60">
              <Heart size={15} fill={liked ? '#D4537E' : 'none'}
                style={{ color: liked ? '#D4537E' : '#6B7280' }} />
            </button>

            {/* Close */}
            <button onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow hover:opacity-80 transition-opacity"
              style={{ background: '#EF4444' }}>
              <X size={15} className="text-white" />
            </button>

            {/* Sale badge */}
            {product.sale_active && product.sale_label && (
              <div className="absolute top-3 left-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: '#FEF3C7', color: '#92400E' }}>
                  🏷️ {product.sale_label}
                </span>
              </div>
            )}
          </div>

          {/* ── Product info ── */}
          <div className="p-6 space-y-5">

            {/* Name + price */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
                <p className="text-sm text-gray-500 mt-0.5">Sold by {businessName}</p>
              </div>
              <div className="text-right flex-shrink-0">
                {product.sale_active && product.sale_price ? (
                  <>
                    <p className="text-sm text-gray-400 line-through">${product.price?.toFixed(2)}</p>
                    <p className="text-2xl font-bold" style={{ color: '#1D9E75' }}>
                      ${product.sale_price.toFixed(2)}
                    </p>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: '#FEF3C7', color: '#92400E' }}>
                      {discount}% OFF
                    </span>
                  </>
                ) : (
                  <p className="text-2xl font-bold" style={{ color: '#1D9E75' }}>
                    ${product.price?.toFixed(2)}
                  </p>
                )}
                {!product.available && (
                  <p className="text-xs text-red-500 font-medium mt-0.5">Out of stock</p>
                )}
              </div>
            </div>

            {/* Likes + rating summary */}
            <div className="flex items-center gap-4">
              <button onClick={toggleLike} disabled={likeLoading}
                className="flex items-center gap-1.5 text-sm transition-colors disabled:opacity-60">
                <Heart size={14} fill={liked ? '#D4537E' : 'none'}
                  style={{ color: liked ? '#D4537E' : '#9CA3AF' }} />
                <span className="text-gray-600">{likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>
              </button>
              {ratingCount > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Star size={14} fill="#F59E0B" style={{ color: '#F59E0B' }} />
                  <span className="text-gray-600">{ratingAvg.toFixed(1)} ({ratingCount} ratings)</span>
                </div>
              )}
              {reviews.length > 0 && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <MessageCircle size={13} />
                  {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            )}

            {/* ── Rate this product ── */}
            <div className="p-4 rounded-xl" style={{ background: '#f9fafb' }}>
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                {userRating ? 'Your rating' : 'Rate this product'}
              </p>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(star => (
                  <button key={star} disabled={ratingLoading}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => submitRating(star)}
                    className="transition-transform hover:scale-110 disabled:opacity-60">
                    <Star size={22}
                      fill={(hoverRating || userRating || 0) >= star ? '#F59E0B' : 'none'}
                      style={{ color: (hoverRating || userRating || 0) >= star ? '#F59E0B' : '#D1D5DB' }} />
                  </button>
                ))}
                {ratingLoading && <Loader2 size={14} className="animate-spin text-gray-400 ml-2" />}
              </div>
            </div>

            {/* ── CTAs ── */}
            <div className="flex flex-col gap-2">
              {waUrl && (
                <a href={waUrl} target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white py-3 rounded-xl hover:opacity-90 transition-opacity"
                  style={{ background: '#25D366' }}>
                  <MessageCircle size={15} /> Enquire on WhatsApp
                </a>
              )}
              <button
                disabled={!product.available}
                onClick={() => waUrl && window.open(waUrl, '_blank')}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white py-3 rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity"
                style={{ background: '#1D9E75' }}>
                <ShoppingCart size={15} />
                {product.available ? 'Add to enquiry' : 'Out of stock'}
              </button>
            </div>

            {/* ── Product reviews ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900">Reviews</h3>
                {isLoggedIn && !hasReviewed && !reviewDone && (
                  <button
                    onClick={() => setShowReviewForm(v => !v)}
                    className="text-xs font-semibold transition-colors"
                    style={{ color: '#1D9E75' }}>
                    {showReviewForm ? 'Cancel' : '+ Write a review'}
                  </button>
                )}
              </div>

              {/* Review form */}
              {showReviewForm && isLoggedIn && !hasReviewed && (
                <form onSubmit={submitReview} className="mb-4 p-4 rounded-xl border border-gray-200 space-y-3">
                  {/* Star picker */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Rating *</p>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(i => (
                        <button key={i} type="button"
                          onClick={() => setReviewRating(i)}
                          onMouseEnter={() => setReviewHover(i)}
                          onMouseLeave={() => setReviewHover(0)}
                          className="transition-transform hover:scale-110">
                          <Star size={24}
                            className={i <= (reviewHover || reviewRating) ? 'text-amber-400 fill-current' : 'text-gray-200'} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Your review *</p>
                    <textarea value={reviewBody} onChange={e => setReviewBody(e.target.value)}
                      placeholder="What did you think of this product?"
                      rows={3} maxLength={500}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none transition-all" />
                  </div>
                  {reviewError && (
                    <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{reviewError}</p>
                  )}
                  <button type="submit" disabled={submitting || !reviewRating || !reviewBody.trim()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-white rounded-xl text-sm font-semibold disabled:opacity-40"
                    style={{ background: '#1D9E75' }}>
                    {submitting ? <><Loader2 size={13} className="animate-spin" /> Submitting…</> : <><Send size={13} /> Submit review</>}
                  </button>
                </form>
              )}

              {/* Sign in prompt */}
              {!isLoggedIn && (
                <div className="mb-4 p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
                  <p className="text-xs text-gray-500 mb-2">Sign in to leave a review</p>
                  <Link href="/auth/login"
                    className="text-xs font-semibold"
                    style={{ color: '#1D9E75' }}>
                    Sign in <LogIn size={11} className="inline" />
                  </Link>
                </div>
              )}

              {/* Review done confirmation */}
              {reviewDone && (
                <div className="mb-4 p-3 rounded-xl text-center" style={{ background: '#f0faf6' }}>
                  <CheckCircle2 size={18} className="mx-auto mb-1" style={{ color: '#1D9E75' }} />
                  <p className="text-xs font-medium" style={{ color: '#085041' }}>
                    Thanks for your review!
                  </p>
                </div>
              )}

              {/* Review list */}
              {!reviewsLoaded ? (
                <div className="flex items-center gap-2 py-4 justify-center text-gray-400 text-sm">
                  <Loader2 size={14} className="animate-spin" /> Loading reviews…
                </div>
              ) : reviews.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  No reviews yet — be the first!
                </p>
              ) : (
                <div className="space-y-3">
                  {reviews.map(r => (
                    <div key={r.id} className="p-4 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: '#085041' }}>
                            {(r.profiles?.name ?? 'A')[0].toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {r.profiles?.name ?? 'Anonymous'}
                          </span>
                        </div>
                        <div className="flex gap-0.5 flex-shrink-0">
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} size={11}
                              className={i <= r.rating ? 'text-amber-400 fill-current' : 'text-gray-200'} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{r.body}</p>
                      <p className="text-xs text-gray-400 mt-1.5">
                        {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Fullscreen zoom ── */}
      {zoomed && allPhotos.length > 0 && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.95)' }}
          onClick={() => setZoomed(false)}>
          <img src={allPhotos[slide]} alt={product.name}
            className="max-w-[92vw] max-h-[92vh] object-contain rounded-lg"
            onClick={e => e.stopPropagation()} />
          <button onClick={() => setZoomed(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
            <X size={20} />
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}
    </>
  )
}