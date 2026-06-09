import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  const base     = process.env.NEXT_PUBLIC_APP_URL ?? 'https://markeetee.com'

  const { data: businesses } = await supabase
    .from('businesses')
    .select('id, updated_at')

  const businessUrls = (businesses ?? []).map(b => ({
    url:          `${base}/businesses/${b.id}`,
    lastModified: b.updated_at ? new Date(b.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority:     0.8,
  }))

  const staticPages = [
    { url: base,                      priority: 1.0, changeFrequency: 'daily'   as const },
    { url: `${base}/search`,          priority: 0.9, changeFrequency: 'daily'   as const },
    { url: `${base}/map`,             priority: 0.8, changeFrequency: 'daily'   as const },
    { url: `${base}/about`,           priority: 0.6, changeFrequency: 'monthly' as const },
    { url: `${base}/how-it-works`,    priority: 0.6, changeFrequency: 'monthly' as const },
    { url: `${base}/contact`,         priority: 0.5, changeFrequency: 'monthly' as const },
    { url: `${base}/faq`,             priority: 0.6, changeFrequency: 'monthly' as const },
    { url: `${base}/terms`,           priority: 0.3, changeFrequency: 'yearly'  as const },
    { url: `${base}/privacy`,         priority: 0.3, changeFrequency: 'yearly'  as const },
  ]

  return [...staticPages, ...businessUrls]
}