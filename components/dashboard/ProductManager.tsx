'use client'
import { useState, useEffect, useRef } from 'react'
import {
  Plus, Pencil, Trash2, X, Loader2, Save,
  Tag, DollarSign, Package, Eye, EyeOff,
  Megaphone, CheckCircle2, AlertCircle, Image as ImageIcon
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'

interface Product {
  id:          string
  name:        string
  description: string | null
  price:       number
  sale_price:  number | null
  sale_active: boolean
  sale_label:  string | null
  sale_ends_at:string | null
  image_url:   string | null
  available:   boolean
  like_count:  number
  rating_avg:  number
}

const inputCls  = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:border-transparent transition-all"
const labelCls  = "block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5"

const EMPTY: Omit<Product, 'id' | 'like_count' | 'rating_avg'> = {
  name: '', description: '', price: 0,
  sale_price: null, sale_active: false, sale_label: null, sale_ends_at: null,
  image_url: null, available: true,
}

interface Props {
  businessId: string
}

export default function ProductManager({ businessId }: Props) {
  const supabase = createClient()
  const { user } = useAuth()

  const [products,  setProducts]  = useState<Product[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [editing,   setEditing]   = useState<Product | null>(null)
  const [form,      setForm]      = useState({ ...EMPTY })
  const [saving,    setSaving]    = useState(false)
  const [deleting,  setDeleting]  = useState<string | null>(null)
  const [toast,     setToast]     = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [imgFile,   setImgFile]   = useState<File | null>(null)
  const [imgPreview,setImgPreview]= useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Sale notification state
  const [notifyModal,  setNotifyModal]  = useState<Product | null>(null)
  const [notifyMsg,    setNotifyMsg]    = useState('')
  const [notifySending,setNotifySending]= useState(false)
  const [notifyResult, setNotifyResult] = useState<{ sent: number } | null>(null)

  function upd(k: string, v: any) { setForm(f => ({ ...f, [k]: v })) }

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Load products ──────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('products')
        .select('id,name,description,price,sale_price,sale_active,sale_label,sale_ends_at,image_url,available,like_count,rating_avg')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
      setProducts(data ?? [])
      setLoading(false)
    }
    load()
  }, [businessId])

  // ── Open add form ──────────────────────────────────────────────────────
  function openAdd() {
    setEditing(null)
    setForm({ ...EMPTY })
    setImgFile(null); setImgPreview(null)
    setShowForm(true)
  }

  // ── Open edit form ─────────────────────────────────────────────────────
  function openEdit(p: Product) {
    setEditing(p)
    setForm({
      name: p.name, description: p.description ?? '',
      price: p.price, sale_price: p.sale_price,
      sale_active: p.sale_active, sale_label: p.sale_label ?? '',
      sale_ends_at: p.sale_ends_at ? p.sale_ends_at.slice(0,10) : null,
      image_url: p.image_url, available: p.available,
    })
    setImgFile(null)
    setImgPreview(p.image_url)
    setShowForm(true)
  }

  // ── Image upload ───────────────────────────────────────────────────────
  async function uploadImage(): Promise<string | null> {
    if (!imgFile) return form.image_url
    const ext  = imgFile.name.split('.').pop()
    const path = `products/${businessId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('business-images').upload(path, imgFile)
    if (error) { showToast('Image upload failed', 'error'); return form.image_url }
    const { data } = supabase.storage.from('business-images').getPublicUrl(path)
    return data.publicUrl
  }

  // ── Save (create or update) ────────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { showToast('Product name is required', 'error'); return }
    if (!form.price || form.price <= 0) { showToast('Enter a valid price', 'error'); return }
    setSaving(true)

    const imageUrl = await uploadImage()

    const payload = {
      name:         form.name.trim(),
      description:  form.description?.trim() || null,
      price:        Number(form.price),
      sale_price:   form.sale_active && form.sale_price ? Number(form.sale_price) : null,
      sale_active:  form.sale_active,
      sale_label:   form.sale_active && form.sale_label ? form.sale_label.trim() : null,
      sale_ends_at: form.sale_active && form.sale_ends_at ? form.sale_ends_at : null,
      image_url:    imageUrl,
      available:    form.available,
    }

    if (editing) {
      const { error } = await supabase.from('products').update(payload).eq('id', editing.id)
      if (error) { showToast('Failed to update product', 'error'); setSaving(false); return }
      setProducts(ps => ps.map(p => p.id === editing.id ? { ...p, ...payload } : p))
      showToast('Product updated')
    } else {
      const { data, error } = await supabase.from('products')
        .insert({ ...payload, business_id: businessId })
        .select()
        .single()
      if (error) { showToast('Failed to add product', 'error'); setSaving(false); return }
      setProducts(ps => [{ ...data, like_count: 0, rating_avg: 0 }, ...ps])
      showToast('Product added!')
    }

    setSaving(false)
    setShowForm(false)
    setEditing(null)
  }

  // ── Delete ─────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    if (!confirm('Delete this product? This cannot be undone.')) return
    setDeleting(id)
    await supabase.from('products').delete().eq('id', id)
    setProducts(ps => ps.filter(p => p.id !== id))
    setDeleting(null)
    showToast('Product deleted')
  }

  // ── Toggle availability ────────────────────────────────────────────────
  async function toggleAvailable(p: Product) {
    const newVal = !p.available
    await supabase.from('products').update({ available: newVal }).eq('id', p.id)
    setProducts(ps => ps.map(x => x.id === p.id ? { ...x, available: newVal } : x))
  }

  // ── Send sale notification ─────────────────────────────────────────────
  async function sendNotification() {
    if (!notifyModal) return
    setNotifySending(true)
    const res = await fetch('/api/sale-notification', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        businessId,
        ownerId:       user!.id,
        productId:     notifyModal.id,
        productName:   notifyModal.name,
        saleLabel:     notifyModal.sale_label ?? 'Sale',
        originalPrice: notifyModal.price,
        salePrice:     notifyModal.sale_price,
        message:       notifyMsg.trim(),
      }),
    })
    const data = await res.json()
    setNotifySending(false)
    if (res.ok) {
      setNotifyResult({ sent: data.sent })
    } else {
      showToast(data.error ?? 'Failed to send', 'error')
      setNotifyModal(null)
    }
  }

  const discount = (p: Product) =>
    p.sale_price ? Math.round(((p.price - p.sale_price) / p.price) * 100) : 0

  return (
    <div className="space-y-4">

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium
          ${toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-700 border border-red-100'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900">Products</h3>
          <p className="text-xs text-gray-400">{products.length} listed</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-xl"
          style={{ background: '#1D9E75' }}>
          <Plus size={15} /> Add product
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 py-8 justify-center text-gray-400">
          <Loader2 size={18} className="animate-spin" /> Loading products…
        </div>
      )}

      {/* Empty */}
      {!loading && products.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
          <Package size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-500 mb-1">No products yet</p>
          <p className="text-xs text-gray-400 mb-4">Add products for customers to browse and enquire about</p>
          <button onClick={openAdd}
            className="text-sm font-semibold text-white px-4 py-2 rounded-xl"
            style={{ background: '#1D9E75' }}>
            Add first product
          </button>
        </div>
      )}

      {/* Product list */}
      {!loading && products.map(p => (
        <div key={p.id}
          className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-2xl hover:border-green-200 transition-colors">

          {/* Thumbnail */}
          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
            {p.image_url
              ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-gray-300"><Package size={20} /></div>
            }
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm text-gray-900">{p.name}</p>
              {p.sale_active && p.sale_price && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: '#FEF3C7', color: '#92400E' }}>
                  {discount(p)}% OFF
                </span>
              )}
              {!p.available && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  Out of stock
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {p.sale_active && p.sale_price ? (
                <>
                  <span className="text-xs text-gray-400 line-through">${p.price.toFixed(2)}</span>
                  <span className="text-sm font-bold" style={{ color: '#1D9E75' }}>${p.sale_price.toFixed(2)}</span>
                </>
              ) : (
                <span className="text-sm font-bold text-gray-700">${p.price.toFixed(2)}</span>
              )}
              {p.like_count > 0 && (
                <span className="text-xs text-gray-400">· ❤️ {p.like_count}</span>
              )}
              {p.rating_avg > 0 && (
                <span className="text-xs text-gray-400">· ⭐ {Number(p.rating_avg).toFixed(1)}</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Notify customers (only if sale active) */}
            {p.sale_active && p.sale_price && (
              <button onClick={() => { setNotifyModal(p); setNotifyMsg(''); setNotifyResult(null) }}
                title="Notify customers of sale"
                className="p-2 rounded-lg hover:bg-yellow-50 transition-colors">
                <Megaphone size={15} style={{ color: '#D97706' }} />
              </button>
            )}
            {/* Toggle availability */}
            <button onClick={() => toggleAvailable(p)}
              title={p.available ? 'Mark out of stock' : 'Mark available'}
              className="p-2 rounded-lg hover:bg-gray-50 transition-colors">
              {p.available
                ? <Eye size={15} className="text-gray-400" />
                : <EyeOff size={15} className="text-gray-300" />
              }
            </button>
            {/* Edit */}
            <button onClick={() => openEdit(p)}
              className="p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <Pencil size={15} className="text-gray-400" />
            </button>
            {/* Delete */}
            <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id}
              className="p-2 rounded-lg hover:bg-red-50 transition-colors">
              {deleting === p.id
                ? <Loader2 size={15} className="animate-spin text-red-400" />
                : <Trash2 size={15} className="text-red-400" />
              }
            </button>
          </div>
        </div>
      ))}

      {/* ── Add / Edit form modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-gray-900">{editing ? 'Edit product' : 'Add product'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">

              {/* Image upload */}
              <div>
                <label className={labelCls}>Product image</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-36 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-green-300 transition-colors overflow-hidden"
                  style={imgPreview ? { border: 'none' } : {}}>
                  {imgPreview
                    ? <img src={imgPreview} alt="Preview" className="w-full h-full object-cover" />
                    : <div className="text-center">
                        <ImageIcon size={24} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-xs text-gray-400">Click to upload image</p>
                      </div>
                  }
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    setImgFile(f)
                    setImgPreview(URL.createObjectURL(f))
                  }} />
              </div>

              {/* Name */}
              <div>
                <label className={labelCls}>Product name *</label>
                <input type="text" value={form.name} onChange={e => upd('name', e.target.value)}
                  placeholder="e.g. Jollof rice — family tray" className={inputCls} />
              </div>

              {/* Description */}
              <div>
                <label className={labelCls}>Description</label>
                <textarea value={form.description ?? ''} onChange={e => upd('description', e.target.value)}
                  placeholder="What's included, portions, ingredients…"
                  rows={3} className={`${inputCls} resize-none`} />
              </div>

              {/* Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Price *</label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="number" min="0" step="0.01" value={form.price || ''}
                      onChange={e => upd('price', e.target.value)}
                      placeholder="0.00" className={`${inputCls} pl-8`} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Availability</label>
                  <label className="flex items-center gap-2 h-10 cursor-pointer">
                    <input type="checkbox" checked={form.available}
                      onChange={e => upd('available', e.target.checked)}
                      className="accent-green-600 w-4 h-4" />
                    <span className="text-sm text-gray-700">In stock</span>
                  </label>
                </div>
              </div>

              {/* Sale section */}
              <div className="border border-amber-200 rounded-xl p-4" style={{ background: '#FFFBEB' }}>
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input type="checkbox" checked={form.sale_active}
                    onChange={e => upd('sale_active', e.target.checked)}
                    className="accent-amber-500 w-4 h-4" />
                  <span className="text-sm font-semibold text-amber-800">
                    <Tag size={13} className="inline mr-1" />Run a sale on this product
                  </span>
                </label>

                {form.sale_active && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Sale price *</label>
                        <div className="relative">
                          <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input type="number" min="0" step="0.01" value={form.sale_price ?? ''}
                            onChange={e => upd('sale_price', e.target.value)}
                            placeholder="0.00" className={`${inputCls} pl-8`} />
                        </div>
                        {form.sale_price && form.price && Number(form.sale_price) < Number(form.price) && (
                          <p className="text-xs text-amber-700 mt-1 font-medium">
                            {Math.round(((form.price - Number(form.sale_price)) / form.price) * 100)}% off
                          </p>
                        )}
                      </div>
                      <div>
                        <label className={labelCls}>Sale ends</label>
                        <input type="date" value={form.sale_ends_at ?? ''}
                          onChange={e => upd('sale_ends_at', e.target.value)}
                          className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Sale label</label>
                      <input type="text" value={form.sale_label ?? ''}
                        onChange={e => upd('sale_label', e.target.value)}
                        placeholder="e.g. Weekend special, Eid offer, Flash sale"
                        className={inputCls} />
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-white rounded-xl text-sm font-semibold disabled:opacity-60"
                  style={{ background: '#1D9E75' }}>
                  {saving
                    ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                    : <><Save size={14} /> {editing ? 'Save changes' : 'Add product'}</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Sale notification modal ── */}
      {notifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => { setNotifyModal(null); setNotifyResult(null) }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl"
            onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#FEF3C7' }}>
                  <Megaphone size={17} style={{ color: '#D97706' }} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Notify customers</h3>
                  <p className="text-xs text-gray-400">{notifyModal.name}</p>
                </div>
              </div>
              <button onClick={() => { setNotifyModal(null); setNotifyResult(null) }} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              {notifyResult ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#E1F5EE' }}>
                    <CheckCircle2 size={26} style={{ color: '#0F6E56' }} />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">Notifications sent!</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    {notifyResult.sent > 0
                      ? `${notifyResult.sent} customer${notifyResult.sent !== 1 ? 's' : ''} who saved your business have been notified.`
                      : 'No customers have saved your business yet — notifications will send as you grow your following.'
                    }
                  </p>
                  <button onClick={() => { setNotifyModal(null); setNotifyResult(null) }}
                    className="text-sm font-semibold text-white px-6 py-2.5 rounded-xl"
                    style={{ background: '#1D9E75' }}>
                    Done
                  </button>
                </div>
              ) : (
                <>
                  {/* Sale summary */}
                  <div className="p-4 rounded-xl mb-4" style={{ background: '#FEF3C7' }}>
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">Sale active</p>
                    <p className="text-sm text-amber-900">
                      <strong>{notifyModal.name}</strong> ·{' '}
                      <span className="line-through text-amber-700">${notifyModal.price.toFixed(2)}</span>{' '}
                      <span className="font-bold text-amber-900">${notifyModal.sale_price!.toFixed(2)}</span>{' '}
                      <span className="font-bold">({discount(notifyModal)}% off)</span>
                    </p>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                    An email will be sent to every customer who has saved your business on Markeetee,
                    with a direct WhatsApp link to reach you.
                  </p>

                  <div className="mb-4">
                    <label className={labelCls}>Add a personal message <span className="font-normal normal-case text-gray-400">(optional)</span></label>
                    <textarea
                      value={notifyMsg}
                      onChange={e => setNotifyMsg(e.target.value)}
                      placeholder="e.g. Available this weekend only! Come in or message us to order."
                      rows={3}
                      className={`${inputCls} resize-none`}
                    />
                  </div>

                  <button onClick={sendNotification} disabled={notifySending}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-white rounded-xl text-sm font-semibold disabled:opacity-60"
                    style={{ background: '#D97706' }}>
                    {notifySending
                      ? <><Loader2 size={14} className="animate-spin" /> Sending…</>
                      : <><Megaphone size={14} /> Send sale notification</>
                    }
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}