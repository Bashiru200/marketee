'use client'
import { useEffect, useState } from 'react'
import {
  Flag, Search, X, Eye, CheckCircle2,
  XCircle, Loader2, Building2, MessageSquare,
  AlertTriangle, Clock
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'
import Link from 'next/link'

interface Report {
  id:          string
  entity_type: 'business' | 'review'
  entity_id:   string
  reason:      string
  details:     string | null
  status:      'pending' | 'reviewed' | 'dismissed'
  created_at:  string
  reviewed_at: string | null
  reported_by: { name: string | null; email: string | null } | null
  // Joined entity info
  business?:   { id: string; name: string; cover_image: string | null } | null
  review?:     { id: string; body: string | null; rating: number; businesses: { name: string } | null } | null
}

const REASON_LABELS: Record<string, string> = {
  spam:          'Spam or fake listing',
  fake:          'Fake reviews',
  inappropriate: 'Inappropriate content',
  wrong_info:    'Wrong information',
  offensive:     'Offensive or harmful',
  other:         'Other',
}

const STATUS_STYLES = {
  pending:  { label:'Pending',   color:'#D97706', bg:'#FEF3C7', icon:Clock         },
  reviewed: { label:'Reviewed',  color:'#1D9E75', bg:'#E1F5EE', icon:CheckCircle2  },
  dismissed:{ label:'Dismissed', color:'#6B7280', bg:'#F3F4F6', icon:XCircle       },
}

export default function ReportsQueue() {
  const supabase = createClient()
  const { user } = useAuth()

  const [reports,  setReports]  = useState<Report[]>([])
  const [loading,  setLoading]  = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [toast,    setToast]    = useState<string | null>(null)
  const [filter,   setFilter]   = useState<'all' | 'pending' | 'reviewed' | 'dismissed'>('pending')
  const [query,    setQuery]    = useState('')

  useEffect(() => { loadReports() }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function loadReports() {
    setLoading(true)

    const { data: rawReports } = await supabase
      .from('reports')
      .select('id, entity_type, entity_id, reason, details, status, created_at, reviewed_at, reported_by:profiles(name, email)')
      .order('created_at', { ascending: false })

    if (!rawReports) { setLoading(false); return }

    // Fetch entity details for each report
    const enriched = await Promise.all(rawReports.map(async (r: any) => {
      if (r.entity_type === 'business') {
        const { data: biz } = await supabase
          .from('businesses')
          .select('id, name, cover_image')
          .eq('id', r.entity_id)
          .single()
        return { ...r, business: biz }
      } else {
        const { data: rev } = await supabase
          .from('reviews')
          .select('id, body, rating, businesses(name)')
          .eq('id', r.entity_id)
          .single()
        return { ...r, review: rev }
      }
    }))

    setReports(enriched as Report[])
    setLoading(false)
  }

  async function updateStatus(report: Report, status: 'reviewed' | 'dismissed') {
    setUpdating(report.id + status)

    const { error } = await supabase
      .from('reports')
      .update({
        status,
        reviewed_by: user?.id ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', report.id)

    if (error) {
      showToast(`Error: ${error.message}`)
    } else {
      setReports(rs => rs.map(r => r.id === report.id
        ? { ...r, status, reviewed_at: new Date().toISOString() }
        : r
      ))
      showToast(status === 'reviewed' ? 'Marked as reviewed' : 'Report dismissed')
    }
    setUpdating(null)
  }

  const pendingCount = reports.filter(r => r.status === 'pending').length

  const filtered = reports.filter(r => {
    const mf = filter === 'all' ? true : r.status === filter
    const mq = !query
      || (r.business?.name  ?? '').toLowerCase().includes(query.toLowerCase())
      || (r.review?.businesses?.name ?? '').toLowerCase().includes(query.toLowerCase())
      || REASON_LABELS[r.reason].toLowerCase().includes(query.toLowerCase())
      || (r.reported_by?.email ?? '').toLowerCase().includes(query.toLowerCase())
    return mf && mq
  })

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3,4].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-200 rounded-xl flex-shrink-0" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 bg-gray-200 rounded" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
            <div className="h-3 w-64 bg-gray-200 rounded" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
          </div>
        </div>
      ))}
      <style dangerouslySetInnerHTML={{ __html:'@keyframes shimmer{0%,100%{opacity:1}50%{opacity:.4}}' }} />
    </div>
  )

  return (
    <div className="space-y-6">

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg">
          ✓ {toast}
        </div>
      )}

      {/* Header */}
      <div>
        <h3 className="font-semibold text-gray-900">Content reports</h3>
        <p className="text-sm text-gray-400 mt-0.5">
          {pendingCount > 0
            ? <span className="text-red-500 font-medium">{pendingCount} report{pendingCount !== 1 ? 's' : ''} pending review</span>
            : 'No pending reports'
          }
          {' · '}{reports.length} total
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search by business, reason, or reporter email…"
            className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400" />
          {query && <button onClick={() => setQuery('')}><X size={13} className="text-gray-400" /></button>}
        </div>
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
          {(['all','pending','reviewed','dismissed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors"
              style={filter === f ? { background:'#085041', color:'white' } : { color:'#6B7280' }}>
              {f}
              {f === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Reports list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 text-center py-16">
          <Flag size={32} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm text-gray-400">
            {filter === 'pending' ? 'No pending reports — all clear!' : 'No reports found'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(report => {
            const style     = STATUS_STYLES[report.status]
            const StatusIcon = style.icon
            const entityName = report.entity_type === 'business'
              ? report.business?.name
              : report.review?.businesses?.name
            const EntityIcon = report.entity_type === 'business' ? Building2 : MessageSquare

            return (
              <div key={report.id}
                className="bg-white rounded-2xl border border-gray-100 p-5"
                style={{ borderLeftWidth:'3px', borderLeftColor: style.color }}>

                <div className="flex items-start gap-4">
                  {/* Entity icon */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: style.bg }}>
                    <EntityIcon size={18} style={{ color: style.color }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
                        style={{ background: style.bg, color: style.color }}>
                        <StatusIcon size={9} className="inline mr-1" />
                        {style.label}
                      </span>
                      <span className="text-xs font-medium text-gray-700 capitalize">{report.entity_type}</span>
                      {entityName && (
                        <>
                          <span className="text-xs text-gray-400">·</span>
                          <span className="text-sm font-semibold text-gray-900 truncate">{entityName}</span>
                        </>
                      )}
                    </div>

                    <p className="text-sm font-medium text-gray-800">
                      {REASON_LABELS[report.reason] ?? report.reason}
                    </p>

                    {report.details && (
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        &ldquo;{report.details}&rdquo;
                      </p>
                    )}

                    {report.entity_type === 'review' && report.review?.body && (
                      <div className="mt-2 px-3 py-2 bg-gray-50 rounded-lg">
                        <div className="flex gap-0.5 mb-1">
                          {[1,2,3,4,5].map(i => (
                            <span key={i} className={`text-xs ${i <= (report.review?.rating ?? 0) ? 'text-amber-400' : 'text-gray-300'}`}>★</span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">{report.review.body}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                      <span>Reported by {report.reported_by?.email ?? 'unknown'}</span>
                      <span>·</span>
                      <span>{new Date(report.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
                      {report.reviewed_at && (
                        <>
                          <span>·</span>
                          <span>Reviewed {new Date(report.reviewed_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* View entity */}
                    {(report.business?.id || report.review?.id) && (
                      <Link
                        href={report.entity_type === 'business'
                          ? `/businesses/${report.entity_id}`
                          : `/businesses/${report.review?.businesses ? 'unknown' : report.entity_id}`
                        }
                        target="_blank"
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-green-300 hover:text-green-600 transition-colors">
                        <Eye size={14} />
                      </Link>
                    )}

                    {/* Mark reviewed */}
                    {report.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatus(report, 'reviewed')}
                          disabled={!!updating}
                          title="Mark as reviewed"
                          className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors"
                          style={{ background:'#E1F5EE', borderColor:'#1D9E75', color:'#1D9E75' }}>
                          {updating === report.id + 'reviewed'
                            ? <Loader2 size={13} className="animate-spin" />
                            : <CheckCircle2 size={14} />
                          }
                        </button>
                        <button
                          onClick={() => updateStatus(report, 'dismissed')}
                          disabled={!!updating}
                          title="Dismiss report"
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-colors">
                          {updating === report.id + 'dismissed'
                            ? <Loader2 size={13} className="animate-spin" />
                            : <XCircle size={14} />
                          }
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}