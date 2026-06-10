import { NextRequest, NextResponse } from 'next/server'
import { algoliasearch } from 'algoliasearch'

const INDEX = 'businesses'

export async function POST(req: NextRequest) {
  
  const appId =process.env.NEXT_PUBLIC_ALGOLIA_APP_ID
  const apiKey = process.env.ALGOLIA_ADMIN_KEY

  if(!appId || !apiKey) {
    throw new Error('Algolia credentials are not set')
  }
  const client = algoliasearch(appId, apiKey)
  
  try {
    const { type, record, old_record } = await req.json()

    if (type === 'INSERT' || type === 'UPDATE') {
      const b = record
      await client.saveObject({
        indexName: INDEX,
        body: {
          objectID:     b.id,
          name:         b.name         ?? '',
          category:     b.category     ?? '',
          subcategory:  b.subcategory  ?? '',
          description:  b.description  ?? '',
          city:         b.city         ?? '',
          state:        b.state        ?? '',
          country:      b.country      ?? '',
          cover_image:  b.cover_image  ?? null,
          rating:       b.rating       ?? 0,
          review_count: b.review_count ?? 0,
          price_range:  b.price_range  ?? '',
          tags:         b.tags         ?? [],
          verified:     b.verified     ?? false,
          premium:      b.premium      ?? false,
          featured:     b.featured     ?? false,
        },
      })
      return NextResponse.json({ ok: true, action: type })
    }

    if (type === 'DELETE') {
      await client.deleteObject({ indexName: INDEX, objectID: old_record.id })
      return NextResponse.json({ ok: true, action: 'DELETE' })
    }

    return NextResponse.json({ ok: true, action: 'ignored' })
  } catch (err) {
    console.error('[Algolia webhook]', err)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
  
}