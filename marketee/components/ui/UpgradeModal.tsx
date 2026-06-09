'use client'
import { useState } from 'react'
import { X, Check, Zap, Star, Shield, ArrowRight, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'

interface Props {
  onClose:      () => void
  businessId?:  string
  currentPlan?: 'free' | 'premium' | 'storefront'
  businessName?: string
}

type Plan = 'free' | 'premium' | 'storefront'

const PLANS = [
  {
    id:       'free' as Plan,
    name:     'Free',
    price:    '$0',
    period:   'forever',
    desc:     'Get discovered by the diaspora community',
    color:    '#6B7280',
    bg:       '#F9FAFB',
    features: [
      'Business listing on Markeetee',
      'Map pin with directions',
      'Phone & WhatsApp contact',
      'Customer reviews',
      'Basic search visibility',
    ],
    cta:      'Current plan',
    disabled: true,
  },
  {
    id:       'premium' as Plan,
    name:     'Premium',
    price:    '$29',
    period:   'per month',
    desc:     'Stand out and attract more customers',
    color:    '#1D9E75',
    bg:       '#f0faf6',
    badge:    'Most popular',
    features: [
      'Everything in Free',
      'Featured placement in search',
      'Cover photo & logo upload',
      'Product / menu showcase',
      'Weekly stats email',
      'Priority in category listings',
    ],
    cta:      'Upgrade to Premium',
    disabled: false,
  },
  {
    id:       'storefront' as Plan,
    name:     'Storefront',
    price:    '$49',
    period:   'per month',
    desc:     'Your full African business online',
    color:    '#085041',
    bg:       '#E1F5EE',
    badge:    'Best value',
    features: [
      'Everything in Premium',
      'Custom store URL',
      'Product enquiry via WhatsApp',
      'Owner reply to reviews',
      'Advanced analytics',
      'Verified badge',
    ],
    cta:      'Upgrade to Storefront',
    disabled: false,
  },
]

export default function UpgradeModal({ onClose, businessId, currentPlan = 'free', businessName }: Props) {
  const supabase = createClient()
  const { refreshProfile } = useAuth()

  const [selected, setSelected]   = useState<Plan>(currentPlan === 'free' ? 'premium' : currentPlan)
  const [loading,  setLoading]    = useState(false)
  const [success,  setSuccess]    = useState(false)
  const [error,    setError]      = useState('')

  async function handleUpgrade() {
    if (!businessId || selected === currentPlan) return
    setLoading(true); setError('')

    const { error: err } = await supabase
      .from('businesses')
      .update({
        plan:     selected,
        premium:  selected !== 'free',
        featured: selected === 'storefront',
        // verified badge for storefront
        verified: selected === 'storefront' ? true : undefined,
      })
      .eq('id', businessId)

    if (err) {
      setError('Failed to update plan. Please try again.')
      setLoading(false)
      return
    }

    await refreshProfile()
    setSuccess(true)
    setLoading(false)
    setTimeout(onClose, 2000)
  }

  const selectedPlan = PLANS.find(p => p.id === selected)!
  const isCurrentPlan = selected === currentPlan

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        style={{ boxShadow:'0 24px 80px rgba(0,0,0,0.25)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Upgrade your listing</h2>
            <p className="text-sm text-gray-500">
              {businessName
                ? `Get more customers for ${businessName}`
                : 'Choose a plan to grow your African business'}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors flex-shrink-0 mt-0.5">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Success state */}
        {success ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background:'#E1F5EE' }}>
              <Check size={28} style={{ color:'#1D9E75' }} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Plan updated to {PLANS.find(p => p.id === selected)?.name}!
            </h3>
            <p className="text-sm text-gray-500">Your listing features have been activated.</p>
          </div>
        ) : (
          <>
            {/* Current plan indicator */}
            {currentPlan !== 'free' && (
              <div className="mx-6 mt-5 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
                style={{ background:'#E1F5EE', color:'#085041' }}>
                <Check size={15} />
                You&apos;re currently on the <strong>{PLANS.find(p => p.id === currentPlan)?.name}</strong> plan
              </div>
            )}

            {/* Plans */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PLANS.map(plan => {
                const isCurrent  = plan.id === currentPlan
                const isSelected = plan.id === selected
                return (
                  <div
                    key={plan.id}
                    onClick={() => !isCurrent && setSelected(plan.id)}
                    className="relative rounded-2xl border-2 p-5 transition-all flex flex-col"
                    style={{
                      borderColor: isSelected && !isCurrent ? plan.color : '#E5E7EB',
                      background:  isSelected && !isCurrent ? plan.bg : isCurrent ? '#F9FAFB' : '#FAFAFA',
                      cursor:      isCurrent ? 'default' : 'pointer',
                    }}
                  >
                    {plan.badge && !isCurrent && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold text-white px-3 py-1 rounded-full"
                        style={{ background: plan.color }}>
                        {plan.badge}
                      </span>
                    )}
                    {isCurrent && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold text-white px-3 py-1 rounded-full bg-gray-400">
                        Current plan
                      </span>
                    )}

                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-500 mb-1">{plan.name}</p>
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                        <span className="text-xs text-gray-400">/{plan.period}</span>
                      </div>
                      <p className="text-xs text-gray-500">{plan.desc}</p>
                    </div>

                    <ul className="space-y-2 flex-1">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                          <Check size={12} className="flex-shrink-0 mt-0.5" style={{ color: plan.color }} />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <div
                      className="mt-4 w-full py-2 rounded-xl text-xs font-semibold text-center transition-colors"
                      style={{
                        background: isSelected && !isCurrent ? plan.color : 'transparent',
                        color:      isSelected && !isCurrent ? 'white'     : isCurrent ? '#9CA3AF' : plan.color,
                        border:     `1.5px solid ${isCurrent ? '#E5E7EB' : plan.color}`,
                      }}
                    >
                      {isCurrent ? 'Active' : isSelected ? '✓ Selected' : 'Select'}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* CTA */}
            <div className="px-6 pb-6">
              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-100">
                  {error}
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-sm font-semibold text-gray-900">
                    {isCurrentPlan ? 'Already on this plan' : selectedPlan.cta}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isCurrentPlan
                      ? 'Select a different plan to upgrade'
                      : 'Cancel anytime · No long-term contract · Instant activation'}
                  </p>
                </div>
                <button
                  onClick={handleUpgrade}
                  disabled={loading || isCurrentPlan}
                  className="flex items-center gap-2 text-sm font-semibold text-white px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: selectedPlan.color }}
                >
                  {loading
                    ? <><Loader2 size={14} className="animate-spin" /> Updating…</>
                    : <>{isCurrentPlan ? 'Select a plan' : 'Confirm upgrade'} <ArrowRight size={14} /></>
                  }
                </button>
              </div>

              <div className="flex items-center justify-center gap-6 mt-4">
                {([
                  [Shield, 'Secure payment'],
                  [Star,   'Cancel anytime'],
                  [Zap,    'Instant upgrade'],
                ] as [React.ElementType, string][]).map(([Icon, label]) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Icon size={12} />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}