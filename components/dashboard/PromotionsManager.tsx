// components/dashboard/PromotionsManager.tsx
'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Tag, Loader2, Save, X, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Promotion {
  id:           string
  title:        string
  description:  string | null
  discount_pct: number | null
  code:         string | null
  starts_at:    string | null
  ends_at:      string | null
  active:       boolean
}

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:border-transparent"
const labelCls = "block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5"

const EMPTY = {
  title: '', description: '', discount_pct: '', code: '',
  starts_at: '', ends_at: '', active: true,
}

export default function PromotionsManager({ businessId }: { businessId: string }) {
  const supabase = createClient()
  const [promos,    setPromos]   = useState<Promotion[]>([])
  const [loading,   setLoading]  = useState(true)
  const [showForm,  setShowForm] = useState(false)
  const [form,      setForm]     = useState({ ...EMPTY })
  const [saving,    setSaving]   = useState(false)
  const [deleting,  setDeleting] = useState<string | null>(null)
  const [toast,     setToast]    = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok = true) { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500) }
  function upd(k: string, v: any) { setForm(f => ({ ...f, [k]: v })) }

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('promotions').select('*')
        .eq('business_id', businessId).order('created_at', { ascending: false })
      setPromos(data ?? [])
      setLoading(false)
    }
    load()
  }, [businessId])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { showToast('Title is required', false); return }
    setSaving(true)
    const payload = {
      title:        form.title.trim(),
      description:  form.description?.trim() || null,
      discount_pct: form.discount_pct ? parseInt(form.discount_pct) : null,
      code:         form.code?.trim().toUpperCase() || null,
      starts_at:    form.starts_at || null,
      ends_at:      form.ends_at   || null,
      active:       form.active,
    }
    const { data, error } = await supabase.from('promotions')
      .insert({ ...payload, business_id: businessId }).select().single()
    if (error) { showToast('Failed to create promotion', false); setSaving(false); return }
    setPromos(ps => [data, ...ps])
    setForm({ ...EMPTY })
    setShowForm(false)
    showToast('Promotion created!')
    setSaving(false)
  }

  async function toggleActive(p: Promotion) {
    await supabase.from('promotions').update({ active: !p.active }).eq('id', p.id)
    setPromos(ps => ps.map(x => x.id === p.id ? { ...x, active: !p.active } : x))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this promotion?')) return
    setDeleting(id)
    await supabase.from('promotions').delete().eq('id', id)
    setPromos(ps => ps.filter(p => p.id !== id))
    setDeleting(null)
    showToast('Promotion deleted')
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium
          ${toast.ok ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-700 border border-red-100'}`}>
          {toast.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900">Promotions</h3>
          <p className="text-xs text-gray-400">{promos.filter(p => p.active).length} active</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-xl"
          style={{ background: '#1D9E75' }}>
          <Plus size={14} /> Add promotion
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-gray-400">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      ) : promos.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
          <Tag size={28} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-400 mb-4">No promotions yet — run a deal to attract customers</p>
          <button onClick={() => setShowForm(true)}
            className="text-sm font-semibold text-white px-4 py-2 rounded-xl"
            style={{ background: '#1D9E75' }}>
            Create first promotion
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {promos.map(p => (
            <div key={p.id} className="flex items-start gap-3 p-4 bg-white border border-gray-100 rounded-2xl hover:border-green-200 transition-colors">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: p.active ? '#FEF3C7' : '#F3F4F6' }}>
                <Tag size={15} style={{ color: p.active ? '#D97706' : '#9CA3AF' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-gray-900">{p.title}</p>
                  {p.discount_pct && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: '#FEF3C7', color: '#92400E' }}>
                      {p.discount_pct}% OFF
                    </span>
                  )}
                  {!p.active && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      Inactive
                    </span>
                  )}
                </div>
                {p.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{p.description}</p>}
                <div className="flex items-center gap-3 mt-1">
                  {p.code && (
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg"
                      style={{ background: '#E1F5EE', color: '#085041' }}>
                      {p.code}
                    </span>
                  )}
                  {p.ends_at && (
                    <span className="text-[10px] text-gray-400">
                      Ends {new Date(p.ends_at).toLocaleDateString('en-US', { month:'short', day:'numeric' })}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => toggleActive(p)}
                  className="p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  {p.active
                    ? <Eye size={14} style={{ color: '#1D9E75' }} />
                    : <EyeOff size={14} className="text-gray-300" />}
                </button>
                <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id}
                  className="p-2 rounded-lg hover:bg-red-50 transition-colors">
                  {deleting === p.id
                    ? <Loader2 size={14} className="animate-spin text-red-400" />
                    : <Trash2 size={14} className="text-red-400" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">New promotion</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className={labelCls}>Title *</label>
                <input type="text" value={form.title} onChange={e => upd('title', e.target.value)}
                  placeholder="e.g. Weekend Flash Sale, Eid Special" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea value={form.description} onChange={e => upd('description', e.target.value)}
                  placeholder="Tell customers what the deal is…" rows={2}
                  className={`${inputCls} resize-none`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Discount %</label>
                  <input type="number" min="1" max="100" value={form.discount_pct}
                    onChange={e => upd('discount_pct', e.target.value)}
                    placeholder="e.g. 20" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Promo code</label>
                  <input type="text" value={form.code} onChange={e => upd('code', e.target.value.toUpperCase())}
                    placeholder="e.g. SAVE20" className={`${inputCls} font-mono`} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Start date</label>
                  <input type="date" value={form.starts_at} onChange={e => upd('starts_at', e.target.value)}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>End date</label>
                  <input type="date" value={form.ends_at} onChange={e => upd('ends_at', e.target.value)}
                    className={inputCls} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-white rounded-xl text-sm font-semibold disabled:opacity-60"
                  style={{ background: '#1D9E75' }}>
                  {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> Create promotion</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}