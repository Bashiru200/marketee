import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import SearchClient from './SearchClient'
import SearchLoading from './loading'

const PAGE_SIZE = 12

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

async function SearchContent() {
  const supabase = await createClient()

  // Only fetch first page on server — client handles the rest
  const { data: businesses, count } = await supabase
    .from('businesses')
    .select(`
      id, name, category, subcategory, description,
      address, city, state, zip, country,
      cover_image, rating, review_count,
      price_range, tags, lat, lng,
      verified, premium, featured
    `, { count: 'exact' })
    .order('featured',   { ascending: false })
    .order('rating',     { ascending: false })
    .order('created_at', { ascending: false })
    .range(0, PAGE_SIZE - 1)

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

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchContent />
    </Suspense>
  )
}