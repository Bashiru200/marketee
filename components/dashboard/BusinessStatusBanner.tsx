'use client'
import { EyeOff, AlertTriangle, Clock, Mail } from 'lucide-react'
import Link from 'next/link'

interface Props {
  status: string | null
  reason?: string | null
  hiddenAt?: string | null
}

const STATUS_CONFIG: Record<string, {
  title:   string
  desc:    string
  bg:      string
  border:  string
  color:   string
  icon:    React.ElementType
}> = {
  hidden: {
    title: 'Your listing is currently hidden',
    desc:  'Your business is not visible to the public. It remains in your dashboard so you can edit and update it.',
    bg:    '#FEF3C7',
    border:'#FDE68A',
    color: '#92400E',
    icon:  EyeOff,
  },
  suspended: {
    title: 'Your listing has been suspended',
    desc:  'Your business is not visible to the public. If you believe this is a mistake, contact our support team.',
    bg:    '#FEE2E2',
    border:'#FCA5A5',
    color: '#991B1B',
    icon:  AlertTriangle,
  },
  pending_review: {
    title: 'Your listing is under review',
    desc:  'Our team is reviewing your business. This usually takes 24–48 hours. You will be notified when the review is complete.',
    bg:    '#EDE9FE',
    border:'#C4B5FD',
    color: '#5B21B6',
    icon:  Clock,
  },
}

export default function BusinessStatusBanner({ status, reason, hiddenAt }: Props) {
  if (!status || status === 'active') return null

  const config = STATUS_CONFIG[status]
  if (!config) return null

  const Icon = config.icon

  return (
    <div className="rounded-2xl p-5 border-l-4 mb-6"
      style={{ background: config.bg, borderColor: config.color }}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background:'white' }}>
          <Icon size={17} style={{ color: config.color }} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-sm mb-1" style={{ color: config.color }}>
            {config.title}
          </h3>
          <p className="text-xs mb-3 leading-relaxed" style={{ color: config.color, opacity: 0.85 }}>
            {config.desc}
          </p>

          {reason && (
            <p className="text-xs mb-3" style={{ color: config.color }}>
              <strong>Reason:</strong> {reason}
            </p>
          )}

          {hiddenAt && (
            <p className="text-xs mb-3" style={{ color: config.color, opacity: 0.7 }}>
              Since {new Date(hiddenAt).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })}
            </p>
          )}

          <Link href="/contact"
            className="inline-flex items-center gap-1.5 text-xs font-semibold"
            style={{ color: config.color }}>
            <Mail size={11} /> Contact support to appeal
          </Link>
        </div>
      </div>
    </div>
  )
}