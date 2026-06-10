'use client'
import { useState } from 'react'
import {
  X, ChevronLeft, ChevronRight, Star, MessageCircle,
  ShoppingCart, ZoomIn
} from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  description: string | null
  image_url: string | null
  images?: string[]
  available: boolean
}

interface Props {
  product: Product
  businessName: string
  businessPhone: string | null
  onClose: () => void
}

export default function ProductModal({ product, businessName, businessPhone, onClose }: Props) {
  const images = [
    ...(product.image_url ? [product.image_url] : []),
    ...(product.images ?? []),
  ].filter(Boolean)

  const [slide, setSlide] = useState(0)
  const [zoomed, setZoomed] = useState(false)

  const prev = () => setSlide(s => (s - 1 + images.length) % images.length)
  const next = () => setSlide(s => (s + 1) % images.length)

  const waMsg = encodeURIComponent(
    `Hi ${businessName}! I'm interested in "${product.name}" (£${product.price?.toFixed(2)}) — is it available?`
  )
  const waUrl = businessPhone
    ? `https://wa.me/${businessPhone.replace(/\D/g, '')}?text=${waMsg}`
    : null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-2xl overflow-hidden w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
          style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}
        >
          {/* Image slider */}
          <div className="relative bg-gray-100" style={{ height: '280px' }}>
            {images.length > 0 ? (
              <>
                <img
                  src={images[slide]}
                  alt={product.name}
                  className="w-full h-full object-cover cursor-zoom-in"
                  onClick={() => setZoomed(true)}
                />
                {/* Slide nav */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white shadow transition-colors"
                    >
                      <ChevronLeft size={16} className="text-gray-700" />
                    </button>
                    <button
                      onClick={next}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white shadow transition-colors"
                    >
                      <ChevronRight size={16} className="text-gray-700" />
                    </button>
                    {/* Dots */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setSlide(i)}
                          className="rounded-full transition-all"
                          style={{
                            width:  i === slide ? '20px' : '6px',
                            height: '6px',
                            background: i === slide ? '#1D9E75' : 'rgba(255,255,255,0.6)',
                          }}
                        />
                      ))}
                    </div>
                    {/* Zoom hint */}
                    <button
                      onClick={() => setZoomed(true)}
                      className="absolute top-3 right-12 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white shadow transition-colors"
                    >
                      <ZoomIn size={14} className="text-gray-600" />
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl">📦</div>
            )}
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white shadow transition-colors"
            >
              <X size={15} className="text-gray-700" />
            </button>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="absolute bottom-10 left-0 right-0 flex gap-1.5 px-3 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSlide(i)}
                    className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-colors"
                    style={{ borderColor: i === slide ? '#1D9E75' : 'transparent' }}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 mb-3">
              <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-bold" style={{ color: '#1D9E75' }}>
                  ${product.price?.toFixed(2)}
                </p>
                {!product.available && (
                  <span className="text-xs text-red-500 font-medium">Out of stock</span>
                )}
              </div>
            </div>

            {product.description && (
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                {product.description}
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white py-3 rounded-xl hover:opacity-90 transition-opacity"
                  style={{ background: '#25D366' }}
                >
                  <MessageCircle size={16} />
                  Enquire on WhatsApp
                </a>
              )}
              <button
                disabled={!product.available}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                style={{ background: '#1D9E75' }}
                onClick={() => {
                  if (waUrl) window.open(waUrl, '_blank')
                }}
              >
                <ShoppingCart size={16} />
                {product.available ? 'Add to enquiry' : 'Out of stock'}
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-3">
              Sold by <span className="font-medium text-gray-600">{businessName}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Fullscreen zoom */}
      {zoomed && images.length > 0 && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.9)' }}
          onClick={() => setZoomed(false)}
        >
          <img
            src={images[slide]}
            alt={product.name}
            className="max-w-full max-h-full object-contain"
            style={{ maxHeight: '90vh', maxWidth: '90vw' }}
          />
          <button
            onClick={() => setZoomed(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      )}
    </>
  )
}