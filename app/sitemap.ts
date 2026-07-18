// app/sitemap.ts
import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const APP_URL = 'https://markeetee.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: APP_URL,              lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${APP_URL}/search`,  lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${APP_URL}/map`,     lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${APP_URL}/launch`,  lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${APP_URL}/about`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${APP_URL}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${APP_URL}/terms`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${APP_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]

  // Business pages
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: businesses } = await supabase
      .from('businesses')
      .select('id, updated_at')
      .order('created_at', { ascending: false })

    const businessPages: MetadataRoute.Sitemap = (businesses ?? []).map(b => ({
      url:              `${APP_URL}/businesses/${b.id}`,
      lastModified:     new Date(b.updated_at ?? new Date()),
      changeFrequency:  'weekly' as const,
      priority:         0.8,
    }))

    return [...staticPages, ...businessPages]
  } catch {
    return staticPages
  }
}