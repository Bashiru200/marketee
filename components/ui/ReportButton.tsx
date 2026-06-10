'use client'
import { useState } from 'react'
import { Flag, X, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'
import Link from 'next/link'

interface Props {
  entityType: 'business' | 'review'
  entityId:   string
  label?:     string
}

const REASONS = [
  { value:'spam',         label:'Spam or fake listing'        },
  { value:'fake',         label:'Fake or misleading reviews'  },
  { value:'inappropriate',label:'Inappropriate content'       },
  { value:'wrong_info',   label:'Wrong information'           },
  { value:'offensive',    label:'Offensive or harmful'        },
  { value:'other',        label:'Other'                       },
]

export default function ReportButton({ entityType, entityId, label }: Props) {
  const supabase = createClient()
  const { user, isLoggedIn } = useAuth()

  const [open,    setOpen]    = useState(false)
  const [reason,  setReason]  = useState('')
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason) { setError('Please select a reason'); return }
    setLoading(true); setError('')

    const { error: err } = await supabase.from('reports').insert({
      entity_type: entityType,
      entity_id:   entityId,
      reason,
      details:     details.trim() || null,
      reported_by: user!.id,
      status:      'pending',
    })

    if (err) {
      if (err.code === '23505') {
        setError('You have already reported this content.')
      } else {
        setError(err.message)
      }
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
    >
      <Flag size={12} />
      {label ?? `Report ${entityType}`}
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)' }}
      onClick={() => setOpen(false)}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-50">
              <Flag size={16} className="text-red-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Report {entityType}</h3>
              <p className="text-xs text-gray-400">Help us keep Markeetee trustworthy</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>

        {/* Not logged in */}
        {!isLoggedIn ? (
          <div className="p-6 text-center">
            <p className="text-sm text-gray-600 mb-4">
              You need to be signed in to report content.
            </p>
            <Link href="/auth/login"
              className="inline-block text-sm font-semibold text-white px-5 py-2.5 rounded-xl"
              style={{ background:'#1D9E75' }}
              onClick={() => setOpen(false)}>
              Sign in
            </Link>
          </div>
        ) : done ? (
          <div className="p-8 text-center">
            <CheckCircle2 size={36} className="mx-auto mb-3" style={{ color:'#1D9E75' }} />
            <h4 className="font-bold text-gray-900 mb-2">Report submitted</h4>
            <p className="text-sm text-gray-500 mb-5">
              Thank you for helping keep Markeetee safe.
              Our team will review this within 24 hours.
            </p>
            <button onClick={() => { setOpen(false); setDone(false) }}
              className="text-sm font-medium text-gray-600 hover:text-gray-800">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-100">
                {error}
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Reason *
              </label>
              <div className="space-y-2">
                {REASONS.map(r => (
                  <label key={r.value}
                    className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all"
                    style={{
                      borderColor: reason === r.value ? '#EF4444' : '#E5E7EB',
                      background:  reason === r.value ? '#FEF2F2' : 'white',
                    }}>
                    <input type="radio" name="reason" value={r.value}
                      checked={reason === r.value}
                      onChange={() => setReason(r.value)}
                      className="accent-red-500" />
                    <span className="text-sm text-gray-700">{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Details */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                Additional details
                <span className="font-normal normal-case ml-1">(optional)</span>
              </label>
              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="Tell us more about the issue…"
                rows={3}
                maxLength={300}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={loading || !reason}
                className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold text-white py-2.5 rounded-xl disabled:opacity-50"
                style={{ background:'#EF4444' }}>
                {loading
                  ? <><Loader2 size={14} className="animate-spin" /> Submitting…</>
                  : <><Flag size={14} /> Submit report</>
                }
              </button>
              <button type="button" onClick={() => setOpen(false)}
                className="px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}