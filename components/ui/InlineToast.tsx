'use client'
import { useEffect } from 'react'
import { AlertCircle, X } from 'lucide-react'

interface Props {
  message:  string
  type?:    'error' | 'info' | 'success'
  onClose:  () => void
  duration?: number // ms, 0 = stays until manually closed
}

const STYLES = {
  error:   { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', icon: '#DC2626' },
  info:    { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF', icon: '#2563EB' },
  success: { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534', icon: '#16A34A' },
}

export default function InlineToast({ message, type = 'info', onClose, duration = 3500 }: Props) {
  useEffect(() => {
    if (duration === 0) return
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [duration, onClose])

  const s = STYLES[type]

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg max-w-sm w-[calc(100%-2rem)] animate-toast-in"
      style={{ background: s.bg, border: `1px solid ${s.border}` }}
      role="alert"
    >
      <AlertCircle size={16} style={{ color: s.icon }} className="flex-shrink-0" />
      <p className="text-sm flex-1" style={{ color: s.text }}>{message}</p>
      <button onClick={onClose} className="flex-shrink-0">
        <X size={14} style={{ color: s.text }} className="opacity-60 hover:opacity-100 transition-opacity" />
      </button>

      <style jsx>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translate(-50%, 8px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-toast-in {
          animation: toast-in 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}