'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star, Loader2, LogIn } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'
import Link from 'next/link'

interface Props {
  businessId: string
  hasReviewed: boolean
  onSubmitted: () => void
}

export default function ReviewForm({ businessId, hasReviewed, onSubmitted }: Props) {
  const supabase = createClient()
  const router   = useRouter()
  const { user, isLoggedIn } = useAuth()

  const [rating,   setRating]   = useState(0)
  const [hover,    setHover]    = useState(0)
  const [title,    setTitle]    = useState('')
  const [body,     setBody]     = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [done,     setDone]     = useState(false)

  // ── Not logged in ────────────────────────────────────────────────────
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

  // ── Already reviewed ─────────────────────────────────────────────────
  if (hasReviewed) return (
    <div className="border border-gray-100 rounded-2xl p-6 text-center bg-gray-50">
      <p className="text-2xl mb-2">✅</p>
      <p className="font-medium text-gray-700 mb-1">You&apos;ve already reviewed this business</p>
      <p className="text-sm text-gray-400">Thank you for helping the community!</p>
    </div>
  )

  // ── Success state ────────────────────────────────────────────────────
  if (done) return (
    <div className="border border-gray-100 rounded-2xl p-6 text-center bg-green-50">
      <p className="text-3xl mb-2">🎉</p>
      <p className="font-semibold text-green-800 mb-1">Thank you for your review!</p>
      <p className="text-sm text-gray-500">Your review helps the community find great African businesses.</p>
    </div>
  )

  // ── Submit ───────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating) { setError('Please select a star rating'); return }
    if (!body.trim()) { setError('Please write a review'); return }
    setLoading(true); setError('')

    const { error: insertError } = await supabase.from('reviews').insert({
      business_id: businessId,
      user_id:     user!.id,
      rating,
      title:       title.trim() || null,
      body:        body.trim(),
      verified:    false,
      helpful:     0,
    })

    if (insertError) {
      // Unique constraint = already reviewed
      if (insertError.code === '23505') {
        setError('You have already reviewed this business.')
      } else {
        setError(insertError.message)
      }
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
    onSubmitted()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-bold text-gray-900">Write a review</h3>

      {/* Star picker */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Your rating
        </label>
        <div className="flex gap-1">
          {[1,2,3,4,5].map(i => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i)}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={28}
                className={i <= (hover || rating) ? 'text-amber-400 fill-current' : 'text-gray-200'}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-xs text-gray-400 mt-1">
            {['','Poor','Fair','Good','Very good','Excellent'][rating]}
          </p>
        )}
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
          Review title <span className="font-normal normal-case">(optional)</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Summarise your experience"
          maxLength={100}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
        />
      </div>

      {/* Body */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
          Your review *
        </label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Tell the community about your experience — what did you love? What could be better?"
          rows={4}
          minLength={10}
          maxLength={1000}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none transition-all"
        />
        <p className="text-xs text-gray-400 text-right mt-1">{body.length}/1000</p>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !rating || !body.trim()}
        className="w-full py-3 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        style={{ background: '#1D9E75' }}
      >
        {loading ? <><Loader2 size={15} className="animate-spin" /> Submitting…</> : 'Submit review'}
      </button>
    </form>
  )
}