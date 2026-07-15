// app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/coming-soon',
          '/coming-soon?*',
          '/api/',
          '/admin',
          '/dashboard',
          '/auth/',
          '/settings',
          '/invite/',
          '/claim/',
        ],
      },
    ],
    sitemap: 'https://markeetee.com/sitemap.xml',
    host:    'https://markeetee.com',
  }
}