'use client'
import { useEffect, useState } from 'react'
import {
  Eye, MessageCircle, Star, Heart,
  TrendingUp, Phone, Globe, Navigation,
  Loader2, ChevronUp, ChevronDown, Minus
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'

interface Props { businessId: string }

interface DayCount { date: string; count: number }

interface Stats {
  // Views
  totalViews:    number
  weekViews:     number
  prevWeekViews: number
  viewsByDay:    DayCount[]
  // Reviews
  totalReviews:  number
  avgRating:     number
  weekReviews:   number
  // Clicks
  waClicks:      number
  phoneClicks:   number
  websiteClicks: number
  dirClicks:     number
  // Saves
  savedCount:    number
}

function Trend({ current, prev }: { current: number; prev: number }) {
  if (prev === 0 && current === 0) return <span className="text-xs text-gray-400">No data yet</span>
  if (prev === 0) return <span className="text-xs font-medium" style={{ color: '#1D9E75' }}>New this week</span>
  const pct = Math.round(((current - prev) / prev) * 100)
  if (pct === 0) return (
    <span className="flex items-center gap-0.5 text-xs text-gray-400">
      <Minus size={10} /> Same as last week
    </span>
  )
  const up = pct > 0
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${up ? 'text-green-600' : 'text-red-500'}`}>
      {up ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      {Math.abs(pct)}% vs last week
    </span>
  )
}

// Tiny bar chart — pure CSS, no library needed
function MiniChart({ data, color = '#1D9E75' }: { data: DayCount[]; color?: string }) {
  if (!data.length) return null
  const max  = Math.max(...data.map(d => d.count), 1)
  const last7 = data.slice(-30) // show last 30 days

  return (
    <div className="mt-4">
      <div className="flex items-end gap-0.5 h-16">
        {last7.map((d, i) => {
          const pct    = (d.count / max) * 100
          const isLast = i === last7.length - 1
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center justify-end group relative">
              <div
                className="w-full rounded-t-sm transition-all duration-300 group-hover:opacity-80"
                style={{
                  height:  `${Math.max(pct, 4)}%`,
                  background: isLast ? color : `${color}66`,
                  minHeight: d.count > 0 ? '4px' : '2px',
                }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 whitespace-nowrap">
                <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded-lg">
                  {d.count} view{d.count !== 1 ? 's' : ''}<br/>
                  <span className="text-gray-400">{new Date(d.date).toLocaleDateString('en-US', { month:'short', day:'numeric' })}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {/* X-axis labels — show first, middle, last */}
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-gray-400">
          {new Date(last7[0]?.date).toLocaleDateString('en-US', { month:'short', day:'numeric' })}
        </span>
        <span className="text-[10px] text-gray-400">30 days</span>
        <span className="text-[10px] text-gray-400">Today</span>
      </div>
    </div>
  )
}

export default function AnalyticsDashboard({ businessId }: Props) {
  const supabase = createClient()
  const { user } = useAuth()
  const [stats,   setStats]   = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const now          = new Date()
      const oneWeekAgo   = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000).toISOString()
      const twoWeeksAgo  = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
      const thirtyDays   = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

      const [
        viewsAll, viewsWeek, viewsPrevWeek, viewsDaily,
        reviewsAll, reviewsWeek,
        clicks, saved,
      ] = await Promise.all([
        // Total views
        supabase.from('business_views')
          .select('id', { count:'exact', head:true })
          .eq('business_id', businessId),
        // This week's views
        supabase.from('business_views')
          .select('id', { count:'exact', head:true })
          .eq('business_id', businessId)
          .gte('viewed_at', oneWeekAgo),
        // Last week's views (for trend)
        supabase.from('business_views')
          .select('id', { count:'exact', head:true })
          .eq('business_id', businessId)
          .gte('viewed_at', twoWeeksAgo)
          .lt('viewed_at', oneWeekAgo),
        // Daily views for chart (last 30 days)
        supabase.from('business_views')
          .select('viewed_at')
          .eq('business_id', businessId)
          .gte('viewed_at', thirtyDays)
          .order('viewed_at', { ascending: true }),
        // Reviews
        supabase.from('reviews')
          .select('rating')
          .eq('business_id', businessId),
        // This week's reviews
        supabase.from('reviews')
          .select('id', { count:'exact', head:true })
          .eq('business_id', businessId)
          .gte('created_at', oneWeekAgo),
        // Click breakdown
        supabase.from('business_clicks')
          .select('click_type')
          .eq('business_id', businessId)
          .gte('clicked_at', thirtyDays),
        // Saves
        supabase.from('saved_businesses')
          .select('id', { count:'exact', head:true })
          .eq('business_id', businessId),
      ])

      // Build daily view counts — fill in zeros for missing days
      const dailyMap: Record<string, number> = {}
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        dailyMap[d.toISOString().slice(0, 10)] = 0
      }
      ;(viewsDaily.data ?? []).forEach((v: { viewed_at: string }) => {
        const day = v.viewed_at.slice(0, 10)
        if (dailyMap[day] !== undefined) dailyMap[day]++
      })
      const viewsByDay: DayCount[] = Object.entries(dailyMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))

      // Click type counts
      const clickData = clicks.data ?? []
      const countClicks = (type: string) => clickData.filter((c: { click_type: string }) => c.click_type === type).length

      // Reviews
      const reviews = reviewsAll.data ?? []
      const avg     = reviews.length
        ? reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / reviews.length
        : 0

      setStats({
        totalViews:    viewsAll.count    ?? 0,
        weekViews:     viewsWeek.count   ?? 0,
        prevWeekViews: viewsPrevWeek.count ?? 0,
        viewsByDay,
        totalReviews:  reviews.length,
        avgRating:     avg,
        weekReviews:   reviewsWeek.count ?? 0,
        waClicks:      countClicks('whatsapp'),
        phoneClicks:   countClicks('phone'),
        websiteClicks: countClicks('website'),
        dirClicks:     countClicks('directions'),
        savedCount:    saved.count ?? 0,
      })
      setLoading(false)
    }
    load()
  }, [businessId])

  if (loading) return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="h-3 w-16 bg-gray-100 rounded mb-3 animate-pulse" />
            <div className="h-8 w-12 bg-gray-100 rounded mb-2 animate-pulse" />
            <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 py-4 text-gray-400 text-sm">
        <Loader2 size={16} className="animate-spin" /> Loading analytics…
      </div>
    </div>
  )

  if (!stats) return null

  return (
    <div className="space-y-5">

      {/* ── Top stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Profile views */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Profile views</p>
            <Eye size={16} style={{ color: '#1D9E75' }} />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{stats.totalViews.toLocaleString()}</p>
          <Trend current={stats.weekViews} prev={stats.prevWeekViews} />
        </div>

        {/* Saved */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Saved</p>
            <Heart size={16} style={{ color: '#D4537E' }} />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{stats.savedCount}</p>
          <p className="text-xs text-gray-400">customers</p>
        </div>

        {/* Rating */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Avg rating</p>
            <Star size={16} style={{ color: '#F59E0B' }} />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
          </p>
          <p className="text-xs text-gray-400">{stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}</p>
        </div>

        {/* Reviews this week */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">New reviews</p>
            <MessageCircle size={16} style={{ color: '#6366F1' }} />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{stats.weekReviews}</p>
          <p className="text-xs text-gray-400">this week</p>
        </div>
      </div>

      {/* ── Views chart ── */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-gray-900">Profile views</h3>
          <span className="text-xs text-gray-400 font-medium">Last 30 days</span>
        </div>
        <p className="text-xs text-gray-400 mb-2">
          {stats.weekViews} view{stats.weekViews !== 1 ? 's' : ''} this week
        </p>
        <MiniChart data={stats.viewsByDay} />
      </div>

      {/* ── Click breakdown ── */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-4">Customer actions <span className="text-xs font-normal text-gray-400 ml-1">last 30 days</span></h3>
        <div className="space-y-3">
          {[
            { label: 'WhatsApp enquiries', count: stats.waClicks,      icon: MessageCircle, color: '#25D366' },
            { label: 'Phone calls',        count: stats.phoneClicks,   icon: Phone,         color: '#1D9E75' },
            { label: 'Website visits',     count: stats.websiteClicks, icon: Globe,         color: '#6366F1' },
            { label: 'Get directions',     count: stats.dirClicks,     icon: Navigation,    color: '#F59E0B' },
          ].map(({ label, count, icon: Icon, color }) => {
            const total = stats.waClicks + stats.phoneClicks + stats.websiteClicks + stats.dirClicks
            const pct   = total > 0 ? Math.round((count / total) * 100) : 0
            return (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Icon size={14} style={{ color }} />
                    <span className="text-sm text-gray-700">{label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{count}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
              </div>
            )
          })}

          {(stats.waClicks + stats.phoneClicks + stats.websiteClicks + stats.dirClicks) === 0 && (
            <p className="text-sm text-gray-400 text-center py-2">
              No click data yet — clicks will appear here once customers interact with your listing
            </p>
          )}
        </div>
      </div>

      {/* ── Growth tips ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp size={16} style={{ color:'#1D9E75' }} /> Growth tips
        </h3>
        <div className="space-y-3">
          {[
            {
              tip:  'Add a cover photo — listings with photos get 3× more views',
              done: stats.totalViews > 0,
              action: 'Upload photo',
            },
            {
              tip:  'Share your listing link in WhatsApp groups to get your first reviews',
              done: stats.totalReviews >= 5,
              action: 'Copy link',
            },
            {
              tip:  'Add your products so customers know what you offer before contacting you',
              done: false,
              action: 'Add products',
            },
            {
              tip:  'Respond to every review — it builds trust with new customers',
              done: stats.totalReviews === 0,
              action: null,
            },
          ].map(({ tip, done, action }) => (
            <div key={tip} className="flex items-start gap-3 text-sm">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: done ? '#E1F5EE' : '#F3F4F6' }}
              >
                {done
                  ? <span className="text-[10px]" style={{ color:'#1D9E75' }}>✓</span>
                  : <span className="text-[10px] text-gray-400">○</span>
                }
              </div>
              <p className={done ? 'text-gray-400 line-through flex-1' : 'text-gray-600 flex-1'}>{tip}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}