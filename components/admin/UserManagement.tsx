'use client'
import { useEffect, useState } from 'react'
import {
  Users, Search, X, Shield, Send, ShieldOff,
  Mail, Building2, User, Crown, Loader2,
  ChevronDown, MoreVertical, Ban, Key,
  CheckCircle2, XCircle, Eye
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuditLog } from '@/lib/useAuditLog'
import { useAuth } from '@/lib/auth'
import Link from 'next/link'
import Image from 'next/image'

interface UserRow {
  id:          string
  name:        string | null
  email:       string | null
  role:        string
  is_admin:    boolean
  is_banned:   boolean | null
  business_id: string | null
  avatar_url:  string | null
  created_at:  string
  businesses:  { id: string; name: string; plan: string } | null
}

interface Stats {
  total:     number
  owners:    number
  customers: number
  admins:    number
  banned:    number
}

type FilterTab = 'all' | 'owners' | 'customers' | 'admins' | 'banned'

export default function UserManagement() {
  const supabase = createClient()
  const { log }  = useAuditLog()
  const { user: adminUser } = useAuth()
  const [emailTarget,   setEmailTarget]   = useState<UserRow | null>(null)
  const [emailSubject,  setEmailSubject]  = useState('')
  const [emailBody,     setEmailBody]     = useState('')
  const [emailSending,  setEmailSending]  = useState(false)
  const [emailDone,     setEmailDone]     = useState(false)
  const [users,    setUsers]    = useState<UserRow[]>([])
  const [stats,    setStats]    = useState<Stats>({ total:0, owners:0, customers:0, admins:0, banned:0 })
  const [loading,  setLoading]  = useState(true)
  const [query,    setQuery]    = useState('')
  const [tab,      setTab]      = useState<FilterTab>('all')
  const [updating, setUpdating] = useState<string | null>(null)
  const [toast,    setToast]    = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [confirmBan,   setConfirmBan]   = useState<UserRow | null>(null)
  const [confirmAdmin, setConfirmAdmin] = useState<UserRow | null>(null)

  useEffect(() => { loadUsers() }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function sendEmailToUser() {
    if (!emailTarget || !emailSubject.trim() || !emailBody.trim()) return
    setEmailSending(true)

    const res = await fetch('/api/admin-email', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        toEmail:  emailTarget.email,
        toName:   emailTarget.name ?? emailTarget.email,
        subject:  emailSubject.trim(),
        body:     emailBody.trim(),
        adminId:  adminUser?.id,
      }),
    })

    if (res.ok) {
      setEmailDone(true)
      showToast(`Email sent to ${emailTarget.name ?? emailTarget.email}`)
    } else {
      const data = await res.json()
      showToast(`Error: ${data.error ?? 'Failed to send'}`)
    }
    setEmailSending(false)
  }

  async function loadUsers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, is_admin, is_banned, business_id, avatar_url, created_at, businesses(id, name, plan)')
      .order('created_at', { ascending: false })

    if (error) { console.error('[users]', error); setLoading(false); return }

    const rows = (data ?? []) as UserRow[]
    setUsers(rows)
    setStats({
      total:     rows.length,
      owners:    rows.filter(u => u.role === 'owner').length,
      customers: rows.filter(u => u.role === 'customer').length,
      admins:    rows.filter(u => u.is_admin).length,
      banned:    rows.filter(u => u.is_banned).length,
    })
    setLoading(false)
  }

  async function toggleBan(user: UserRow) {
    setUpdating(user.id + 'ban')
    const next = !user.is_banned
    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: next })
      .eq('id', user.id)

    if (error) {
      showToast(`Error: ${error.message}`)
    } else {
      setUsers(us => us.map(u => u.id === user.id ? { ...u, is_banned: next } : u))
      showToast(next ? `${user.name ?? user.email} has been banned` : `${user.name ?? user.email} has been unbanned`)
      await log({ action: next ? 'ban_user' : 'unban_user', entityType:'user', entityId: user.id, entityName: user.name ?? user.email ?? undefined })
    }
    setUpdating(null)
    setConfirmBan(null)
    setMenuOpen(null)
  }

  async function toggleAdmin(user: UserRow) {
    setUpdating(user.id + 'admin')
    const next = !user.is_admin
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: next })
      .eq('id', user.id)

    if (error) {
      showToast(`Error: ${error.message}`)
    } else {
      setUsers(us => us.map(u => u.id === user.id ? { ...u, is_admin: next } : u))
      showToast(next ? `${user.name ?? user.email} promoted to admin` : `Admin removed from ${user.name ?? user.email}`)
      await log({ action: next ? 'make_admin' : 'remove_admin', entityType:'user', entityId: user.id, entityName: user.name ?? user.email ?? undefined })
    }
    setUpdating(null)
    setConfirmAdmin(null)
    setMenuOpen(null)
  }

  async function sendPasswordReset(user: UserRow) {
    if (!user.email) return
    setUpdating(user.id + 'reset')
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) {
      showToast(`Error: ${error.message}`)
    } else {
      showToast(`Password reset email sent to ${user.email}`)
      await log({ action:'reset_password', entityType:'user', entityId: user.id, entityName: user.name ?? user.email ?? undefined })
    }
    setUpdating(null)
    setMenuOpen(null)
  }

  const filtered = users.filter(u => {
    const q  = (query).toLowerCase()
    const mq = !query
      || (u.name  ?? '').toLowerCase().includes(q)
      || (u.email ?? '').toLowerCase().includes(q)
      || (u.businesses?.name ?? '').toLowerCase().includes(q)
    const mt = tab === 'all'       ? true
             : tab === 'owners'    ? u.role === 'owner'
             : tab === 'customers' ? u.role === 'customer'
             : tab === 'admins'    ? u.is_admin
             : tab === 'banned'    ? !!u.is_banned
             : true
    return mq && mt
  })

  const TABS: { id: FilterTab; label: string; count: number }[] = [
    { id:'all',       label:'All',       count: stats.total     },
    { id:'owners',    label:'Owners',    count: stats.owners    },
    { id:'customers', label:'Customers', count: stats.customers },
    { id:'admins',    label:'Admins',    count: stats.admins    },
    { id:'banned',    label:'Banned',    count: stats.banned    },
  ]

  const PLAN_COLORS: Record<string, string> = {
    free: '#6B7280', premium: '#1D9E75', storefront: '#085041'
  }

  if (loading) return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="h-6 w-10 bg-gray-200 rounded mb-2" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
            <div className="h-3 w-16 bg-gray-200 rounded" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-50">
            <div className="w-10 h-10 rounded-full bg-gray-200" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 bg-gray-200 rounded" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
              <div className="h-3 w-56 bg-gray-200 rounded" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
            </div>
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label:'Total users',  value:stats.total,     icon:Users,    color:'#1D9E75' },
          { label:'Owners',       value:stats.owners,    icon:Building2,color:'#085041' },
          { label:'Customers',    value:stats.customers, icon:User,     color:'#8B5CF6' },
          { label:'Admins',       value:stats.admins,    icon:Crown,    color:'#F59E0B' },
          { label:'Banned',       value:stats.banned,    icon:Ban,      color:'#EF4444' },
        ].map(({ label, value, icon:Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100">
            <Icon size={16} className="mb-2" style={{ color }} />
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Search + tabs */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search by name, email, or business"
              className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400" />
            {query && <button onClick={() => setQuery('')}><X size={13} className="text-gray-400" /></button>}
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
                style={tab === t.id ? { background:'#1D9E75', color:'white' } : { color:'#6B7280' }}>
                {t.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab===t.id?'bg-white/20 text-white':'bg-white text-gray-500'}`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* User rows */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users size={28} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No users found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(u => (
              <div key={u.id}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                style={{ opacity: u.is_banned ? 0.6 : 1 }}>

                {/* Avatar */}
                <div className="flex-shrink-0">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt={u.name ?? ''}
                      className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      style={{ background: u.role === 'owner' ? '#085041' : '#1D9E75' }}>
                      {(u.name ?? u.email ?? '?')[0].toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {u.name ?? 'Unnamed user'}
                    </p>
                    {u.is_admin && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background:'#FEF3C7', color:'#D97706' }}>
                        Admin
                      </span>
                    )}
                    {u.is_banned && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                        Banned
                      </span>
                    )}
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full capitalize"
                      style={{ background:'#E1F5EE', color:'#085041' }}>
                      {u.role}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{u.email}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {u.businesses && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Building2 size={10} />
                        {u.businesses.name}
                        <span className="font-medium" style={{ color: PLAN_COLORS[u.businesses.plan ?? 'free'] }}>
                          · {u.businesses.plan ?? 'free'}
                        </span>
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      Joined {new Date(u.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                    </span>
                  </div>
                </div>

                {/* Actions menu */}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setMenuOpen(menuOpen === u.id ? null : u.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    <MoreVertical size={14} />
                  </button>

                  {menuOpen === u.id && (
                    <>
                      {/* Backdrop */}
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                      <div className="absolute right-0 top-10 bg-white border border-gray-100 rounded-xl shadow-xl z-20 w-52 overflow-hidden">

                        {/* View business */}
                        {u.businesses && (
                          <Link href={`/businesses/${u.businesses.id}`} target="_blank"
                            onClick={() => setMenuOpen(null)}
                            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                            <Eye size={14} className="text-gray-400" />
                            View listing
                          </Link>
                        )}

                        {/* Send email */}
                        <button
                          onClick={() => { setEmailTarget(u); setEmailSubject(''); setEmailBody(''); setEmailDone(false); setMenuOpen(null) }}
                          disabled={!u.email}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40"
                        >
                          <Mail size={14} className="text-gray-400" />
                          Send email
                        </button>

                        {/* Password reset */}
                        <button
                          onClick={() => sendPasswordReset(u)}
                          disabled={!u.email || updating === u.id + 'reset'}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40"
                        >
                          {updating === u.id + 'reset'
                            ? <Loader2 size={14} className="animate-spin text-gray-400" />
                            : <Key size={14} className="text-gray-400" />
                          }
                          Send password reset
                        </button>

                        {/* Toggle admin */}
                        <button
                          onClick={() => setConfirmAdmin(u)}
                          disabled={updating === u.id + 'admin'}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors disabled:opacity-40"
                          style={{ color: u.is_admin ? '#D97706' : '#374151' }}
                        >
                          {updating === u.id + 'admin'
                            ? <Loader2 size={14} className="animate-spin text-gray-400" />
                            : <Crown size={14} style={{ color: u.is_admin ? '#D97706' : '#9CA3AF' }} />
                          }
                          {u.is_admin ? 'Remove admin' : 'Make admin'}
                        </button>

                        <div className="border-t border-gray-100" />

                        {/* Ban / Unban */}
                        <button
                          onClick={() => setConfirmBan(u)}
                          disabled={updating === u.id + 'ban'}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-red-50 transition-colors disabled:opacity-40"
                          style={{ color: u.is_banned ? '#1D9E75' : '#EF4444' }}
                        >
                          {updating === u.id + 'ban'
                            ? <Loader2 size={14} className="animate-spin" />
                            : u.is_banned
                              ? <ShieldOff size={14} style={{ color:'#1D9E75' }} />
                              : <Ban size={14} style={{ color:'#EF4444' }} />
                          }
                          {u.is_banned ? 'Unban user' : 'Ban user'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-400">Showing {filtered.length} of {users.length} users</p>
        </div>
      </div>

      {/* Send email modal */}
      {emailTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background:'rgba(0,0,0,0.5)' }}
          onClick={() => setEmailTarget(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'#E1F5EE' }}>
                  <Mail size={16} style={{ color:'#085041' }} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Send email</h3>
                  <p className="text-xs text-gray-400">To: {emailTarget.name ?? emailTarget.email} · {emailTarget.email}</p>
                </div>
              </div>
              <button onClick={() => setEmailTarget(null)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
            {emailDone ? (
              <div className="p-10 text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background:'#E1F5EE' }}>
                  <Send size={20} style={{ color:'#1D9E75' }} />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Email sent!</h4>
                <p className="text-sm text-gray-500 mb-4">Message delivered to {emailTarget.email}</p>
                <button onClick={() => setEmailTarget(null)}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700">Close</button>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Subject *</label>
                  <input type="text" value={emailSubject} onChange={e => setEmailSubject(e.target.value)}
                    placeholder="Enter email subject"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Message *</label>
                  <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)}
                    placeholder="Enter email message"
                    rows={6}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none" />
                </div>
                <div className="flex gap-3">
                  <button onClick={sendEmailToUser}
                    disabled={emailSending || !emailSubject.trim() || !emailBody.trim()}
                    className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold text-white py-2.5 rounded-xl disabled:opacity-50"
                    style={{ background:'#1D9E75' }}>
                    {emailSending ? 'Sending…' : <><Send size={14} /> Send email</>}
                  </button>
                  <button onClick={() => setEmailTarget(null)}
                    className="px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ban confirmation modal */}
      {confirmBan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background:'rgba(0,0,0,0.5)' }}
          onClick={() => setConfirmBan(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: confirmBan.is_banned ? '#E1F5EE' : '#FEE2E2' }}>
              <Ban size={22} style={{ color: confirmBan.is_banned ? '#1D9E75' : '#EF4444' }} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
              {confirmBan.is_banned ? 'Unban this user?' : 'Ban this user?'}
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              <strong>{confirmBan.name ?? confirmBan.email}</strong>
              {confirmBan.is_banned
                ? ' will be able to log in and use Markeetee again.'
                : ' will be flagged as banned. They can still log in but you can use this to track bad actors.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmBan(null)}
                className="flex-1 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => toggleBan(confirmBan)}
                disabled={updating === confirmBan.id + 'ban'}
                className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-60 transition-colors"
                style={{ background: confirmBan.is_banned ? '#1D9E75' : '#EF4444' }}>
                {updating === confirmBan.id + 'ban'
                  ? 'Updating…'
                  : confirmBan.is_banned ? 'Yes, unban' : 'Yes, ban'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin promotion confirmation modal */}
      {confirmAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background:'rgba(0,0,0,0.5)' }}
          onClick={() => setConfirmAdmin(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background:'#FEF3C7' }}>
              <Crown size={22} style={{ color:'#D97706' }} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
              {confirmAdmin.is_admin ? 'Remove admin access?' : 'Grant admin access?'}
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              <strong>{confirmAdmin.name ?? confirmAdmin.email}</strong>
              {confirmAdmin.is_admin
                ? ' will lose access to the admin dashboard.'
                : ' will have full access to the admin dashboard including deleting businesses and managing users.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmAdmin(null)}
                className="flex-1 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => toggleAdmin(confirmAdmin)}
                disabled={updating === confirmAdmin.id + 'admin'}
                className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-60 transition-colors"
                style={{ background:'#D97706' }}>
                {updating === confirmAdmin.id + 'admin'
                  ? 'Updating…'
                  : confirmAdmin.is_admin ? 'Remove admin' : 'Grant admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}