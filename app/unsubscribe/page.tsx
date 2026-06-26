'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, AlertCircle, Mail, Loader2 } from 'lucide-react'

const EMAIL_TYPES = [
  { key: 'marketing',  label: 'Marketing emails',    desc: 'New features, promotions and announcements' },
  { key: 'reviews',    label: 'Review notifications', desc: 'When someone reviews your business' },
  { key: 'broadcast',  label: 'Community updates',   desc: 'News and updates from the Markeetee team' },
]

function UnsubscribeContent() {
  const params = useSearchParams()

  const success = params.get('success') === 'true'
  const error   = params.get('error')
  const type    = params.get('type') ?? 'all'
  const email   = params.get('email') ?? ''
  const token   = params.get('token') ?? ''

  const [prefs,   setPrefs]   = useState({ marketing: false, reviews: false, broadcast: false, all: false })
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [saveErr, setSaveErr] = useState('')

  // If arriving via one-click link (has token, no success yet) — show preferences page
  const showPrefs = token && !success && !error

  async function handleSave() {
    setSaving(true)
    setSaveErr('')
    const res = await fetch('/api/unsubscribe', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token, preferences: prefs }),
    })
    if (res.ok) {
      setSaved(true)
    } else {
      setSaveErr('Something went wrong — please try again.')
    }
    setSaving(false)
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-50">
          <AlertCircle size={24} className="text-red-500" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Invalid link</h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          This unsubscribe link has expired or is invalid.<br />
          Please use the link from your most recent email.
        </p>
        <Link href="/" className="text-sm font-medium" style={{ color: '#1D9E75' }}>
          Go to Markeetee →
        </Link>
      </div>
    )
  }

  if (success) {
    const label = type === 'all' ? 'all Markeetee emails' : `${type} emails`
    return (
      <div className="text-center py-8">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#E1F5EE' }}>
          <CheckCircle2 size={24} style={{ color: '#0F6E56' }} />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Unsubscribed</h1>
        <p className="text-sm text-gray-500 mb-1 leading-relaxed">
          <strong>{email || 'You'}</strong> have been unsubscribed from <strong>{label}</strong>.
        </p>
        <p className="text-xs text-gray-400 mb-6">
          You may still receive transactional emails like password resets and security alerts.
        </p>
        <div className="flex flex-col gap-2 items-center">
          <Link href="/"
            className="text-sm font-semibold text-white px-6 py-2.5 rounded-xl"
            style={{ background: '#1D9E75' }}>
            Go to Markeetee
          </Link>
          <Link href="/account/settings"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Manage all email preferences
          </Link>
        </div>
      </div>
    )
  }

  if (saved) {
    return (
      <div className="text-center py-8">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#E1F5EE' }}>
          <CheckCircle2 size={24} style={{ color: '#0F6E56' }} />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Preferences saved</h1>
        <p className="text-sm text-gray-500 mb-6">Your email preferences have been updated.</p>
        <Link href="/" className="text-sm font-semibold text-white px-6 py-2.5 rounded-xl" style={{ background: '#1D9E75' }}>
          Go to Markeetee
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#E1F5EE' }}>
        <Mail size={22} style={{ color: '#085041' }} />
      </div>
      <h1 className="text-xl font-semibold text-gray-900 text-center mb-1">
        Email preferences
      </h1>
      <p className="text-sm text-gray-500 text-center mb-6">
        Choose which emails you'd like to receive from Markeetee
      </p>

      <div className="space-y-2 mb-6">
        {EMAIL_TYPES.map(({ key, label, desc }) => (
          <label key={key}
            className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer hover:border-green-300 transition-colors"
            style={prefs[key as keyof typeof prefs] ? { borderColor: '#1D9E75', background: '#f0faf6' } : {}}>
            <input
              type="checkbox"
              checked={!prefs[key as keyof typeof prefs]}
              onChange={e => setPrefs(p => ({ ...p, [key]: !e.target.checked }))}
              className="mt-0.5 accent-green-600 flex-shrink-0"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
          </label>
        ))}
      </div>

      {/* Unsubscribe from all */}
      <label className="flex items-center gap-3 p-4 rounded-xl border border-red-100 bg-red-50 cursor-pointer mb-6">
        <input
          type="checkbox"
          checked={prefs.all}
          onChange={e => setPrefs(p => ({ ...p, all: e.target.checked }))}
          className="accent-red-500 flex-shrink-0"
        />
        <div>
          <p className="text-sm font-medium text-red-700">Unsubscribe from all emails</p>
          <p className="text-xs text-red-400 mt-0.5">You'll only receive essential security emails</p>
        </div>
      </label>

      {saveErr && (
        <p className="text-xs text-red-600 mb-3 text-center">{saveErr}</p>
      )}

      <button onClick={handleSave} disabled={saving}
        className="w-full py-2.5 text-white rounded-xl text-sm font-semibold disabled:opacity-60"
        style={{ background: '#1D9E75' }}>
        {saving ? <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" />Saving…</span> : 'Save preferences'}
      </button>

      <p className="text-xs text-gray-400 text-center mt-4">
        You can also manage preferences in your{' '}
        <Link href="/account/settings" className="font-medium" style={{ color: '#0F6E56' }}>
          account settings
        </Link>.
      </p>
    </>
  )
}

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md w-full">
        <Suspense fallback={
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin" style={{ color: '#1D9E75' }} />
          </div>
        }>
          <UnsubscribeContent />
        </Suspense>
      </div>
    </div>
  )
}