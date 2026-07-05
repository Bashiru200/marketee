'use client'
import { useEffect, useState } from 'react'
import {
  ClipboardList, Search, X, Filter,
  BadgeCheck, Trash2, Flag, Crown,
  Ban, Key, Shield, RefreshCw, User,
  Building2, MessageSquare, ChevronDown,
  ChevronUp, Clock
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AuditEntry {
  id:          string
  admin_id:    string | null
  action:      string
  entity_type: string
  entity_id:   string | null
  entity_name: string | null
  details:     Record<string, unknown> | null
  created_at:  string
  profiles:    { name: string | null; email: string | null; avatar_url: string | null } | null
}

const ACTION_META: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  verify_business:     { label:'Verified business',     color:'#1D9E75', bg:'#E1F5EE', icon:BadgeCheck   },
  unverify_business:   { label:'Unverified business',   color:'#6B7280', bg:'#F3F4F6', icon:BadgeCheck   },
  set_plan:            { label:'Set plan',              color:'#085041', bg:'#c5eadb', icon:Crown        },
  downgrade_plan:      { label:'Downgraded plan',       color:'#D97706', bg:'#FEF3C7', icon:Crown        },
  delete_business:     { label:'Deleted business',      color:'#EF4444', bg:'#FEE2E2', icon:Trash2       },
  suspend_business:    { label:'Suspended business',    color:'#EF4444', bg:'#FEE2E2', icon:Building2    },
  unsuspend_business:  { label:'Unsuspended business',  color:'#1D9E75', bg:'#E1F5EE', icon:Building2    },
  ban_user:            { label:'Banned user',           color:'#EF4444', bg:'#FEE2E2', icon:Ban          },
  unban_user:          { label:'Unbanned user',         color:'#1D9E75', bg:'#E1F5EE', icon:Ban          },
  make_admin:          { label:'Granted admin',         color:'#D97706', bg:'#FEF3C7', icon:Shield       },
  remove_admin:        { label:'Removed admin',         color:'#6B7280', bg:'#F3F4F6', icon:Shield       },
  reset_password:      { label:'Password reset sent',   color:'#8B5CF6', bg:'#EDE9FE', icon:Key          },
  delete_review:       { label:'Deleted review',        color:'#EF4444', bg:'#FEE2E2', icon:Trash2       },
  flag_review:         { label:'Flagged review',        color:'#D97706', bg:'#FEF3C7', icon:Flag         },
  unflag_review:       { label:'Unflagged review',      color:'#6B7280', bg:'#F3F4F6', icon:Flag         },
  feature_business:    { label:'Featured business',     color:'#F59E0B', bg:'#FEF3C7', icon:Crown        },
  unfeature_business:  { label:'Unfeatured business',   color:'#6B7280', bg:'#F3F4F6', icon:Crown        },
}

const ENTITY_ICONS: Record<string, React.ElementType> = {
  business: Building2,
  user:     User,
  review:   MessageSquare,
  plan:     Crown,
}

type FilterType = 'all' | 'business' | 'user' | 'review'

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)  return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  < 7)  return `${days}d ago`
  return new Date(date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
}

export default function AuditLog() {
  const supabase = createClient()

  const [entries,  setEntries]  = useState<AuditEntry[]>([])
  const [loading,  setLoading]  = useState(true)
  const [query,    setQuery]    = useState('')
  const [filter,   setFilter]   = useState<FilterType>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [page,     setPage]     = useState(0)
  const PAGE_SIZE = 50

  useEffect(() => { loadEntries() }, [page])

  async function loadEntries() {
    setLoading(true)
    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, admin_id, action, entity_type, entity_id, entity_name, details, created_at, profiles(name, email, avatar_url)')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (error) { console.error('[audit log]', error); setLoading(false); return }
    if (page === 0) {
      setEntries((data ?? []) as AuditEntry[])
    } else {
      setEntries(prev => [...prev, ...(data ?? []) as AuditEntry[]])
    }
    setLoading(false)
  }

  async function refresh() {
    setPage(0)
    setLoading(true)
    const { data } = await supabase
      .from('audit_logs')
      .select('id, admin_id, action, entity_type, entity_id, entity_name, details, created_at, profiles(name, email, avatar_url)')
      .order('created_at', { ascending: false })
      .range(0, PAGE_SIZE - 1)
    setEntries((data ?? []) as AuditEntry[])
    setLoading(false)
  }

  const filtered = entries.filter(e => {
    const q  = query.toLowerCase()
    const mq = !query
      || (e.entity_name ?? '').toLowerCase().includes(q)
      || (e.action ?? '').toLowerCase().includes(q)
      || (e.profiles?.name  ?? '').toLowerCase().includes(q)
      || (e.profiles?.email ?? '').toLowerCase().includes(q)
    const mf = filter === 'all' ? true : e.entity_type === filter
    return mq && mf
  })

  // Group by date
  const grouped: { date: string; entries: AuditEntry[] }[] = []
  filtered.forEach(e => {
    const date = new Date(e.created_at).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})
    const last  = grouped[grouped.length - 1]
    if (last && last.date === date) {
      last.entries.push(e)
    } else {
      grouped.push({ date, entries: [e] })
    }
  })

  const FILTERS: { id: FilterType; label: string }[] = [
    { id:'all',      label:'All activity' },
    { id:'business', label:'Businesses'   },
    { id:'user',     label:'Users'        },
    { id:'review',   label:'Reviews'      },
  ]

  if (loading && page === 0) return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="h-5 w-32 bg-gray-200 rounded" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
      </div>
      {[1,2,3,4,5,6,7,8].map(i => (
        <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-50">
          <div className="w-8 h-8 rounded-lg bg-gray-200 flex-shrink-0" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-64 bg-gray-200 rounded" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
            <div className="h-3 w-40 bg-gray-200 rounded" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
          </div>
          <div className="h-3 w-16 bg-gray-200 rounded" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
        </div>
      ))}
      <style dangerouslySetInnerHTML={{ __html: '@keyframes shimmer{0%,100%{opacity:1}50%{opacity:.4}}' }} />
    </div>
  )

  return (
    <div className="space-y-4">

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search by action, entity or admin"
            className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400" />
          {query && <button onClick={() => setQuery('')}><X size={13} className="text-gray-400" /></button>}
        </div>
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
              style={filter === f.id
                ? { background:'#085041', color:'white' }
                : { color:'#6B7280' }}>
              {f.label}
            </button>
          ))}
        </div>
        <button onClick={refresh} disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Log entries grouped by day */}
      {grouped.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 text-center py-16">
          <ClipboardList size={32} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm text-gray-400">No audit log entries yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Actions you take in the admin dashboard will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ date, entries: dayEntries }) => (
            <div key={date} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Date header */}
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <Clock size={12} className="text-gray-400" />
                <p className="text-xs font-semibold text-gray-500">{date}</p>
                <span className="text-xs text-gray-400 ml-auto">
                  {dayEntries.length} action{dayEntries.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Entries */}
              <div className="divide-y divide-gray-50">
                {dayEntries.map(e => {
                  const meta       = ACTION_META[e.action] ?? { label: e.action, color:'#6B7280', bg:'#F3F4F6', icon: ClipboardList }
                  const EntityIcon = ENTITY_ICONS[e.entity_type] ?? ClipboardList
                  const isExpanded = expanded === e.id

                  return (
                    <div key={e.id} className="hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3 p-4">

                        {/* Action icon */}
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: meta.bg }}>
                          <meta.icon size={14} style={{ color: meta.color }} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-gray-900">{meta.label}</span>
                            {e.entity_name && (
                              <>
                                <span className="text-xs text-gray-400">on</span>
                                <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                                  <EntityIcon size={11} className="text-gray-400" />
                                  {e.entity_name}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {/* Admin who did it */}
                            {e.profiles ? (
                              <div className="flex items-center gap-1.5">
                                {e.profiles.avatar_url ? (
                                  <img src={e.profiles.avatar_url} alt=""
                                    className="w-4 h-4 rounded-full object-cover" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                                    style={{ background:'#085041' }}>
                                    {(e.profiles.name ?? e.profiles.email ?? '?')[0].toUpperCase()}
                                  </div>
                                )}
                                <span className="text-xs text-gray-400">
                                  {e.profiles.name ?? e.profiles.email}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">System</span>
                            )}
                            <span className="text-gray-300 text-xs">·</span>
                            <span className="text-xs text-gray-400">{timeAgo(e.created_at)}</span>
                          </div>
                        </div>

                        {/* Details toggle */}
                        {e.details && Object.keys(e.details).length > 0 && (
                          <button
                            onClick={() => setExpanded(isExpanded ? null : e.id)}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                          >
                            Details
                            {isExpanded
                              ? <ChevronUp  size={12} />
                              : <ChevronDown size={12} />
                            }
                          </button>
                        )}
                      </div>

                      {/* Expanded details */}
                      {isExpanded && e.details && (
                        <div className="mx-4 mb-4 bg-gray-50 rounded-xl p-4">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Details</p>
                          <div className="space-y-1">
                            {Object.entries(e.details).map(([key, val]) => (
                              <div key={key} className="flex items-start gap-3">
                                <span className="text-xs font-medium text-gray-500 capitalize w-24 flex-shrink-0">
                                  {key.replace(/_/g, ' ')}
                                </span>
                                <span className="text-xs text-gray-700 break-all">
                                  {String(val)}
                                </span>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-400 mt-3 font-mono">
                            ID: {e.entity_id ?? '—'}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Load more */}
          {entries.length === (page + 1) * PAGE_SIZE && (
            <div className="text-center">
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={loading}
                className="text-sm font-medium px-6 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 text-gray-600"
              >
                {loading ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Showing {filtered.length} entries · Paginated at {PAGE_SIZE} per page
      </p>
    </div>
  )
}