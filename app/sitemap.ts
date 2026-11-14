// app/sitemap.ts
import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://markeetee.com').replace(/\/$/, '')

const CATEGORY_SLUG_BY_DB_CATEGORY: Record<string, string> = {
  restaurant: 'restaurants',
  food: 'groceries',
  fashion: 'fashion',
  beauty: 'hair-braiding',
  herbs: 'wellness',
  music: 'music-arts',
  crafts: 'crafts',
  services: 'services',
  nightlife: 'nightlife',
}

function cityNameToSlug(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '-')
}

function staticPages(now = new Date()): MetadataRoute.Sitemap {
  return [
    { url: `${APP_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${APP_URL}/search`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${APP_URL}/map`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${APP_URL}/lunch`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${APP_URL}/blog`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${APP_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${APP_URL}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${APP_URL}/how-it-works`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${APP_URL}/privacy`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${APP_URL}/terms`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${APP_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ]
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const pages = staticPages(now)

  try {
    const supabase = await createClient()

    const { data: businesses } = await supabase
      .from('businesses')
      .select('id, created_at, city, category')
      .eq('status', 'active')

    const businessRows = businesses ?? []

    const businessPages: MetadataRoute.Sitemap = businessRows.map((business) => ({
      url: `${APP_URL}/businesses/${business.id}`,
      lastModified: new Date(business.created_at ?? now),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    const uniqueCities = Array.from(new Set(
      businessRows
        .map((business) => business.city)
        .filter(Boolean) as string[],
    ))

    const cityPages: MetadataRoute.Sitemap = uniqueCities.map((city) => ({
      url: `${APP_URL}/${cityNameToSlug(city)}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    }))

    const cityCategoryCombos = new Set<string>()
    businessRows.forEach((business) => {
      if (!business.city || !business.category) return

      const categorySlug = CATEGORY_SLUG_BY_DB_CATEGORY[business.category]
      if (!categorySlug) return

      cityCategoryCombos.add(`${cityNameToSlug(business.city)}/${categorySlug}`)
    })

    const cityCategoryPages: MetadataRoute.Sitemap = Array.from(cityCategoryCombos).map((combo) => ({
      url: `${APP_URL}/${combo}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, published_at')
      .eq('published', true)

    const blogPages: MetadataRoute.Sitemap = (posts ?? []).map((post) => ({
      url: `${APP_URL}/blog/${post.slug}`,
      lastModified: new Date(post.published_at ?? now),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    return [
      ...pages,
      ...cityPages,
      ...cityCategoryPages,
      ...businessPages,
      ...blogPages,
    ]
  } catch {
    return pages
  }
}
