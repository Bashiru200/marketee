'use client'
import { useEffect, useState } from 'react'
import {
  Mail, Send, Users, Building2, User,
  Loader2, CheckCircle2, Clock, ChevronDown,
  ChevronUp, AlertTriangle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'

type Audience = 'all' | 'owners' | 'customers'

interface SentEmail {
  id:         string
  subject:    string
  audience:   Audience
  sent_count: number
  created_at: string
}

interface AudienceCount {
  all:       number
  owners:    number
  customers: number
}

const AUDIENCE_OPTIONS: {
  value:  Audience
  label:  string
  desc:   string
  icon:   React.ElementType
  color:  string
}[] = [
  { value:'all',       label:'Everyone',         desc:'All registered users',           icon:Users,    color:'#085041' },
  { value:'owners',    label:'Business owners',  desc:'Users with a business listing',  icon:Building2,color:'#1D9E75' },
  { value:'customers', label:'Customers only',   desc:'Users browsing without a listing',icon:User,   color:'#8B5CF6' },
]

export default function BroadcastEmail() {
  const supabase = createClient()
  const { user } = useAuth()

  const [subject,    setSubject]    = useState('')
  const [body,       setBody]       = useState('')
  const [audience,   setAudience]   = useState<Audience>('owners')
  const [sending,    setSending]    = useState(false)
  const [success,    setSuccess]    = useState<{ sent: number } | null>(null)
  const [error,      setError]      = useState('')
  const [history,    setHistory]    = useState<SentEmail[]>([])
  const [counts,     setCounts]     = useState<AudienceCount>({ all:0, owners:0, customers:0 })
  const [showHistory,setShowHistory]= useState(false)
  const [confirmed,  setConfirmed]  = useState(false)

  useEffect(() => {
    loadCounts()
    loadHistory()
  }, [])

  async function loadCounts() {
    const [all, owners, customers] = await Promise.all([
      supabase.from('profiles').select('id', { count:'exact', head:true }),
      supabase.from('profiles').select('id', { count:'exact', head:true }).eq('role','owner'),
      supabase.from('profiles').select('id', { count:'exact', head:true }).eq('role','customer'),
    ])
    setCounts({
      all:       all.count       ?? 0,
      owners:    owners.count    ?? 0,
      customers: customers.count ?? 0,
    })
  }

  async function loadHistory() {
    const { data } = await supabase
      .from('broadcast_emails')
      .select('id, subject, audience, sent_count, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    setHistory((data ?? []) as SentEmail[])
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!confirmed) { setError('Please confirm you want to send this email'); return }
    setSending(true); setError('')

    const res = await fetch('/api/broadcast-email', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ subject, body, audience, adminId: user?.id }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Failed to send')
      setSending(false)
      return
    }

    setSuccess({ sent: data.sent })
    setSending(false)
    setSubject('')
    setBody('')
    setConfirmed(false)
    await loadHistory()
  }

  function reset() {
    setSuccess(null)
    setError('')
    setConfirmed(false)
  }

  const recipientCount = counts[audience]
  const selectedAudience = AUDIENCE_OPTIONS.find(o => o.value === audience)!

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h3 className="font-semibold text-gray-900">Broadcast email</h3>
        <p className="text-sm text-gray-400 mt-0.5">
          Send a message to all users or a specific group
        </p>
      </div>

      {/* Success state */}
      {success ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background:'#E1F5EE' }}>
            <CheckCircle2 size={28} style={{ color:'#1D9E75' }} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Emails sent!</h3>
          <p className="text-gray-500 mb-6">
            Successfully sent to <strong>{success.sent}</strong> recipient{success.sent !== 1 ? 's' : ''}
          </p>
          <button onClick={reset}
            className="text-sm font-semibold text-white px-6 py-2.5 rounded-xl"
            style={{ background:'#1D9E75' }}>
            Send another
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Compose form */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
            <h4 className="font-semibold text-gray-900 mb-5">Compose</h4>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-100 flex items-center gap-2">
                <AlertTriangle size={14} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSend} className="space-y-4">

              {/* Audience */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Audience
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {AUDIENCE_OPTIONS.map(opt => {
                    const Icon     = opt.icon
                    const selected = audience === opt.value
                    return (
                      <button key={opt.value} type="button"
                        onClick={() => setAudience(opt.value)}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center"
                        style={{
                          borderColor: selected ? opt.color : '#E5E7EB',
                          background:  selected ? '#f0faf6'  : '#FAFAFA',
                        }}>
                        <Icon size={18} style={{ color: selected ? opt.color : '#9CA3AF' }} />
                        <span className="text-xs font-semibold" style={{ color: selected ? opt.color : '#6B7280' }}>
                          {opt.label}
                        </span>
                        <span className="text-[10px] font-bold" style={{ color: selected ? opt.color : '#9CA3AF' }}>
                          {counts[opt.value]} users
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  Subject line *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Enter email subject"
                  required
                  maxLength={150}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  Message body *
                </label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Enter email message"
                  required
                  rows={8}
                  minLength={20}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-400 text-right mt-1">{body.length} chars</p>
              </div>

              {/* Confirmation checkbox */}
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl border"
                style={{ background:'#FFFBEB', borderColor:'#FDE68A' }}>
                <input
                  type="checkbox"
                  id="confirm"
                  checked={confirmed}
                  onChange={e => setConfirmed(e.target.checked)}
                  className="mt-0.5 flex-shrink-0 accent-amber-500"
                />
                <label htmlFor="confirm" className="text-sm cursor-pointer" style={{ color:'#92400E' }}>
                  I confirm I want to send this email to{' '}
                  <strong>{recipientCount} {selectedAudience.label.toLowerCase()}</strong>.
                  This action cannot be undone.
                </label>
              </div>

              <button
                type="submit"
                disabled={sending || !subject.trim() || !body.trim() || !confirmed}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                style={{ background:'#085041' }}
              >
                {sending ? (
                  <><Loader2 size={15} className="animate-spin" /> Sending to {recipientCount} recipients…</>
                ) : (
                  <><Send size={15} /> Send to {recipientCount} {selectedAudience.label.toLowerCase()}</>
                )}
              </button>
            </form>
          </div>

          {/* Sidebar — tips + history */}
          <div className="space-y-4">

            {/* Tips */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Mail size={15} style={{ color:'#1D9E75' }} />
                Tips
              </h4>
              <ul className="space-y-2.5">
                {[
                  'Keep subject lines under 60 characters for best open rates',
                  'Use double line breaks to separate paragraphs',
                  'Send to owners first before sending to everyone',
                  'Mention Markeetee in the opening line so users recognise you',
                  'Avoid all-caps and excessive exclamation marks — triggers spam filters',
                ].map(tip => (
                  <li key={tip} className="flex items-start gap-2 text-xs text-gray-500">
                    <span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full bg-green-400" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Audience counts */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h4 className="font-semibold text-gray-900 mb-3">Audience sizes</h4>
              <div className="space-y-3">
                {AUDIENCE_OPTIONS.map(opt => {
                  const Icon = opt.icon
                  return (
                    <div key={opt.value} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background:'#E1F5EE' }}>
                        <Icon size={13} style={{ color: opt.color }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{opt.label}</span>
                          <span className="text-sm font-bold text-gray-900">{counts[opt.value]}</span>
                        </div>
                        <p className="text-xs text-gray-400">{opt.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sent history */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Clock size={15} style={{ color:'#1D9E75' }} />
            <span className="font-semibold text-gray-900">Sent history</span>
            <span className="text-xs text-gray-400">({history.length})</span>
          </div>
          {showHistory ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
        </button>

        {showHistory && (
          history.length === 0 ? (
            <div className="px-5 pb-5 text-sm text-gray-400">No emails sent yet</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {history.map(h => (
                <div key={h.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background:'#E1F5EE' }}>
                    <Mail size={14} style={{ color:'#1D9E75' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{h.subject}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400 capitalize">{h.audience}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{h.sent_count} sent</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">
                        {new Date(h.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}