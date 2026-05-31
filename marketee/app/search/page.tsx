import { createClient } from '@/lib/supabase/server'
import SearchClient from './SearchClient'

const STATIC_CATEGORIES = [
  { id: 'food',       name: 'Food & Groceries',  icon: '🍲' },
  { id: 'restaurant', name: 'Restaurants',        icon: '🍽️' },
  { id: 'fashion',    name: 'Fashion & Fabric',   icon: '👗' },
  { id: 'beauty',     name: 'Beauty & Hair',      icon: '💆' },
  { id: 'herbs',      name: 'Herbs & Wellness',   icon: '🌿' },
  { id: 'music',      name: 'Music & Arts',       icon: '🎵' },
  { id: 'crafts',     name: 'Crafts & Decor',     icon: '🏺' },
  { id: 'services',   name: 'Services',           icon: '🛠️' },
]

// Cache this page for 60 seconds — revalidates in background
// so users always get a fast response from cache
export const revalidate = 60

export default async function SearchPage() {
  const supabase = await createClient()

  // Only select the fields we actually use — reduces payload size
  const { data: businesses, error } = await supabase
    .from('businesses')
    .select(`
      id, name, category, subcategory, description,
      address, city, state, zip, country,
      cover_image, rating, review_count,
      price_range, tags, lat, lng,
      verified, premium, featured
    `)
    .order('featured',   { ascending: false })
    .order('rating',     { ascending: false })
    .order('created_at', { ascending: false })

  if (error) console.error('[SearchPage]', error)

  const allBusinesses = businesses ?? []

  const categories = STATIC_CATEGORIES
    .map(cat => ({
      ...cat,
      count: allBusinesses.filter(b => b.category === cat.id).length,
    }))
    .filter(cat => cat.count > 0)

  return (
    <SearchClient
      businesses={allBusinesses}
      categories={categories}
    />
  )
}