import { Suspense } from 'react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import SearchClient from './SearchClient'
import SearchLoading from './loading'

export const dynamic = 'force-dynamic'
const PAGE_SIZE = 12

export const metadata: Metadata = {
  title: 'Search African-Owned Businesses',
  description: 'Search African-owned restaurants, groceries, beauty services, fashion, wellness, and more across the United States.',
  alternates: {
    canonical: '/search',
  },
}

const CATEGORIES = [
  { id:'food',       name:'Food & Groceries', icon:'🍲' },
  { id:'restaurant', name:'Restaurants',       icon:'🍽️' },
  { id:'fashion',    name:'Fashion & Fabric',  icon:'👗' },
  { id:'beauty',     name:'Beauty & Hair',     icon:'💆' },
  { id:'herbs',      name:'Herbs & Wellness',  icon:'🌿' },
  { id:'music',      name:'Music & Arts',      icon:'🎵' },
  { id:'crafts',     name:'Crafts & Decor',    icon:'🏺' },
  { id:'services',   name:'Services',          icon:'🛠️' },
  { id:'nightlife', name:'Bars & Nightlife', icon:'🍺' },
]

export const revalidate = 60

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    city?: string
    category?: string
    sort?: string
  }>
}

async function SearchContent({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('businesses')
    .select(`
      id, name, category, subcategory, description,
      address, city, state, zip, country,
      cover_image, rating, review_count,
      price_range, tags, lat, lng,
      verified, premium, featured
    `, { count: 'exact' })

  if (params.q?.trim()) {
    query = query.ilike('name', `%${params.q.trim()}%`)
  }

  if (params.city?.trim()) {
    const city = params.city.trim()
    query = query.or(`city.ilike.%${city}%,state.ilike.%${city}%,zip.eq.${city}`)
  }

  if (params.category && CATEGORIES.some((category) => category.id === params.category)) {
    query = query.eq('category', params.category)
  }

  if (params.sort === 'rating') {
    query = query.order('rating', { ascending: false })
  } else if (params.sort === 'newest') {
    query = query.order('created_at', { ascending: false })
  } else if (params.sort === 'reviews') {
    query = query.order('review_count', { ascending: false })
  } else {
    query = query
      .order('featured', { ascending: false })
      .order('rating', { ascending: false })
      .order('created_at', { ascending: false })
  }

  // Only fetch first page on server — client handles the rest
  const { data: businesses, count } = await query.range(0, PAGE_SIZE - 1)

  const categories = CATEGORIES.map(cat => ({
    ...cat,
    count: 0, // counts loaded client-side via Supabase
  }))

  return (
    <SearchClient
      initialBusinesses={businesses ?? []}
      totalCount={count ?? 0}
      pageSize={PAGE_SIZE}
      categories={categories}
      initialTab="businesses"
    />
  )
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchContent searchParams={searchParams} />
    </Suspense>
  )
}
