'use client'
import { useEffect, useState } from 'react'
import {
  Shield, Crown, Plus, X, Check,
  Loader2, Trash2, ChevronDown, ChevronUp,
  Building2, User, MessageSquare, TrendingUp,
  DollarSign, ClipboardList, Settings
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'
import { useAuditLog } from '@/lib/useAuditLog'
import { ADMIN_PERMISSIONS, PERMISSION_LABELS, AdminPermission } from '@/lib/permissions'
import { Mail as MailIcon, Send } from 'lucide-react'

interface AdminUser {
  id:                 string
  name:               string | null
  email:              string | null
  avatar_url:         string | null
  admin_role:         'super_admin' | 'admin' | null
  admin_permissions:  AdminPermission[]
  created_at:         string
}

const PERMISSION_ICONS: Record<AdminPermission, React.ElementType> = {
  manage_businesses: Building2,
  manage_users:      User,
  moderate_reviews:  MessageSquare,
  view_analytics:    TrendingUp,
  view_revenue:      DollarSign,
  view_audit_log:    ClipboardList,
}

export default function AdminManagement() {
  const supabase = createClient()
  const { user, isSuperAdmin } = useAuth()
  const { log } = useAuditLog()

  const [admins,    setAdmins]    = useState<AdminUser[]>([])
  const [loading,   setLoading]   = useState(true)
  const [updating,  setUpdating]  = useState<string | null>(null)
  const [expanded,  setExpanded]  = useState<string | null>(null)
  const [showAdd,   setShowAdd]   = useState(false)
  const [showInvite,    setShowInvite]    = useState(false)
  const [inviteEmail,   setInviteEmail]   = useState('')
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteSent,    setInviteSent]    = useState(false)
  const [inviteError,   setInviteError]   = useState('')
  const [newEmail,  setNewEmail]  = useState('')
  const [adding,    setAdding]    = useState(false)
  const [addError,  setAddError]  = useState('')
  const [toast,     setToast]     = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<AdminUser | null>(null)

  useEffect(() => { loadAdmins() }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function loadAdmins() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, name, email, avatar_url, admin_role, admin_permissions, created_at')
      .not('admin_role', 'is', null)
      .order('admin_role', { ascending: true })

    setAdmins((data ?? []) as AdminUser[])
    setLoading(false)
  }

  async function togglePermission(admin: AdminUser, permission: AdminPermission) {
    if (admin.admin_role === 'super_admin') return
    setUpdating(admin.id + permission)

    const current = admin.admin_permissions ?? []
    const next    = current.includes(permission)
      ? current.filter(p => p !== permission)
      : [...current, permission]

    const { error } = await supabase
      .from('profiles')
      .update({ admin_permissions: next })
      .eq('id', admin.id)

    if (error) {
      showToast(`Error: ${error.message}`)
    } else {
      setAdmins(as => as.map(a => a.id === admin.id ? { ...a, admin_permissions: next } : a))
      const action = current.includes(permission) ? 'revoke_permission' : 'grant_permission'
      await log({
        action,
        entityType:  'user',
        entityId:    admin.id,
        entityName:  admin.name ?? admin.email ?? undefined,
        details:     { permission, admin_email: admin.email ?? '' },
      })
      showToast(
        current.includes(permission)
          ? `Removed "${PERMISSION_LABELS[permission].label}" from ${admin.name ?? admin.email}`
          : `Granted "${PERMISSION_LABELS[permission].label}" to ${admin.name ?? admin.email}`
      )
    }
    setUpdating(null)
  }

  async function grantAllPermissions(admin: AdminUser) {
    setUpdating(admin.id + 'all')
    const { error } = await supabase
      .from('profiles')
      .update({ admin_permissions: [...ADMIN_PERMISSIONS] })
      .eq('id', admin.id)

    if (!error) {
      setAdmins(as => as.map(a => a.id === admin.id ? { ...a, admin_permissions: [...ADMIN_PERMISSIONS] } : a))
      showToast(`All permissions granted to ${admin.name ?? admin.email}`)
    }
    setUpdating(null)
  }

  async function removeAdmin(admin: AdminUser) {
    setUpdating(admin.id + 'remove')
    const { error } = await supabase
      .from('profiles')
      .update({ admin_role: null, is_admin: false, admin_permissions: [] })
      .eq('id', admin.id)

    if (error) {
      showToast(`Error: ${error.message}`)
    } else {
      setAdmins(as => as.filter(a => a.id !== admin.id))
      await log({
        action: 'remove_admin',
        entityType: 'user',
        entityId:   admin.id,
        entityName: admin.name ?? admin.email ?? undefined,
      })
      showToast(`${admin.name ?? admin.email} is no longer an admin`)
    }
    setUpdating(null)
    setConfirmRemove(null)
  }

  async function addAdmin() {
    if (!newEmail.trim()) return
    setAdding(true); setAddError('')

    // Find user by email
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name, email, avatar_url, admin_role')
      .eq('email', newEmail.trim().toLowerCase())
      .single()

    if (!profile) {
      setAddError('No user found with that email address')
      setAdding(false)
      return
    }

    if (profile.admin_role) {
      setAddError('This user is already an admin')
      setAdding(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({ admin_role: 'admin', is_admin: true, admin_permissions: [] })
      .eq('id', profile.id)

    if (error) {
      setAddError(error.message)
    } else {
      await log({
        action: 'make_admin',
        entityType: 'user',
        entityId:   profile.id,
        entityName: profile.name ?? profile.email ?? undefined,
        details:    { granted_by: user?.email ?? '' },
      })
      await loadAdmins()
      setNewEmail('')
      setShowAdd(false)
      showToast(`${profile.name ?? newEmail} added as admin`)
    }
    setAdding(false)
  }

  if (loading) return (
    <div className="space-y-4">
      {[1,2,3].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gray-200" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-40 bg-gray-200 rounded" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
              <div className="h-3 w-56 bg-gray-200 rounded" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
            </div>
          </div>
        </div>
      ))}
      <style dangerouslySetInnerHTML={{ __html: '@keyframes shimmer{0%,100%{opacity:1}50%{opacity:.4}}' }} />
    </div>
  )

  async function sendAdminInvite() {
    if (!inviteEmail.trim()) return
    setInviteSending(true)
    setInviteError('')

    const res = await fetch('/api/send-invite', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        email:     inviteEmail.trim(),
        roleLabel: 'admin',
        invitedBy: user?.id,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setInviteError(data.error ?? 'Failed to send invite')
      setInviteSending(false)
      return
    }

    setInviteSent(true)
    setInviteSending(false)
    showToast(`Invite sent to ${inviteEmail}`)
  }

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
          <h3 className="font-semibold text-gray-900">Admin team</h3>
          <p className="text-sm text-gray-400 mt-0.5">
            {admins.length} admin{admins.length !== 1 ? 's' : ''} ·
            Super admins have full access to all features
          </p>
        </div>
        {isSuperAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => { setShowInvite(true); setInviteSent(false); setInviteEmail('') }}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border-2 hover:opacity-90 transition-opacity"
              style={{ borderColor:'#085041', color:'#085041' }}
            >
              <MailIcon size={15} /> Invite by email
            </button>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
              style={{ background:'#085041' }}
            >
              <Plus size={15} /> Add admin
            </button>
          </div>
        )}
      </div>

      {/* Invite by email modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background:'rgba(0,0,0,0.5)' }}
          onClick={() => setShowInvite(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'#E1F5EE' }}>
                  <MailIcon size={16} style={{ color:'#085041' }} />
                </div>
                <h3 className="font-bold text-gray-900">Invite a new admin</h3>
              </div>
              <button onClick={() => setShowInvite(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            {inviteSent ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background:'#E1F5EE' }}>
                  <Send size={20} style={{ color:'#1D9E75' }} />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Invite sent!</h4>
                <p className="text-sm text-gray-500 mb-5">
                  {inviteEmail} will receive an email with instructions to join as an admin.
                </p>
                <button onClick={() => setShowInvite(false)}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700">Close</button>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-500">
                  Unlike "Add admin" (which requires an existing account), this sends an
                  email invitation to someone who doesn't have a Markeetee account yet.
                </p>
                {inviteError && (
                  <div className="px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-100">{inviteError}</div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Email address</label>
                  <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                    placeholder="newadmin@example.com"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent" />
                </div>
                <button onClick={sendAdminInvite} disabled={inviteSending || !inviteEmail.trim()}
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white py-2.5 rounded-xl disabled:opacity-50"
                  style={{ background:'#1D9E75' }}>
                  {inviteSending ? <><Loader2 size={14} className="animate-spin" /> Sending…</> : <><Send size={14} /> Send invite</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add admin form */}
      {showAdd && (
        <div className="bg-white rounded-2xl border-2 border-dashed p-5" style={{ borderColor:'#1D9E75' }}>
          <h4 className="font-medium text-gray-900 mb-3">Add a new admin</h4>
          <p className="text-sm text-gray-500 mb-4">
            The user must already have a Markeetee account. They will start with no permissions — grant them after adding.
          </p>
          {addError && (
            <div className="mb-3 px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-100">
              {addError}
            </div>
          )}
          <div className="flex gap-3">
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addAdmin()}
              placeholder="user@email.com"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            />
            <button onClick={addAdmin} disabled={adding || !newEmail.trim()}
              className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2.5 rounded-xl disabled:opacity-60"
              style={{ background:'#1D9E75' }}>
              {adding ? <><Loader2 size={14} className="animate-spin" /> Adding…</> : 'Add admin'}
            </button>
            <button onClick={() => { setShowAdd(false); setAddError(''); setNewEmail('') }}
              className="px-3 py-2.5 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Admin cards */}
      <div className="space-y-4">
        {admins.map(admin => {
          const isSelf       = admin.id === user?.id
          const isSuperA     = admin.admin_role === 'super_admin'
          const isExpanded_  = expanded === admin.id
          const permissions  = admin.admin_permissions ?? []

          return (
            <div key={admin.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

              {/* Admin header */}
              <div className="flex items-center gap-4 p-5">
                {admin.avatar_url ? (
                  <img src={admin.avatar_url} alt={admin.name ?? ''}
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: isSuperA ? '#085041' : '#1D9E75' }}>
                    {(admin.name ?? admin.email ?? '?')[0].toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{admin.name ?? 'Unnamed'}</p>
                    {isSuperA ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ background:'#085041' }}>
                        Super admin
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background:'#E1F5EE', color:'#085041' }}>
                        Admin
                      </span>
                    )}
                    {isSelf && (
                      <span className="text-[10px] text-gray-400 px-2 py-0.5 rounded-full bg-gray-100">You</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{admin.email}</p>
                  {!isSuperA && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {permissions.length === 0
                        ? 'No permissions — cannot access any tab'
                        : `${permissions.length} of ${ADMIN_PERMISSIONS.length} permissions`}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Expand permissions */}
                  {!isSuperA && (
                    <button
                      onClick={() => setExpanded(isExpanded_ ? null : admin.id)}
                      className="flex items-center gap-1.5 text-xs font-medium border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
                    >
                      <Settings size={13} />
                      Permissions
                      {isExpanded_
                        ? <ChevronUp size={12} />
                        : <ChevronDown size={12} />
                      }
                    </button>
                  )}

                  {/* Remove admin */}
                  {isSuperAdmin && !isSelf && !isSuperA && (
                    <button
                      onClick={() => setConfirmRemove(admin)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 transition-colors"
                      title="Remove admin access"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Permissions panel */}
              {!isSuperA && isExpanded_ && (
                <div className="border-t border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Tab permissions
                    </p>
                    {isSuperAdmin && (
                      <button
                        onClick={() => grantAllPermissions(admin)}
                        disabled={!!updating}
                        className="text-xs font-medium hover:underline"
                        style={{ color:'#1D9E75' }}>
                        Grant all
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ADMIN_PERMISSIONS.map(permission => {
                      const info    = PERMISSION_LABELS[permission]
                      const Icon    = PERMISSION_ICONS[permission]
                      const granted = permissions.includes(permission)
                      const isUpdating = updating === admin.id + permission

                      return (
                        <div
                          key={permission}
                          className="flex items-center gap-3 p-3 rounded-xl border-2 transition-all"
                          style={{
                            borderColor: granted ? '#1D9E75' : '#E5E7EB',
                            background:  granted ? '#f0faf6' : '#FAFAFA',
                          }}
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: granted ? '#E1F5EE' : '#F3F4F6' }}>
                            <Icon size={14} style={{ color: granted ? '#1D9E75' : '#9CA3AF' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800">{info.label}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{info.desc}</p>
                          </div>
                          {isSuperAdmin ? (
                            <button
                              onClick={() => togglePermission(admin, permission)}
                              disabled={!!updating}
                              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors flex-shrink-0"
                              style={{
                                background: granted ? '#1D9E75' : '#E5E7EB',
                              }}
                            >
                              {isUpdating
                                ? <Loader2 size={12} className="animate-spin text-white" />
                                : granted
                                  ? <Check size={13} className="text-white" />
                                  : <Plus  size={13} className="text-gray-500" />
                              }
                            </button>
                          ) : (
                            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                              {granted
                                ? <Check size={13} style={{ color:'#1D9E75' }} />
                                : <X     size={13} className="text-gray-300" />
                              }
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Remove admin confirmation */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background:'rgba(0,0,0,0.5)' }}
          onClick={() => setConfirmRemove(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-50">
              <Shield size={22} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Remove admin access?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              <strong>{confirmRemove.name ?? confirmRemove.email}</strong> will lose all admin access
              and all permissions immediately.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmRemove(null)}
                className="flex-1 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={() => removeAdmin(confirmRemove)}
                disabled={updating === confirmRemove.id + 'remove'}
                className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60">
                {updating === confirmRemove.id + 'remove' ? 'Removing…' : 'Remove admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}