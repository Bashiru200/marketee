'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Mail, MapPin, Star, MessageSquare, Heart, Settings, Loader2, Save, Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'
import ImageUpload from '@/components/ui/ImageUpload'

interface Stats {
  reviews: number
  saved:   number
  rating:  number
}

export default function ProfilePage() {
  const router   = useRouter()
  const supabase = createClient()
  const { user, profile, isLoggedIn, loading: authLoading, refreshProfile } = useAuth()

  const [editing,   setEditing]   = useState(false)
  const [name,      setName]      = useState('')
  const [city,      setCity]      = useState('')
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [error,     setError]     = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [stats,     setStats]     = useState<Stats>({ reviews: 0, saved: 0, rating: 0 })

  useEffect(() => {
    if (authLoading) return
    if (!isLoggedIn) { router.replace('/auth/login'); return }
    setName(profile?.name ?? '')
    setAvatarUrl(profile?.avatar_url ?? null)
    loadStats()
  }, [authLoading, isLoggedIn, profile])

  async function loadStats() {
    const [reviewRes, savedRes] = await Promise.all([
      supabase.from('reviews').select('rating').eq('user_id', user!.id),
      supabase.from('saved_businesses').select('id').eq('user_id', user!.id),
    ])
    const reviews = reviewRes.data ?? []
    const avgRating = reviews.length
      ? reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / reviews.length
      : 0
    setStats({ reviews: reviews.length, saved: (savedRes.data ?? []).length, rating: avgRating })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    const { error: err } = await supabase.from('profiles')
      .update({ name, city })
      .eq('id', user!.id)
    if (err) { setError(err.message) }
    else {
      await refreshProfile()
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  async function handleAvatarUpload(url: string) {
    setAvatarUrl(url)
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', user!.id)
    await refreshProfile()
  }

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={28} className="animate-spin" style={{ color: '#1D9E75' }} />
    </div>
  )

  const initials = (profile?.name ?? user?.email ?? '?')
    .split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My profile</h1>
        <Link href="/account/settings"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-700 transition-colors">
          <Settings size={15} /> Settings
        </Link>
      </div>

      {saved && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm text-green-700 bg-green-50 border border-green-100">
          ✓ Profile updated successfully
        </div>
      )}

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
        {/* Cover banner */}
        <div className="h-24 w-full" style={{ background: 'linear-gradient(135deg,#085041,#1D9E75)' }} />

        <div className="px-6 pb-6">
          {/* Avatar + edit toggle */}
          <div className="flex items-end justify-between -mt-10 mb-5">
            <div className="relative">
              {editing ? (
                <ImageUpload
                  bucket="avatars"
                  folder={user?.id ?? 'unknown'}
                  currentUrl={avatarUrl}
                  onUpload={handleAvatarUpload}
                  shape="circle"
                  label=""
                />
              ) : (
                <div className="relative">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={profile?.name ?? ''}
                      className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md" />
                  ) : (
                    <div className="w-20 h-20 rounded-full border-4 border-white shadow-md flex items-center justify-center text-2xl font-bold text-white"
                      style={{ background: '#085041' }}>
                      {initials}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setEditing(!editing)}
              className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border transition-colors"
              style={editing
                ? { borderColor: '#E5E7EB', color: '#6B7280' }
                : { borderColor: '#1D9E75', color: '#1D9E75' }
              }
            >
              {editing ? 'Cancel' : 'Edit profile'}
            </button>
          </div>

          {editing ? (
            /* Edit form */
            <form onSubmit={handleSave} className="space-y-4">
              {error && <div className="px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-100">{error}</div>}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Full name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">City</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input value={city} onChange={e => setCity(e.target.value)} placeholder="Houston, TX"
                    className="w-full pl-9 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Email</label>
                <input value={user?.email ?? ''} disabled
                  className="w-full border border-gray-100 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
              </div>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 text-sm font-semibold text-white px-5 py-2.5 rounded-xl disabled:opacity-60"
                style={{ background: '#1D9E75' }}>
                {saving ? <><Loader2 size={14} className="animate-spin" />Saving…</> : <><Save size={14} />Save changes</>}
              </button>
            </form>
          ) : (
            /* View mode */
            <div>
              <h2 className="text-xl font-bold text-gray-900">{profile?.name ?? 'Your name'}</h2>
              <div className="flex items-center gap-1.5 mt-1 mb-3">
                <Mail size={13} className="text-gray-400" />
                <span className="text-sm text-gray-400">{user?.email}</span>
              </div>
              <span className="inline-block text-xs font-medium px-3 py-1 rounded-full capitalize"
                style={{ background: '#E1F5EE', color: '#085041' }}>
                {profile?.role ?? 'customer'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { icon: MessageSquare, label: 'Reviews',        value: stats.reviews, href: '/account/reviews' },
          { icon: Heart,         label: 'Saved',          value: stats.saved,   href: '/account/saved'   },
          { icon: Star,          label: 'Avg. rating',    value: stats.rating > 0 ? stats.rating.toFixed(1) + ' ★' : '—', href: '/account/reviews' },
        ].map(({ icon: Icon, label, value, href }) => (
          <Link key={label} href={href}
            className="bg-white rounded-2xl border border-gray-100 p-4 text-center hover:border-green-300 transition-colors group">
            <Icon size={16} className="mx-auto mb-1.5 text-gray-400 group-hover:text-green-600 transition-colors" />
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400">{label}</p>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quick access</p>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            { icon: Heart,         label: 'Saved businesses', desc: `${stats.saved} saved`,  href: '/account/saved'    },
            { icon: MessageSquare, label: 'My reviews',        desc: `${stats.reviews} written`, href: '/account/reviews'  },
            { icon: Settings,      label: 'Settings',          desc: 'Appearance, notifications, security', href: '/account/settings' },
          ].map(({ icon: Icon, label, desc, href }) => (
            <Link key={label} href={href}
              className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#E1F5EE' }}>
                <Icon size={15} style={{ color: '#085041' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}