'use client'
import { useState } from 'react'
import { Mail, MessageSquare, MapPin, Send, Loader2 } from 'lucide-react'

export default function ContactPage() {
  const [form,    setForm]    = useState({ name:'', email:'', subject:'', message:'' })
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    // In production wire to Resend or a form service
    await new Promise(r => setTimeout(r, 1000))
    setDone(true); setLoading(false)
  }

  const contacts = [
    { icon: Mail,         label: 'Email us',      value: 'hello@markeetee.com', href: 'mailto:hello@markeetee.com' },
    { icon: MessageSquare,label: 'WhatsApp',       value: '+1 (713) 000-0000',   href: 'https://wa.me/17130000000' },
    { icon: MapPin,       label: 'Based in',       value: 'Houston, TX, USA',    href: null },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Get in touch</h1>
        <p className="text-gray-500">We'd love to hear from you — whether you're a business owner, a customer, or just curious.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact info */}
        <div className="space-y-4">
          {contacts.map(({ icon:Icon, label, value, href }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:'#E1F5EE' }}>
                <Icon size={18} style={{ color:'#085041' }} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                {href
                  ? <a href={href} className="text-sm font-medium text-gray-800 hover:text-green-700 transition-colors">{value}</a>
                  : <p className="text-sm font-medium text-gray-800">{value}</p>
                }
              </div>
            </div>
          ))}

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Response time</p>
            <p className="text-sm text-gray-700">We aim to respond to all enquiries within <strong>24 hours</strong> on business days.</p>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          {done ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="font-bold text-gray-900 mb-2">Message sent!</h3>
              <p className="text-sm text-gray-500">We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="font-semibold text-gray-900 mb-4">Send us a message</h2>
              {error && <div className="px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-100">{error}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[['Full name','name','text','Your name'],['Email','email','email','your@email.com']].map(([label,key,type,placeholder]) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{label}</label>
                    <input type={type} value={form[key as keyof typeof form]} onChange={e => setForm(f => ({...f,[key]:e.target.value}))}
                      placeholder={placeholder} required
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent" />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Subject</label>
                <select value={form.subject} onChange={e => setForm(f => ({...f,subject:e.target.value}))} required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent">
                  <option value="">Select a topic</option>
                  <option>Business listing enquiry</option>
                  <option>Report a problem</option>
                  <option>Partnership or press</option>
                  <option>General question</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Message</label>
                <textarea value={form.message} onChange={e => setForm(f => ({...f,message:e.target.value}))}
                  placeholder="Tell us how we can help…" rows={5} required minLength={10}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none" />
              </div>
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 text-sm font-semibold text-white px-6 py-2.5 rounded-xl disabled:opacity-60"
                style={{ background:'#1D9E75' }}>
                {loading ? <><Loader2 size={14} className="animate-spin" />Sending…</> : <><Send size={14} />Send message</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}