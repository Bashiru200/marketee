'use client'
import { useState } from 'react'
import { X, Building2, CheckCircle2, Loader2, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Props {
  businessId:   string
  businessName: string
  onClose:      () => void
}

export default function ClaimBusinessModal({ businessId, businessName, onClose }: Props) {
  const supabase = createClient()
  const router   = useRouter()
  const { user, isLoggedIn, isOwner } = useAuth()

  const [message,  setMessage]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)
  const [error,    setError]    = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')

    // Check for existing claim
    const { data: existing } = await supabase
      .from('business_claims')
      .select('id, status')
      .eq('business_id', businessId)
      .eq('user_id', user!.id)
      .single()

    if (existing) {
      if (existing.status === 'pending') {
        setError('You already have a pending claim for this business.')
      } else if (existing.status === 'approved') {
        setError('Your claim for this business has already been approved.')
      } else {
        setError('Your previous claim was rejected. Contact support for help.')
      }
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase
      .from('business_claims')
      .insert({
        business_id: businessId,
        user_id:     user!.id,
        message:     message.trim() || null,
        status:      'pending',
      })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
  }

  // Not logged in
  if (!isLoggedIn) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)' }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl"
        onClick={e => e.stopPropagation()}>
        <Building2 size={36} className="mx-auto mb-4" style={{ color:'#1D9E75' }} />
        <h3 className="text-lg font-bold text-gray-900 mb-2">Sign in to claim</h3>
        <p className="text-sm text-gray-500 mb-6">
          You need an account to claim a business listing.
        </p>
        <Link href="/auth/signup"
          className="block text-sm font-semibold text-white py-2.5 rounded-xl mb-2"
          style={{ background:'#1D9E75' }}
          onClick={onClose}>
          Create owner account
        </Link>
        <Link href="/auth/login"
          className="block text-sm font-medium text-gray-600 py-2 hover:text-green-700 transition-colors"
          onClick={onClose}>
          Sign in
        </Link>
      </div>
    </div>
  )

  // Already an owner of a different business
  if (isOwner) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)' }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl"
        onClick={e => e.stopPropagation()}>
        <Building2 size={36} className="mx-auto mb-4" style={{ color:'#1D9E75' }} />
        <h3 className="text-lg font-bold text-gray-900 mb-2">Already a business owner</h3>
        <p className="text-sm text-gray-500 mb-6">
          Your account is already linked to a business. Contact support if you own multiple businesses.
        </p>
        <button onClick={onClose}
          className="text-sm font-medium text-gray-500 hover:text-gray-700">
          Close
        </button>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)' }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background:'#E1F5EE' }}>
              <Building2 size={20} style={{ color:'#085041' }} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Claim this listing</h2>
              <p className="text-xs text-gray-400 mt-0.5">{businessName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 mt-0.5">
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background:'#E1F5EE' }}>
              <CheckCircle2 size={28} style={{ color:'#1D9E75' }} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Claim submitted!</h3>
            <p className="text-sm text-gray-500 mb-6">
              We'll review your claim within 24 hours and notify you by email.
              Once approved, you'll have full control of this listing.
            </p>
            <button onClick={onClose}
              className="text-sm font-semibold text-white px-6 py-2.5 rounded-xl"
              style={{ background:'#1D9E75' }}>
              Got it
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">

            {/* How it works */}
            <div className="flex items-start gap-3 p-4 rounded-xl"
              style={{ background:'#f0faf6' }}>
              <Shield size={16} className="flex-shrink-0 mt-0.5" style={{ color:'#1D9E75' }} />
              <div className="text-xs text-gray-600 leading-relaxed">
                <p className="font-semibold text-gray-800 mb-1">How claiming works</p>
                <ol className="list-decimal list-inside space-y-1 text-gray-600">
                  <li>Submit your claim with a message explaining your ownership</li>
                  <li>Our team verifies your claim within 24 hours</li>
                  <li>Once approved, the listing is linked to your account</li>
                  <li>You get full control to edit, add photos, and respond to reviews</li>
                </ol>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-100">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                Why do you own this business?
                <span className="font-normal normal-case ml-1">(optional but helps us verify faster)</span>
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="e.g. I am the founder of this business and have been operating since 2018. My phone number on the listing is my personal number."
                rows={4}
                maxLength={500}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-400 text-right mt-1">{message.length}/500</p>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90 transition-opacity"
              style={{ background:'#1D9E75' }}>
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Submitting…</>
                : 'Submit claim'
              }
            </button>

            <p className="text-xs text-gray-400 text-center">
              By submitting, you confirm you are the legitimate owner of this business.
              False claims may result in account suspension.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}