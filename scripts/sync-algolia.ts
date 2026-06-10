import { createClient } from '@supabase/supabase-js'
import { algoliasearch } from 'algoliasearch'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const client = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.ALGOLIA_ADMIN_KEY!
)

const INDEX = 'businesses'

async function configureIndex() {
  await client.setSettings({
    indexName: INDEX,
    indexSettings: {
      searchableAttributes: [
        'name', 'subcategory', 'category',
        'description', 'tags', 'city', 'state', 'country',
      ],
      attributesForFaceting: [
        'category', 'country', 'city', 'price_range', 'verified', 'featured',
      ],
      customRanking: [
        'desc(featured)', 'desc(rating)', 'desc(review_count)',
      ],
      attributesToHighlight: ['name', 'description', 'tags'],
      hitsPerPage: 10,
    },
  })
  console.log('✓ Index settings configured')
}

async function syncBusinesses() {
  console.log('Fetching businesses from Supabase...')

  const { data, error } = await supabase
    .from('businesses')
    .select(`
      id, name, category, subcategory, description,
      city, state, country, cover_image,
      rating, review_count, price_range,
      tags, verified, premium, featured
    `)

  if (error) { console.error('Supabase error:', error.message); process.exit(1) }
  if (!data || data.length === 0) { console.log('No businesses to sync'); return }

  const records = data.map(b => ({
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
  }))

  console.log(`Syncing ${records.length} businesses...`)
  await client.saveObjects({ indexName: INDEX, objects: records })
  console.log(`✓ Synced ${records.length} records`)
}

async function main() {
  await configureIndex()
  await syncBusinesses()
  console.log('\nSync complete!')
}

main().catch(console.error)