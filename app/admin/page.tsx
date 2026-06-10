'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Shield, BadgeCheck, Search, X, Trash2,
  TrendingUp, Users, Building2, MessageSquare,
  DollarSign, ClipboardList, Loader2, Eye,
  CheckCircle2, XCircle, Crown, Star, Megaphone, Zap, Mail, Flag
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuditLog } from '@/lib/useAuditLog'
import { useAuth } from '@/lib/auth'
import { AdminPermission } from '@/lib/permissions'
import Link from 'next/link'
import Image from 'next/image'
import UserManagement    from '@/components/admin/UserManagement'
import ReviewModeration  from '@/components/admin/Reviewmoderation'
import PlatformAnalytics from '@/components/admin/Platformanalytics'
import RevenueDashboard  from '@/components/admin/RevenueDashboard'
import AuditLog          from '@/components/admin/AuditLog'
import AdminManagement      from '@/components/admin/AdminManagement'
import AnnouncementManager  from '@/components/admin/AnnouncementManager'
import FeatureFlagsManager  from '@/components/admin/FeatureFlagsManager'
import BroadcastEmail          from '@/components/admin/BroadcastEmail'
import BusinessClaimsManager  from '@/components/admin/BusinessClaimsManager'
import ReportsQueue           from '@/components/admin/ReportsQueue'

// ── Types ─────────────────────────────────────────────────────────────────
type Plan      = 'free' | 'premium' | 'storefront'
type FilterTab = 'all' | 'unverified' | 'verified' | 'premium' | 'storefront'
type ActiveTab = 'businesses' | 'users' | 'reviews' | 'analytics' | 'revenue' | 'audit' | 'admins' | 'announcements' | 'flags' | 'broadcast' | 'claims' | 'reports'

interface Business {
  id: string; name: string; category: string | null
  city: string | null; state: string | null; country: string | null
  cover_image: string | null; rating: number; review_count: number
  verified: boolean; premium: boolean; featured: boolean
  plan: Plan; slug: string | null
  created_at: string; owner_id: string
  profiles: { name: string | null; email: string | null } | null
}

interface Stats {
  totalBusinesses: number
  verifiedCount:   number
  premiumCount:    number
  storefrontCount: number
}

// ── Constants ─────────────────────────────────────────────────────────────
const GRADIENTS: Record<string, string> = {
  food:       'linear-gradient(135deg,#c5eadb,#9fdcc3)',
  restaurant: 'linear-gradient(135deg,#EEEDFE,#AFA9EC)',
  fashion:    'linear-gradient(135deg,#FAEEDA,#FAC775)',
  beauty:     'linear-gradient(135deg,#FBEAF0,#ED93B1)',
  herbs:      'linear-gradient(135deg,#EAF3DE,#C0DD97)',
  music:      'linear-gradient(135deg,#FAECE7,#F0997B)',
  crafts:     'linear-gradient(135deg,#E6F1FB,#85B7EB)',
  services:   'linear-gradient(135deg,#F1EFE8,#B4B2A9)',
}

const PLAN_CONFIG: Record<Plan, { label: string; color: string; bg: string }> = {
  free:       { label: 'Free',       color: '#6B7280', bg: '#F3F4F6' },
  premium:    { label: 'Premium',    color: '#1D9E75', bg: '#E1F5EE' },
  storefront: { label: 'Storefront', color: '#085041', bg: '#c5eadb' },
}

// Tab definitions — permission field is the required AdminPermission
// or '__super_admin__' for super-admin-only tabs
const NAV_TABS: {
  id: ActiveTab
  label: string
  icon: React.ElementType
  permission: AdminPermission | '__super_admin__'
}[] = [
  { id: 'businesses', label: 'Businesses', icon: Building2,    permission: 'manage_businesses' },
  { id: 'users',      label: 'Users',      icon: Users,        permission: 'manage_users'      },
  { id: 'reviews',    label: 'Reviews',    icon: MessageSquare,permission: 'moderate_reviews'  },
  { id: 'analytics',  label: 'Analytics',  icon: TrendingUp,   permission: 'view_analytics'    },
  { id: 'revenue',    label: 'Revenue',    icon: DollarSign,   permission: 'view_revenue'      },
  { id: 'audit',      label: 'Audit log',  icon: ClipboardList,permission: 'view_audit_log'    },
  { id: 'admins',     label: 'Admin team',     icon: Shield,       permission: '__super_admin__'   },
  { id: 'announcements', label: 'Announcements', icon: Megaphone,    permission: '__super_admin__'   },
  { id: 'flags',         label: 'Feature flags', icon: Zap,         permission: '__super_admin__'   },
  { id: 'broadcast',     label: 'Send email',    icon: Mail,        permission: '__super_admin__'   },
  { id: 'claims',       label: 'Claims',        icon: Building2,   permission: 'manage_businesses'  },
  { id: 'reports',      label: 'Reports',       icon: Flag,        permission: 'moderate_reviews'   },
]

// ── Component ─────────────────────────────────────────────────────────────
export default function AdminPage() {
  const router   = useRouter()
  const supabase = createClient()
  const { log }  = useAuditLog()
  const { isLoggedIn, isAdmin, isSuperAdmin, hasPermission, loading: authLoading } = useAuth()

  const [businesses, setBusinesses] = useState<Business[]>([])
  const [stats,      setStats]      = useState<Stats>({ totalBusinesses: 0, verifiedCount: 0, premiumCount: 0, storefrontCount: 0 })
  const [loading,    setLoading]    = useState(true)
  const [query,      setQuery]      = useState('')
  const [filterTab,  setFilterTab]  = useState<FilterTab>('all')
  const [activeTab,  setActiveTab]  = useState<ActiveTab>('businesses')
  const [updating,   setUpdating]   = useState<string | null>(null)
  const [deleting,   setDeleting]   = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState<string | null>(null)
  const [planModal,  setPlanModal]  = useState<Business | null>(null)
  const [toast,      setToast]      = useState<string | null>(null)
  const [selected,   setSelected]   = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState('')
  const [bulkLoading,setBulkLoading]= useState(false)
  const [confirmBulk,setConfirmBulk]= useState(false)

  // ── Auth guard ───────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return
    if (!isLoggedIn) { router.replace('/auth/login'); return }
    if (!isAdmin)    { router.replace('/');           return }
    loadAll()
  }, [authLoading, isLoggedIn, isAdmin])

  // ── Helpers ──────────────────────────────────────────────────────────
  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(b => b.id)))
    }
  }

  async function executeBulkAction() {
    if (!bulkAction || selected.size === 0) return
    setBulkLoading(true)

    const ids = [...selected]

    if (bulkAction === 'verify') {
      await supabase.from('businesses').update({ verified: true }).in('id', ids)
      setBusinesses(bs => bs.map(b => ids.includes(b.id) ? { ...b, verified: true } : b))
      await log({ action:'verify_business', entityType:'business', entityName:`Bulk: ${ids.length} businesses`, details:{ count: ids.length } })
      showToast(`✓ ${ids.length} businesses verified`)
    }

    if (bulkAction === 'unverify') {
      await supabase.from('businesses').update({ verified: false }).in('id', ids)
      setBusinesses(bs => bs.map(b => ids.includes(b.id) ? { ...b, verified: false } : b))
      showToast(`${ids.length} businesses unverified`)
    }

    if (bulkAction === 'premium') {
      await supabase.from('businesses').update({ plan:'premium', premium:true }).in('id', ids)
      setBusinesses(bs => bs.map(b => ids.includes(b.id) ? { ...b, plan:'premium' as Plan, premium:true } : b))
      await log({ action:'set_plan', entityType:'plan', entityName:`Bulk: ${ids.length} businesses`, details:{ to:'premium', count: ids.length } })
      showToast(`✓ ${ids.length} businesses set to Premium`)
    }

    if (bulkAction === 'free') {
      await supabase.from('businesses').update({ plan:'free', premium:false, featured:false }).in('id', ids)
      setBusinesses(bs => bs.map(b => ids.includes(b.id) ? { ...b, plan:'free' as Plan, premium:false, featured:false } : b))
      showToast(`${ids.length} businesses downgraded to Free`)
    }

    if (bulkAction === 'delete') {
      await supabase.from('businesses').delete().in('id', ids)
      setBusinesses(bs => bs.filter(b => !ids.includes(b.id)))
      await log({ action:'delete_business', entityType:'business', entityName:`Bulk: ${ids.length} businesses`, details:{ count: ids.length } })
      showToast(`${ids.length} businesses deleted`)
    }

    setSelected(new Set())
    setBulkAction('')
    setConfirmBulk(false)
    setBulkLoading(false)
  }

  function canSeeTab(permission: AdminPermission | '__super_admin__'): boolean {
    if (isSuperAdmin) return true
    if (permission === '__super_admin__') return false
    return hasPermission(permission)
  }

  // ── Data loading ─────────────────────────────────────────────────────
  async function loadAll() {
    setLoading(true)
    const { data } = await supabase
      .from('businesses')
      .select('id,name,category,city,state,country,cover_image,rating,review_count,verified,premium,featured,plan,slug,created_at,owner_id,profiles(name,email)')
      .order('created_at', { ascending: false })

    const allBiz = (data ?? []) as Business[]
    setBusinesses(allBiz)
    setStats({
      totalBusinesses: allBiz.length,
      verifiedCount:   allBiz.filter(b => b.verified).length,
      premiumCount:    allBiz.filter(b => b.plan === 'premium').length,
      storefrontCount: allBiz.filter(b => b.plan === 'storefront').length,
    })
    setLoading(false)
  }

  // ── Business actions ─────────────────────────────────────────────────
  async function toggleVerified(b: Business) {
    setUpdating(b.id + 'verified')
    const next = !b.verified
    const { error } = await supabase.from('businesses').update({ verified: next }).eq('id', b.id)
    if (error) {
      showToast(`Error: ${error.message}`)
    } else {
      setBusinesses(bs => bs.map(x => x.id === b.id ? { ...x, verified: next } : x))
      await log({ action: next ? 'verify_business' : 'unverify_business', entityType: 'business', entityId: b.id, entityName: b.name })
      showToast(`${b.name} ${next ? 'verified' : 'unverified'}`)
    }
    setUpdating(null)
  }

  async function setPlan(id: string, plan: Plan) {
    setUpdating(id + 'plan')
    const biz = businesses.find(b => b.id === id)
    const { error } = await supabase.from('businesses').update({
      plan,
      premium:  plan !== 'free',
      featured: plan === 'storefront',
    }).eq('id', id)

    if (error) {
      showToast(`Error: ${error.message}`)
    } else {
      setBusinesses(bs => bs.map(b => b.id === id ? { ...b, plan, premium: plan !== 'free', featured: plan === 'storefront' } : b))
      await log({ action: 'set_plan', entityType: 'plan', entityId: id, entityName: biz?.name, details: { from: biz?.plan ?? 'free', to: plan } })
      showToast(`Plan updated to ${PLAN_CONFIG[plan].label}`)
    }
    setUpdating(null)
    setPlanModal(null)
  }

  async function deleteBusiness(id: string) {
    setDeleting(id)
    const biz = businesses.find(b => b.id === id)
    const { error } = await supabase.from('businesses').delete().eq('id', id)
    if (error) {
      showToast(`Error: ${error.message}`)
    } else {
      setBusinesses(bs => bs.filter(b => b.id !== id))
      await log({ action: 'delete_business', entityType: 'business', entityId: id, entityName: biz?.name })
      showToast('Business deleted')
    }
    setConfirmDel(null)
    setDeleting(null)
  }

  // ── Filtered businesses ──────────────────────────────────────────────
  const filtered = businesses.filter(b => {
    const q = query.toLowerCase()
    const matchQuery = !query
      || b.name.toLowerCase().includes(q)
      || (b.city ?? '').toLowerCase().includes(q)
      || (b.profiles?.email ?? '').toLowerCase().includes(q)
      || (b.profiles?.name  ?? '').toLowerCase().includes(q)
    const matchTab =
        filterTab === 'all'        ? true
      : filterTab === 'unverified' ? !b.verified
      : filterTab === 'verified'   ? b.verified
      : filterTab === 'premium'    ? b.plan === 'premium'
      : filterTab === 'storefront' ? b.plan === 'storefront'
      : true
    return matchQuery && matchTab
  })

  const FILTER_TABS: { id: FilterTab; label: string; count: number }[] = [
    { id: 'all',        label: 'All',        count: businesses.length },
    { id: 'unverified', label: 'Unverified', count: businesses.filter(b => !b.verified).length },
    { id: 'verified',   label: 'Verified',   count: businesses.filter(b => b.verified).length  },
    { id: 'premium',    label: 'Premium',    count: stats.premiumCount    },
    { id: 'storefront', label: 'Storefront', count: stats.storefrontCount },
  ]

  // ── Loading skeleton ─────────────────────────────────────────────────
  if (authLoading || loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gray-200" style={{ animation: 'shimmer 1.8s ease-in-out infinite' }} />
        <div className="space-y-2">
          <div className="h-6 w-40 bg-gray-200 rounded-lg" style={{ animation: 'shimmer 1.8s ease-in-out infinite' }} />
          <div className="h-3 w-56 bg-gray-200 rounded"    style={{ animation: 'shimmer 1.8s ease-in-out infinite' }} />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="w-5 h-5 bg-gray-200 rounded mb-3" style={{ animation: 'shimmer 1.8s ease-in-out infinite' }} />
            <div className="h-8 w-16 bg-gray-200 rounded mb-2" style={{ animation: 'shimmer 1.8s ease-in-out infinite' }} />
            <div className="h-3 w-24 bg-gray-200 rounded"    style={{ animation: 'shimmer 1.8s ease-in-out infinite' }} />
          </div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes shimmer{0%,100%{opacity:1}50%{opacity:.4}}' }} />
    </div>
  )

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg">
          ✓ {toast}
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#085041' }}>
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin dashboard</h1>
            <p className="text-sm text-gray-400">
              {isSuperAdmin ? 'Super admin · Full access' : 'Admin · Limited access'}
            </p>
          </div>
        </div>
        <Link href="/" className="text-sm text-gray-500 hover:text-green-700 transition-colors">
          ← Back to site
        </Link>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Building2, label: 'Total businesses', value: stats.totalBusinesses, color: '#1D9E75' },
          { icon: BadgeCheck,label: 'Verified',         value: stats.verifiedCount,   color: '#085041' },
          { icon: Crown,     label: 'Premium',          value: stats.premiumCount,    color: '#F59E0B' },
          { icon: Star,      label: 'Storefront',       value: stats.storefrontCount, color: '#8B5CF6' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100">
            <Icon size={17} className="mb-3" style={{ color }} />
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Navigation tabs — permission gated */}
      <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1 mb-6 flex-wrap">
        {NAV_TABS.filter(t => canSeeTab(t.permission)).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={activeTab === id
              ? { background: '#085041', color: 'white' }
              : { color: '#6B7280' }
            }
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}

      {activeTab === 'users'      && <UserManagement />}
      {activeTab === 'reviews'    && <ReviewModeration />}
      {activeTab === 'analytics'  && <PlatformAnalytics />}
      {activeTab === 'revenue'    && <RevenueDashboard />}
      {activeTab === 'audit'      && <AuditLog />}
      {activeTab === 'admins'         && isSuperAdmin && <AdminManagement />}
      {activeTab === 'announcements'  && isSuperAdmin && <AnnouncementManager />}
      {activeTab === 'flags'          && isSuperAdmin && <FeatureFlagsManager />}
      {activeTab === 'broadcast'      && isSuperAdmin && <BroadcastEmail />}
      {activeTab === 'claims'         && <BusinessClaimsManager />}
      {activeTab === 'reports'        && <ReportsQueue />}

      {/* Businesses tab */}
      {activeTab === 'businesses' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 border-b border-amber-200"
              style={{ background:'#FFFBEB' }}>
              <span className="text-sm font-semibold text-amber-800">
                {selected.size} selected
              </span>
              <select
                value={bulkAction}
                onChange={e => setBulkAction(e.target.value)}
                className="text-sm border border-amber-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none"
              >
                <option value="">Choose action…</option>
                <option value="verify">✓ Verify all</option>
                <option value="unverify">✗ Unverify all</option>
                <option value="premium">⭐ Set to Premium</option>
                <option value="free">↓ Downgrade to Free</option>
                <option value="delete">🗑 Delete all</option>
              </select>
              {bulkAction && (
                <button
                  onClick={() => bulkAction === 'delete' ? setConfirmBulk(true) : executeBulkAction()}
                  disabled={bulkLoading}
                  className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-1.5 rounded-lg disabled:opacity-60"
                  style={{ background: bulkAction === 'delete' ? '#EF4444' : '#1D9E75' }}
                >
                  {bulkLoading
                    ? <><Loader2 size={13} className="animate-spin" /> Running…</>
                    : `Apply to ${selected.size}`
                  }
                </button>
              )}
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs text-amber-600 hover:text-amber-800 ml-auto"
              >
                Clear selection
              </button>
            </div>
          )}

          {/* Search + filter tabs */}
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
              <Search size={14} className="text-gray-400 flex-shrink-0" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by name, city, or owner email…"
                className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
              />
              {query && (
                <button onClick={() => setQuery('')}>
                  <X size={13} className="text-gray-400" />
                </button>
              )}
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
              {FILTER_TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setFilterTab(t.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
                  style={filterTab === t.id
                    ? { background: '#1D9E75', color: 'white' }
                    : { color: '#6B7280' }
                  }
                >
                  {t.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filterTab === t.id ? 'bg-white/20 text-white' : 'bg-white text-gray-500'}`}>
                    {t.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Select all row */}
          {filtered.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <input
                type="checkbox"
                checked={selected.size === filtered.length && filtered.length > 0}
                onChange={toggleSelectAll}
                className="rounded accent-green-600 cursor-pointer"
              />
              <span className="text-xs text-gray-500">
                {selected.size > 0
                  ? `${selected.size} of ${filtered.length} selected`
                  : `Select all ${filtered.length} businesses`
                }
              </span>
            </div>
          )}

          {/* Business rows */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Building2 size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No businesses found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map(b => (
                <div key={b.id}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                  style={{ background: selected.has(b.id) ? '#f0faf6' : undefined }}>
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selected.has(b.id)}
                    onChange={() => toggleSelect(b.id)}
                    onClick={e => e.stopPropagation()}
                    className="rounded accent-green-600 cursor-pointer flex-shrink-0"
                  />

                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                    {b.cover_image
                      ? <img src={b.cover_image} alt={b.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full" style={{ background: GRADIENTS[b.category ?? ''] ?? GRADIENTS.services }} />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 truncate">{b.name}</p>
                      {b.verified && <BadgeCheck size={14} style={{ color: '#1D9E75' }} />}
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: PLAN_CONFIG[b.plan ?? 'free'].bg, color: PLAN_CONFIG[b.plan ?? 'free'].color }}
                      >
                        {PLAN_CONFIG[b.plan ?? 'free'].label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {b.category}
                      {b.city  ? ` · ${b.city}` : ''}
                      {b.state ? `, ${b.state}`  : ''}
                      {b.profiles?.name  ? ` · ${b.profiles.name}`  : ''}
                      {b.profiles?.email ? ` (${b.profiles.email})` : ''}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">⭐ {b.rating > 0 ? b.rating.toFixed(1) : '—'}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{b.review_count} reviews</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">
                        {new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">

                    {/* View listing */}
                    <Link
                      href={`/businesses/${b.id}`}
                      target="_blank"
                      title="View listing"
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-green-300 hover:text-green-600 transition-colors"
                    >
                      <Eye size={14} />
                    </Link>

                    {/* Verify toggle */}
                    <button
                      onClick={() => toggleVerified(b)}
                      disabled={updating === b.id + 'verified'}
                      title={b.verified ? 'Remove verification' : 'Verify business'}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors"
                      style={b.verified
                        ? { background: '#E1F5EE', borderColor: '#1D9E75', color: '#1D9E75' }
                        : { borderColor: '#E5E7EB', color: '#9CA3AF' }
                      }
                    >
                      {updating === b.id + 'verified'
                        ? <Loader2 size={13} className="animate-spin" />
                        : <BadgeCheck size={14} />
                      }
                    </button>

                    {/* Plan manager */}
                    <button
                      onClick={() => setPlanModal(b)}
                      disabled={updating === b.id + 'plan'}
                      title="Manage plan"
                      className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors"
                      style={
                        b.plan === 'storefront' ? { background: '#c5eadb', borderColor: '#085041', color: '#085041' }
                        : b.plan === 'premium'  ? { background: '#FEF3C7', borderColor: '#F59E0B', color: '#D97706' }
                        :                         { borderColor: '#E5E7EB', color: '#9CA3AF' }
                      }
                    >
                      {updating === b.id + 'plan'
                        ? <Loader2 size={13} className="animate-spin" />
                        : <Crown size={14} />
                      }
                    </button>

                    {/* Delete */}
                    {confirmDel === b.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => deleteBusiness(b.id)}
                          disabled={deleting === b.id}
                          title="Confirm delete"
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                        >
                          {deleting === b.id
                            ? <Loader2 size={13} className="animate-spin" />
                            : <CheckCircle2 size={14} />
                          }
                        </button>
                        <button
                          onClick={() => setConfirmDel(null)}
                          title="Cancel"
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50"
                        >
                          <XCircle size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDel(b.id)}
                        title="Delete business"
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer count */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-400">
              Showing {filtered.length} of {businesses.length} businesses
            </p>
          </div>
        </div>
      )}

      {/* Bulk delete confirmation modal */}
      {confirmBulk && bulkAction === 'delete' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background:'rgba(0,0,0,0.5)' }}
          onClick={() => setConfirmBulk(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-50">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
              Delete {selected.size} businesses?
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              This will permanently delete <strong>{selected.size} businesses</strong> and all
              their reviews, products, and saved records. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmBulk(false)}
                className="flex-1 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={executeBulkAction} disabled={bulkLoading}
                className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60">
                {bulkLoading ? 'Deleting…' : `Delete ${selected.size}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan management modal */}
      {planModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setPlanModal(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
            style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {planModal.cover_image ? (
                  <img src={planModal.cover_image} alt={planModal.name}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg flex-shrink-0"
                    style={{ background: GRADIENTS[planModal.category ?? ''] ?? GRADIENTS.services }} />
                )}
                <div>
                  <p className="font-semibold text-gray-900">{planModal.name}</p>
                  <p className="text-xs text-gray-400">
                    {planModal.profiles?.email ?? 'No email'} · Current:{' '}
                    <span className="font-medium" style={{ color: PLAN_CONFIG[planModal.plan ?? 'free'].color }}>
                      {PLAN_CONFIG[planModal.plan ?? 'free'].label}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Plan options */}
            <div className="p-6 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
                Set subscription plan
              </p>
              {(['free', 'premium', 'storefront'] as Plan[]).map(plan => {
                const cfg     = PLAN_CONFIG[plan]
                const current = (planModal.plan ?? 'free') === plan
                return (
                  <button
                    key={plan}
                    onClick={() => setPlan(planModal.id, plan)}
                    disabled={current || updating === planModal.id + 'plan'}
                    className="w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left disabled:cursor-not-allowed"
                    style={{
                      borderColor: current ? cfg.color : '#E5E7EB',
                      background:  current ? cfg.bg    : '#FAFAFA',
                      opacity:     updating === planModal.id + 'plan' ? 0.6 : 1,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: cfg.bg }}>
                        <Crown size={15} style={{ color: cfg.color }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{cfg.label}</p>
                        <p className="text-xs text-gray-400">
                          {plan === 'free'       ? 'Basic listing, map pin, reviews'
                          : plan === 'premium'   ? '$29/mo · Products, featured, cover photo'
                          :                        '$49/mo · Custom URL, analytics, verified badge'}
                        </p>
                      </div>
                    </div>
                    {current ? (
                      <span className="text-xs font-medium px-2 py-1 rounded-full text-white" style={{ background: cfg.color }}>
                        Active
                      </span>
                    ) : updating === planModal.id + 'plan' ? (
                      <Loader2 size={16} className="animate-spin text-gray-400" />
                    ) : (
                      <span className="text-xs text-gray-400">Select →</span>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="px-6 pb-5">
              <button
                onClick={() => setPlanModal(null)}
                className="w-full py-2.5 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}