// components/dashboard/LeadInbox.tsx
// Dashboard inbox for owner to view/manage lead enquiries
'use client'
import { useState, useEffect } from 'react'
import { Mail, Loader2, Check, Phone, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Lead {
  id:         string
  name:       string
  email:      string
  phone:      string | null
  message:    string
  status:     string
  created_at: string
}

export default function LeadInbox({ businessId }: { businessId: string }) {
  const supabase = createClient()
  const [leads,   setLeads]   = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('lead_enquiries')
        .select('*').eq('business_id', businessId)
        .order('created_at', { ascending: false })
      setLeads(data ?? [])
      setLoading(false)
    }
    load()
  }, [businessId])

  async function markRead(id: string) {
    await supabase.from('lead_enquiries').update({ status: 'read' }).eq('id', id)
    setLeads(ls => ls.map(l => l.id === id ? { ...l, status: 'read' } : l))
  }

  const unread = leads.filter(l => l.status === 'new').length

  if (loading) return (
    <div className="flex items-center justify-center gap-2 py-8 text-gray-400">
      <Loader2 size={16} className="animate-spin" /> Loading enquiries…
    </div>
  )

  if (leads.length === 0) return (
    <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
      <Mail size={28} className="mx-auto mb-2 text-gray-300" />
      <p className="text-sm text-gray-400 mb-1">No enquiries yet</p>
      <p className="text-xs text-gray-400">Customers who fill out your enquiry form will appear here</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900">Lead Enquiries</h3>
          <p className="text-xs text-gray-400">
            {unread > 0 ? <span className="font-semibold" style={{ color: '#1D9E75' }}>{unread} new</span> : 'All read'} · {leads.length} total
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {leads.map(l => (
          <div key={l.id}
            className="bg-white rounded-2xl border p-5 transition-colors"
            style={{ borderColor: l.status === 'new' ? '#9FE1CB' : '#F3F4F6' }}>

            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">{l.name}</p>
                  {l.status === 'new' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: '#E1F5EE', color: '#085041' }}>New</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(l.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                </p>
              </div>
              {l.status === 'new' && (
                <button onClick={() => markRead(l.id)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex-shrink-0">
                  <Check size={12} /> Mark read
                </button>
              )}
            </div>

            {/* Message */}
            <p className="text-sm text-gray-700 leading-relaxed mb-3 bg-gray-50 rounded-xl p-3">
              {l.message}
            </p>

            {/* Contact actions */}
            <div className="flex gap-2 flex-wrap">
              <a href={`mailto:${l.email}?subject=Re: Your enquiry`}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 hover:border-green-300 transition-colors"
                style={{ color: '#1D9E75' }}>
                <Mail size={12} /> {l.email}
              </a>
              {l.phone && (
                <a href={`https://wa.me/${l.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 hover:border-green-300 transition-colors"
                  style={{ color: '#25D366' }}>
                  <Phone size={12} /> WhatsApp
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}