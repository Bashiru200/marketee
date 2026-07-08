'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Shield,
  BadgeCheck,
  Search,
  X,
  Trash2,
  TrendingUp,
  Users,
  Building2,
  MessageSquare,
  DollarSign,
  ClipboardList,
  Loader2,
  Eye,
  CheckCircle2,
  XCircle,
  Crown,
  Star,
  Megaphone,
  Zap,
  Mail,
  Flag,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { useAuditLog } from '@/lib/useAuditLog'
import { useAuth } from '@/lib/auth'
import type { AdminPermission } from '@/lib/permissions'

import UserManagement from '@/components/admin/UserManagement'
import ReviewModeration from '@/components/admin/Reviewmoderation'
import PlatformAnalytics from '@/components/admin/Platformanalytics'
import RevenueDashboard from '@/components/admin/RevenueDashboard'
import AuditLog from '@/components/admin/AuditLog'
import AdminManagement from '@/components/admin/AdminManagement'
import AnnouncementManager from '@/components/admin/AnnouncementManager'
import FeatureFlagsManager from '@/components/admin/FeatureFlagsManager'
import BroadcastEmail from '@/components/admin/BroadcastEmail'
import BusinessClaimsManager from '@/components/admin/BusinessClaimsManager'
import ReportsQueue from '@/components/admin/ReportsQueue'
import BetaList from '@/components/admin/BetaList'

type Plan = 'starter' | 'growth' | 'pro_store'
type OldPlan = 'free' | 'premium' | 'storefront'
type FilterTab = 'all' | 'unverified' | 'verified' | 'growth' | 'pro_store'

type ActiveTab =
  | 'businesses'
  | 'users'
  | 'reviews'
  | 'analytics'
  | 'revenue'
  | 'audit'
  | 'admins'
  | 'announcements'
  | 'flags'
  | 'broadcast'
  | 'claims'
  | 'reports'
  | 'beta'

interface Business {
  id: string
  name: string
  category: string | null
  city: string | null
  state: string | null
  country: string | null
  cover_image: string | null
  rating: number
  review_count: number
  verified: boolean
  premium: boolean
  featured: boolean
  plan: Plan | OldPlan | null
  slug: string | null
  created_at: string
  owner_id: string
  profiles: { name: string | null; email: string | null } | null
}

interface Stats {
  totalBusinesses: number
  verifiedCount: number
  growthCount: number
  proStoreCount: number
}

const GRADIENTS: Record<string, string> = {
  food: 'linear-gradient(135deg,#c5eadb,#9fdcc3)',
  restaurant: 'linear-gradient(135deg,#EEEDFE,#AFA9EC)',
  fashion: 'linear-gradient(135deg,#FAEEDA,#FAC775)',
  beauty: 'linear-gradient(135deg,#FBEAF0,#ED93B1)',
  herbs: 'linear-gradient(135deg,#EAF3DE,#C0DD97)',
  music: 'linear-gradient(135deg,#FAECE7,#F0997B)',
  crafts: 'linear-gradient(135deg,#E6F1FB,#85B7EB)',
  services: 'linear-gradient(135deg,#F1EFE8,#B4B2A9)',
}

const PLAN_CONFIG: Record<
  Plan,
  {
    label: string
    color: string
    bg: string
    description: string
  }
> = {
  starter: {
    label: 'Starter',
    color: '#6B7280',
    bg: '#F3F4F6',
    description: 'Free listing, map pin, reviews',
  },
  growth: {
    label: 'Growth',
    color: '#1D9E75',
    bg: '#E1F5EE',
    description: '$29/mo · Featured search, photos, products, analytics',
  },
  pro_store: {
    label: 'Pro Store',
    color: '#085041',
    bg: '#c5eadb',
    description: '$49/mo · Custom URL, enquiries, promotions, full storefront',
  },
}

const NAV_TABS: {
  id: ActiveTab
  label: string
  icon: React.ElementType
  permission: AdminPermission | '__super_admin__'
}[] = [
  { id: 'businesses', label: 'Businesses', icon: Building2, permission: 'manage_businesses' },
  { id: 'users', label: 'Users', icon: Users, permission: 'manage_users' },
  { id: 'reviews', label: 'Reviews', icon: MessageSquare, permission: 'moderate_reviews' },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp, permission: 'view_analytics' },
  { id: 'revenue', label: 'Revenue', icon: DollarSign, permission: 'view_revenue' },
  { id: 'audit', label: 'Audit log', icon: ClipboardList, permission: 'view_audit_log' },
  { id: 'admins', label: 'Admin team', icon: Shield, permission: '__super_admin__' },
  { id: 'announcements', label: 'Announcements', icon: Megaphone, permission: '__super_admin__' },
  { id: 'flags', label: 'Feature flags', icon: Zap, permission: '__super_admin__' },
  { id: 'broadcast', label: 'Send email', icon: Mail, permission: '__super_admin__' },
  { id: 'claims', label: 'Claims', icon: Building2, permission: 'manage_businesses' },
  { id: 'reports', label: 'Reports', icon: Flag, permission: 'moderate_reviews' },
  { id: 'beta', label: 'Beta & Waitlist', icon: Users, permission: '__super_admin__' },
]

function normalizePlan(plan: Business['plan']): Plan {
  if (plan === 'premium') return 'growth'
  if (plan === 'storefront') return 'pro_store'
  if (plan === 'free') return 'starter'
  return plan ?? 'starter'
}

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const { log } = useAuditLog()

  const {
    isLoggedIn,
    isAdmin,
    isSuperAdmin,
    hasPermission,
    loading: authLoading,
  } = useAuth()

  const [businesses, setBusinesses] = useState<Business[]>([])
  const [stats, setStats] = useState<Stats>({
    totalBusinesses: 0,
    verifiedCount: 0,
    growthCount: 0,
    proStoreCount: 0,
  })

  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filterTab, setFilterTab] = useState<FilterTab>('all')
  const [activeTab, setActiveTab] = useState<ActiveTab>('businesses')
  const [updating, setUpdating] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState<string | null>(null)
  const [planModal, setPlanModal] = useState<Business | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)
  const [confirmBulk, setConfirmBulk] = useState(false)

  useEffect(() => {
    if (authLoading) return

    if (!isLoggedIn) {
      router.replace('/auth/login')
      return
    }

    if (!isAdmin) {
      router.replace('/')
      return
    }

    loadAll()
  }, [authLoading, isLoggedIn, isAdmin])

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  function canSeeTab(tab: (typeof NAV_TABS)[number]) {
    if (isSuperAdmin) return true
    if (tab.permission === '__super_admin__') return false
    return hasPermission(tab.permission)
  }

  function computeStats(rows: Business[]) {
    setStats({
      totalBusinesses: rows.length,
      verifiedCount: rows.filter((b) => b.verified).length,
      growthCount: rows.filter((b) => normalizePlan(b.plan) === 'growth').length,
      proStoreCount: rows.filter((b) => normalizePlan(b.plan) === 'pro_store').length,
    })
  }

  async function loadAll() {
    setLoading(true)

    const { data, error } = await supabase
      .from('businesses')
      .select(
        `
        id,
        name,
        category,
        city,
        state,
        country,
        cover_image,
        rating,
        review_count,
        verified,
        premium,
        featured,
        plan,
        slug,
        created_at,
        owner_id,
        profiles(name,email)
      `
      )
      .order('created_at', { ascending: false })

    if (error) {
      showToast(`Error loading businesses: ${error.message}`)
      setLoading(false)
      return
    }

    const rows = (data ?? []) as unknown as Business[]
    setBusinesses(rows)
    computeStats(rows)
    setLoading(false)
  }

  const filtered = useMemo(() => {
    return businesses.filter((b) => {
      const q = query.toLowerCase()
      const plan = normalizePlan(b.plan)

      const matchQuery =
        !query ||
        b.name.toLowerCase().includes(q) ||
        (b.city ?? '').toLowerCase().includes(q) ||
        (b.profiles?.email ?? '').toLowerCase().includes(q) ||
        (b.profiles?.name ?? '').toLowerCase().includes(q)

      const matchTab =
        filterTab === 'all'
          ? true
          : filterTab === 'unverified'
            ? !b.verified
            : filterTab === 'verified'
              ? b.verified
              : filterTab === 'growth'
                ? plan === 'growth'
                : filterTab === 'pro_store'
                  ? plan === 'pro_store'
                  : true

      return matchQuery && matchTab
    })
  }, [businesses, query, filterTab])

  const FILTER_TABS: { id: FilterTab; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: businesses.length },
    {
      id: 'unverified',
      label: 'Unverified',
      count: businesses.filter((b) => !b.verified).length,
    },
    {
      id: 'verified',
      label: 'Verified',
      count: businesses.filter((b) => b.verified).length,
    },
    { id: 'growth', label: 'Growth', count: stats.growthCount },
    { id: 'pro_store', label: 'Pro Store', count: stats.proStoreCount },
  ]

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((b) => b.id)))
    }
  }

  async function executeBulkAction() {
    if (!bulkAction || selected.size === 0) return

    setBulkLoading(true)

    const ids = Array.from(selected)

    try {
      if (bulkAction === 'verify') {
        const { error } = await supabase
          .from('businesses')
          .update({ verified: true })
          .in('id', ids)

        if (error) throw error

        setBusinesses((rows) =>
          rows.map((b) => (ids.includes(b.id) ? { ...b, verified: true } : b))
        )

        await log({
          action: 'verify_business',
          entityType: 'business',
          entityName: `Bulk: ${ids.length}`,
          details: { count: ids.length },
        })

        showToast(`${ids.length} businesses verified`)
      }

      if (bulkAction === 'unverify') {
        const { error } = await supabase
          .from('businesses')
          .update({ verified: false })
          .in('id', ids)

        if (error) throw error

        setBusinesses((rows) =>
          rows.map((b) => (ids.includes(b.id) ? { ...b, verified: false } : b))
        )

        showToast(`${ids.length} businesses unverified`)
      }

      if (bulkAction === 'growth') {
        const { error } = await supabase
          .from('businesses')
          .update({ plan: 'growth', premium: true, featured: true })
          .in('id', ids)

        if (error) throw error

        setBusinesses((rows) =>
          rows.map((b) =>
            ids.includes(b.id)
              ? { ...b, plan: 'growth', premium: true, featured: true }
              : b
          )
        )

        await log({
          action: 'set_plan',
          entityType: 'plan',
          entityName: `Bulk: ${ids.length}`,
          details: { to: 'growth', count: ids.length },
        })

        showToast(`${ids.length} businesses set to Growth`)
      }

      if (bulkAction === 'starter') {
        const { error } = await supabase
          .from('businesses')
          .update({ plan: 'starter', premium: false, featured: false })
          .in('id', ids)

        if (error) throw error

        setBusinesses((rows) =>
          rows.map((b) =>
            ids.includes(b.id)
              ? { ...b, plan: 'starter', premium: false, featured: false }
              : b
          )
        )

        showToast(`${ids.length} businesses moved to Starter`)
      }

      if (bulkAction === 'pro_store') {
        const { error } = await supabase
          .from('businesses')
          .update({ plan: 'pro_store', premium: true, featured: true })
          .in('id', ids)

        if (error) throw error

        setBusinesses((rows) =>
          rows.map((b) =>
            ids.includes(b.id)
              ? { ...b, plan: 'pro_store', premium: true, featured: true }
              : b
          )
        )

        await log({
          action: 'set_plan',
          entityType: 'plan',
          entityName: `Bulk: ${ids.length}`,
          details: { to: 'pro_store', count: ids.length },
        })

        showToast(`${ids.length} businesses set to Pro Store`)
      }

      if (bulkAction === 'delete') {
        const { error } = await supabase.from('businesses').delete().in('id', ids)

        if (error) throw error

        setBusinesses((rows) => rows.filter((b) => !ids.includes(b.id)))

        await log({
          action: 'delete_business',
          entityType: 'business',
          entityName: `Bulk: ${ids.length}`,
          details: { count: ids.length },
        })

        showToast(`${ids.length} businesses deleted`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bulk action failed'
      showToast(`Error: ${message}`)
    }

    setSelected(new Set())
    setBulkAction('')
    setConfirmBulk(false)
    setBulkLoading(false)
  }

  async function toggleVerified(business: Business) {
    setUpdating(`${business.id}:verified`)

    const next = !business.verified

    const { error } = await supabase
      .from('businesses')
      .update({ verified: next })
      .eq('id', business.id)

    if (error) {
      showToast(`Error: ${error.message}`)
    } else {
      setBusinesses((rows) =>
        rows.map((b) => (b.id === business.id ? { ...b, verified: next } : b))
      )

      await log({
        action: next ? 'verify_business' : 'unverify_business',
        entityType: 'business',
        entityId: business.id,
        entityName: business.name,
      })

      showToast(`${business.name} ${next ? 'verified' : 'unverified'}`)
    }

    setUpdating(null)
  }

  async function setPlan(id: string, plan: Plan) {
    setUpdating(`${id}:plan`)

    const business = businesses.find((b) => b.id === id)

    const { error } = await supabase
      .from('businesses')
      .update({
        plan,
        premium: plan !== 'starter',
        featured: plan === 'growth' || plan === 'pro_store',
      })
      .eq('id', id)

    if (error) {
      showToast(`Error: ${error.message}`)
    } else {
      setBusinesses((rows) =>
        rows.map((b) =>
          b.id === id
            ? {
                ...b,
                plan,
                premium: plan !== 'starter',
                featured: plan === 'growth' || plan === 'pro_store',
              }
            : b
        )
      )

      await log({
        action: 'set_plan',
        entityType: 'plan',
        entityId: id,
        entityName: business?.name,
        details: {
          from: normalizePlan(business?.plan ?? null),
          to: plan,
        },
      })

      showToast(`Plan updated to ${PLAN_CONFIG[plan].label}`)
    }

    setUpdating(null)
    setPlanModal(null)
  }

  async function deleteBusiness(id: string) {
    setDeleting(id)

    const business = businesses.find((b) => b.id === id)

    const { error } = await supabase.from('businesses').delete().eq('id', id)

    if (error) {
      showToast(`Error: ${error.message}`)
    } else {
      setBusinesses((rows) => rows.filter((b) => b.id !== id))

      await log({
        action: 'delete_business',
        entityType: 'business',
        entityId: id,
        entityName: business?.name,
      })

      showToast('Business deleted')
    }

    setConfirmDel(null)
    setDeleting(null)
  }

  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 size={18} className="animate-spin" />
          Loading admin dashboard...
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: '#085041' }}
          >
            <Shield size={20} className="text-white" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin dashboard</h1>
            <p className="text-sm text-gray-400">
              {isSuperAdmin ? 'Super admin · Full access' : 'Admin · Limited access'}
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-green-700 transition-colors"
        >
          ← Back to site
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            icon: Building2,
            label: 'Total businesses',
            value: stats.totalBusinesses,
            color: '#1D9E75',
          },
          {
            icon: BadgeCheck,
            label: 'Verified',
            value: stats.verifiedCount,
            color: '#085041',
          },
          {
            icon: Crown,
            label: 'Growth',
            value: stats.growthCount,
            color: '#F59E0B',
          },
          {
            icon: Star,
            label: 'Pro Store',
            value: stats.proStoreCount,
            color: '#8B5CF6',
          },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100">
            <Icon size={17} className="mb-3" style={{ color }} />
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1 mb-6 flex-wrap">
        {NAV_TABS.filter((tab) => canSeeTab(tab)).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={
              activeTab === id
                ? { background: '#085041', color: 'white' }
                : { color: '#6B7280' }
            }
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'users' && <UserManagement />}
      {activeTab === 'reviews' && <ReviewModeration />}
      {activeTab === 'analytics' && <PlatformAnalytics />}
      {activeTab === 'revenue' && <RevenueDashboard />}
      {activeTab === 'audit' && <AuditLog />}
      {activeTab === 'admins' && isSuperAdmin && <AdminManagement />}
      {activeTab === 'announcements' && isSuperAdmin && <AnnouncementManager />}
      {activeTab === 'flags' && isSuperAdmin && <FeatureFlagsManager />}
      {activeTab === 'broadcast' && isSuperAdmin && <BroadcastEmail />}
      {activeTab === 'claims' && <BusinessClaimsManager />}
      {activeTab === 'reports' && <ReportsQueue />}
      {activeTab === 'beta' && <BetaList />}

      {activeTab === 'businesses' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {selected.size > 0 && (
            <div
              className="flex items-center gap-3 px-4 py-3 border-b border-amber-200"
              style={{ background: '#FFFBEB' }}
            >
              <span className="text-sm font-semibold text-amber-800">
                {selected.size} selected
              </span>

              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="text-sm border border-amber-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none"
              >
                <option value="">Choose action...</option>
                <option value="verify">Verify all</option>
                <option value="unverify">Unverify all</option>
                <option value="growth">Set to Growth</option>
                <option value="pro_store">Set to Pro Store</option>
                <option value="starter">Move to Starter</option>
                <option value="delete">Delete all</option>
              </select>

              {bulkAction && (
                <button
                  type="button"
                  onClick={() =>
                    bulkAction === 'delete' ? setConfirmBulk(true) : executeBulkAction()
                  }
                  disabled={bulkLoading}
                  className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-1.5 rounded-lg disabled:opacity-60"
                  style={{ background: bulkAction === 'delete' ? '#EF4444' : '#1D9E75' }}
                >
                  {bulkLoading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Running...
                    </>
                  ) : (
                    `Apply to ${selected.size}`
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="text-xs text-amber-600 hover:text-amber-800 ml-auto"
              >
                Clear selection
              </button>
            </div>
          )}

          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
              <Search size={14} className="text-gray-400 flex-shrink-0" />

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, city, or owner email..."
                className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
              />

              {query && (
                <button type="button" onClick={() => setQuery('')}>
                  <X size={13} className="text-gray-400" />
                </button>
              )}
            </div>

            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTab(tab.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
                  style={
                    filterTab === tab.id
                      ? { background: '#1D9E75', color: 'white' }
                      : { color: '#6B7280' }
                  }
                >
                  {tab.label}
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      filterTab === tab.id ? 'bg-white/20 text-white' : 'bg-white text-gray-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

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
                  : `Select all ${filtered.length} businesses`}
              </span>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Building2 size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No businesses found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((business) => {
                const plan = normalizePlan(business.plan)
                const config = PLAN_CONFIG[plan]

                return (
                  <div
                    key={business.id}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                    style={{
                      background: selected.has(business.id) ? '#f0faf6' : undefined,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(business.id)}
                      onChange={() => toggleSelect(business.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded accent-green-600 cursor-pointer flex-shrink-0"
                    />

                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                      {business.cover_image ? (
                        <img
                          src={business.cover_image}
                          alt={business.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full"
                          style={{
                            background:
                              GRADIENTS[business.category ?? ''] ?? GRADIENTS.services,
                          }}
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {business.name}
                        </p>

                        {business.verified && (
                          <BadgeCheck size={14} style={{ color: '#1D9E75' }} />
                        )}

                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: config.bg, color: config.color }}
                        >
                          {config.label}
                        </span>
                      </div>

                      <p className="text-xs text-gray-400 truncate">
                        {business.category}
                        {business.city ? ` · ${business.city}` : ''}
                        {business.state ? `, ${business.state}` : ''}
                        {business.profiles?.name ? ` · ${business.profiles.name}` : ''}
                        {business.profiles?.email ? ` (${business.profiles.email})` : ''}
                      </p>

                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">
                          ⭐ {business.rating > 0 ? business.rating.toFixed(1) : '—'}
                        </span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">
                          {business.review_count} reviews
                        </span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">
                          {new Date(business.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Link
                        href={`/businesses/${business.id}`}
                        target="_blank"
                        title="View listing"
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-green-300 hover:text-green-600 transition-colors"
                      >
                        <Eye size={14} />
                      </Link>

                      <button
                        type="button"
                        onClick={() => toggleVerified(business)}
                        disabled={updating === `${business.id}:verified`}
                        title={business.verified ? 'Remove verification' : 'Verify business'}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors"
                        style={
                          business.verified
                            ? {
                                background: '#E1F5EE',
                                borderColor: '#1D9E75',
                                color: '#1D9E75',
                              }
                            : { borderColor: '#E5E7EB', color: '#9CA3AF' }
                        }
                      >
                        {updating === `${business.id}:verified` ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <BadgeCheck size={14} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setPlanModal(business)}
                        disabled={updating === `${business.id}:plan`}
                        title="Manage plan"
                        className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors"
                        style={{
                          background: config.bg,
                          borderColor: config.color,
                          color: config.color,
                        }}
                      >
                        {updating === `${business.id}:plan` ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Crown size={14} />
                        )}
                      </button>

                      {confirmDel === business.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => deleteBusiness(business.id)}
                            disabled={deleting === business.id}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                          >
                            {deleting === business.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={14} />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setConfirmDel(null)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50"
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDel(business.id)}
                          title="Delete business"
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-400">
              Showing {filtered.length} of {businesses.length} businesses
            </p>
          </div>
        </div>
      )}

      {confirmBulk && bulkAction === 'delete' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setConfirmBulk(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-50">
              <Trash2 size={22} className="text-red-500" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
              Delete {selected.size} businesses?
            </h3>

            <p className="text-sm text-gray-500 text-center mb-6">
              This will permanently delete <strong>{selected.size} businesses</strong>.
              This cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmBulk(false)}
                className="flex-1 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={executeBulkAction}
                disabled={bulkLoading}
                className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60"
              >
                {bulkLoading ? 'Deleting...' : `Delete ${selected.size}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {planModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setPlanModal(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
            style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {planModal.cover_image ? (
                  <img
                    src={planModal.cover_image}
                    alt={planModal.name}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-lg flex-shrink-0"
                    style={{
                      background:
                        GRADIENTS[planModal.category ?? ''] ?? GRADIENTS.services,
                    }}
                  />
                )}

                <div>
                  <p className="font-semibold text-gray-900">{planModal.name}</p>
                  <p className="text-xs text-gray-400">
                    {planModal.profiles?.email ?? 'No email'} · Current:{' '}
                    <span
                      className="font-medium"
                      style={{ color: PLAN_CONFIG[normalizePlan(planModal.plan)].color }}
                    >
                      {PLAN_CONFIG[normalizePlan(planModal.plan)].label}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
                Set subscription plan
              </p>

              {(['starter', 'growth', 'pro_store'] as Plan[]).map((plan) => {
                const config = PLAN_CONFIG[plan]
                const current = normalizePlan(planModal.plan) === plan

                return (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => setPlan(planModal.id, plan)}
                    disabled={current || updating === `${planModal.id}:plan`}
                    className="w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left disabled:cursor-not-allowed"
                    style={{
                      borderColor: current ? config.color : '#E5E7EB',
                      background: current ? config.bg : '#FAFAFA',
                      opacity: updating === `${planModal.id}:plan` ? 0.6 : 1,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: config.bg }}
                      >
                        <Crown size={15} style={{ color: config.color }} />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {config.label}
                        </p>
                        <p className="text-xs text-gray-400">{config.description}</p>
                      </div>
                    </div>

                    {current ? (
                      <span
                        className="text-xs font-medium px-2 py-1 rounded-full text-white"
                        style={{ background: config.color }}
                      >
                        Active
                      </span>
                    ) : updating === `${planModal.id}:plan` ? (
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
                type="button"
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