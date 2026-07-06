// components/ui/LeadEnquiryForm.tsx
// Shown on business detail page (Pro Store only)
'use client'
import { useState } from 'react'
import { Send, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  businessId:   string
  businessName: string
  productId?:   string
}

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:border-transparent"

export default function LeadEnquiryForm({ businessId, businessName, productId }: Props) {
  const supabase = createClient()
  const [form, setForm]     = useState({ name: '', email: '', phone: '', message: '' })
  const [submitting, setSub] = useState(false)
  const [done, setDone]     = useState(false)
  const [error, setError]   = useState('')

  function upd(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in all required fields.')
      return
    }
    setSub(true); setError('')
    const { error: err } = await supabase.from('lead_enquiries').insert({
      business_id: businessId,
      name:        form.name.trim(),
      email:       form.email.trim(),
      phone:       form.phone.trim() || null,
      message:     form.message.trim(),
      product_id:  productId ?? null,
    })
    if (err) { setError('Something went wrong. Try WhatsApp instead.'); setSub(false); return }
    // Also notify owner by email
    await fetch('/api/send-enquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId, businessName, ...form }),
    })
    setDone(true)
    setSub(false)
  }

  if (done) return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
      <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
        style={{ background: '#E1F5EE' }}>
        <CheckCircle2 size={22} style={{ color: '#1D9E75' }} />
      </div>
      <p className="font-bold text-gray-900 mb-1">Enquiry sent!</p>
      <p className="text-sm text-gray-500">
        {businessName} will get back to you at {form.email}.
      </p>
    </div>
  )

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <h3 className="font-bold text-gray-900 mb-4">Send an enquiry</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="text" value={form.name} onChange={e => upd('name', e.target.value)}
            placeholder="Your name *" className={inputCls} />
          <input type="email" value={form.email} onChange={e => upd('email', e.target.value)}
            placeholder="Your email *" className={inputCls} />
        </div>
        <input type="tel" value={form.phone} onChange={e => upd('phone', e.target.value)}
          placeholder="Phone number (optional)" className={inputCls} />
        <textarea value={form.message} onChange={e => upd('message', e.target.value)}
          placeholder="What would you like to know? *"
          rows={4} className={`${inputCls} resize-none`} />
        {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        <button type="submit" disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-3 text-white rounded-xl text-sm font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity"
          style={{ background: '#1D9E75' }}>
          {submitting
            ? <><Loader2 size={14} className="animate-spin" /> Sending…</>
            : <><Send size={14} /> Send enquiry</>}
        </button>
        <p className="text-xs text-gray-400 text-center">
          Your message goes directly to {businessName}. No spam.
        </p>
      </form>
    </div>
  )
}