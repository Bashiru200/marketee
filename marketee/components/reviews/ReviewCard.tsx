import { ThumbsUp, BadgeCheck } from 'lucide-react'
import { Star } from 'lucide-react'

interface Review {
  id: string
  rating: number
  title: string | null
  body: string | null
  created_at: string
  helpful: number
  verified: boolean
  profiles: { name: string | null; avatar_url?: string | null } | null
}

export default function ReviewCard({ review: r }: { review: Review }) {
  const name    = r.profiles?.name ?? 'Anonymous'
  const initial = name[0]?.toUpperCase() ?? '?'

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100">
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
              <span className="font-medium text-sm text-gray-900">{name}</span>
              {r.verified && <BadgeCheck size={13} style={{ color: '#1D9E75' }} />}
            </div>
            <span className="text-xs text-gray-400">
              {new Date(r.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
        {/* Stars */}
        <div className="flex gap-0.5">
          {[1,2,3,4,5].map(i => (
            <Star key={i} size={13}
              className={i <= r.rating ? 'text-amber-400 fill-current' : 'text-gray-200'} />
          ))}
        </div>
      </div>

      {r.title && (
        <p className="font-semibold text-sm text-gray-900 mb-1">{r.title}</p>
      )}
      <p className="text-sm text-gray-600 leading-relaxed">{r.body}</p>

      {r.helpful > 0 && (
        <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-600 transition-colors mt-3">
          <ThumbsUp size={12} /> Helpful ({r.helpful})
        </button>
      )}
    </div>
  )
}