import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://markeetee.com'
  return {
    rules: [
      {
        userAgent: '*',
        allow:     '/',
        disallow:  ['/dashboard', '/account', '/auth'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}