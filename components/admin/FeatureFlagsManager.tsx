'use client'
import { useEffect, useState } from 'react'
import {
  Zap, RefreshCw, Loader2, Shield,
  Map, Star, MessageCircle, Heart,
  ShoppingBag, Search, UserPlus, Mail,
  CreditCard, Building2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'
import { useAuditLog } from '@/lib/useAuditLog'
import { invalidateFlagCache } from '@/lib/useFeatureFlags'

interface Flag {
  id:          string
  key:         string
  name:        string
  description: string | null
  enabled:     boolean
  updated_at:  string
  updated_by:  string | null
}

// Icon mapping per flag key
const FLAG_ICONS: Record<string, React.ElementType> = {
  map_view:         Map,
  reviews:          Star,
  whatsapp_button:  MessageCircle,
  save_businesses:  Heart,
  product_showcase: ShoppingBag,
  algolia_search:   Search,
  signup_enabled:   UserPlus,
  owner_signup:     Building2,
  weekly_emails:    Mail,
  upgrade_modal:    CreditCard,
}

// Group flags by category
const FLAG_GROUPS: { label: string; keys: string[] }[] = [
  {
    label: 'Core features',
    keys: ['map_view', 'reviews', 'save_businesses', 'product_showcase', 'algolia_search'],
  },
  {
    label: 'User acquisition',
    keys: ['signup_enabled', 'owner_signup', 'upgrade_modal'],
  },
  {
    label: 'Communications',
    keys: ['whatsapp_button', 'weekly_emails'],
  },
]

export default function FeatureFlagsManager() {
  const supabase = createClient()
  const { user } = useAuth()
  const { log }  = useAuditLog()

  const [flags,    setFlags]    = useState<Flag[]>([])
  const [loading,  setLoading]  = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [toast,    setToast]    = useState<string | null>(null)

  useEffect(() => { loadFlags() }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function loadFlags() {
    setLoading(true)
    const { data } = await supabase
      .from('feature_flags')
      .select('id, key, name, description, enabled, updated_at, updated_by')
      .order('created_at', { ascending: true })
    setFlags((data ?? []) as Flag[])
    setLoading(false)
  }

  async function toggleFlag(flag: Flag) {
    setToggling(flag.id)
    const next = !flag.enabled

    const { error } = await supabase
      .from('feature_flags')
      .update({
        enabled:    next,
        updated_by: user?.id ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', flag.id)

    if (error) {
      showToast(`Error: ${error.message}`)
    } else {
      setFlags(fs => fs.map(f => f.id === flag.id ? { ...f, enabled: next } : f))
      invalidateFlagCache()
      await log({
        action:     next ? 'feature_enable' as any : 'feature_disable' as any,
        entityType: 'business',
        entityId:   flag.id,
        entityName: flag.name,
        details:    { key: flag.key, enabled: next },
      })
      showToast(`"${flag.name}" ${next ? 'enabled' : 'disabled'}`)
    }
    setToggling(null)
  }

  const enabledCount  = flags.filter(f => f.enabled).length
  const disabledCount = flags.filter(f => !f.enabled).length

  if (loading) return (
    <div className="space-y-6">
      {[1, 2, 3].map(g => (
        <div key={g} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="h-4 w-32 bg-gray-200 rounded" style={{ animation: 'shimmer 1.8s ease-in-out infinite' }} />
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-lg" style={{ animation: 'shimmer 1.8s ease-in-out infinite' }} />
                <div className="space-y-1.5">
                  <div className="h-4 w-40 bg-gray-200 rounded" style={{ animation: 'shimmer 1.8s ease-in-out infinite' }} />
                  <div className="h-3 w-64 bg-gray-200 rounded" style={{ animation: 'shimmer 1.8s ease-in-out infinite' }} />
                </div>
              </div>
              <div className="h-6 w-11 bg-gray-200 rounded-full" style={{ animation: 'shimmer 1.8s ease-in-out infinite' }} />
            </div>
          ))}
        </div>
      ))}
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Feature flags</h3>
          <p className="text-sm text-gray-400 mt-0.5">
            <span className="font-medium text-green-600">{enabledCount} enabled</span>
            {' · '}
            <span className="font-medium text-gray-500">{disabledCount} disabled</span>
            {' · Changes take effect immediately for all users'}
          </p>
        </div>
        <button
          onClick={loadFlags}
          className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border"
        style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
        <Shield size={15} style={{ color: '#D97706', flexShrink: 0, marginTop: 1 }} />
        <p className="text-sm" style={{ color: '#92400E' }}>
          <strong>Caution:</strong> Disabling a feature removes it immediately for all users including paying subscribers.
          Always test in staging before disabling live features.
        </p>
      </div>

      {/* Flag groups */}
      {FLAG_GROUPS.map(group => {
        const groupFlags = group.keys
          .map(key => flags.find(f => f.key === key))
          .filter(Boolean) as Flag[]

        if (groupFlags.length === 0) return null

        return (
          <div key={group.label} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{group.label}</p>
            </div>
            <div className="divide-y divide-gray-50">
              {groupFlags.map(flag => {
                const Icon        = FLAG_ICONS[flag.key] ?? Zap
                const isToggling  = toggling === flag.id

                return (
                  <div key={flag.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: flag.enabled ? '#E1F5EE' : '#F3F4F6',
                        }}
                      >
                        <Icon size={16} style={{ color: flag.enabled ? '#1D9E75' : '#9CA3AF' }} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{flag.name}</p>
                          <code className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">
                            {flag.key}
                          </code>
                        </div>
                        {flag.description && (
                          <p className="text-xs text-gray-400 mt-0.5">{flag.description}</p>
                        )}
                        <p className="text-[11px] text-gray-300 mt-1">
                          Last updated {new Date(flag.updated_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Toggle switch */}
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <span className={`text-xs font-medium ${flag.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                        {flag.enabled ? 'On' : 'Off'}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleFlag(flag)}
                        disabled={isToggling}
                        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50"
                        style={{ background: flag.enabled ? '#1D9E75' : '#E5E7EB' }}
                      >
                        {isToggling ? (
                          <Loader2 size={12} className="animate-spin text-white absolute left-1/2 -translate-x-1/2" />
                        ) : (
                          <span
                            className="inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform"
                            style={{ transform: flag.enabled ? 'translateX(22px)' : 'translateX(2px)' }}
                          />
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Any ungrouped flags */}
      {(() => {
        const groupedKeys = FLAG_GROUPS.flatMap(g => g.keys)
        const ungrouped   = flags.filter(f => !groupedKeys.includes(f.key))
        if (ungrouped.length === 0) return null
        return (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Other</p>
            </div>
            <div className="divide-y divide-gray-50">
              {ungrouped.map(flag => {
                const Icon = FLAG_ICONS[flag.key] ?? Zap
                return (
                  <div key={flag.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: flag.enabled ? '#E1F5EE' : '#F3F4F6' }}>
                        <Icon size={16} style={{ color: flag.enabled ? '#1D9E75' : '#9CA3AF' }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{flag.name}</p>
                        {flag.description && <p className="text-xs text-gray-400">{flag.description}</p>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleFlag(flag)}
                      disabled={toggling === flag.id}
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50"
                      style={{ background: flag.enabled ? '#1D9E75' : '#E5E7EB' }}
                    >
                      <span
                        className="inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform"
                        style={{ transform: flag.enabled ? 'translateX(22px)' : 'translateX(2px)' }}
                      />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}
    </div>
  )
}