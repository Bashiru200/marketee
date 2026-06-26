'use client'
import { useEffect, useState } from 'react'
import {
  Building2, CheckCircle2, XCircle, Clock,
  Loader2, Eye, MessageSquare, Search, X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuditLog } from '@/lib/useAuditLog'
import Link from 'next/link'

interface Claim {
  id:          string
  status:      'pending' | 'approved' | 'rejected'
  message:       string | null
  phone_verified: boolean
  created_at:  string
  reviewed_at: string | null
  businesses:  { id: string; name: string; city: string | null; cover_image: string | null; owner_id: string | null } | null
  profiles:    { name: string | null; email: string | null; avatar_url: string | null } | null
}

const STATUS_STYLES = {
  pending:  { label:'Pending',  color:'#D97706', bg:'#FEF3C7' },
  approved: { label:'Approved', color:'#1D9E75', bg:'#E1F5EE' },
  rejected: { label:'Rejected', color:'#EF4444', bg:'#FEE2E2' },
}

export default function BusinessClaimsManager() {
  const supabase = createClient()
  const { log }  = useAuditLog()

  const [claims,   setClaims]   = useState<Claim[]>([])
  const [loading,  setLoading]  = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [toast,    setToast]    = useState<string | null>(null)
  const [filter,   setFilter]   = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [query,    setQuery]    = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => { loadClaims() }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function loadClaims() {
    setLoading(true)
    const { data } = await supabase
      .from('business_claims')
      .select(`
        id, status, message, phone_verified, created_at, reviewed_at,
        businesses(id, name, city, cover_image, owner_id),
        profiles(name, email, avatar_url)
      `)
      .order('created_at', { ascending: false })
    setClaims((data ?? []) as Claim[])
    setLoading(false)
  }

  async function handleDecision(claim: Claim, decision: 'approved' | 'rejected') {
    setUpdating(claim.id + decision)

    const { error } = await supabase
      .from('business_claims')
      .update({
        status:      decision,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', claim.id)

    if (error) {
      showToast(`Error: ${error.message}`)
      setUpdating(null)
      return
    }

    // If approved, link the business to the user
    if (decision === 'approved' && claim.businesses && claim.profiles) {
      // Update business owner_id
      await supabase.from('businesses')
        .update({ owner_id: claim.profiles?.email ? undefined : undefined })
        .eq('id', claim.businesses.id)

      // Get user's profile id from email
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', claim.profiles.email ?? '')
        .single()

      if (profile) {
        await supabase.from('businesses')
          .update({ owner_id: profile.id })
          .eq('id', claim.businesses.id)

        await supabase.from('profiles')
          .update({ role: 'owner', business_id: claim.businesses.id })
          .eq('id', profile.id)
      }
    }

    setClaims(cs => cs.map(c => c.id === claim.id
      ? { ...c, status: decision, reviewed_at: new Date().toISOString() }
      : c
    ))

    await log({
      action:      decision === 'approved' ? 'verify_business' as any : 'unverify_business' as any,
      entityType:  'business',
      entityId:    claim.businesses?.id,
      entityName:  claim.businesses?.name,
      details:     { claim_id: claim.id, claimant: claim.profiles?.email ?? '', decision },
    })

    showToast(decision === 'approved'
      ? `✓ Claim approved — ${claim.businesses?.name} linked to ${claim.profiles?.email}`
      : `Claim rejected`
    )
    setUpdating(null)
  }

  const pendingCount  = claims.filter(c => c.status === 'pending').length
  const filtered = claims.filter(c => {
    const mf = filter === 'all' ? true : c.status === filter
    const mq = !query
      || (c.businesses?.name ?? '').toLowerCase().includes(query.toLowerCase())
      || (c.profiles?.email  ?? '').toLowerCase().includes(query.toLowerCase())
    return mf && mq
  })

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-xl" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 bg-gray-200 rounded" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
              <div className="h-3 w-64 bg-gray-200 rounded" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
            </div>
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
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Business claims</h3>
          <p className="text-sm text-gray-400 mt-0.5">
            {pendingCount > 0
              ? <span className="text-amber-600 font-medium">{pendingCount} pending review</span>
              : 'No pending claims'
            }
            {' · '}{claims.length} total
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search by business or email…"
            className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400" />
          {query && <button onClick={() => setQuery('')}><X size={13} className="text-gray-400" /></button>}
        </div>
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
          {(['all','pending','approved','rejected'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors"
              style={filter === f
                ? { background:'#085041', color:'white' }
                : { color:'#6B7280' }
              }>
              {f}
              {f === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Claims list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 text-center py-16">
          <Building2 size={32} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm text-gray-400">No claims found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(claim => {
            const style = STATUS_STYLES[claim.status]
            return (
              <div key={claim.id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                style={{ borderLeftWidth:'3px', borderLeftColor: style.color }}>

                <div className="flex items-center gap-4 p-5">
                  {/* Business thumbnail */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                    {claim.businesses?.cover_image
                      ? <img src={claim.businesses.cover_image} alt=""
                          className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-xl"
                          style={{ background:'#E1F5EE' }}>🏪</div>
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{claim.businesses?.name}</p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: style.bg, color: style.color }}>
                        {style.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Claimed by <strong>{claim.profiles?.name ?? claim.profiles?.email}</strong>
                      {claim.businesses?.city ? ` · ${claim.businesses.city}` : ''}
                    </p>
                    <p className="text-xs text-gray-400">
                      Submitted {new Date(claim.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                      {claim.reviewed_at && ` · Reviewed ${new Date(claim.reviewed_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}`}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* View listing */}
                    {claim.businesses && (
                      <Link href={`/businesses/${claim.businesses.id}`} target="_blank"
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-green-300 hover:text-green-600 transition-colors">
                        <Eye size={14} />
                      </Link>
                    )}

                    {/* View message */}
                    {/* Phone verified badge */}
                    {claim.phone_verified && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background:'#E1F5EE', color:'#085041' }}>
                        📱 Phone verified
                      </span>
                    )}
                    {!claim.phone_verified && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background:'#FEF3C7', color:'#92400E' }}>
                        ⚠ Unverified
                      </span>
                    )}

                    {claim.message && (
                      <button
                        onClick={() => setExpanded(expanded === claim.id ? null : claim.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors">
                        <MessageSquare size={14} />
                      </button>
                    )}

                    {/* Approve / Reject — only for pending */}
                    {claim.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleDecision(claim, 'approved')}
                          disabled={!!updating}
                          title="Approve claim"
                          className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors"
                          style={{ background:'#E1F5EE', borderColor:'#1D9E75', color:'#1D9E75' }}>
                          {updating === claim.id + 'approved'
                            ? <Loader2 size={13} className="animate-spin" />
                            : <CheckCircle2 size={14} />
                          }
                        </button>
                        <button
                          onClick={() => handleDecision(claim, 'rejected')}
                          disabled={!!updating}
                          title="Reject claim"
                          className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors"
                          style={{ background:'#FEE2E2', borderColor:'#EF4444', color:'#EF4444' }}>
                          {updating === claim.id + 'rejected'
                            ? <Loader2 size={13} className="animate-spin" />
                            : <XCircle size={14} />
                          }
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Expanded message */}
                {expanded === claim.id && claim.message && (
                  <div className="mx-5 mb-5 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Claimant message
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">{claim.message}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}