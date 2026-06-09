'use client'
import Link from 'next/link'
import { Lock, Zap } from 'lucide-react'
import { Plan, Feature, canAccess, PLAN_FEATURES } from '@/lib/planGate'

interface Props {
  plan:     Plan
  feature:  Feature
  children: React.ReactNode
  compact?: boolean          // inline lock icon instead of full overlay
}

const UPGRADE_LABELS: Partial<Record<Feature, { title: string; desc: string; plan: string }>> = {
  products:          { title: 'Products & Menu', desc: 'Showcase your menu to attract customers', plan: 'Premium' },
  coverPhoto:        { title: 'Cover photo', desc: 'Add a cover photo to stand out', plan: 'Premium' },
  logoUpload:        { title: 'Logo upload', desc: 'Brand your listing with your logo', plan: 'Premium' },
  customDescription: { title: 'Custom description', desc: 'Tell your story in full', plan: 'Premium' },
  featuredSearch:    { title: 'Featured placement', desc: 'Appear at the top of search results', plan: 'Premium' },
  weeklyStats:       { title: 'Weekly stats email', desc: 'Get weekly insights on your listing', plan: 'Premium' },
  customUrl:         { title: 'Custom store URL', desc: 'Get markeetee.com/store/your-name', plan: 'Storefront' },
  whatsappProducts:  { title: 'WhatsApp enquiry', desc: 'Let customers enquire on products via WhatsApp', plan: 'Storefront' },
  ownerReplies:      { title: 'Reply to reviews', desc: 'Respond publicly to customer reviews', plan: 'Storefront' },
  analytics:         { title: 'Advanced analytics', desc: 'Views, clicks, and enquiry tracking', plan: 'Storefront' },
  verifiedBadge:     { title: 'Verified badge', desc: 'Build trust with a verified tick', plan: 'Storefront' },
  noMarketeeBranding:{ title: 'Remove branding', desc: 'Remove "Powered by Markeetee" from your listing', plan: 'Storefront' },
}

export default function PlanGate({ plan, feature, children, compact = false }: Props) {
  if (canAccess(plan, feature)) return <>{children}</>

  const info = UPGRADE_LABELS[feature]
  const requiredPlan = (PLAN_FEATURES[feature] as readonly string[])[0]

  if (compact) {
    return (
      <div className="relative inline-flex items-center gap-1.5 opacity-50 cursor-not-allowed" title={`Requires ${requiredPlan} plan`}>
        {children}
        <Lock size={11} className="text-gray-400" />
      </div>
    )
  }

  return (
    <div className="relative rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden">
      {/* Blurred preview */}
      <div className="blur-sm pointer-events-none select-none opacity-40">
        {children}
      </div>
      {/* Lock overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/80">
        <div className="text-center p-6 max-w-xs">
          <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: requiredPlan === 'storefront' ? '#085041' : '#1D9E75' }}>
            <Lock size={18} className="text-white" />
          </div>
          <p className="font-semibold text-gray-900 text-sm mb-1">{info?.title}</p>
          <p className="text-xs text-gray-500 mb-4">{info?.desc}</p>
          <Link href="/dashboard?tab=billing"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
            style={{ background: requiredPlan === 'storefront' ? '#085041' : '#1D9E75' }}>
            <Zap size={11} />
            Upgrade to {info?.plan}
          </Link>
        </div>
      </div>
    </div>
  )
}