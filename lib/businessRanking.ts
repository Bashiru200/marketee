export interface RankableBusiness {
  id: string
  name: string
  category: string | null
  subcategory?: string | null
  description?: string | null
  city: string | null
  state: string | null
  zip?: string | null
  country?: string | null
  cover_image: string | null
  logo_url?: string | null
  images?: string[] | null
  rating: number | null
  review_count: number | null
  verified: boolean | null
  premium: boolean | null
  featured: boolean | null
  plan?: string | null
  created_at?: string | null
  tags?: string[] | null
  lat?: number | null
  lng?: number | null
}

export interface BusinessRankContext {
  query?: string | null
  city?: string | null
  category?: string | null
  country?: string | null
}

function normalize(value: string | null | undefined) {
  return String(value ?? '').trim().toLowerCase()
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function includesText(value: string | null | undefined, needle: string) {
  return normalize(value).includes(needle)
}

function textMatchScore(business: RankableBusiness, query?: string | null) {
  const q = normalize(query)
  if (!q) return 0

  const tags = business.tags?.join(' ') ?? ''
  if (normalize(business.name) === q) return 40
  if (normalize(business.name).startsWith(q)) return 34
  if (includesText(business.name, q)) return 28
  if (includesText(business.subcategory, q)) return 20
  if (includesText(business.category, q)) return 18
  if (includesText(tags, q)) return 14
  if (includesText(business.description, q)) return 10
  return 0
}

function locationMatchScore(business: RankableBusiness, city?: string | null) {
  const location = normalize(city)
  if (!location) return 0
  if (normalize(business.city) === location) return 20
  if (normalize(business.state) === location) return 14
  if (normalize(business.zip) === location) return 14
  if (includesText(business.city, location)) return 12
  if (includesText(business.state, location)) return 8
  return 0
}

function freshnessScore(createdAt?: string | null) {
  if (!createdAt) return 0
  const created = new Date(createdAt).getTime()
  if (!Number.isFinite(created)) return 0

  const ageDays = (Date.now() - created) / (1000 * 60 * 60 * 24)
  if (ageDays <= 30) return 4
  if (ageDays <= 90) return 2
  if (ageDays <= 180) return 1
  return 0
}

function profileCompletenessScore(business: RankableBusiness) {
  let score = 0
  if (business.cover_image) score += 2
  if (business.logo_url) score += 1
  if ((business.images?.length ?? 0) > 0) score += 1
  if (business.description && business.description.length > 80) score += 1
  if (business.city && business.state) score += 1
  return clamp(score, 0, 6)
}

function planBoost(business: RankableBusiness) {
  if (business.featured) return 6
  if (business.plan === 'pro_store' || business.plan === 'storefront') return 5
  if (business.premium || business.plan === 'growth' || business.plan === 'premium') return 3
  return 0
}

export function businessScore(business: RankableBusiness, context: BusinessRankContext = {}) {
  const rating = clamp(Number(business.rating ?? 0), 0, 5)
  const reviewCount = Math.max(0, Number(business.review_count ?? 0))
  const categoryMatch = context.category && business.category === context.category ? 20 : 0
  const countryMatch = context.country && business.country === context.country ? 4 : 0

  return (
    textMatchScore(business, context.query) +
    categoryMatch +
    locationMatchScore(business, context.city) +
    (rating / 5) * 10 +
    clamp(Math.log10(reviewCount + 1) * 4, 0, 8) +
    (business.verified ? 8 : 0) +
    profileCompletenessScore(business) +
    planBoost(business) +
    countryMatch +
    freshnessScore(business.created_at)
  )
}

export function rankBusinesses<T extends RankableBusiness>(
  businesses: T[],
  context: BusinessRankContext = {},
) {
  return [...businesses].sort((a, b) => {
    const scoreDiff = businessScore(b, context) - businessScore(a, context)
    if (scoreDiff !== 0) return scoreDiff

    const ratingDiff = Number(b.rating ?? 0) - Number(a.rating ?? 0)
    if (ratingDiff !== 0) return ratingDiff

    return Number(b.review_count ?? 0) - Number(a.review_count ?? 0)
  })
}
