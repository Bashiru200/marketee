'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CountriesBar from '@/components/ui/CountriesBar'
import FieldError from '@/components/ui/FieldError'
import { Mail, Lock, Eye, EyeOff, Sparkles, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  // ── Inline field errors — no native browser popups ──────────────────────
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function setFE(field: string, msg: string) {
    setFieldErrors(e => ({ ...e, [field]: msg }))
  }
  function clearFE(field: string) {
    setFieldErrors(e => { const n = { ...e }; delete n[field]; return n })
  }
  function validateEmail(val: string): boolean {
    if (!val.trim()) { setFE('email', 'Email is required'); return false }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) { setFE('email', 'Enter a valid email address'); return false }
    clearFE('email'); return true
  }
  function validatePassword(val: string): boolean {
    if (!val.trim()) { setFE('password', 'Password is required'); return false }
    clearFE('password'); return true
  }
  function validateMagicEmail(val: string): boolean {
    if (!val.trim()) { setFE('magicEmail', 'Email is required'); return false }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) { setFE('magicEmail', 'Enter a valid email address'); return false }
    clearFE('magicEmail'); return true
  }

  // ── Magic link / OTP state ───────────────────────────────────────────────
  const [mode,         setMode]         = useState<'password' | 'magic'>('password')
  const [magicEmail,   setMagicEmail]   = useState('')
  const [magicSent,    setMagicSent]    = useState(false)
  const [magicLoading, setMagicLoading] = useState(false)
  const [magicError,   setMagicError]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!validateEmail(email) || !validatePassword(password)) return
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      setError('Login failed — no user returned. Please try again.')
      setLoading(false)
      return
    }

    // Fetch the profile to get the real role from the DB
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profileError || !profile) {
      router.push('/')
      router.refresh()
      return
    }

    router.push(profile.role === 'owner' ? '/dashboard' : '/search')
    router.refresh()
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback?intent=login` },
    })
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setMagicError('')
    if (!validateMagicEmail(magicEmail)) return
    setMagicLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email: magicEmail,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback?intent=login`,
        shouldCreateUser: false,
      },
    })

    if (error) {
      setMagicError(error.message)
      setMagicLoading(false)
      return
    }

    setMagicSent(true)
    setMagicLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-4xl bg-white border border-gray-100 rounded-2xl overflow-hidden flex" style={{ minHeight: '560px' }}>

        {/* ── Left brand panel ── */}
        <div className="hidden lg:flex flex-col justify-between w-2/5 p-10" style={{ background: '#085041' }}>
          <div>
            <h2 className="text-white text-2xl font-semibold leading-snug mb-3">
              Welcome back to Africa&apos;s diaspora marketplace
            </h2>
            <ul className="space-y-3">
              {[
                'Find African businesses near you',
                'Browse products and get directions',
                'Leave reviews for your community',
                'Manage your business listing',
              ].map(f => (
                <li key={f} className="flex items-center gap-3 text-sm" style={{ color: '#9FE1CB' }}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#5DCAA5' }} />
                  {f}
                </li>
              ))}
            </ul>
            <CountriesBar />
          </div>
          <p className="text-xs" style={{ color: '#085041' }}>© 2025 Markeetee</p>
        </div>

        {/* ── Right form panel ── */}
        <div className="flex-1 flex flex-col justify-center p-8 lg:p-10">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-sm" style={{ background: '#1D9E75' }}>M</div>
            <span className="font-semibold text-lg text-gray-900">Markeetee</span>
          </div>

          <h1 className="text-xl font-semibold text-gray-900 mb-1">Sign in</h1>
          <p className="text-sm text-gray-500 mb-6">Access your Markeetee account</p>

          {/* Google */}
          <button type="button" onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-green-400 transition-colors mb-4">
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
              <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.615 24 12.255 24z"/>
              <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"/>
              <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.64 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4 text-xs text-gray-400">
            <div className="flex-1 h-px bg-gray-100" />
            or sign in with email
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Password / Magic link toggle */}
          <div className="flex gap-1 bg-gray-50 rounded-xl p-1 mb-4">
            <button type="button" onClick={() => setMode('password')}
              className="flex-1 text-xs font-medium py-2 rounded-lg transition-colors"
              style={mode === 'password'
                ? { background: 'white', color: '#085041', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }
                : { color: '#9CA3AF' }}>
              Password
            </button>
            <button type="button" onClick={() => setMode('magic')}
              className="flex-1 text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
              style={mode === 'magic'
                ? { background: 'white', color: '#085041', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }
                : { color: '#9CA3AF' }}>
              <Sparkles size={11} /> Magic link
            </button>
          </div>

          {/* ── Password mode ── */}
          {mode === 'password' ? (
            <>
              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-100">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); clearFE('email') }}
                      onBlur={() => validateEmail(email)}
                      placeholder="you@example.com"
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:border-transparent transition-all"
                    />
                  </div>
                  {fieldErrors.email && <FieldError message={fieldErrors.email} />}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); clearFE('password') }}
                      onBlur={() => validatePassword(password)}
                      placeholder="Enter your password"
                      className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:border-transparent transition-all"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {fieldErrors.password && <FieldError message={fieldErrors.password} />}
                </div>

                <div className="text-right">
                  <Link href="/auth/forgot-password" className="text-xs font-medium" style={{ color: '#0F6E56' }}>
                    Forgot password?
                  </Link>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-2.5 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: '#1D9E75' }}>
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>
            </>
          ) : (
            // ── Magic link mode ──
            <>
              {magicSent ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: '#E1F5EE' }}>
                    <Sparkles size={20} style={{ color: '#1D9E75' }} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1.5">Check your email</h3>
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                    We sent a sign-in link to <strong>{magicEmail}</strong>.<br />
                    Click it to sign in — no password needed.
                  </p>
                  <button
                    onClick={() => { setMagicSent(false); setMagicEmail('') }}
                    className="text-xs font-medium" style={{ color: '#0F6E56' }}>
                    Use a different email
                  </button>
                </div>
              ) : (
                <>
                  {magicError && (
                    <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-100">
                      {magicError}
                    </div>
                  )}

                  <form onSubmit={handleMagicLink} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
                        Email address
                      </label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                          type="email"
                          value={magicEmail}
                          onChange={e => { setMagicEmail(e.target.value); clearFE('magicEmail') }}
                          onBlur={() => validateMagicEmail(magicEmail)}
                          placeholder="you@example.com"
                          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:border-transparent transition-all"
                        />
                      </div>
                      {fieldErrors.magicEmail && <FieldError message={fieldErrors.magicEmail} />}
                    </div>

                    <button type="submit" disabled={magicLoading}
                      className="w-full py-2.5 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      style={{ background: '#1D9E75' }}>
                      {magicLoading
                        ? <><Loader2 size={14} className="animate-spin" /> Sending…</>
                        : <><Sparkles size={14} /> Send magic link</>
                      }
                    </button>

                    <p className="text-xs text-gray-400 text-center">
                      We&apos;ll email you a link to sign in instantly — no password required.
                    </p>
                  </form>
                </>
              )}
            </>
          )}

          <p className="text-center text-sm text-gray-500 mt-5">
            No account?{' '}
            <Link href="/auth/signup" className="font-semibold" style={{ color: '#0F6E56' }}>
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}