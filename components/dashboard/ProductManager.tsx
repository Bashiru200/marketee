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
  id:           string
  name:         string
  description:  string | null
  price:        number
  sale_price:   number | null
  sale_active:  boolean
  sale_label:   string | null
  sale_ends_at: string | null
  image_url:    string | null
  images:       string[] | null
  available:    boolean
  like_count:   number
  rating_avg:   number
}

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:border-transparent transition-all"
const labelCls = "block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5"

const EMPTY: Omit<Product, 'id' | 'like_count' | 'rating_avg'> = {
  name: '', description: '', price: 0,
  sale_price: null, sale_active: false, sale_label: null, sale_ends_at: null,
  image_url: null, images: [], available: true,
}

interface Props { businessId: string }

const MAX_EXTRA = 5

export default function ProductManager({ businessId }: Props) {
  const supabase = createClient()
  const { user } = useAuth()

  const [products,      setProducts]      = useState<Product[]>([])
  const [loading,       setLoading]       = useState(true)
  const [showForm,      setShowForm]      = useState(false)
  const [editing,       setEditing]       = useState<Product | null>(null)
  const [form,          setForm]          = useState({ ...EMPTY })
  const [saving,        setSaving]        = useState(false)
  const [deleting,      setDeleting]      = useState<string | null>(null)
  const [toast,         setToast]         = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // Cover image
  const [imgFile,       setImgFile]       = useState<File | null>(null)
  const [imgPreview,    setImgPreview]    = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Extra images
  const [extraFiles,    setExtraFiles]    = useState<File[]>([])
  const [extraPreviews, setExtraPreviews] = useState<string[]>([])   // existing URLs + new blob URLs
  const [existingImgCount, setExistingImgCount] = useState(0)        // how many are already-saved URLs
  const extraFileRef = useRef<HTMLInputElement>(null)

  // Inline edit
  const [expandedId,    setExpandedId]    = useState<string | null>(null)
  const [inlineForm,    setInlineForm]    = useState<typeof EMPTY>({ ...EMPTY })
  const [inlineSaving,  setInlineSaving]  = useState(false)
  const [inlineImgFile, setInlineImgFile] = useState<File | null>(null)
  const [inlinePreview, setInlinePreview] = useState<string | null>(null)
  const inlineFileRef = useRef<HTMLInputElement>(null)

  // Sale notify
  const [notifyModal,   setNotifyModal]   = useState<Product | null>(null)
  const [notifyMsg,     setNotifyMsg]     = useState('')
  const [notifySending, setNotifySending] = useState(false)
  const [notifyResult,  setNotifyResult]  = useState<{ sent: number } | null>(null)

  function upd(k: string, v: any) { setForm(f => ({ ...f, [k]: v })) }
  function updInline(k: string, v: any) { setInlineForm(f => ({ ...f, [k]: v })) }

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Load products ─────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('products')
        .select('id,name,description,price,sale_price,sale_active,sale_label,sale_ends_at,image_url,images,available,like_count,rating_avg')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
      setProducts(data ?? [])
      setLoading(false)
    }
    load()
  }, [businessId])

  // ── Upload helpers ────────────────────────────────────────────────────
  async function uploadCover(file: File, existingUrl: string | null): Promise<string | null> {
    const ext  = file.name.split('.').pop()
    const path = `products/${businessId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('business-images').upload(path, file)
    if (error) { showToast('Cover image upload failed', 'error'); return existingUrl }
    return supabase.storage.from('business-images').getPublicUrl(path).data.publicUrl
  }

  async function uploadExtras(newFiles: File[]): Promise<string[]> {
    const urls: string[] = []
    for (const file of newFiles) {
      const ext  = file.name.split('.').pop()
      const path = `products/${businessId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('business-images').upload(path, file)
      if (!error) {
        urls.push(supabase.storage.from('business-images').getPublicUrl(path).data.publicUrl)
      }
    }
    return urls
  }

  // ── Open add form ─────────────────────────────────────────────────────
  function openAdd() {
    setEditing(null)
    setForm({ ...EMPTY })
    setImgFile(null); setImgPreview(null)
    setExtraFiles([]); setExtraPreviews([]); setExistingImgCount(0)
    setShowForm(true)
  }

  // ── Open edit form ────────────────────────────────────────────────────
  function openEdit(p: Product) {
    setEditing(p)
    setForm({
      name:         p.name,
      description:  p.description ?? '',
      price:        p.price,
      sale_price:   p.sale_price,
      sale_active:  p.sale_active,
      sale_label:   p.sale_label ?? '',
      sale_ends_at: p.sale_ends_at ? p.sale_ends_at.slice(0, 10) : null,
      image_url:    p.image_url,
      images:       p.images ?? [],
      available:    p.available,
    })
    setImgFile(null)
    setImgPreview(p.image_url)
    const existing = p.images ?? []
    setExtraFiles([])
    setExtraPreviews([...existing])
    setExistingImgCount(existing.length)
    setShowForm(true)
  }

  // ── Save (add or edit) ────────────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim())            { showToast('Product name is required', 'error'); return }
    if (!form.price || form.price <= 0) { showToast('Enter a valid price', 'error');    return }
    setSaving(true)

    // Cover
    const imageUrl = imgFile
      ? await uploadCover(imgFile, form.image_url)
      : form.image_url

    // Extra — keep existing saved URLs + upload new files
    const savedUrls  = extraPreviews.slice(0, existingImgCount)       // already-saved URLs kept
    const newUploads = await uploadExtras(extraFiles)
    const finalImages = [...savedUrls, ...newUploads]

    const payload = {
      name:         form.name.trim(),
      description:  form.description?.trim() || null,
      price:        Number(form.price),
      sale_price:   form.sale_active && form.sale_price ? Number(form.sale_price) : null,
      sale_active:  form.sale_active,
      sale_label:   form.sale_active && form.sale_label ? form.sale_label.trim() : null,
      sale_ends_at: form.sale_active && form.sale_ends_at ? form.sale_ends_at : null,
      image_url:    imageUrl,
      images:       finalImages,
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
        .select().single()
      if (error) { showToast('Failed to add product', 'error'); setSaving(false); return }
      setProducts(ps => [{ ...data, like_count: 0, rating_avg: 0 }, ...ps])
      showToast('Product added!')
    }

    setSaving(false)
    setShowForm(false)
    setEditing(null)
  }

  // ── Inline edit ───────────────────────────────────────────────────────
  function openInlineEdit(p: Product) {
    if (expandedId === p.id) { setExpandedId(null); return }
    setExpandedId(p.id)
    setInlineForm({
      name:         p.name,
      description:  p.description ?? '',
      price:        p.price,
      sale_price:   p.sale_price,
      sale_active:  p.sale_active,
      sale_label:   p.sale_label ?? '',
      sale_ends_at: p.sale_ends_at ? p.sale_ends_at.slice(0, 10) : null,
      image_url:    p.image_url,
      images:       p.images ?? [],
      available:    p.available,
    })
    setInlineImgFile(null)
    setInlinePreview(p.image_url)
  }

  async function saveInline(productId: string) {
    if (!inlineForm.name.trim())              { showToast('Product name is required', 'error'); return }
    if (!inlineForm.price || Number(inlineForm.price) <= 0) { showToast('Enter a valid price', 'error'); return }
    setInlineSaving(true)

    const imageUrl = inlineImgFile
      ? await uploadCover(inlineImgFile, inlineForm.image_url)
      : inlineForm.image_url

    const payload = {
      name:         inlineForm.name.trim(),
      description:  inlineForm.description?.trim() || null,
      price:        Number(inlineForm.price),
      sale_price:   inlineForm.sale_active && inlineForm.sale_price ? Number(inlineForm.sale_price) : null,
      sale_active:  inlineForm.sale_active,
      sale_label:   inlineForm.sale_active && inlineForm.sale_label ? inlineForm.sale_label.trim() : null,
      sale_ends_at: inlineForm.sale_active && inlineForm.sale_ends_at ? inlineForm.sale_ends_at : null,
      image_url:    imageUrl,
      available:    inlineForm.available,
    }

    const { error } = await supabase.from('products').update(payload).eq('id', productId)
    if (error) { showToast('Failed to update product', 'error'); setInlineSaving(false); return }

    setProducts(ps => ps.map(p => p.id === productId ? { ...p, ...payload } : p))
    setInlineSaving(false)
    setExpandedId(null)
    setInlineImgFile(null)
    setInlinePreview(null)
    showToast('Product updated!')
  }

  // ── Delete ────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    if (!confirm('Delete this product? This cannot be undone.')) return
    setDeleting(id)
    await supabase.from('products').delete().eq('id', id)
    setProducts(ps => ps.filter(p => p.id !== id))
    setDeleting(null)
    showToast('Product deleted')
  }

  async function toggleAvailable(p: Product) {
    const newVal = !p.available
    await supabase.from('products').update({ available: newVal }).eq('id', p.id)
    setProducts(ps => ps.map(x => x.id === p.id ? { ...x, available: newVal } : x))
  }

  // ── Sale notify ───────────────────────────────────────────────────────
  async function sendNotification() {
    if (!notifyModal) return
    setNotifySending(true)
    const res = await fetch('/api/sale-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
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
    if (res.ok) setNotifyResult({ sent: data.sent })
    else { showToast(data.error ?? 'Failed to send', 'error'); setNotifyModal(null) }
  }

  const discount = (p: Product) =>
    p.sale_price ? Math.round(((p.price - p.sale_price) / p.price) * 100) : 0

  // ── Extra image helpers ───────────────────────────────────────────────
  function addExtraFiles(files: FileList | null) {
    if (!files) return
    const remaining = MAX_EXTRA - extraPreviews.length
    const toAdd = Array.from(files).slice(0, remaining)
    setExtraFiles(f => [...f, ...toAdd])
    setExtraPreviews(p => [...p, ...toAdd.map(f => URL.createObjectURL(f))])
  }

  function removeExtra(idx: number) {
    if (idx < existingImgCount) {
      // Removing a saved URL
      setExtraPreviews(p => p.filter((_, i) => i !== idx))
      setExistingImgCount(c => c - 1)
    } else {
      // Removing a new file
      const fileIdx = idx - existingImgCount
      setExtraFiles(f => f.filter((_, i) => i !== fileIdx))
      setExtraPreviews(p => p.filter((_, i) => i !== idx))
    }
  }

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
        <div key={p.id} className="space-y-0">
          <div
            className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-2xl hover:border-green-200 transition-colors"
            style={expandedId === p.id ? { borderColor: '#1D9E75', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 } : {}}>

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
                {(p.images?.length ?? 0) > 0 && (
                  <span className="text-[10px] text-gray-400">
                    📷 {(p.images?.length ?? 0) + 1} photos
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
                {p.like_count > 0 && <span className="text-xs text-gray-400">· ❤️ {p.like_count}</span>}
                {p.rating_avg > 0 && <span className="text-xs text-gray-400">· ⭐ {Number(p.rating_avg).toFixed(1)}</span>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {p.sale_active && p.sale_price && (
                <button onClick={() => { setNotifyModal(p); setNotifyMsg(''); setNotifyResult(null) }}
                  title="Notify customers of sale"
                  className="p-2 rounded-lg hover:bg-yellow-50 transition-colors">
                  <Megaphone size={15} style={{ color: '#D97706' }} />
                </button>
              )}
              <button onClick={() => toggleAvailable(p)}
                title={p.available ? 'Mark out of stock' : 'Mark available'}
                className="p-2 rounded-lg hover:bg-gray-50 transition-colors">
                {p.available ? <Eye size={15} className="text-gray-400" /> : <EyeOff size={15} className="text-gray-300" />}
              </button>
              <button onClick={() => openInlineEdit(p)}
                className="p-2 rounded-lg hover:bg-gray-50 transition-colors" title="Edit product">
                <Pencil size={15} style={{ color: expandedId === p.id ? '#1D9E75' : undefined }}
                  className={expandedId === p.id ? '' : 'text-gray-400'} />
              </button>
              <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id}
                className="p-2 rounded-lg hover:bg-red-50 transition-colors">
                {deleting === p.id
                  ? <Loader2 size={15} className="animate-spin text-red-400" />
                  : <Trash2 size={15} className="text-red-400" />}
              </button>
            </div>
          </div>

          {/* Inline edit panel */}
          {expandedId === p.id && (
            <div className="border border-gray-200 rounded-2xl overflow-hidden -mt-2" style={{ background: '#fafafa' }}>
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100" style={{ background: '#f0faf6' }}>
                <p className="text-sm font-semibold" style={{ color: '#085041' }}>Editing — {p.name}</p>
                <button onClick={() => setExpandedId(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={15} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                {/* Cover image */}
                <div className="flex items-start gap-4">
                  <div onClick={() => inlineFileRef.current?.click()}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 overflow-hidden flex-shrink-0 cursor-pointer hover:border-green-300 transition-colors">
                    {(inlinePreview && expandedId === p.id)
                      ? <img src={inlinePreview} alt="" className="w-full h-full object-cover" />
                      : p.image_url
                      ? <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={18} className="text-gray-300" /></div>
                    }
                  </div>
                  <div className="flex-1 space-y-3">
                    <input type="text" value={inlineForm.name} onChange={e => updInline('name', e.target.value)}
                      placeholder="Product name *" className={inputCls} />
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="number" min="0" step="0.01" value={inlineForm.price || ''}
                          onChange={e => updInline('price', e.target.value)}
                          placeholder="Price *" className={`${inputCls} pl-7`} />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                        <input type="checkbox" checked={inlineForm.available}
                          onChange={e => updInline('available', e.target.checked)}
                          className="accent-green-600 w-4 h-4" />
                        <span className="text-sm text-gray-700 whitespace-nowrap">In stock</span>
                      </label>
                    </div>
                  </div>
                </div>
                <input ref={inlineFileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    setInlineImgFile(f)
                    setInlinePreview(URL.createObjectURL(f))
                  }} />
                <textarea value={inlineForm.description ?? ''} onChange={e => updInline('description', e.target.value)}
                  placeholder="Description (optional)" rows={2} className={`${inputCls} resize-none`} />
                {/* Sale */}
                <div className="border border-amber-200 rounded-xl p-3" style={{ background: '#FFFBEB' }}>
                  <label className="flex items-center gap-2 cursor-pointer mb-3">
                    <input type="checkbox" checked={inlineForm.sale_active}
                      onChange={e => updInline('sale_active', e.target.checked)}
                      className="accent-amber-500 w-4 h-4" />
                    <span className="text-sm font-semibold text-amber-800">
                      <Tag size={12} className="inline mr-1" />Run a sale
                    </span>
                  </label>
                  {inlineForm.sale_active && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <DollarSign size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="number" min="0" step="0.01" value={inlineForm.sale_price ?? ''}
                          onChange={e => updInline('sale_price', e.target.value)}
                          placeholder="Sale price" className={`${inputCls} pl-7`} />
                      </div>
                      <input type="text" value={inlineForm.sale_label ?? ''}
                        onChange={e => updInline('sale_label', e.target.value)}
                        placeholder="Label e.g. Weekend deal" className={inputCls} />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => saveInline(p.id)} disabled={inlineSaving}
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-white rounded-xl text-sm font-semibold disabled:opacity-60"
                    style={{ background: '#1D9E75' }}>
                    {inlineSaving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : <><Save size={13} /> Save changes</>}
                  </button>
                  <button onClick={() => { setExpandedId(null); setInlineImgFile(null); setInlinePreview(null) }}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* ── Add / Edit modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-gray-900">{editing ? 'Edit product' : 'Add product'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">

              {/* Cover image */}
              <div>
                <label className={labelCls}>Cover photo</label>
                <div onClick={() => fileRef.current?.click()}
                  className="w-full h-36 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-green-300 transition-colors overflow-hidden"
                  style={imgPreview ? { border: 'none' } : {}}>
                  {imgPreview
                    ? <img src={imgPreview} alt="Preview" className="w-full h-full object-cover" />
                    : <div className="text-center">
                        <ImageIcon size={24} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-xs text-gray-400">Click to upload cover photo</p>
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

              {/* Extra photos */}
              <div>
                <label className={labelCls}>
                  More photos <span className="font-normal normal-case text-gray-400">(up to {MAX_EXTRA})</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {extraPreviews.map((src, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden group flex-shrink-0">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeExtra(i)}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={16} className="text-white" />
                      </button>
                    </div>
                  ))}
                  {extraPreviews.length < MAX_EXTRA && (
                    <button type="button" onClick={() => extraFileRef.current?.click()}
                      className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 hover:border-green-300 hover:bg-green-50 transition-colors flex-shrink-0">
                      <Plus size={20} className="text-gray-300" />
                      <span className="text-[10px] text-gray-400">Add photo</span>
                    </button>
                  )}
                </div>
                <input ref={extraFileRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={e => { addExtraFiles(e.target.files); e.target.value = '' }} />
                {extraPreviews.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    {extraPreviews.length}/{MAX_EXTRA} extra photos · hover to remove
                  </p>
                )}
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

              {/* Price + availability */}
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

              {/* Sale */}
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
                      ? `${notifyResult.sent} customer${notifyResult.sent !== 1 ? 's' : ''} notified.`
                      : 'No customers have saved your business yet.'}
                  </p>
                  <button onClick={() => { setNotifyModal(null); setNotifyResult(null) }}
                    className="text-sm font-semibold text-white px-6 py-2.5 rounded-xl"
                    style={{ background: '#1D9E75' }}>Done</button>
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-xl mb-4" style={{ background: '#FEF3C7' }}>
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">Sale active</p>
                    <p className="text-sm text-amber-900">
                      <strong>{notifyModal.name}</strong> ·{' '}
                      <span className="line-through text-amber-700">${notifyModal.price.toFixed(2)}</span>{' '}
                      <span className="font-bold">${notifyModal.sale_price!.toFixed(2)}</span>{' '}
                      ({discount(notifyModal)}% off)
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className={labelCls}>Personal message <span className="font-normal normal-case text-gray-400">(optional)</span></label>
                    <textarea value={notifyMsg} onChange={e => setNotifyMsg(e.target.value)}
                      placeholder="e.g. Available this weekend only!"
                      rows={3} className={`${inputCls} resize-none`} />
                  </div>
                  <button onClick={sendNotification} disabled={notifySending}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-white rounded-xl text-sm font-semibold disabled:opacity-60"
                    style={{ background: '#D97706' }}>
                    {notifySending
                      ? <><Loader2 size={14} className="animate-spin" /> Sending…</>
                      : <><Megaphone size={14} /> Send sale notification</>}
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