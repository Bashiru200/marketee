'use client'
import { useState, useRef, useCallback } from 'react'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  bucket:       'businesses' | 'products' | 'avatars'
  folder:       string          // usually the user's ID or business ID
  currentUrl?:  string | null
  onUpload:     (url: string) => void
  onRemove?:    () => void
  shape?:       'square' | 'circle'
  label?:       string
  maxSizeMB?:   number
}

export default function ImageUpload({
  bucket, folder, currentUrl, onUpload, onRemove,
  shape = 'square', label = 'Upload image', maxSizeMB = 5,
}: Props) {
  const supabase   = createClient()
  const inputRef   = useRef<HTMLInputElement>(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [preview,  setPreview]  = useState<string | null>(currentUrl ?? null)
  const [dragging, setDragging] = useState(false)

  async function uploadFile(file: File) {
    setError('')

    // Validate type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, WebP)')
      return
    }

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Image must be under ${maxSizeMB}MB`)
      return
    }

    setLoading(true)

    // Local preview immediately
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    // Upload to Supabase Storage
    const ext      = file.name.split('.').pop()
    const path     = `${folder}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setError(uploadError.message)
      setPreview(currentUrl ?? null)
      setLoading(false)
      return
    }

    // Get public URL
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    onUpload(data.publicUrl)
    setLoading(false)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  function handleRemove() {
    setPreview(null)
    onRemove?.()
    if (inputRef.current) inputRef.current.value = ''
  }

  const isCircle = shape === 'circle'

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">
          {label}
        </label>
      )}

      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative cursor-pointer transition-all overflow-hidden ${
          isCircle ? 'rounded-full' : 'rounded-xl'
        } ${dragging ? 'ring-2 ring-offset-2' : ''}`}
        style={{
          width:   isCircle ? '96px' : '100%',
          height:  isCircle ? '96px' : '180px',
          background: dragging ? '#f0faf6' : '#F9FAFB',
          border:  `2px dashed ${dragging ? '#1D9E75' : '#E5E7EB'}`,
          outline: dragging ? '2px solid #1D9E75' : 'none',
          outlineOffset: '2px',
        }}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <span className="text-white text-xs font-medium flex items-center gap-1">
                <Upload size={13} /> Change
              </span>
            </div>
            {/* Remove button */}
            {onRemove && (
              <button
                type="button"
                onClick={e => { e.stopPropagation(); handleRemove() }}
                className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors z-10"
              >
                <X size={12} />
              </button>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-gray-400">
            {loading
              ? <Loader2 size={20} className="animate-spin" style={{ color: '#1D9E75' }} />
              : <ImageIcon size={20} />
            }
            {!isCircle && !loading && (
              <p className="text-xs text-center px-2">
                Click or drag to upload<br />
                <span className="text-[10px]">JPG, PNG, WebP · max {maxSizeMB}MB</span>
              </p>
            )}
          </div>
        )}

        {loading && preview && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <Loader2 size={20} className="animate-spin text-white" />
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}