'use client'
import { useEffect, useState } from 'react'
import { TrendingUp, Eye, MessageCircle, Star, Users, ArrowUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  businessId: string
}

interface Stat {
  label:    string
  value:    string | number
  change?:  string
  up?:      boolean
  icon:     React.ElementType
  color:    string
}

export default function AnalyticsDashboard({ businessId }: Props) {
  const supabase = createClient()
  const [stats, setStats] = useState<{
    totalReviews: number
    avgRating:    number
    weekReviews:  number
    savedCount:   number
  } | null>(null)

  useEffect(() => {
    async function load() {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const [reviewAll, reviewWeek, saved] = await Promise.all([
        supabase.from('reviews').select('rating').eq('business_id', businessId),
        supabase.from('reviews').select('id', { count: 'exact', head: true })
          .eq('business_id', businessId).gte('created_at', oneWeekAgo),
        supabase.from('saved_businesses').select('id', { count: 'exact', head: true })
          .eq('business_id', businessId),
      ])

      const reviews = reviewAll.data ?? []
      const avg = reviews.length
        ? reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / reviews.length
        : 0

      setStats({
        totalReviews: reviews.length,
        avgRating:    avg,
        weekReviews:  reviewWeek.count ?? 0,
        savedCount:   saved.count ?? 0,
      })
    }
    load()
  }, [businessId])

  if (!stats) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1,2,3,4].map(i => (
        <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="h-4 w-16 bg-gray-100 rounded mb-3" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
          <div className="h-8 w-12 bg-gray-100 rounded mb-2" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
          <div className="h-3 w-20 bg-gray-100 rounded" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
        </div>
      ))}
      <style dangerouslySetInnerHTML={{ __html: '@keyframes shimmer{0%,100%{opacity:1}50%{opacity:.4}}' }} />
    </div>
  )

  const statCards: Stat[] = [
    {
      icon:  Star,
      label: 'Average rating',
      value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) + ' ★' : '—',
      color: '#F59E0B',
    },
    {
      icon:  MessageCircle,
      label: 'Total reviews',
      value: stats.totalReviews,
      color: '#1D9E75',
    },
    {
      icon:  TrendingUp,
      label: 'Reviews this week',
      value: stats.weekReviews,
      up:    stats.weekReviews > 0,
      color: '#8B5CF6',
    },
    {
      icon:  Users,
      label: 'People saved you',
      value: stats.savedCount,
      color: '#EF4444',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100">
            <s.icon size={17} className="mb-3" style={{ color: s.color }} />
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            {s.up !== undefined && (
              <div className="flex items-center gap-1 mt-1.5">
                <ArrowUp size={10} style={{ color: s.up ? '#1D9E75' : '#EF4444', transform: s.up ? 'none' : 'rotate(180deg)' }} />
                <span className="text-xs" style={{ color: s.up ? '#1D9E75' : '#EF4444' }}>
                  {s.up ? 'Active this week' : 'No activity this week'}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Rating breakdown */}
      {stats.totalReviews > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Star size={16} style={{ color: '#F59E0B' }} />
            Rating breakdown
          </h3>
          <div className="space-y-2">
            {[5,4,3,2,1].map(star => {
              const count = 0 // would need review data with ratings
              const pct   = stats.totalReviews ? count / stats.totalReviews * 100 : 0
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-4">{star}★</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: '#1D9E75' }} />
                  </div>
                  <span className="text-xs text-gray-400 w-4">{count}</span>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Tips */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Growth tips</h3>
        <div className="space-y-3">
          {[
            { tip: 'Share your listing link on WhatsApp groups to collect your first reviews', done: stats.totalReviews >= 5 },
            { tip: 'Add at least 3 product photos to increase enquiries by 2x', done: false },
            { tip: 'Respond to reviews to build trust with potential customers', done: false },
          ].map(({ tip, done }) => (
            <div key={tip} className="flex items-start gap-3 text-sm">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: done ? '#E1F5EE' : '#F3F4F6' }}>
                {done
                  ? <span className="text-[10px]" style={{ color:'#1D9E75' }}>✓</span>
                  : <span className="text-[10px] text-gray-400">○</span>
                }
              </div>
              <p className={done ? 'text-gray-400 line-through' : 'text-gray-600'}>{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}