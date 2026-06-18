'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const supabase = createClient()

  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/reset-password`,
    })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl p-8">

        <Link href="/auth/login"
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to sign in
        </Link>

        {sent ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#E1F5EE' }}>
              <CheckCircle2 size={24} style={{ color: '#0F6E56' }} />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Check your email</h1>
            <p className="text-sm text-gray-500 mb-1 leading-relaxed">
              We sent a password reset link to
            </p>
            <p className="text-sm font-semibold text-gray-900 mb-6">{email}</p>
            <button onClick={() => { setSent(false); setEmail('') }}
              className="text-sm font-medium" style={{ color: '#0F6E56' }}>
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-1">Forgot your password?</h1>
            <p className="text-sm text-gray-500 mb-6">
              Enter your email and we'll send you a link to reset it.
            </p>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-100">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Email address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" required
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:border-transparent transition-all" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: '#1D9E75' }}>
                {loading ? <><Loader2 size={15} className="animate-spin" /> Sending…</> : 'Send reset link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}