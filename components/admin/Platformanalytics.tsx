'use client'
import { useEffect, useState } from 'react'
import {
  TrendingUp, Users, Building2, Star,
  MapPin, ArrowUp, ArrowDown, Calendar,
  Crown, ShoppingBag, MessageSquare
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Overview {
  totalUsers:       number
  totalBusinesses:  number
  totalReviews:     number
  premiumCount:     number
  storefrontCount:  number
  newUsersWeek:     number
  newBizWeek:       number
  newReviewsWeek:   number
  avgRating:        number
}

interface CityRow    { city: string; count: number }
interface CategoryRow{ category: string; count: number; avg_rating: number }
interface PlanRow    { plan: string; count: number }
interface DayRow     { day: string; users: number; businesses: number; reviews: number }

const WEEK_DAYS = Array.from({ length: 7 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() - (6 - i))
  return d.toISOString().slice(0, 10)
})

const BAR_COLORS: Record<string, string> = {
  free:       '#E5E7EB',
  premium:    '#1D9E75',
  storefront: '#085041',
}

export default function PlatformAnalytics() {
  const supabase = createClient()

  const [overview,    setOverview]    = useState<Overview | null>(null)
  const [cities,      setCities]      = useState<CityRow[]>([])
  const [categories,  setCategories]  = useState<CategoryRow[]>([])
  const [plans,       setPlans]       = useState<PlanRow[]>([])
  const [activity,    setActivity]    = useState<DayRow[]>([])
  const [loading,     setLoading]     = useState(true)
  const [period,      setPeriod]      = useState<'week' | 'month'>('week')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const oneWeekAgo  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000).toISOString()
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const [
      usersAll, usersWeek,
      bizAll, bizWeek,
      reviewsAll, reviewsWeek,
      bizDetails,
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count:'exact', head:true }),
      supabase.from('profiles').select('id', { count:'exact', head:true }).gte('created_at', oneWeekAgo),
      supabase.from('businesses').select('id', { count:'exact', head:true }),
      supabase.from('businesses').select('id', { count:'exact', head:true }).gte('created_at', oneWeekAgo),
      supabase.from('reviews').select('id, rating', { count:'exact' }),
      supabase.from('reviews').select('id', { count:'exact', head:true }).gte('created_at', oneWeekAgo),
      supabase.from('businesses').select('city, category, plan, rating, created_at'),
    ])

    const allReviews = reviewsAll.data ?? []
    const avgRating  = allReviews.length
      ? allReviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / allReviews.length
      : 0

    const allBiz = bizDetails.data ?? []

    // Overview
    setOverview({
      totalUsers:      usersAll.count      ?? 0,
      totalBusinesses: bizAll.count        ?? 0,
      totalReviews:    reviewsAll.count    ?? 0,
      premiumCount:    allBiz.filter((b: any) => b.plan === 'premium').length,
      storefrontCount: allBiz.filter((b: any) => b.plan === 'storefront').length,
      newUsersWeek:    usersWeek.count     ?? 0,
      newBizWeek:      bizWeek.count       ?? 0,
      newReviewsWeek:  reviewsWeek.count   ?? 0,
      avgRating,
    })

    // Cities
    const cityMap: Record<string, number> = {}
    allBiz.forEach((b: any) => {
      if (b.city) cityMap[b.city] = (cityMap[b.city] ?? 0) + 1
    })
    setCities(
      Object.entries(cityMap)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
    )

    // Categories
    const catMap: Record<string, { count: number; ratings: number[] }> = {}
    allBiz.forEach((b: any) => {
      if (!b.category) return
      if (!catMap[b.category]) catMap[b.category] = { count: 0, ratings: [] }
      catMap[b.category].count++
      if (b.rating > 0) catMap[b.category].ratings.push(b.rating)
    })
    setCategories(
      Object.entries(catMap)
        .map(([category, { count, ratings }]) => ({
          category,
          count,
          avg_rating: ratings.length
            ? ratings.reduce((s, r) => s + r, 0) / ratings.length
            : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
    )

    // Plans
    const planMap: Record<string, number> = { free: 0, premium: 0, storefront: 0 }
    allBiz.forEach((b: any) => {
      const p = b.plan ?? 'free'
      planMap[p] = (planMap[p] ?? 0) + 1
    })
    setPlans(Object.entries(planMap).map(([plan, count]) => ({ plan, count })))

    // Daily activity — last 7 days
    const dayActivity: Record<string, DayRow> = {}
    WEEK_DAYS.forEach(d => { dayActivity[d] = { day: d, users: 0, businesses: 0, reviews: 0 } })

    allBiz.forEach((b: any) => {
      const d = (b.created_at ?? '').slice(0, 10)
      if (dayActivity[d]) dayActivity[d].businesses++
    })

    setActivity(Object.values(dayActivity))
    setLoading(false)
  }

  function Stat({
    icon: Icon, label, value, sub, color, up,
  }: {
    icon: React.ElementType; label: string; value: string | number
    sub?: string; color: string; up?: boolean
  }) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-gray-100">
        <Icon size={17} className="mb-3" style={{ color }} />
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400 mt-1">{label}</p>
        {sub !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            {up
              ? <ArrowUp size={10} style={{ color:'#1D9E75' }} />
              : <ArrowDown size={10} style={{ color:'#EF4444' }} />
            }
            <span className="text-xs font-medium" style={{ color: up ? '#1D9E75' : '#EF4444' }}>
              {sub} this week
            </span>
          </div>
        )}
      </div>
    )
  }

  if (loading || !overview) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="h-5 w-5 bg-gray-200 rounded mb-3" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
            <div className="h-7 w-12 bg-gray-200 rounded mb-2" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
            <div className="h-3 w-20 bg-gray-200 rounded" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
          </div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes shimmer{0%,100%{opacity:1}50%{opacity:.4}}' }} />
    </div>
  )

  const maxCity = Math.max(...cities.map(c => c.count), 1)
  const maxCat  = Math.max(...categories.map(c => c.count), 1)
  const totalBizForPlan = plans.reduce((s, p) => s + p.count, 0) || 1

  return (
    <div className="space-y-6">

      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Users}        label="Total users"       value={overview.totalUsers}                    color="#1D9E75" up={overview.newUsersWeek > 0}    sub={`+${overview.newUsersWeek}`} />
        <Stat icon={Building2}    label="Total businesses"  value={overview.totalBusinesses}               color="#085041" up={overview.newBizWeek > 0}      sub={`+${overview.newBizWeek}`} />
        <Stat icon={MessageSquare}label="Total reviews"     value={overview.totalReviews}                  color="#8B5CF6" up={overview.newReviewsWeek > 0}  sub={`+${overview.newReviewsWeek}`} />
        <Stat icon={Star}         label="Avg rating"        value={overview.avgRating > 0 ? overview.avgRating.toFixed(1) + ' ★' : '—'} color="#F59E0B" />
        <Stat icon={Crown}        label="Premium"           value={overview.premiumCount}                  color="#1D9E75" />
        <Stat icon={ShoppingBag}  label="Storefront"        value={overview.storefrontCount}               color="#085041" />
        <Stat icon={TrendingUp}   label="Conversion rate"   value={overview.totalBusinesses > 0 ? Math.round(((overview.premiumCount + overview.storefrontCount) / overview.totalBusinesses) * 100) + '%' : '0%'} color="#F59E0B" />
        <Stat icon={Calendar}     label="New this week"     value={overview.newUsersWeek + overview.newBizWeek} color="#8B5CF6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Plan breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <Crown size={16} style={{ color:'#1D9E75' }} />
            Plan breakdown
          </h3>
          <div className="space-y-4">
            {plans.map(({ plan, count }) => {
              const pct = Math.round(count / totalBizForPlan * 100)
              return (
                <div key={plan}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: BAR_COLORS[plan] ?? '#E5E7EB' }} />
                      <span className="text-sm font-medium text-gray-700 capitalize">{plan}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-900">{count}</span>
                      <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: BAR_COLORS[plan] ?? '#E5E7EB' }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Free → Paid conversion:{' '}
              <span className="font-semibold text-gray-700">
                {Math.round(((overview.premiumCount + overview.storefrontCount) / totalBizForPlan) * 100)}%
              </span>
            </p>
          </div>
        </div>

        {/* Cities */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <MapPin size={16} style={{ color:'#1D9E75' }} />
            Top cities
          </h3>
          {cities.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No city data yet</p>
          ) : (
            <div className="space-y-3">
              {cities.map(({ city, count }, i) => (
                <div key={city} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 truncate">{city}</span>
                      <span className="text-xs font-bold text-gray-900 ml-2">{count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full"
                        style={{ width:`${Math.round(count / maxCity * 100)}%`, background:'#1D9E75' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <ShoppingBag size={16} style={{ color:'#1D9E75' }} />
            Categories
          </h3>
          {categories.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No category data yet</p>
          ) : (
            <div className="space-y-3">
              {categories.map(({ category, count, avg_rating }) => (
                <div key={category} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 capitalize truncate">{category}</span>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        {avg_rating > 0 && (
                          <span className="text-xs text-gray-400">
                            ⭐ {avg_rating.toFixed(1)}
                          </span>
                        )}
                        <span className="text-xs font-bold text-gray-900">{count}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full"
                        style={{ width:`${Math.round(count / maxCat * 100)}%`, background:'#085041' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weekly activity */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <Calendar size={16} style={{ color:'#1D9E75' }} />
            Business signups — last 7 days
          </h3>
          {activity.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No activity data yet</p>
          ) : (
            <>
              <div className="flex items-end gap-2 h-32">
                {activity.map(({ day, businesses }) => {
                  const maxDay = Math.max(...activity.map(d => d.businesses), 1)
                  const pct    = Math.round(businesses / maxDay * 100)
                  const label  = new Date(day + 'T00:00:00').toLocaleDateString('en-US',{weekday:'short'})
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs font-bold text-gray-700">{businesses > 0 ? businesses : ''}</span>
                      <div className="w-full rounded-t-lg transition-all duration-700 flex-1 flex items-end">
                        <div className="w-full rounded-t-lg"
                          style={{ height:`${Math.max(pct, 4)}%`, background: businesses > 0 ? '#1D9E75' : '#E5E7EB', minHeight:'4px' }} />
                      </div>
                      <span className="text-[10px] text-gray-400">{label}</span>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">
                Total this week: <strong className="text-gray-700">{activity.reduce((s, d) => s + d.businesses, 0)}</strong> new businesses
              </p>
            </>
          )}
        </div>
      </div>

      {/* Key metrics summary */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp size={16} style={{ color:'#1D9E75' }} />
          Key metrics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: 'Reviews per business',
              value: overview.totalBusinesses > 0
                ? (overview.totalReviews / overview.totalBusinesses).toFixed(1)
                : '0',
              desc: 'Average reviews each listing has received',
            },
            {
              label: 'Paid conversion',
              value: `${Math.round(((overview.premiumCount + overview.storefrontCount) / Math.max(overview.totalBusinesses, 1)) * 100)}%`,
              desc: 'Percentage of businesses on a paid plan',
            },
            {
              label: 'Owner to customer ratio',
              value: overview.totalUsers > 0
                ? `1 : ${Math.round((overview.totalUsers - overview.totalBusinesses) / Math.max(overview.totalBusinesses, 1))}`
                : '—',
              desc: 'Customers per business owner on the platform',
            },
          ].map(({ label, value, desc }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
              <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}