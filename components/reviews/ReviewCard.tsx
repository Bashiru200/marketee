'use client'
import { useState } from 'react'
import { ThumbsUp, BadgeCheck, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'

interface Review {
  id:          string
  rating:      number
  title:       string | null
  body:        string | null
  created_at:  string
  helpful:     number
  verified:    boolean
  user_id?:    string          // optional — not all callers provide this
  images?:     string[] | null
  owner_reply?: string | null
  reply_at?:   string | null
  profiles:    { name: string | null; avatar_url?: string | null } | null
}

interface Props {
  review:       Review
  businessName?: string
  isOwner?:     boolean
  onReply?:     (reviewId: string, text: string) => Promise<void>
}

export default function ReviewCard({ review: r, businessName, isOwner, onReply }: Props) {
  const supabase = createClient()
  const { user } = useAuth()

  const name    = r.profiles?.name ?? 'Anonymous'
  const initial = name[0]?.toUpperCase() ?? '?'

  // Helpful votes
  const [helpfulCount,  setHelpfulCount]  = useState(r.helpful ?? 0)
  const [votedHelpful,  setVotedHelpful]  = useState(false)
  const [votingHelpful, setVotingHelpful] = useState(false)

  // Photo lightbox
  const [lightbox, setLightbox] = useState<number | null>(null)
  const photos = (r.images ?? []).filter(Boolean)

  // Owner reply
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyText,     setReplyText]     = useState('')
  const [replying,      setReplying]      = useState(false)

  async function markHelpful() {
    if (votedHelpful || !user || r.user_id === user?.id) return
    setVotingHelpful(true)
    await supabase.from('reviews').update({ helpful: helpfulCount + 1 }).eq('id', r.id)
    setHelpfulCount(c => c + 1)
    setVotedHelpful(true)
    setVotingHelpful(false)
  }

  async function submitReply() {
    if (!replyText.trim() || !onReply) return
    setReplying(true)
    await onReply(r.id, replyText.trim())
    setReplying(false)
    setShowReplyForm(false)
    setReplyText('')
  }

  return (
    <>
      <div className="bg-white rounded-xl p-5 border border-gray-100">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {r.profiles?.avatar_url ? (
              <img src={r.profiles.avatar_url} alt={name}
                className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
                style={{ background: '#085041' }}>
                {initial}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-gray-900">{name}</p>
                {r.verified && (
                  <BadgeCheck size={14} style={{ color: '#1D9E75' }} aria-label="Verified customer" />
                )}
              </div>
              <p className="text-xs text-gray-400">
                {new Date(r.created_at).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })}
              </p>
            </div>
          </div>
          {/* Stars */}
          <div className="flex gap-0.5 flex-shrink-0">
            {[1,2,3,4,5].map(i => (
              <Star key={i} size={13}
                className={i <= Math.round(r.rating) ? 'text-amber-400 fill-current' : 'text-gray-200'} />
            ))}
          </div>
        </div>

        {/* Title */}
        {r.title && (
          <p className="font-semibold text-gray-900 mb-1 text-sm">{r.title}</p>
        )}

        {/* Body */}
        {r.body && (
          <p className="text-sm text-gray-600 leading-relaxed mb-3">{r.body}</p>
        )}

        {/* Review photos */}
        {photos.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-3">
            {photos.map((url, i) => (
              <button key={url} type="button"
                onClick={() => setLightbox(i)}
                className="w-20 h-20 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 hover:opacity-90 transition-opacity">
                <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Footer: helpful + owner reply button */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-2">
          <button
            onClick={markHelpful}
            disabled={votingHelpful || votedHelpful || !user || (r.user_id != null && r.user_id === user?.id)}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-40
              ${votedHelpful ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <ThumbsUp size={13} className={votedHelpful ? 'fill-current text-green-600' : ''} />
            Helpful {helpfulCount > 0 && `(${helpfulCount})`}
          </button>

          {/* Owner reply button */}
          {isOwner && !r.owner_reply && (
            <button
              onClick={() => setShowReplyForm(v => !v)}
              className="text-xs font-medium transition-colors"
              style={{ color: '#1D9E75' }}>
              {showReplyForm ? 'Cancel' : 'Reply'}
            </button>
          )}
        </div>

        {/* Owner reply form */}
        {isOwner && !r.owner_reply && showReplyForm && (
          <div className="mt-3 flex gap-2">
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Write a response to this review…"
              rows={2}
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent resize-none transition-all"
            />
            <button
              onClick={submitReply}
              disabled={replying || !replyText.trim()}
              className="self-end flex items-center gap-1 text-xs font-semibold text-white px-3 py-2 rounded-xl disabled:opacity-50 flex-shrink-0"
              style={{ background: '#1D9E75' }}>
              {replying ? '…' : 'Post'}
            </button>
          </div>
        )}

        {/* Existing owner reply */}
        {r.owner_reply && (
          <div className="mt-3 ml-2 pl-3 border-l-2 rounded-r-xl py-2" style={{ borderColor: '#1D9E75', background: '#f8fdfb' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                style={{ background: '#1D9E75' }}>
                {(businessName ?? 'B')[0]}
              </div>
              <span className="text-xs font-semibold text-gray-700">
                {businessName ?? 'Business owner'} · Owner
              </span>
              {r.reply_at && (
                <span className="text-xs text-gray-400">
                  · {new Date(r.reply_at).toLocaleDateString('en-US', { month:'short', day:'numeric' })}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">{r.owner_reply}</p>
          </div>
        )}
      </div>

      {/* Photo lightbox */}
      {lightbox !== null && photos.length > 0 && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.9)' }}
          onClick={() => setLightbox(null)}>
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
            <X size={18} />
          </button>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/40 px-3 py-1 rounded-full">
            {lightbox + 1} / {photos.length}
          </div>
          <img
            src={photos[lightbox]}
            alt=""
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />
          {lightbox > 0 && (
            <button
              onClick={e => { e.stopPropagation(); setLightbox(lightbox - 1) }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
              <ChevronLeft size={18} />
            </button>
          )}
          {lightbox < photos.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); setLightbox(lightbox + 1) }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      )}
    </>
  )
}