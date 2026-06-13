'use client'
import { useState } from 'react'
import {
  Mail, Send, Loader2, CheckCircle2, AlertTriangle, X
} from 'lucide-react'
import { useAuth } from '@/lib/auth'

interface Props {
  recipientEmail: string
  recipientName:  string
  businessName:   string
}

export default function SendEmailModal({ recipientEmail, recipientName, businessName, }: Props) {
  const { user } = useAuth()
  const [open,    setOpen]    = useState(false)
  const [subject, setSubject] = useState('')
  const [body,    setBody]    = useState('')
  const [sending, setSending] = useState(false)
  const [done,    setDone]    = useState(false)
  const [error,   setError]   = useState('')

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !body.trim()) return
    setSending(true); setError('')

    const res = await fetch('/api/send-email', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        to:           recipientEmail,
        toName:       recipientName,
        subject:      subject.trim(),
        body:         body.trim(),
        fromBusiness: businessName,
        userId:       user?.id,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to send')
      setSending(false)
      return
    }

    setDone(true)
    setSending(false)
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="flex items-center gap-2 text-sm font-medium border border-gray-200 px-4 py-2.5 rounded-xl hover:border-green-300 hover:text-green-700 transition-colors text-gray-600"
    >
      <Mail size={15} /> Send email
    </button>
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)' }}
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'#E1F5EE' }}>
              <Mail size={16} style={{ color:'#085041' }} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Send email</h3>
              <p className="text-xs text-gray-400">To: {recipientName} · {recipientEmail}</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>

        {done ? (
          <div className="p-10 text-center">
            <CheckCircle2 size={36} className="mx-auto mb-3" style={{ color:'#1D9E75' }} />
            <h4 className="font-bold text-gray-900 mb-2">Email sent!</h4>
            <p className="text-sm text-gray-500 mb-5">Your message has been delivered to {recipientName}.</p>
            <button onClick={() => { setOpen(false); setDone(false); setSubject(''); setBody('') }}
              className="text-sm font-medium text-gray-600 hover:text-gray-800">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="p-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-100">
                <AlertTriangle size={14} className="flex-shrink-0" />
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Subject *</label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Your recent enquiry about our products"
                required maxLength={150}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Message *</label>
              <textarea value={body} onChange={e => setBody(e.target.value)}
                placeholder={`Hi ${recipientName},\n\nThank you for your interest in ${businessName}...`}
                required rows={6} minLength={10}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none" />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={sending || !subject.trim() || !body.trim()}
                className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold text-white py-2.5 rounded-xl disabled:opacity-50"
                style={{ background:'#1D9E75' }}>
                {sending ? <><Loader2 size={14} className="animate-spin" /> Sending…</> : <><Send size={14} /> Send message</>}
              </button>
              <button type="button" onClick={() => setOpen(false)}
                className="px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">
                Cancel
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center">
              This email will be sent from Markeetee on behalf of {businessName}
            </p>
          </form>
        )}
      </div>
    </div>
  )
}