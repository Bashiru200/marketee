'use client'
import { useState, useRef } from 'react'
import { Plus, X, Loader2, GripVertical, ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  businessId:  string
  coverImage:  string | null
  images:      string[]
  onChange:    (updated: { cover_image: string | null; images: string[] }) => void
}

const MAX_GALLERY = 8 // max extra photos (not counting cover)

export default function GalleryUploader({ businessId, coverImage, images, onChange }: Props) {
  const supabase       = createClient()
  const fileRef        = useRef<HTMLInputElement>(null)
  const coverRef       = useRef<HTMLInputElement>(null)
  const [uploading,  setUploading]  = useState(false)
  const [toast,      setToast]      = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Upload a single file to Supabase Storage ──────────────────────────
  async function uploadFile(file: File, prefix: string): Promise<string | null> {
    const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `businesses/${businessId}/${prefix}-${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('business-images')
      .upload(path, file, { upsert: true })
    if (error) { showToast(`Upload failed: ${error.message}`, 'error'); return null }
    const { data } = supabase.storage.from('business-images').getPublicUrl(path)
    return data.publicUrl
  }

  // ── Save changes to Supabase ──────────────────────────────────────────
  async function save(cover: string | null, imgs: string[]) {
    const { error } = await supabase
      .from('businesses')
      .update({ cover_image: cover, images: imgs })
      .eq('id', businessId)
    if (error) showToast('Failed to save — try again', 'error')
    else { showToast('Photos saved!'); onChange({ cover_image: cover, images: imgs }) }
  }

  // ── Replace cover image ────────────────────────────────────────────────
  async function handleCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const url = await uploadFile(file, 'cover')
    if (url) await save(url, images)
    setUploading(false)
    e.target.value = ''
  }

  // ── Add gallery photos ─────────────────────────────────────────────────
  async function handleGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    const remaining = MAX_GALLERY - images.length
    if (remaining <= 0) { showToast(`Max ${MAX_GALLERY} gallery photos`, 'error'); return }

    const toUpload = files.slice(0, remaining)
    setUploading(true)

    const urls: string[] = []
    for (const file of toUpload) {
      const url = await uploadFile(file, `gallery-${urls.length}`)
      if (url) urls.push(url)
    }

    if (urls.length) await save(coverImage, [...images, ...urls])
    setUploading(false)
    e.target.value = ''
  }

  // ── Remove a gallery image ─────────────────────────────────────────────
  async function removeGallery(idx: number) {
    const updated = images.filter((_, i) => i !== idx)
    await save(coverImage, updated)
  }

  // ── Promote a gallery image to cover ──────────────────────────────────
  async function makeCover(url: string) {
    const updated = images.filter(i => i !== url)
    if (coverImage) updated.unshift(coverImage) // old cover goes to gallery slot 0
    await save(url, updated)
  }

  // ── Remove cover ──────────────────────────────────────────────────────
  async function removeCover() {
    await save(null, images)
  }

  const allPhotos = [coverImage, ...images].filter(Boolean) as string[]

  return (
    <div className="space-y-4">

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium
          ${toast.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-100'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {toast.msg}
        </div>
      )}

      {/* Label row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Business photos</p>
          <p className="text-xs text-gray-400 mt-0.5">{allPhotos.length} / {MAX_GALLERY + 1} photos · First photo is your cover</p>
        </div>
        {uploading && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Loader2 size={13} className="animate-spin" /> Uploading…
          </div>
        )}
      </div>

      {/* Photo grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">

        {/* Cover slot */}
        <div
          className="relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer group"
          style={{ borderColor: '#1D9E75' }}
          onClick={() => !uploading && coverRef.current?.click()}
        >
          {coverImage ? (
            <>
              <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
              {/* Cover badge */}
              <div className="absolute top-1.5 left-1.5">
                <span className="text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full"
                  style={{ background: '#1D9E75' }}>Cover</span>
              </div>
              {/* Remove cover */}
              <button
                onClick={e => { e.stopPropagation(); removeCover() }}
                className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X size={10} className="text-white" />
              </button>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1"
              style={{ background: '#f0faf6' }}>
              <ImageIcon size={20} style={{ color: '#1D9E75' }} />
              <span className="text-[10px] font-semibold" style={{ color: '#1D9E75' }}>Add cover</span>
            </div>
          )}
        </div>

        {/* Gallery slots */}
        {images.map((url, i) => (
          <div key={url} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group cursor-pointer">
            <img src={url} alt={`Photo ${i + 2}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors" />
            {/* Actions on hover */}
            <div className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Make cover */}
              <button
                onClick={() => makeCover(url)}
                className="text-[10px] font-bold text-white bg-black/60 px-2 py-1 rounded-full hover:bg-black/80 transition-colors">
                Set cover
              </button>
            </div>
            {/* Remove */}
            <button
              onClick={() => removeGallery(i)}
              className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <X size={10} className="text-white" />
            </button>
          </div>
        ))}

        {/* Add more slot */}
        {images.length < MAX_GALLERY && (
          <div
            onClick={() => !uploading && fileRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-green-300 hover:bg-green-50 transition-colors">
            <Plus size={20} className="text-gray-300" />
            <span className="text-[10px] text-gray-400">Add photo</span>
          </div>
        )}
      </div>

      {/* Helper text */}
      <p className="text-xs text-gray-400">
        Click any photo to replace the cover. Hover a gallery photo to set it as cover or remove it.
        Max {MAX_GALLERY} gallery photos · JPG, PNG, WebP recommended.
      </p>

      {/* Hidden file inputs */}
      <input ref={coverRef}  type="file" accept="image/*" className="hidden" onChange={handleCover} />
      <input ref={fileRef}   type="file" accept="image/*" className="hidden" onChange={handleGallery} multiple />
    </div>
  )
}