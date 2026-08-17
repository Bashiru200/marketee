'use client'
import { useState, useRef } from 'react'
import {
  Mail, Send, Loader2, CheckCircle2, AlertTriangle, X,
  Image as ImageIcon, Link as LinkIcon, Bold, Italic,
  List, Trash2, Plus, ExternalLink,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'

interface Props {
  recipientEmail: string
  recipientName:  string
  businessName:   string
  businessId?:    string
  /** Open immediately without needing the trigger button */
  startOpen?:     boolean
  /** Called after email is sent successfully */
  onSent?:        () => void
  /** Called when modal closes */
  onClose?:       () => void
  /** Custom trigger button label — defaults to "Send email" */
  triggerLabel?:  string
}

interface LinkButton {
  label: string
  url:   string
}

export default function SendEmailModal({
  recipientEmail, recipientName, businessName, businessId,
  startOpen = false, onSent, onClose, triggerLabel = 'Send email',
}: Props) {
  const supabase = createClient()
  const { user } = useAuth()

  const [open,        setOpen]      = useState(startOpen)
  const [subject,     setSubject]   = useState('')
  const [body,        setBody]      = useState('')
  const [images,      setImages]    = useState<string[]>([])
  const [links,       setLinks]     = useState<LinkButton[]>([])
  const [uploading,   setUploading] = useState(false)
  const [sending,     setSending]   = useState(false)
  const [done,        setDone]      = useState(false)
  const [error,       setError]     = useState('')

  const fileRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  // ── Handle image upload to Supabase Storage ──────────────────────────
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true); setError('')

    const uploads = await Promise.all(
      Array.from(files).slice(0, 5 - images.length).map(async file => {
        if (file.size > 5 * 1024 * 1024) {
          setError('Images must be under 5MB')
          return null
        }
        const path = `emails/${user?.id}/${Date.now()}-${file.name.replace(/\s/g, '-')}`
        const { error: err } = await supabase.storage
          .from('businesses')
          .upload(path, file, { cacheControl: '3600', upsert: false })
        if (err) { setError(err.message); return null }

        const { data: { publicUrl } } = supabase.storage
          .from('businesses')
          .getPublicUrl(path)
        return publicUrl
      })
    )

    setImages(prev => [...prev, ...uploads.filter(Boolean) as string[]])
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function removeImage(url: string) {
    setImages(imgs => imgs.filter(i => i !== url))
  }

  // ── Formatting helpers ───────────────────────────────────────────────
  function wrap(before: string, after: string) {
    const el = bodyRef.current
    if (!el) return
    const start = el.selectionStart
    const end   = el.selectionEnd
    const selected = body.slice(start, end)
    const newBody = body.slice(0, start) + before + (selected || 'text') + after + body.slice(end)
    setBody(newBody)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + before.length, start + before.length + (selected || 'text').length)
    }, 0)
  }

  // ── Add / remove link buttons ────────────────────────────────────────
  function addLink() {
    if (links.length >= 3) return
    setLinks([...links, { label: '', url: '' }])
  }
  function updateLink(i: number, field: 'label' | 'url', value: string) {
    setLinks(l => l.map((link, idx) => idx === i ? { ...link, [field]: value } : link))
  }
  function removeLink(i: number) {
    setLinks(l => l.filter((_, idx) => idx !== i))
  }

  // ── Send ─────────────────────────────────────────────────────────────
  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !body.trim()) return
    setSending(true); setError('')

    const validLinks = links.filter(l => l.label.trim() && l.url.trim())

    const res = await fetch('/api/send-email', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        to:           recipientEmail,
        toName:       recipientName,
        subject:      subject.trim(),
        body:         body.trim(),
        images,
        links:        validLinks,
        fromBusiness: businessName,
        businessId,
        userId:       user?.id,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to send')
      setSending(false)
      return
    }
    setDone(true); setSending(false)
    onSent?.()
  }

  function reset() {
    setOpen(false); setDone(false)
    setSubject(''); setBody('')
    setImages([]);  setLinks([])
    setError('')
    onClose?.()
  }

  if (!open) {
    // If startOpen was true and modal closed, don't show trigger
    if (startOpen) return null
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm font-medium border border-gray-200 px-4 py-2.5 rounded-xl hover:border-green-300 hover:text-green-700 transition-colors text-gray-600">
        <Mail size={15} /> {triggerLabel}
      </button>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)' }}
      onClick={reset}>
      <div
        className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background:'#E1F5EE' }}>
              <Mail size={17} style={{ color:'#085041' }} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900">Send email</h3>
              <p className="text-xs text-gray-400 truncate">To: {recipientName} · {recipientEmail}</p>
            </div>
          </div>
          <button onClick={reset} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center flex-shrink-0">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {done ? (
          <div className="p-10 text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background:'#E1F5EE' }}>
              <CheckCircle2 size={28} style={{ color:'#1D9E75' }} />
            </div>
            <h4 className="font-bold text-xl text-gray-900 mb-2">Email sent!</h4>
            <p className="text-sm text-gray-500 mb-6">
              Your message was delivered to {recipientName}
            </p>
            <button onClick={reset}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background:'#1D9E75' }}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-4">

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  Subject *
                </label>
                <input value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Special offer just for you"
                  required maxLength={150}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent" />
              </div>

              {/* Body with format toolbar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Message *
                  </label>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => wrap('**', '**')}
                      className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                      title="Bold">
                      <Bold size={13} className="text-gray-500" />
                    </button>
                    <button type="button" onClick={() => wrap('_', '_')}
                      className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                      title="Italic">
                      <Italic size={13} className="text-gray-500" />
                    </button>
                    <button type="button" onClick={() => wrap('\n• ', '')}
                      className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                      title="List item">
                      <List size={13} className="text-gray-500" />
                    </button>
                  </div>
                </div>
                <textarea ref={bodyRef} value={body} onChange={e => setBody(e.target.value)}
                  placeholder="Write your message here. Use **bold**, _italic_, or bullet points."
                  required rows={8}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none" />
                <p className="text-[10px] text-gray-400 mt-1">
                  Supports **bold**, _italic_, and • bullets · {body.length} chars
                </p>
              </div>

              {/* Images */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  <ImageIcon size={11} className="inline mr-1" /> Photos ({images.length}/5)
                </label>

                {images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                    {images.map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeImage(url)}
                          className="absolute top-1 right-1 w-6 h-6 bg-black/60 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={12} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {images.length < 5 && (
                  <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-4 cursor-pointer hover:border-green-300 hover:bg-green-50/30 transition-colors">
                    <input ref={fileRef} type="file" accept="image/*" multiple
                      onChange={handleImageUpload} disabled={uploading}
                      className="hidden" />
                    {uploading ? (
                      <><Loader2 size={14} className="animate-spin text-gray-400" />
                        <span className="text-sm text-gray-500">Uploading…</span></>
                    ) : (
                      <><ImageIcon size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-500">Click to add photos</span>
                        <span className="text-xs text-gray-300">(max 5MB each)</span></>
                    )}
                  </label>
                )}
              </div>

              {/* Link buttons */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    <LinkIcon size={11} className="inline mr-1" /> Link buttons ({links.length}/3)
                  </label>
                  {links.length < 3 && (
                    <button type="button" onClick={addLink}
                      className="text-xs font-semibold flex items-center gap-1"
                      style={{ color:'#1D9E75' }}>
                      <Plus size={11} /> Add link
                    </button>
                  )}
                </div>

                {links.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Add clickable buttons like "View menu" or "Book now"</p>
                ) : (
                  <div className="space-y-2">
                    {links.map((link, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <input value={link.label}
                            onChange={e => updateLink(i, 'label', e.target.value)}
                            placeholder="Button label"
                            maxLength={30}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent" />
                          <input value={link.url}
                            onChange={e => updateLink(i, 'url', e.target.value)}
                            placeholder="https://..."
                            type="url"
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent" />
                        </div>
                        <button type="button" onClick={() => removeLink(i)}
                          className="w-9 h-9 rounded-xl hover:bg-red-50 flex items-center justify-center text-red-400 hover:text-red-600 flex-shrink-0">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-100">
                  <AlertTriangle size={14} /> {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 p-6 flex items-center justify-between flex-wrap gap-3">
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <ExternalLink size={11} /> Sent from <strong className="ml-1">{businessName}</strong>
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={reset}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit"
                  disabled={sending || !subject.trim() || !body.trim() || uploading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                  style={{ background:'#1D9E75' }}>
                  {sending
                    ? <><Loader2 size={14} className="animate-spin" /> Sending…</>
                    : <><Send size={14} /> Send email</>}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}