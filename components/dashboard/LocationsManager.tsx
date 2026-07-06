// components/dashboard/LocationsManager.tsx
'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, MapPin, Pencil, Loader2, Save, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Location {
  id:         string
  name:        string
  address:     string | null
  city:        string | null
  state:       string | null
  zip:         string | null
  phone:       string | null
  hours_open:  string | null
  is_primary:  boolean
}

const EMPTY = {
  name: '', address: '', city: '', state: '', zip: '', phone: '', hours_open: '', is_primary: false
}

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:border-transparent"
const labelCls = "block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5"

export default function LocationsManager({ businessId }: { businessId: string }) {
  const supabase = createClient()
  const [locations, setLocations] = useState<Location[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [editing,   setEditing]   = useState<Location | null>(null)
  const [form,      setForm]      = useState({ ...EMPTY })
  const [saving,    setSaving]    = useState(false)
  const [deleting,  setDeleting]  = useState<string | null>(null)
  const [toast,     setToast]     = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  function upd(k: string, v: any) { setForm(f => ({ ...f, [k]: v })) }

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('business_locations')
        .select('*')
        .eq('business_id', businessId)
        .order('is_primary', { ascending: false })
      setLocations(data ?? [])
      setLoading(false)
    }
    load()
  }, [businessId])

  function openAdd() {
    setEditing(null)
    setForm({ ...EMPTY })
    setShowForm(true)
  }

  function openEdit(l: Location) {
    setEditing(l)
    setForm({
      name:       l.name,
      address:    l.address ?? '',
      city:       l.city    ?? '',
      state:      l.state   ?? '',
      zip:        l.zip     ?? '',
      phone:      l.phone   ?? '',
      hours_open: l.hours_open ?? '',
      is_primary: l.is_primary,
    })
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { showToast('Location name is required', false); return }
    setSaving(true)

    const payload = {
      name:       form.name.trim(),
      address:    form.address?.trim()    || null,
      city:       form.city?.trim()       || null,
      state:      form.state?.trim()      || null,
      zip:        form.zip?.trim()        || null,
      phone:      form.phone?.trim()      || null,
      hours_open: form.hours_open?.trim() || null,
      is_primary: form.is_primary,
    }

    if (editing) {
      const { error } = await supabase.from('business_locations').update(payload).eq('id', editing.id)
      if (error) { showToast('Failed to update location', false); setSaving(false); return }
      setLocations(ls => ls.map(l => l.id === editing.id ? { ...l, ...payload } : l))
      showToast('Location updated!')
    } else {
      const { data, error } = await supabase.from('business_locations')
        .insert({ ...payload, business_id: businessId })
        .select().single()
      if (error) { showToast('Failed to add location', false); setSaving(false); return }
      setLocations(ls => [...ls, data])
      showToast('Location added!')
    }

    setSaving(false)
    setShowForm(false)
    setEditing(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this location?')) return
    setDeleting(id)
    await supabase.from('business_locations').delete().eq('id', id)
    setLocations(ls => ls.filter(l => l.id !== id))
    setDeleting(null)
    showToast('Location deleted')
  }

  async function setPrimary(id: string) {
    await supabase.from('business_locations').update({ is_primary: false }).eq('business_id', businessId)
    await supabase.from('business_locations').update({ is_primary: true  }).eq('id', id)
    setLocations(ls => ls.map(l => ({ ...l, is_primary: l.id === id })))
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
          <h3 className="font-bold text-gray-900">Locations</h3>
          <p className="text-xs text-gray-400">{locations.length}/5 locations used</p>
        </div>
        {locations.length < 5 && (
          <button onClick={openAdd}
            className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-xl"
            style={{ background: '#1D9E75' }}>
            <Plus size={14} /> Add location
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-gray-400">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      ) : locations.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
          <MapPin size={28} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-400 mb-1">No locations added yet</p>
          <p className="text-xs text-gray-400 mb-4">Add up to 5 branches or locations</p>
          <button onClick={openAdd}
            className="text-sm font-semibold text-white px-4 py-2 rounded-xl"
            style={{ background: '#1D9E75' }}>
            Add first location
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {locations.map(l => (
            <div key={l.id} className="flex items-start gap-3 p-4 bg-white border border-gray-100 rounded-2xl hover:border-green-200 transition-colors">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: l.is_primary ? '#E1F5EE' : '#F3F4F6' }}>
                <MapPin size={15} style={{ color: l.is_primary ? '#1D9E75' : '#9CA3AF' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-gray-900">{l.name}</p>
                  {l.is_primary && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: '#E1F5EE', color: '#085041' }}>Primary</span>
                  )}
                </div>
                {(l.address || l.city) && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {[l.address, l.city, l.state].filter(Boolean).join(', ')}
                  </p>
                )}
                {l.phone && <p className="text-xs text-gray-400 mt-0.5">{l.phone}</p>}
                {l.hours_open && <p className="text-xs text-gray-400 mt-0.5">⏰ {l.hours_open}</p>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!l.is_primary && (
                  <button onClick={() => setPrimary(l.id)}
                    className="text-xs font-medium px-2 py-1 rounded-lg hover:bg-green-50 transition-colors"
                    style={{ color: '#1D9E75' }}>
                    Set primary
                  </button>
                )}
                <button onClick={() => openEdit(l)}
                  className="p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <Pencil size={13} className="text-gray-400" />
                </button>
                <button onClick={() => handleDelete(l.id)} disabled={deleting === l.id}
                  className="p-2 rounded-lg hover:bg-red-50 transition-colors">
                  {deleting === l.id
                    ? <Loader2 size={13} className="animate-spin text-red-400" />
                    : <Trash2 size={13} className="text-red-400" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-gray-900">{editing ? 'Edit location' : 'Add location'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className={labelCls}>Location name *</label>
                <input type="text" value={form.name} onChange={e => upd('name', e.target.value)}
                  placeholder="e.g. Downtown Branch, Houston" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Address</label>
                <input type="text" value={form.address} onChange={e => upd('address', e.target.value)}
                  placeholder="123 Main St" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>City</label>
                  <input type="text" value={form.city} onChange={e => upd('city', e.target.value)}
                    placeholder="Houston" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>State</label>
                  <input type="text" value={form.state} onChange={e => upd('state', e.target.value)}
                    placeholder="TX" className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>ZIP code</label>
                  <input type="text" value={form.zip} onChange={e => upd('zip', e.target.value)}
                    placeholder="77001" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input type="text" value={form.phone} onChange={e => upd('phone', e.target.value)}
                    placeholder="+1 713 000 0000" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Hours</label>
                <input type="text" value={form.hours_open} onChange={e => upd('hours_open', e.target.value)}
                  placeholder="9:00 AM – 9:00 PM" className={inputCls} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_primary}
                  onChange={e => upd('is_primary', e.target.checked)}
                  className="accent-green-600 w-4 h-4" />
                <span className="text-sm text-gray-700">Set as primary location</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-white rounded-xl text-sm font-semibold disabled:opacity-60"
                  style={{ background: '#1D9E75' }}>
                  {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> {editing ? 'Save changes' : 'Add location'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}