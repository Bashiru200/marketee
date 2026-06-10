'use client'
import { useEffect, useState } from 'react'
import { X, Info, CheckCircle, AlertTriangle, AlertCircle, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Announcement {
  id:        string
  message:   string
  type:      'info' | 'success' | 'warning' | 'error'
  link_text: string | null
  link_url:  string | null
}

const TYPE_STYLES = {
  info:    { bg:'#EFF6FF', border:'#BFDBFE', text:'#1E40AF', icon:Info,          iconColor:'#3B82F6' },
  success: { bg:'#F0FDF4', border:'#BBF7D0', text:'#166534', icon:CheckCircle,   iconColor:'#22C55E' },
  warning: { bg:'#FFFBEB', border:'#FDE68A', text:'#92400E', icon:AlertTriangle, iconColor:'#F59E0B' },
  error:   { bg:'#FEF2F2', border:'#FECACA', text:'#991B1B', icon:AlertCircle,   iconColor:'#EF4444' },
}

export default function AnnouncementBanner() {
  const supabase = createClient()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [dismissed,     setDismissed]     = useState<Set<string>>(new Set())

  useEffect(() => {
    // Load dismissed IDs from localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('dismissed_announcements') ?? '[]')
      setDismissed(new Set(stored))
    } catch {}

    supabase
      .from('announcements')
      .select('id, message, type, link_text, link_url')
      .eq('active', true)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .order('created_at', { ascending: false })
      .then(({ data }: { data: Announcement[] | null }) =>
        setAnnouncements(data ?? [])
      )
  }, [])

  function dismiss(id: string) {
    const next = new Set([...dismissed, id])
    setDismissed(next)
    try {
      localStorage.setItem('dismissed_announcements', JSON.stringify([...next]))
    } catch {}
  }

  const visible = announcements.filter(a => !dismissed.has(a.id))
  if (visible.length === 0) return null

  return (
    <div className="space-y-0">
      {visible.map(a => {
        const style = TYPE_STYLES[a.type] ?? TYPE_STYLES.info
        const Icon  = style.icon
        return (
          <div
            key={a.id}
            className="flex items-center gap-3 px-4 py-3 text-sm"
            style={{ background: style.bg, borderBottom: `1px solid ${style.border}` }}
          >
            <Icon size={15} style={{ color: style.iconColor, flexShrink: 0 }} />
            <p className="flex-1 font-medium" style={{ color: style.text }}>
              {a.message}
              {a.link_url && a.link_text && (
                <a
                  href={a.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 underline inline-flex items-center gap-1 hover:opacity-80"
                  style={{ color: style.text }}
                >
                  {a.link_text}
                  <ExternalLink size={11} />
                </a>
              )}
            </p>
            <button
              onClick={() => dismiss(a.id)}
              className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: style.text }}
            >
              <X size={15} />
            </button>
          </div>
        )
      })}
    </div>
  )
}