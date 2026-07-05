'use client'
import { useState } from 'react'
import {
  X, Building2, CheckCircle2, Loader2,
  Shield, Phone, AlertCircle, RefreshCw
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'
import Link from 'next/link'

type Stage = 'form' | 'otp' | 'done'

interface Props {
  businessId:   string
  businessName: string
  businessPhone?: string | null
  onClose:      () => void
}

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:border-transparent transition-all"

export default function ClaimBusinessModal({
  businessId, businessName, businessPhone, onClose,
}: Props) {
  const supabase = createClient()
  const { user, isLoggedIn, isOwner } = useAuth()

  const [stage,       setStage]       = useState<Stage>('form')
  const [message,     setMessage]     = useState('')
  const [declared,    setDeclared]    = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [maskedPhone, setMaskedPhone] = useState('')

  // OTP stage
  const [otp,          setOtp]          = useState('')
  const [otpLoading,   setOtpLoading]   = useState(false)
  const [otpError,     setOtpError]     = useState('')
  const [resending,    setResending]    = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // ── Stage 1: Submit claim + request OTP ───────────────────────────────
  async function handleSubmitClaim(e: React.FormEvent) {
    e.preventDefault()
    if (!declared) { setError('Please confirm the declaration before proceeding.'); return }
    setLoading(true); setError('')

    // Check for existing claim
    const { data: existing } = await supabase
      .from('business_claims')
      .select('id, status')
      .eq('business_id', businessId)
      .eq('user_id', user!.id)
      .single()

    if (existing) {
      const msgs: Record<string, string> = {
        pending:  'You already have a pending claim for this business.',
        approved: 'Your claim has already been approved.',
        rejected: 'Your previous claim was rejected. Contact support for help.',
      }
      setError(msgs[existing.status] ?? 'A claim already exists.')
      setLoading(false)
      return
    }

    // Request OTP to be sent to business phone
    const res = await fetch('/api/claim-otp', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ businessId, userId: user!.id }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Failed to send verification code.')
      setLoading(false)
      return
    }

    setMaskedPhone(data.maskedPhone ?? '')
    setLoading(false)
    setStage('otp')
    startResendCooldown()
  }

  // ── Stage 2: Verify OTP ────────────────────────────────────────────────
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length !== 6) { setOtpError('Enter the 6-digit code.'); return }
    setOtpLoading(true); setOtpError('')

    const res = await fetch('/api/claim-otp', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ businessId, userId: user!.id, otp }),
    })
    const data = await res.json()

    if (!res.ok) {
      setOtpError(data.error ?? 'Incorrect code.')
      setOtpLoading(false)
      return
    }

    // OTP verified — now insert the actual claim
    const { error: insertError } = await supabase
      .from('business_claims')
      .insert({
        business_id:  businessId,
        user_id:      user!.id,
        message:      message.trim() || null,
        status:       'pending',
        phone_verified: true,
      })

    if (insertError) {
      setOtpError(insertError.message)
      setOtpLoading(false)
      return
    }

    setOtpLoading(false)
    setStage('done')
  }

  // ── Resend OTP with cooldown ───────────────────────────────────────────
  function startResendCooldown() {
    setResendCooldown(60)
    const interval = setInterval(() => {
      setResendCooldown(c => {
        if (c <= 1) { clearInterval(interval); return 0 }
        return c - 1
      })
    }, 1000)
  }

  async function handleResend() {
    if (resendCooldown > 0) return
    setResending(true); setOtpError('')

    const res = await fetch('/api/claim-otp', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ businessId, userId: user!.id }),
    })

    setResending(false)
    if (res.ok) {
      startResendCooldown()
      setOtp('')
    } else {
      const data = await res.json()
      setOtpError(data.error ?? 'Failed to resend code.')
    }
  }

  const Backdrop = ({ children }: { children: React.ReactNode }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)' }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )

  const ModalHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'#E1F5EE' }}>
          <Shield size={18} style={{ color:'#085041' }} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
        <X size={16} />
      </button>
    </div>
  )

  // ── Not logged in ─────────────────────────────────────────────────────
  if (!isLoggedIn) return (
    <Backdrop>
      <div className="p-8 text-center">
        <Building2 size={36} className="mx-auto mb-4" style={{ color:'#1D9E75' }} />
        <h3 className="text-lg font-bold text-gray-900 mb-2">Sign in to claim</h3>
        <p className="text-sm text-gray-500 mb-6">You need an account to claim a business listing.</p>
        <Link href="/auth/signup"
          className="block text-sm font-semibold text-white py-2.5 rounded-xl mb-2"
          style={{ background:'#1D9E75' }} onClick={onClose}>
          Create owner account
        </Link>
        <Link href="/auth/login"
          className="block text-sm font-medium text-gray-600 py-2 hover:text-green-700 transition-colors"
          onClick={onClose}>
          Sign in
        </Link>
      </div>
    </Backdrop>
  )

  // ── Already an owner ─────────────────────────────────────────────────
  if (isOwner) return (
    <Backdrop>
      <div className="p-8 text-center">
        <Building2 size={36} className="mx-auto mb-4" style={{ color:'#1D9E75' }} />
        <h3 className="text-lg font-bold text-gray-900 mb-2">Already a business owner</h3>
        <p className="text-sm text-gray-500 mb-6">
          Your account is already linked to a business. Contact support if you own multiple businesses.
        </p>
        <button onClick={onClose} className="text-sm font-medium text-gray-500 hover:text-gray-700">Close</button>
      </div>
    </Backdrop>
  )

  // ── Stage: done ───────────────────────────────────────────────────────
  if (stage === 'done') return (
    <Backdrop>
      <div className="p-8 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background:'#E1F5EE' }}>
          <CheckCircle2 size={26} style={{ color:'#0F6E56' }} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Claim submitted!</h3>
        <p className="text-sm text-gray-500 mb-1 leading-relaxed">
          Your phone verification was successful. We'll review your claim for
        </p>
        <p className="text-sm font-semibold text-gray-900 mb-4">{businessName}</p>
        <p className="text-xs text-gray-400 mb-6 leading-relaxed">
          You'll receive an email once your claim is approved. This usually takes 1–2 business days.
        </p>
        <button onClick={onClose}
          className="text-sm font-semibold text-white px-6 py-2.5 rounded-xl"
          style={{ background:'#1D9E75' }}>
          Done
        </button>
      </div>
    </Backdrop>
  )

  // ── Stage: otp ────────────────────────────────────────────────────────
  if (stage === 'otp') return (
    <Backdrop>
      <ModalHeader
        title="Phone verification"
        subtitle={`Step 2 of 2 — verify you own this business`}
      />
      <div className="p-6">
        {/* Instructions */}
        <div className="flex items-start gap-3 p-4 rounded-xl mb-5" style={{ background:'#f0faf6' }}>
          <Phone size={16} style={{ color:'#085041' }} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-1">
              Check the business phone
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">
              We sent a 6-digit code to <strong>{maskedPhone || 'the phone number on this listing'}</strong>.
              Only someone with access to that phone can complete this claim.
            </p>
          </div>
        </div>

        {otpError && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-100 mb-4">
            <AlertCircle size={14} className="flex-shrink-0" />
            {otpError}
          </div>
        )}

        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              6-digit verification code
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setOtpError('') }}
              placeholder="Enter code"
              className={`${inputCls} text-center text-2xl font-bold tracking-widest`}
              autoFocus
            />
          </div>

          <button type="submit" disabled={otpLoading || otp.length !== 6}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-white rounded-xl text-sm font-semibold disabled:opacity-60"
            style={{ background:'#1D9E75' }}>
            {otpLoading ? <><Loader2 size={14} className="animate-spin" /> Verifying…</> : 'Verify & submit claim'}
          </button>

          {/* Resend */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || resending}
              className="text-xs font-medium transition-colors disabled:opacity-50"
              style={{ color: resendCooldown > 0 ? '#9CA3AF' : '#1D9E75' }}
            >
              {resending ? (
                <span className="flex items-center gap-1 justify-center">
                  <RefreshCw size={11} className="animate-spin" /> Sending…
                </span>
              ) : resendCooldown > 0 ? (
                `Resend code in ${resendCooldown}s`
              ) : (
                'Didn\'t receive it? Resend code'
              )}
            </button>
          </div>

          <button type="button" onClick={() => { setStage('form'); setOtp(''); setOtpError('') }}
            className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors">
            ← Back to claim form
          </button>
        </form>
      </div>
    </Backdrop>
  )

  // ── Stage: form (default) ─────────────────────────────────────────────
  return (
    <Backdrop>
      <ModalHeader
        title={`Claim ${businessName}`}
        subtitle="Step 1 of 2 — verify your ownership"
      />
      <div className="p-6">
        {/* Security notice */}
        <div className="flex items-start gap-3 p-4 rounded-xl mb-5" style={{ background:'#FEF3C7' }}>
          <Shield size={15} style={{ color:'#D97706' }} className="flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            To prevent fraud, we'll send a verification code to the phone number
            listed for this business. You must have access to that phone to complete your claim.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-100 mb-4">
            <AlertCircle size={14} className="flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmitClaim} className="space-y-4">
          {/* Optional message */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
              Tell us about your connection to this business <span className="font-normal normal-case">(optional)</span>
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="e.g. I am the owner, or I work here as a manager."
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Legal declaration */}
          <label className="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors"
            style={declared
              ? { borderColor:'#1D9E75', background:'#f0faf6' }
              : { borderColor:'#E5E7EB' }
            }>
            <input
              type="checkbox"
              checked={declared}
              onChange={e => { setDeclared(e.target.checked); setError('') }}
              className="mt-0.5 flex-shrink-0 accent-green-600"
            />
            <p className="text-xs text-gray-700 leading-relaxed">
              <span className="font-semibold">I declare</span> that I am the legal owner or an authorised
              representative of <strong>{businessName}</strong>, and that the information I provide
              is accurate. I understand that submitting a false claim may result in my account being banned.
            </p>
          </label>

          <button
            type="submit"
            disabled={loading || !declared}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background:'#1D9E75' }}
          >
            {loading
              ? <><Loader2 size={14} className="animate-spin" /> Sending verification code…</>
              : <><Phone size={14} /> Send verification code</>
            }
          </button>

          <p className="text-xs text-gray-400 text-center leading-relaxed">
            A 6-digit code will be sent to the phone number on this listing.
            You must enter it to complete your claim.
          </p>
        </form>
      </div>
    </Backdrop>
  )
}