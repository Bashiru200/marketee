'use client'
import { useEffect, useState } from 'react'
import {
  MessageSquare, Search, X, Trash2, Flag,
  Star, BadgeCheck, Loader2, Eye, Filter,
  CheckCircle2, XCircle, AlertTriangle, Building2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuditLog } from '@/lib/useAuditLog'
import Link from 'next/link'

interface Review {
  id:          string
  rating:      number
  title:       string | null
  body:        string | null
  created_at:  string
  flagged:     boolean | null
  verified:    boolean
  helpful:     number
  profiles:    { id: string; name: string | null; email: string | null; avatar_url: string | null } | null
  businesses:  { id: string; name: string; cover_image: string | null } | null
}

interface Stats {
  total:   number
  flagged: number
  fiveStar: number
  oneStar:  number
}

type FilterTab = 'all' | 'flagged' | 'five_star' | 'one_star'
type SortBy    = 'newest' | 'oldest' | 'lowest' | 'highest'

export default function ReviewModeration() {
  const supabase = createClient()
  const { log }  = useAuditLog()

  const [reviews,    setReviews]    = useState<Review[]>([])
  const [stats,      setStats]      = useState<Stats>({ total:0, flagged:0, fiveStar:0, oneStar:0 })
  const [loading,    setLoading]    = useState(true)
  const [query,      setQuery]      = useState('')
  const [tab,        setTab]        = useState<FilterTab>('all')
  const [sortBy,     setSortBy]     = useState<SortBy>('newest')
  const [updating,   setUpdating]   = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState<Review | null>(null)
  const [toast,      setToast]      = useState<string | null>(null)
  const [expanded,   setExpanded]   = useState<string | null>(null)

  useEffect(() => { loadReviews() }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function loadReviews() {
    setLoading(true)
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id, rating, title, body, created_at, flagged, verified, helpful,
        profiles(id, name, email, avatar_url),
        businesses(id, name, cover_image)
      `)
      .order('created_at', { ascending: false })

    if (error) { console.error('[reviews]', error); setLoading(false); return }

    const rows = (data ?? []) as Review[]
    setReviews(rows)
    setStats({
      total:    rows.length,
      flagged:  rows.filter(r => r.flagged).length,
      fiveStar: rows.filter(r => r.rating === 5).length,
      oneStar:  rows.filter(r => r.rating === 1).length,
    })
    setLoading(false)
  }

  async function toggleFlag(review: Review) {
    setUpdating(review.id + 'flag')
    const next = !review.flagged
    const { error } = await supabase
      .from('reviews')
      .update({ flagged: next })
      .eq('id', review.id)

    if (error) {
      showToast(`Error: ${error.message}`)
    } else {
      setReviews(rs => rs.map(r => r.id === review.id ? { ...r, flagged: next } : r))
      setStats(s => ({ ...s, flagged: s.flagged + (next ? 1 : -1) }))
      showToast(next ? 'Review flagged for follow-up' : 'Flag removed')
      await log({ action: next ? 'flag_review' : 'unflag_review', entityType:'review', entityId: review.id, entityName: review.businesses?.name ?? undefined, details:{ reviewer: review.profiles?.name ?? review.profiles?.email ?? 'unknown' } })
    }
    setUpdating(null)
  }

  async function deleteReview(review: Review) {
    setUpdating(review.id + 'delete')
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', review.id)

    if (error) {
      showToast(`Error: ${error.message}`)
    } else {
      setReviews(rs => rs.filter(r => r.id !== review.id))
      setStats(s => ({
        ...s,
        total:    s.total - 1,
        flagged:  review.flagged ? s.flagged - 1 : s.flagged,
        fiveStar: review.rating === 5 ? s.fiveStar - 1 : s.fiveStar,
        oneStar:  review.rating === 1 ? s.oneStar  - 1 : s.oneStar,
      }))
      showToast('Review deleted')
      await log({ action:'delete_review', entityType:'review', entityId: review.id, entityName: review.businesses?.name ?? undefined, details:{ reviewer: review.profiles?.name ?? review.profiles?.email ?? 'unknown', rating: review.rating } })
    }
    setUpdating(null)
    setConfirmDel(null)
  }

  // Filter + sort
  const filtered = reviews
    .filter(r => {
      const q  = query.toLowerCase()
      const mq = !query
        || (r.body  ?? '').toLowerCase().includes(q)
        || (r.title ?? '').toLowerCase().includes(q)
        || (r.profiles?.name  ?? '').toLowerCase().includes(q)
        || (r.profiles?.email ?? '').toLowerCase().includes(q)
        || (r.businesses?.name ?? '').toLowerCase().includes(q)
      const mt = tab === 'all'      ? true
               : tab === 'flagged'  ? !!r.flagged
               : tab === 'five_star'? r.rating === 5
               : tab === 'one_star' ? r.rating === 1
               : true
      return mq && mt
    })
    .sort((a, b) => {
      if (sortBy === 'newest')  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sortBy === 'oldest')  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sortBy === 'highest') return b.rating - a.rating
      if (sortBy === 'lowest')  return a.rating - b.rating
      return 0
    })

  const TABS: { id: FilterTab; label: string; count: number; color?: string }[] = [
    { id:'all',       label:'All reviews', count: stats.total    },
    { id:'flagged',   label:'Flagged',     count: stats.flagged,  color:'#EF4444' },
    { id:'five_star', label:'5 star',      count: stats.fiveStar, color:'#F59E0B' },
    { id:'one_star',  label:'1 star',      count: stats.oneStar,  color:'#EF4444' },
  ]

  if (loading) return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="h-6 w-10 bg-gray-200 rounded mb-2" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
            <div className="h-3 w-16 bg-gray-200 rounded" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="p-4 border-b border-gray-50 space-y-2">
            <div className="h-4 w-3/4 bg-gray-200 rounded" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
            <div className="h-3 w-1/2 bg-gray-200 rounded" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
          </div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes shimmer{0%,100%{opacity:1}50%{opacity:.4}}' }} />
    </div>
  )

  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg">
          ✓ {toast}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Total reviews', value:stats.total,    icon:MessageSquare, color:'#1D9E75' },
          { label:'Flagged',       value:stats.flagged,  icon:Flag,          color:'#EF4444' },
          { label:'5-star',        value:stats.fiveStar, icon:Star,          color:'#F59E0B' },
          { label:'1-star',        value:stats.oneStar,  icon:AlertTriangle, color:'#EF4444' },
        ].map(({ label, value, icon:Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100">
            <Icon size={16} className="mb-2" style={{ color }} />
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search reviews, authors, or businesses…"
              className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400" />
            {query && <button onClick={() => setQuery('')}><X size={13} className="text-gray-400" /></button>}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            <Filter size={13} className="text-gray-400" />
            <select value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)}
              className="text-sm text-gray-700 bg-transparent outline-none cursor-pointer">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="lowest">Lowest rated</option>
              <option value="highest">Highest rated</option>
            </select>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-4 py-2 border-b border-gray-100 bg-gray-50 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
              style={tab === t.id
                ? { background: t.color ?? '#1D9E75', color:'white' }
                : { color:'#6B7280', background:'white', border:'1px solid #E5E7EB' }}>
              {t.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab===t.id?'bg-white/20 text-white':'bg-gray-100 text-gray-500'}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Review rows */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MessageSquare size={28} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No reviews found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(r => (
              <div key={r.id}
                className="p-4 hover:bg-gray-50 transition-colors"
                style={{ borderLeft: r.flagged ? '3px solid #EF4444' : '3px solid transparent' }}>

                <div className="flex items-start gap-3">
                  {/* Author avatar */}
                  <div className="flex-shrink-0 mt-0.5">
                    {r.profiles?.avatar_url ? (
                      <img src={r.profiles.avatar_url} alt=""
                        className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background:'#085041' }}>
                        {(r.profiles?.name ?? r.profiles?.email ?? '?')[0].toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Meta row */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {/* Stars */}
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} size={11}
                            className={i <= r.rating ? 'text-amber-400 fill-current' : 'text-gray-200'} />
                        ))}
                      </div>
                      <span className="text-xs font-medium text-gray-700">
                        {r.profiles?.name ?? r.profiles?.email ?? 'Unknown user'}
                      </span>
                      <span className="text-xs text-gray-400">→</span>
                      {r.businesses && (
                        <Link href={`/businesses/${r.businesses.id}`} target="_blank"
                          className="text-xs font-medium hover:underline flex items-center gap-1"
                          style={{ color:'#1D9E75' }}>
                          <Building2 size={10} />
                          {r.businesses.name}
                        </Link>
                      )}
                      {r.flagged && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-1">
                          <Flag size={9} /> Flagged
                        </span>
                      )}
                      {r.verified && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background:'#E1F5EE', color:'#085041' }}>
                          Verified
                        </span>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">
                        {new Date(r.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                      </span>
                    </div>

                    {/* Review text */}
                    {r.title && (
                      <p className="text-sm font-semibold text-gray-900 mb-0.5">{r.title}</p>
                    )}
                    {r.body && (
                      <p className={`text-sm text-gray-600 leading-relaxed ${expanded !== r.id && r.body.length > 200 ? 'line-clamp-2' : ''}`}>
                        {r.body}
                      </p>
                    )}
                    {r.body && r.body.length > 200 && (
                      <button
                        onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                        className="text-xs mt-1 hover:underline"
                        style={{ color:'#1D9E75' }}>
                        {expanded === r.id ? 'Show less' : 'Read more'}
                      </button>
                    )}

                    {/* Author email */}
                    {r.profiles?.email && (
                      <p className="text-xs text-gray-400 mt-1">{r.profiles.email}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Flag toggle */}
                    <button
                      onClick={() => toggleFlag(r)}
                      disabled={updating === r.id + 'flag'}
                      title={r.flagged ? 'Remove flag' : 'Flag for follow-up'}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors"
                      style={r.flagged
                        ? { background:'#FEE2E2', borderColor:'#EF4444', color:'#EF4444' }
                        : { borderColor:'#E5E7EB', color:'#9CA3AF' }
                      }>
                      {updating === r.id + 'flag'
                        ? <Loader2 size={13} className="animate-spin" />
                        : <Flag size={13} />
                      }
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setConfirmDel(r)}
                      title="Delete review"
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-400">
            Showing {filtered.length} of {reviews.length} reviews
          </p>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background:'rgba(0,0,0,0.5)' }}
          onClick={() => setConfirmDel(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-50">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Delete this review?</h3>
            <p className="text-sm text-gray-500 text-center mb-2">
              Review by <strong>{confirmDel.profiles?.name ?? confirmDel.profiles?.email ?? 'Unknown'}</strong>
              {' '}on <strong>{confirmDel.businesses?.name}</strong>
            </p>
            {confirmDel.body && (
              <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5">
                <div className="flex gap-0.5 mb-2">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={11}
                      className={i <= confirmDel.rating ? 'text-amber-400 fill-current' : 'text-gray-200'} />
                  ))}
                </div>
                <p className="text-xs text-gray-600 line-clamp-3">{confirmDel.body}</p>
              </div>
            )}
            <p className="text-xs text-red-500 text-center mb-5">
              This action cannot be undone. The business rating will be recalculated.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel(null)}
                className="flex-1 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => deleteReview(confirmDel)}
                disabled={updating === confirmDel.id + 'delete'}
                className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 transition-colors">
                {updating === confirmDel.id + 'delete' ? 'Deleting…' : 'Delete review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}