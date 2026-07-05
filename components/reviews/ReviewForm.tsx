'use client'
import { useState, useRef } from 'react'
import { Star, Loader2, LogIn, ImageIcon, X, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'
import Link from 'next/link'

interface Props {
  businessId:  string
  hasReviewed: boolean
  onSubmitted: () => void
}

const MAX_PHOTOS = 4

export default function ReviewForm({ businessId, hasReviewed, onSubmitted }: Props) {
  const supabase = createClient()
  const { user, isLoggedIn } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  const [rating,    setRating]    = useState(0)
  const [hover,     setHover]     = useState(0)
  const [title,     setTitle]     = useState('')
  const [body,      setBody]      = useState('')
  const [photos,    setPhotos]    = useState<File[]>([])
  const [previews,  setPreviews]  = useState<string[]>([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [done,      setDone]      = useState(false)

  // ── Add photos ────────────────────────────────────────────────────────
  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const remaining = MAX_PHOTOS - photos.length
    const toAdd = files.slice(0, remaining)
    setPhotos(p => [...p, ...toAdd])
    setPreviews(p => [...p, ...toAdd.map(f => URL.createObjectURL(f))])
    e.target.value = ''
  }

  function removePhoto(i: number) {
    setPhotos(p => p.filter((_, idx) => idx !== i))
    setPreviews(p => p.filter((_, idx) => idx !== i))
  }

  // ── Upload photos to Supabase Storage ─────────────────────────────────
  async function uploadPhotos(reviewId: string): Promise<string[]> {
    const urls: string[] = []
    for (let i = 0; i < photos.length; i++) {
      const file = photos[i]
      const ext  = file.name.split('.').pop() ?? 'jpg'
      const path = `reviews/${businessId}/${reviewId}-${i}.${ext}`
      const { error } = await supabase.storage
        .from('review-images')
        .upload(path, file)
      if (!error) {
        const { data } = supabase.storage.from('review-images').getPublicUrl(path)
        urls.push(data.publicUrl)
      }
    }
    return urls
  }

  // ── Submit ────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating)       { setError('Please select a star rating'); return }
    if (!body.trim())  { setError('Please write a review'); return }
    setLoading(true); setError('')

    // Insert review first to get the ID
    const { data: inserted, error: insertError } = await supabase
      .from('reviews')
      .insert({
        business_id: businessId,
        user_id:     user!.id,
        rating,
        title:       title.trim() || null,
        body:        body.trim(),
        verified:    false,
        helpful:     0,
        images:      [],
      })
      .select('id')
      .single()

    if (insertError) {
      setError(insertError.code === '23505'
        ? 'You have already reviewed this business.'
        : insertError.message
      )
      setLoading(false)
      return
    }

    // Upload photos and attach to review
    if (photos.length > 0 && inserted?.id) {
      const imageUrls = await uploadPhotos(inserted.id)
      if (imageUrls.length > 0) {
        await supabase.from('reviews')
          .update({ images: imageUrls })
          .eq('id', inserted.id)
      }
    }

    setDone(true)
    setLoading(false)
    onSubmitted()
  }

  // ── States ────────────────────────────────────────────────────────────
  if (!isLoggedIn) return (
    <div className="border border-gray-100 rounded-2xl p-6 text-center bg-gray-50">
      <LogIn size={24} className="mx-auto mb-3 text-gray-400" />
      <p className="font-medium text-gray-700 mb-1">Sign in to leave a review</p>
      <p className="text-sm text-gray-400 mb-4">Share your experience with the community</p>
      <Link href="/auth/login"
        className="inline-block text-sm font-semibold text-white px-5 py-2 rounded-xl"
        style={{ background: '#1D9E75' }}>
        Sign in
      </Link>
    </div>
  )

  if (hasReviewed) return (
    <div className="border border-gray-100 rounded-2xl p-6 text-center bg-gray-50">
      <CheckCircle2 size={28} className="mx-auto mb-3" style={{ color: '#1D9E75' }} />
      <p className="font-medium text-gray-700 mb-1">You&apos;ve already reviewed this business</p>
      <p className="text-sm text-gray-400">Thank you for helping the community!</p>
    </div>
  )

  if (done) return (
    <div className="border border-gray-100 rounded-2xl p-6 text-center bg-green-50">
      <p className="text-3xl mb-2">🎉</p>
      <p className="font-semibold text-green-800 mb-1">Thank you for your review!</p>
      <p className="text-sm text-gray-500">Your review helps the community find great African businesses.</p>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-bold text-gray-900">Write a review</h3>

      {/* Star picker */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Your rating *
        </label>
        <div className="flex gap-1">
          {[1,2,3,4,5].map(i => (
            <button key={i} type="button"
              onClick={() => setRating(i)}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(0)}
              className="transition-transform hover:scale-110">
              <Star size={28} className={i <= (hover || rating) ? 'text-amber-400 fill-current' : 'text-gray-200'} />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-xs text-gray-400 mt-1 font-medium">
            {['','Poor','Fair','Good','Very good','Excellent'][rating]}
          </p>
        )}
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
          Review title <span className="font-normal normal-case text-gray-400">(optional)</span>
        </label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Summarise your experience" maxLength={100}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all" />
      </div>

      {/* Body */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
          Your review *
        </label>
        <textarea value={body} onChange={e => setBody(e.target.value)}
          placeholder="Write your review here…"
          rows={4} minLength={10} maxLength={1000}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none transition-all" />
        <p className="text-xs text-gray-400 text-right mt-1">{body.length}/1000</p>
      </div>

      {/* Photo upload */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Add photos <span className="font-normal normal-case text-gray-400">(up to {MAX_PHOTOS})</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {/* Previews */}
          {previews.map((src, i) => (
            <div key={src} className="relative w-20 h-20 rounded-xl overflow-hidden group flex-shrink-0">
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X size={16} className="text-white" />
              </button>
            </div>
          ))}

          {/* Add more button */}
          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 hover:border-green-300 hover:bg-green-50 transition-colors flex-shrink-0">
              <ImageIcon size={18} className="text-gray-300" />
              <span className="text-[10px] text-gray-400">Add photo</span>
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
        {photos.length > 0 && (
          <p className="text-xs text-gray-400 mt-1.5">
            {photos.length} photo{photos.length !== 1 ? 's' : ''} selected · Click a photo to remove it
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <button type="submit" disabled={loading || !rating || !body.trim()}
        className="w-full py-3 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        style={{ background: '#1D9E75' }}>
        {loading ? <><Loader2 size={15} className="animate-spin" /> Submitting…</> : 'Submit review'}
      </button>
    </form>
  )
}