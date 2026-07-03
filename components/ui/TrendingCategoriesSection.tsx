// components/ui/TrendingCategoriesSection.tsx
// Server component — fetches from Supabase, renders client carousel

import { createClient } from '@/lib/supabase/server'
import TrendingCarousel from '@/components/ui/TrendingCarousel'

async function getTrendingCategories(): Promise<string[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('businesses')
      .select('category')

    if (error || !data) return []

    // Count by category
    const counts: Record<string, number> = {}
    data.forEach(item => {
      if (!item.category) return
      counts[item.category] = (counts[item.category] || 0) + 1
    })

    // Sort by count descending, take top 8
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([category]) => category)
  } catch {
    return []
  }
}

export default async function TrendingCategoriesSection() {
  const categories = await getTrendingCategories()

  if (categories.length === 0) return null

  return (
    <div className="max-w-6xl mx-auto px-4">
      <TrendingCarousel categories={categories} title="Trending now" />
    </div>
  )
}