'use client'
import { useState, useEffect } from 'react'
import {
  X, ChevronLeft, ChevronRight, Star, MessageCircle,
  ShoppingCart, ZoomIn, Heart, Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'
import InlineToast from '@/components/ui/InlineToast'

interface Product {
  id: string
  name: string
  price: number
  description: string | null
  image_url: string | null
  images?: string[]
  available: boolean
  like_count?: number
  rating_avg?: number
  rating_count?: number
}

interface Props {
  product: Product
  businessName: string
  businessPhone: string | null
  onClose: () => void
}

export default function ProductModal({ product, businessName, businessPhone, onClose }: Props) {
  const supabase = createClient()
  const { user, isLoggedIn } = useAuth()

  const images = [
    ...(product.image_url ? [product.image_url] : []),
    ...(product.images ?? []),
  ].filter(Boolean)

  const [slide,  setSlide]  = useState(0)
  const [zoomed, setZoomed] = useState(false)

  // Likes
  const [liked,     setLiked]     = useState(false)
  const [likeCount,  setLikeCount]  = useState(product.like_count ?? 0)
  const [likeLoading, setLikeLoading] = useState(false)

  // Ratings
  const [userRating,   setUserRating]   = useState<number | null>(null)
  const [hoverRating,   setHoverRating]   = useState(0)
  const [ratingAvg,     setRatingAvg]     = useState(product.rating_avg ?? 0)
  const [ratingCount,   setRatingCount]   = useState(product.rating_count ?? 0)
  const [ratingLoading, setRatingLoading] = useState(false)

  // Inline toast for "please sign in" type messages instead of native alerts
  const [toast, setToast] = useState<string | null>(null)

  const prev = () => setSlide(s => (s - 1 + images.length) % images.length)
  const next = () => setSlide(s => (s + 1) % images.length)

  // ── Load this user's existing like/rating on mount ───────────────────────
  useEffect(() => {
    if (!user) return

    supabase
      .from('product_likes')
      .select('id')
      .eq('product_id', product.id)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }: { data: { id: string } | null }) => setLiked(!!data))

    supabase
      .from('product_ratings')
      .select('rating')
      .eq('product_id', product.id)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }: { data: { rating: number } | null }) => { if (data) setUserRating(data.rating) })
  }, [user, product.id])

  async function toggleLike() {
    if (!isLoggedIn) {
      setToast('Sign in to like products')
      return
    }
    setLikeLoading(true)

    if (liked) {
      await supabase.from('product_likes')
        .delete()
        .eq('product_id', product.id)
        .eq('user_id', user!.id)
      setLiked(false)
      setLikeCount(c => Math.max(0, c - 1))
    } else {
      await supabase.from('product_likes')
        .insert({ product_id: product.id, user_id: user!.id })
      setLiked(true)
      setLikeCount(c => c + 1)
    }
    setLikeLoading(false)
  }

  async function submitRating(stars: number) {
    if (!isLoggedIn) {
      setToast('Sign in to rate this product')
      return
    }
    setRatingLoading(true)

    const previous = userRating
    setUserRating(stars)

    const { error } = await supabase.from('product_ratings')
      .upsert(
        { product_id: product.id, user_id: user!.id, rating: stars },
        { onConflict: 'product_id,user_id' }
      )

    if (error) {
      setUserRating(previous)
      setToast('Could not save your rating — try again')
      setRatingLoading(false)
      return
    }

    // Optimistically recompute average locally (server trigger will sync on next load)
    if (previous === null) {
      const newCount = ratingCount + 1
      setRatingAvg(Math.round(((ratingAvg * ratingCount) + stars) / newCount * 10) / 10)
      setRatingCount(newCount)
    } else {
      setRatingAvg(Math.round(((ratingAvg * ratingCount) - previous + stars) / ratingCount * 10) / 10)
    }

    setRatingLoading(false)
  }

  const waMsg = encodeURIComponent(
    `Hi ${businessName}! I'm interested in "${product.name}" ($${product.price?.toFixed(2)}) — is it available?`
  )
  const waUrl = businessPhone
    ? `https://wa.me/${businessPhone.replace(/\D/g, '')}?text=${waMsg}`
    : null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-2xl overflow-hidden w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
          style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}
        >
          {/* Image slider */}
          <div className="relative bg-gray-100" style={{ height: '280px' }}>
            {images.length > 0 ? (
              <>
                <img
                  src={images[slide]}
                  alt={product.name}
                  className="w-full h-full object-cover cursor-zoom-in"
                  onClick={() => setZoomed(true)}
                />
                {images.length > 1 && (
                  <>
                    <button onClick={prev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white shadow transition-colors">
                      <ChevronLeft size={16} className="text-gray-700" />
                    </button>
                    <button onClick={next}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white shadow transition-colors">
                      <ChevronRight size={16} className="text-gray-700" />
                    </button>
                  </>
                )}
                <button onClick={() => setZoomed(true)}
                  className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white shadow transition-colors">
                  <ZoomIn size={14} className="text-gray-700" />
                </button>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
            )}

            {/* Like button — floating top-right */}
            <button
              onClick={toggleLike}
              disabled={likeLoading}
              className="absolute top-3 right-14 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white shadow transition-colors disabled:opacity-60"
            >
              <Heart
                size={15}
                fill={liked ? '#D4537E' : 'none'}
                style={{ color: liked ? '#D4537E' : '#6B7280' }}
              />
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white shadow transition-colors"
            >
              <X size={15} className="text-gray-700" />
            </button>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="absolute bottom-10 left-0 right-0 flex gap-1.5 px-3 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSlide(i)}
                    className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-colors"
                    style={{ borderColor: i === slide ? '#1D9E75' : 'transparent' }}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-bold" style={{ color: '#1D9E75' }}>
                  ${product.price?.toFixed(2)}
                </p>
                {!product.available && (
                  <span className="text-xs text-red-500 font-medium">Out of stock</span>
                )}
              </div>
            </div>

            {/* Likes + rating summary row */}
            <div className="flex items-center gap-4 mb-4">
              <button onClick={toggleLike} disabled={likeLoading}
                className="flex items-center gap-1.5 text-sm transition-colors disabled:opacity-60">
                <Heart size={14} fill={liked ? '#D4537E' : 'none'} style={{ color: liked ? '#D4537E' : '#9CA3AF' }} />
                <span className="text-gray-600">{likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>
              </button>

              {ratingCount > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Star size={14} fill="#F59E0B" style={{ color: '#F59E0B' }} />
                  <span className="text-gray-600">{ratingAvg.toFixed(1)} ({ratingCount})</span>
                </div>
              )}
            </div>

            {product.description && (
              <p className="text-gray-600 text-sm leading-relaxed mb-5">
                {product.description}
              </p>
            )}

            {/* Rate this product */}
            <div className="mb-6 p-4 rounded-xl" style={{ background: '#f9fafb' }}>
              <p className="text-xs font-semibold text-gray-500 mb-2">
                {userRating ? 'Your rating' : 'Rate this product'}
              </p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    disabled={ratingLoading}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => submitRating(star)}
                    className="disabled:opacity-60 transition-transform hover:scale-110"
                  >
                    <Star
                      size={22}
                      fill={(hoverRating || userRating || 0) >= star ? '#F59E0B' : 'none'}
                      style={{ color: (hoverRating || userRating || 0) >= star ? '#F59E0B' : '#D1D5DB' }}
                    />
                  </button>
                ))}
                {ratingLoading && <Loader2 size={14} className="animate-spin text-gray-400 ml-2" />}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white py-3 rounded-xl hover:opacity-90 transition-opacity"
                  style={{ background: '#25D366' }}
                >
                  <MessageCircle size={16} />
                  Enquire on WhatsApp
                </a>
              )}
              <button
                disabled={!product.available}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                style={{ background: '#1D9E75' }}
                onClick={() => {
                  if (waUrl) window.open(waUrl, '_blank')
                }}
              >
                <ShoppingCart size={16} />
                {product.available ? 'Add to enquiry' : 'Out of stock'}
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-3">
              Sold by <span className="font-medium text-gray-600">{businessName}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Fullscreen zoom */}
      {zoomed && images.length > 0 && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.9)' }}
          onClick={() => setZoomed(false)}
        >
          <img
            src={images[slide]}
            alt={product.name}
            className="max-w-full max-h-full object-contain"
            style={{ maxHeight: '90vh', maxWidth: '90vw' }}
          />
          <button
            onClick={() => setZoomed(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Inline UI toast — replaces native alert() */}
      {toast && <InlineToast message={toast} onClose={() => setToast(null)} />}
    </>
  )
}