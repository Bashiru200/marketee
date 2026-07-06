// components/ui/PlanGate.tsx
// Wrap any feature in this to show an upgrade prompt if plan doesn't allow it

'use client'
import { canAccess, PLAN_LABELS, PLAN_PRICES, type Plan, type Feature } from '@/lib/planGate'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'

interface Props {
  plan:       string | null
  feature:    Feature
  children:   React.ReactNode
  // What to show instead of children when locked — defaults to a blur overlay
  fallback?:  React.ReactNode
  // If true, just hides the feature entirely instead of showing upgrade prompt
  hide?:      boolean
}

const FEATURE_LABELS: Partial<Record<Feature, { name: string; requiredPlan: Plan }>> = {
  products:           { name: 'Products & Services',  requiredPlan: 'growth'    },
  menu:               { name: 'Menu listing',          requiredPlan: 'growth'    },
  photo_gallery:      { name: 'Photo gallery',         requiredPlan: 'growth'    },
  analytics_basic:    { name: 'Analytics',             requiredPlan: 'growth'    },
  verified_badge:     { name: 'Verified badge',        requiredPlan: 'growth'    },
  priority_search:    { name: 'Priority search',       requiredPlan: 'growth'    },
  priority_support:   { name: 'Priority support',      requiredPlan: 'growth'    },
  custom_store_page:  { name: 'Custom store page',     requiredPlan: 'pro_store' },
  product_reviews:    { name: 'Product reviews',       requiredPlan: 'pro_store' },
  promotions:         { name: 'Promotions',            requiredPlan: 'pro_store' },
  lead_enquiry_form:  { name: 'Lead enquiry form',     requiredPlan: 'pro_store' },
  multiple_locations: { name: 'Multiple locations',    requiredPlan: 'pro_store' },
  analytics_advanced: { name: 'Advanced analytics',    requiredPlan: 'pro_store' },
  unlimited_photos:   { name: 'Unlimited photos',      requiredPlan: 'pro_store' },
  unlimited_products: { name: 'Unlimited products',    requiredPlan: 'pro_store' },
}

export default function PlanGate({ plan, feature, children, fallback, hide }: Props) {
  const router  = useRouter()
  const allowed = canAccess(plan, feature)

  if (allowed) return <>{children}</>
  if (hide)    return null

  if (fallback) return <>{fallback}</>

  const meta     = FEATURE_LABELS[feature]
  const reqPlan  = meta?.requiredPlan ?? 'growth'
  const price    = PLAN_PRICES[reqPlan].monthly
  const label    = PLAN_LABELS[reqPlan]

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-100">
      {/* Blurred preview of children */}
      <div className="pointer-events-none select-none" style={{ filter: 'blur(4px)', opacity: 0.4 }}>
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 text-center shadow-lg max-w-xs mx-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
            style={{ background: '#E1F5EE' }}>
            <Lock size={20} style={{ color: '#1D9E75' }} />
          </div>
          <p className="font-bold text-gray-900 mb-1">
            {meta?.name ?? 'This feature'} is locked
          </p>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            Upgrade to the <strong>{label}</strong> plan to unlock this feature.
            From ${price}/month.
          </p>
          <button
            onClick={() => router.push('/dashboard?tab=upgrade')}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: '#1D9E75' }}>
            Upgrade now →
          </button>
        </div>
      </div>
    </div>
  )
}