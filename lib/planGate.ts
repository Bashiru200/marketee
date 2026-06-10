export type Plan = 'free' | 'premium' | 'storefront'

export function getPlan(business: { premium?: boolean; featured?: boolean } | null): Plan {
  if (!business) return 'free'
  if ((business as any).plan === 'storefront') return 'storefront'
  if (business.premium) return 'premium'
  return 'free'
}

export const PLAN_FEATURES = {
  // Premium features
  products:          ['premium', 'storefront'],
  coverPhoto:        ['premium', 'storefront'],
  logoUpload:        ['premium', 'storefront'],
  customDescription: ['premium', 'storefront'],
  featuredSearch:    ['premium', 'storefront'],
  weeklyStats:       ['premium', 'storefront'],

  // Storefront features
  customUrl:         ['storefront'],
  whatsappProducts:  ['storefront'],
  ownerReplies:      ['storefront'],
  analytics:         ['storefront'],
  verifiedBadge:     ['storefront'],
  noMarketeeBranding:['storefront'],
} as const

export type Feature = keyof typeof PLAN_FEATURES

export function canAccess(plan: Plan, feature: Feature): boolean {
  return (PLAN_FEATURES[feature] as readonly string[]).includes(plan)
}

export function getPlanLabel(plan: Plan) {
  return { free: 'Free', premium: 'Premium', storefront: 'Storefront' }[plan]
}

export function getPlanColor(plan: Plan) {
  return { free: '#6B7280', premium: '#1D9E75', storefront: '#085041' }[plan]
}