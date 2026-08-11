'use client'
import { useEffect, useState } from 'react'
import {
  DollarSign, TrendingUp, CreditCard, Users,
  Crown, ShoppingBag, ArrowUp, ArrowDown,
  CheckCircle2, XCircle, Clock, RefreshCw,
  Building2, Calendar, Zap
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Subscriber {
  id:          string
  name:        string | null
  email:       string | null
  plan:        'premium' | 'storefront'
  city:        string | null
  category:    string | null
  cover_image: string | null
  created_at:  string
  updated_at:  string | null
  owner:       { name: string | null; email: string | null } | null
}

interface RevenueStats {
  mrr:              number
  arr:              number
  premiumCount:     number
  storefrontCount:  number
  totalSubscribers: number
  newThisMonth:     number
  churnThisMonth:   number
  avgRevenuePerSub: number
}

const PLAN_PRICE   = { premium: 29, storefront: 49 }
const PLAN_COLOR   = { premium: '#1D9E75', storefront: '#085041' }
const PLAN_BG      = { premium: '#E1F5EE', storefront: '#c5eadb' }

export default function RevenueDashboard() {
  const supabase = createClient()

  const [stats,       setStats]       = useState<RevenueStats | null>(null)
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading,     setLoading]     = useState(true)
  const [filter,      setFilter]      = useState<'all' | 'premium' | 'storefront'>('all')
  const [toast,       setToast]       = useState<string | null>(null)
  const [downgrading, setDowngrading] = useState<string | null>(null)
  const [confirmDowngrade, setConfirmDowngrade] = useState<Subscriber | null>(null)

  useEffect(() => { loadAll() }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function loadAll() {
    setLoading(true)

    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    const { data: bizData } = await supabase
      .from('businesses')
      .select('id, name, plan, city, category, cover_image, created_at, profiles(name, email)')
      .in('plan', ['premium', 'storefront'])
      .order('created_at', { ascending: false })

    const subs = (bizData ?? []).map((b: any) => ({
      id:          b.id,
      name:        b.name,
      email:       b.profiles?.email ?? null,
      plan:        b.plan,
      city:        b.city,
      category:    b.category,
      cover_image: b.cover_image,
      created_at:  b.created_at,
      updated_at:  b.created_at,   // no updated_at column, use created_at
      owner:       b.profiles ?? null,
    })) as Subscriber[]

    setSubscribers(subs)

    const premCount  = subs.filter(s => s.plan === 'premium').length
    const storeCount = subs.filter(s => s.plan === 'storefront').length
    const mrr        = premCount * PLAN_PRICE.premium + storeCount * PLAN_PRICE.storefront

    // New this month = subscribed after one month ago
    const newThisMonth = subs.filter(s =>
      new Date(s.updated_at ?? s.created_at) >= oneMonthAgo
    ).length

    setStats({
      mrr,
      arr:              mrr * 12,
      premiumCount:     premCount,
      storefrontCount:  storeCount,
      totalSubscribers: subs.length,
      newThisMonth,
      churnThisMonth:   0, // needs Stripe for real churn data
      avgRevenuePerSub: subs.length > 0 ? mrr / subs.length : 0,
    })

    setLoading(false)
  }

  async function downgradePlan(sub: Subscriber) {
    setDowngrading(sub.id)
    const { error } = await supabase
      .from('businesses')
      .update({ plan: 'free', premium: false, featured: false })
      .eq('id', sub.id)

    if (error) {
      showToast(`Error: ${error.message}`)
    } else {
      setSubscribers(ss => ss.filter(s => s.id !== sub.id))
      setStats(prev => {
        if (!prev) return prev
        const lost = PLAN_PRICE[sub.plan]
        return {
          ...prev,
          mrr:              prev.mrr - lost,
          arr:              (prev.mrr - lost) * 12,
          premiumCount:     sub.plan === 'premium'    ? prev.premiumCount - 1    : prev.premiumCount,
          storefrontCount:  sub.plan === 'storefront' ? prev.storefrontCount - 1 : prev.storefrontCount,
          totalSubscribers: prev.totalSubscribers - 1,
        }
      })
      showToast(`${sub.name} downgraded to Free`)
    }
    setDowngrading(null)
    setConfirmDowngrade(null)
  }

  const filtered = subscribers.filter(s =>
    filter === 'all' ? true : s.plan === filter
  )

  function StatCard({
    icon: Icon, label, value, sub, color, prefix = '', up,
  }: {
    icon: React.ElementType; label: string; value: string | number
    sub?: string; color: string; prefix?: string; up?: boolean
  }) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-gray-100">
        <Icon size={17} className="mb-3" style={{ color }} />
        <p className="text-2xl font-bold text-gray-900">{prefix}{value}</p>
        <p className="text-xs text-gray-400 mt-1">{label}</p>
        {sub && (
          <div className="flex items-center gap-1 mt-2">
            {up !== undefined && (
              up
                ? <ArrowUp   size={10} style={{ color:'#1D9E75' }} />
                : <ArrowDown size={10} style={{ color:'#EF4444' }} />
            )}
            <span className="text-xs text-gray-400">{sub}</span>
          </div>
        )}
      </div>
    )
  }

  if (loading || !stats) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="h-5 w-5 bg-gray-200 rounded mb-3" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
            <div className="h-7 w-16 bg-gray-200 rounded mb-2" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
            <div className="h-3 w-20 bg-gray-200 rounded" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
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

      {/* Stripe notice banner */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border"
        style={{ background:'#FFFBEB', borderColor:'#FDE68A' }}>
        <Zap size={16} style={{ color:'#D97706', flexShrink:0, marginTop:1 }} />
        <div>
          <p className="text-sm font-semibold" style={{ color:'#92400E' }}>
            Stripe not connected — showing plan data only
          </p>
          <p className="text-xs mt-0.5" style={{ color:'#B45309' }}>
            Connect Stripe to see real payment history, failed charges, refunds and automatic churn detection.
            MRR figures are calculated from plan assignments.
          </p>
        </div>
      </div>

      {/* Revenue stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign}  label="MRR"               value={stats.mrr.toLocaleString()}              prefix="$" color="#1D9E75" sub="Monthly recurring revenue" />
        <StatCard icon={TrendingUp}  label="ARR"               value={stats.arr.toLocaleString()}              prefix="$" color="#085041" sub="Annualised run rate" />
        <StatCard icon={Users}       label="Subscribers"       value={stats.totalSubscribers}                             color="#8B5CF6" sub={`${stats.newThisMonth} new this month`} up={stats.newThisMonth > 0} />
        <StatCard icon={CreditCard}  label="Avg revenue / sub" value={`$${stats.avgRevenuePerSub.toFixed(0)}`}            color="#F59E0B" sub="Per business per month" />
        <StatCard icon={Crown}       label="Premium"           value={stats.premiumCount}                                 color="#1D9E75" sub={`$${(stats.premiumCount * PLAN_PRICE.premium).toLocaleString()}/mo`} />
        <StatCard icon={ShoppingBag} label="Storefront"        value={stats.storefrontCount}                              color="#085041" sub={`$${(stats.storefrontCount * PLAN_PRICE.storefront).toLocaleString()}/mo`} />
        <StatCard icon={RefreshCw}   label="Churn this month"  value={stats.churnThisMonth}                               color="#EF4444" sub="Requires Stripe" />
        <StatCard icon={Calendar}    label="New this month"    value={stats.newThisMonth}                                 color="#1D9E75" up={stats.newThisMonth > 0} />
      </div>

      {/* MRR breakdown visual */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-5">Revenue breakdown</h3>
        <div className="flex items-center gap-4 mb-4">
          {/* Stacked bar */}
          <div className="flex-1 h-8 rounded-xl overflow-hidden flex">
            {stats.mrr > 0 ? (
              <>
                <div
                  className="h-full flex items-center justify-center text-xs font-medium text-white transition-all"
                  style={{
                    width: `${Math.round(stats.premiumCount * PLAN_PRICE.premium / stats.mrr * 100)}%`,
                    background: '#1D9E75',
                    minWidth: stats.premiumCount > 0 ? '40px' : '0',
                  }}>
                  {stats.premiumCount > 0 && `${Math.round(stats.premiumCount * PLAN_PRICE.premium / stats.mrr * 100)}%`}
                </div>
                <div
                  className="h-full flex items-center justify-center text-xs font-medium text-white transition-all"
                  style={{
                    width: `${Math.round(stats.storefrontCount * PLAN_PRICE.storefront / stats.mrr * 100)}%`,
                    background: '#085041',
                    minWidth: stats.storefrontCount > 0 ? '40px' : '0',
                  }}>
                  {stats.storefrontCount > 0 && `${Math.round(stats.storefrontCount * PLAN_PRICE.storefront / stats.mrr * 100)}%`}
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <span className="text-xs text-gray-400">No revenue yet</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-6">
          {[
            { label:'Premium',    count:stats.premiumCount,    price:PLAN_PRICE.premium,    color:'#1D9E75' },
            { label:'Storefront', count:stats.storefrontCount, price:PLAN_PRICE.storefront, color:'#085041' },
          ].map(({ label, count, price, color }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: color }} />
              <span className="text-sm text-gray-600">
                {label}: <strong className="text-gray-900">{count} × ${price} = ${(count * price).toLocaleString()}/mo</strong>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Subscribers table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <h3 className="font-semibold text-gray-900">
            Active subscribers
            <span className="ml-2 text-sm font-normal text-gray-400">({filtered.length})</span>
          </h3>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {(['all', 'premium', 'storefront'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize"
                style={filter === f
                  ? { background: f === 'storefront' ? '#085041' : f === 'premium' ? '#1D9E75' : '#374151', color:'white' }
                  : { color:'#6B7280' }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <DollarSign size={32} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm text-gray-400">No paid subscribers yet</p>
            <p className="text-xs text-gray-400 mt-1">Upgrade businesses from the Businesses tab</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(s => (
              <div key={s.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">

                {/* Cover */}
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                  {s.cover_image
                    ? <img src={s.cover_image} alt={s.name ?? ''} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-base"
                        style={{ background:'#E1F5EE' }}>🏪</div>
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 truncate">{s.name}</p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
                      style={{ background: PLAN_BG[s.plan], color: PLAN_COLOR[s.plan] }}>
                      {s.plan}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {s.owner?.email ?? 'No email'}
                    {s.city ? ` · ${s.city}` : ''}
                    {s.category ? ` · ${s.category}` : ''}
                  </p>
                </div>

                {/* Revenue */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">
                    ${PLAN_PRICE[s.plan]}<span className="text-xs font-normal text-gray-400">/mo</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Since {new Date(s.updated_at ?? s.created_at).toLocaleDateString('en-US',{month:'short',year:'numeric'})}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0">
                  <button
                    onClick={() => setConfirmDowngrade(s)}
                    className="text-xs text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Downgrade
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {filtered.length} subscriber{filtered.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs font-semibold text-gray-700">
              Total: ${filtered.reduce((s, sub) => s + PLAN_PRICE[sub.plan], 0).toLocaleString()}/mo
            </p>
          </div>
        )}
      </div>

      {/* Confirm downgrade modal */}
      {confirmDowngrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background:'rgba(0,0,0,0.5)' }}
          onClick={() => setConfirmDowngrade(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-amber-50">
              <ArrowDown size={22} className="text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
              Downgrade to Free?
            </h3>
            <p className="text-sm text-gray-500 text-center mb-2">
              <strong>{confirmDowngrade.name}</strong> will lose all{' '}
              <span className="font-semibold capitalize">{confirmDowngrade.plan}</span> features immediately.
            </p>
            <div className="bg-amber-50 rounded-xl px-4 py-3 mb-5 text-center">
              <p className="text-sm font-bold text-amber-800">
                −${PLAN_PRICE[confirmDowngrade.plan]}/mo from MRR
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                New MRR: ${(stats.mrr - PLAN_PRICE[confirmDowngrade.plan]).toLocaleString()}/mo
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDowngrade(null)}
                className="flex-1 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => downgradePlan(confirmDowngrade)}
                disabled={downgrading === confirmDowngrade.id}
                className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 transition-colors">
                {downgrading === confirmDowngrade.id ? 'Downgrading…' : 'Confirm downgrade'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}