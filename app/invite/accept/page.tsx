'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Mail, AlertCircle, CheckCircle2 } from 'lucide-react'

interface InviteRow {
  id:          string
  email:       string
  role_label:  string
  business_id: string | null
  status:      string
  expires_at:  string
}

function AcceptInviteContent() {
  const router   = useRouter()
  const params   = useSearchParams()
  const supabase = createClient()
  const token    = params.get('token')

  const [loading, setLoading] = useState(true)
  const [invite,  setInvite]  = useState<InviteRow | null>(null)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!token) {
      setError('Missing invite token')
      setLoading(false)
      return
    }

    supabase
      .from('invites')
      .select('id, email, role_label, business_id, status, expires_at')
      .eq('token', token)
      .single()
      .then(({ data, error: err }: { data: InviteRow | null; error: unknown }) => {
        if (err || !data) {
          setError('Invite not found')
        } else if (data.status === 'accepted') {
          setError('This invite has already been accepted')
        } else if (new Date(data.expires_at) < new Date()) {
          setError('This invite has expired')
        } else {
          setInvite(data)
        }
        setLoading(false)
      })
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={28} className="animate-spin" style={{ color: '#1D9E75' }} />
      </div>
    )
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-50">
            <AlertCircle size={22} className="text-red-500" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">Invalid invite</h1>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <Link href="/auth/signup"
            className="inline-block text-sm font-semibold text-white px-6 py-2.5 rounded-xl"
            style={{ background: '#1D9E75' }}>
            Sign up instead
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md w-full">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#E1F5EE' }}>
          <Mail size={24} style={{ color: '#0F6E56' }} />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 text-center mb-2">You're invited!</h1>
        <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
          You've been invited to join Markeetee as a <strong>{invite.role_label}</strong>.
          Create your account with <strong>{invite.email}</strong> to accept.
        </p>
        <Link href={`/auth/signup?invite_token=${token}&email=${encodeURIComponent(invite.email)}`}
          className="block text-center text-sm font-semibold text-white py-2.5 rounded-xl"
          style={{ background: '#1D9E75' }}>
          Create account & accept
        </Link>
        <p className="text-center text-xs text-gray-400 mt-4">
          Already have an account?{' '}
          <Link href={`/auth/login?invite_token=${token}`} className="font-medium" style={{ color: '#0F6E56' }}>
            Sign in to accept
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={28} className="animate-spin" style={{ color: '#1D9E75' }} />
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  )
}