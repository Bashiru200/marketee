// lib/planGate.ts
// Single source of truth for all plan features

export type Plan = 'starter' | 'growth' | 'pro_store'

export const PLAN_LABELS: Record<Plan, string> = {
  starter:   '🟢 Starter',
  growth:    '🟡 Growth',
  pro_store: '🔵 Pro Store',
}

export const PLAN_PRICES = {
  starter:   { monthly: 0,  annual: 0  },
  growth:    { monthly: 40, annual: 32 }, // 20% annual discount
  pro_store: { monthly: 60, annual: 48 },
}

export const PLAN_FEATURES = {
  // ── Available on all plans ──────────────────────────────────────────
  business_listing:   ['starter', 'growth', 'pro_store'],
  customer_reviews:   ['starter', 'growth', 'pro_store'],
  search_visibility:  ['starter', 'growth', 'pro_store'],
  whatsapp_button:    ['starter', 'growth', 'pro_store'],
  map_pin:            ['starter', 'growth', 'pro_store'],

  // ── Growth + Pro Store ───────────────────────────────────────────────
  priority_search:    ['growth', 'pro_store'],
  products:           ['growth', 'pro_store'],
  menu:               ['growth', 'pro_store'],
  verified_badge:     ['growth', 'pro_store'],
  analytics_basic:    ['growth', 'pro_store'],
  photo_gallery:      ['growth', 'pro_store'],   // up to 20 photos
  priority_support:   ['growth', 'pro_store'],

  // ── Pro Store only ────────────────────────────────────────────────────
  custom_store_page:  ['pro_store'],
  product_reviews:    ['pro_store'],
  promotions:         ['pro_store'],
  lead_enquiry_form:  ['pro_store'],
  multiple_locations: ['pro_store'],
  analytics_advanced: ['pro_store'],
  unlimited_photos:   ['pro_store'],
  unlimited_products: ['pro_store'],
  dedicated_support:  ['pro_store'],
} as const

export type Feature = keyof typeof PLAN_FEATURES

export function canAccess(plan: Plan | string | null, feature: Feature): boolean {
  const p = (plan ?? 'starter') as Plan
  return (PLAN_FEATURES[feature] as readonly string[]).includes(p)
}

export function getPlanColor(plan: Plan | string | null) {
  const colors: Record<string, string> = {
    starter:   '#6B7280',
    growth:    '#D97706',
    pro_store: '#1D9E75',
  }
  return colors[plan ?? 'starter'] ?? '#6B7280'
}

export function getPlanBadgeStyle(plan: Plan | string | null) {
  const styles: Record<string, { background: string; color: string }> = {
    starter:   { background: '#F3F4F6', color: '#374151' },
    growth:    { background: '#FEF3C7', color: '#92400E' },
    pro_store: { background: '#E1F5EE', color: '#085041' },
  }
  return styles[plan ?? 'starter'] ?? styles.starter
}

// Max photos per plan
export function maxPhotos(plan: Plan | string | null): number {
  if (plan === 'pro_store') return Infinity
  if (plan === 'growth')    return 20
  return 1
}

// Max products per plan
export function maxProducts(plan: Plan | string | null): number {
  if (plan === 'pro_store') return Infinity
  if (plan === 'growth')    return 20
  return 0
}

// Max locations per plan
export function maxLocations(plan: Plan | string | null): number {
  if (plan === 'pro_store') return 5
  return 1
}