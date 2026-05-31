'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Settings, Loader2, Save, LogOut, Trash2,
  Moon, Sun, Bell, BellOff, Shield, ChevronRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'

export default function AccountSettingsPage() {
  const router   = useRouter()
  const supabase = createClient()
  const { user, profile, isLoggedIn, loading: authLoading, signOut, refreshProfile } = useAuth()

  const [saving,        setSaving]        = useState(false)
  const [saved,         setSaved]         = useState(false)
  const [error,         setError]         = useState('')
  const [darkMode,      setDarkMode]      = useState(false)
  const [emailNotifs,   setEmailNotifs]   = useState(true)
  const [reviewNotifs,  setReviewNotifs]  = useState(true)
  const [weeklyDigest,  setWeeklyDigest]  = useState(true)
  const [showDelete,    setShowDelete]    = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting,      setDeleting]      = useState(false)
  const [resetSent,     setResetSent]     = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!isLoggedIn) { router.replace('/auth/login'); return }
    // Load dark mode preference from localStorage
    const stored = localStorage.getItem('markeetee-dark-mode')
    if (stored === 'true') {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [authLoading, isLoggedIn])

  function toggleDarkMode() {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('markeetee-dark-mode', String(next))
    if (next) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  async function handlePasswordReset() {
    await supabase.auth.resetPasswordForEmail(user?.email ?? '', {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    setResetSent(true)
    setTimeout(() => setResetSent(false), 5000)
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'DELETE') return
    setDeleting(true)
    // Delete profile — cascade deletes reviews, saved businesses via FK
    await supabase.from('profiles').delete().eq('id', user!.id)
    await supabase.auth.signOut()
    router.push('/')
  }

  async function handleSignOut() {
    await signOut()
    router.push('/')
  }

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={28} className="animate-spin" style={{ color: '#1D9E75' }} />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Settings size={22} style={{ color: '#1D9E75' }} />
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="space-y-4">

        {/* ── Appearance ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Appearance</p>
          </div>
          <div className="divide-y divide-gray-50">
            <ToggleRow
              icon={darkMode ? Moon : Sun}
              label="Dark mode"
              description="Switch between light and dark interface"
              checked={darkMode}
              onChange={toggleDarkMode}
            />
          </div>
        </div>

        {/* ── Notifications ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Notifications</p>
          </div>
          <div className="divide-y divide-gray-50">
            <ToggleRow
              icon={Bell}
              label="Email notifications"
              description="Receive emails about your account activity"
              checked={emailNotifs}
              onChange={() => setEmailNotifs(!emailNotifs)}
            />
            <ToggleRow
              icon={Bell}
              label="Review alerts"
              description="Get notified when someone reviews your business"
              checked={reviewNotifs}
              onChange={() => setReviewNotifs(!reviewNotifs)}
            />
            <ToggleRow
              icon={Bell}
              label="Weekly summary"
              description="Receive a weekly email with your business stats"
              checked={weeklyDigest}
              onChange={() => setWeeklyDigest(!weeklyDigest)}
            />
          </div>
        </div>

        {/* ── Security ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Security</p>
          </div>
          <div className="divide-y divide-gray-50">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#E1F5EE' }}>
                  <Shield size={15} style={{ color: '#085041' }} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Change password</p>
                  <p className="text-xs text-gray-400">We'll send a reset link to {user?.email}</p>
                </div>
              </div>
              <button
                onClick={handlePasswordReset}
                className="text-sm font-medium px-4 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-700 transition-colors"
              >
                {resetSent ? '✓ Sent!' : 'Reset'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Account ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Account</p>
          </div>
          <div className="divide-y divide-gray-50">
            {/* Sign out */}
            <button onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100">
                <LogOut size={15} className="text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Sign out</p>
                <p className="text-xs text-gray-400">Sign out of your account on this device</p>
              </div>
              <ChevronRight size={15} className="text-gray-300" />
            </button>

            {/* Delete account */}
            <button onClick={() => setShowDelete(!showDelete)}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-red-50 transition-colors text-left">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50">
                <Trash2 size={15} className="text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-500">Delete account</p>
                <p className="text-xs text-gray-400">Permanently delete your account and all data</p>
              </div>
              <ChevronRight size={15} className="text-gray-300" />
            </button>
          </div>

          {/* Delete confirmation */}
          {showDelete && (
            <div className="mx-5 mb-5 p-4 rounded-xl border border-red-200 bg-red-50">
              <p className="text-sm font-semibold text-red-700 mb-1">Are you absolutely sure?</p>
              <p className="text-xs text-red-500 mb-3 leading-relaxed">
                This will permanently delete your account, all your reviews, and saved businesses.
                This action <strong>cannot be undone</strong>.
              </p>
              <label className="block text-xs font-medium text-red-700 mb-2">
                Type <strong>DELETE</strong> to confirm
              </label>
              <input
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirm !== 'DELETE' || deleting}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {deleting ? 'Deleting…' : 'Delete my account'}
                </button>
                <button onClick={() => { setShowDelete(false); setDeleteConfirm('') }}
                  className="px-4 py-2 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* App info */}
        <div className="text-center pt-2">
          <p className="text-xs text-gray-400">Markeetee · Version 1.0.0</p>
          <p className="text-xs text-gray-300 mt-1">Made with ❤️ for the African diaspora</p>
        </div>
      </div>
    </div>
  )
}

function ToggleRow({
  icon: Icon, label, description, checked, onChange,
}: {
  icon: React.ElementType
  label: string
  description: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#E1F5EE' }}>
          <Icon size={15} style={{ color: '#085041' }} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
      </div>
      {/* Toggle switch */}
      <button
        type="button"
        onClick={onChange}
        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
        style={{ background: checked ? '#1D9E75' : '#E5E7EB' }}
      >
        <span
          className="inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform"
          style={{ transform: checked ? 'translateX(22px)' : 'translateX(2px)' }}
        />
      </button>
    </div>
  )
}