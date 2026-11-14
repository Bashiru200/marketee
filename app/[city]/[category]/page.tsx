// app/[city]/[category]/page.tsx
// SEO landing page for city + category combos
// Example URLs:
//   /charlotte/restaurants       → "Best African Restaurants in Charlotte, NC"
//   /durham/hair-braiding        → "African Hair Braiding Salons in Durham, NC"
//   /raleigh/groceries           → "African Grocery Stores in Raleigh, NC"

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MapPin, Phone, Globe, ArrowLeft, ChevronRight } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

// Category slug → DB category + display info
const CATEGORY_MAP: Record<string, {
  dbCategory:    string
  displayName:   string
  description:   string
  icon:          string
  longSeoCopy:   (city: string, count: number) => string
}> = {
  restaurants: {
    dbCategory:  'restaurant',
    displayName: 'African Restaurants',
    description: 'Discover authentic African cuisine',
    icon:        '🍽️',
    longSeoCopy: (city, count) => `Discover ${count} authentic African restaurants in ${city} — from Nigerian jollof rice and suya to Ethiopian injera and tibs, Ghanaian waakye, Senegalese thieboudienne, and more. Each restaurant is diaspora-owned, with real reviews from people who grew up eating these dishes.`,
  },
  groceries: {
    dbCategory:  'food',
    displayName: 'African Grocery Stores',
    description: 'Find authentic ingredients and African markets',
    icon:        '🛒',
    longSeoCopy: (city, count) => `Looking for authentic African ingredients in ${city}? These ${count} grocery stores stock everything from palm oil, egusi seeds, and garri to Maggi cubes, plantains, yam flour, and dried fish. Family-owned, stocked for the diaspora, with the staples you remember from home.`,
  },
  fashion: {
    dbCategory:  'fashion',
    displayName: 'African Fashion & Fabric',
    description: 'Ankara, kente, and authentic African clothing',
    icon:        '👗',
    longSeoCopy: (city, count) => `Explore ${count} African fashion boutiques and fabric shops in ${city}. Shop ankara prints, kente cloth, aso-oke, agbada, dashiki, headwraps, and custom-tailored African wear — all from diaspora-owned stores that understand the culture.`,
  },
  'hair-braiding': {
    dbCategory:  'beauty',
    displayName: 'African Hair Braiding Salons',
    description: 'Box braids, twists, cornrows, and more',
    icon:        '💇',
    longSeoCopy: (city, count) => `${count} African hair braiding salons in ${city} specializing in box braids, Senegalese twists, knotless braids, cornrows, faux locs, and traditional African hairstyles. Experienced stylists from the diaspora who understand African hair textures.`,
  },
  wellness: {
    dbCategory:  'herbs',
    displayName: 'Herbs & Wellness',
    description: 'African traditional wellness and natural remedies',
    icon:        '🌿',
    longSeoCopy: (city, count) => `${count} African wellness stores in ${city} offering traditional herbs, black soap, shea butter, essential oils, and natural remedies rooted in African healing traditions.`,
  },
  'music-arts': {
    dbCategory:  'music',
    displayName: 'Music & Arts',
    description: 'African music, arts, and entertainment',
    icon:        '🎵',
    longSeoCopy: (city, count) => `${count} music and arts providers in ${city} offering African DJs, Afrobeat performers, drummers, dance groups, and cultural entertainment for events and celebrations.`,
  },
  crafts: {
    dbCategory:  'crafts',
    displayName: 'Crafts & Decor',
    description: 'Handmade African crafts and home decor',
    icon:        '🏺',
    longSeoCopy: (city, count) => `${count} African crafts and home decor businesses in ${city} featuring handmade sculptures, textiles, baskets, pottery, and cultural art pieces.`,
  },
  services: {
    dbCategory:  'services',
    displayName: 'Services',
    description: 'Professional services from African-owned businesses',
    icon:        '🛠️',
    longSeoCopy: (city, count) => `${count} African-owned service providers in ${city} — accounting, legal, immigration, auto repair, and more.`,
  },
  nightlife: {
    dbCategory:  'nightlife',
    displayName: 'Bars & Nightlife',
    description: 'African bars, lounges, and nightlife venues',
    icon:        '🍹',
    longSeoCopy: (city, count) => `${count} African bars, lounges, and nightlife venues in ${city} serving as community gathering spots with Afrobeat music, African spirits, and celebrations.`,
  },
}

function slugToCityName(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                        .replace('Winston Salem', 'Winston-Salem')
}

function stateLabel(states: Array<string | null | undefined>): string {
  const uniqueStates = Array.from(new Set(states.filter(Boolean) as string[]))
  if (uniqueStates.length === 1) return uniqueStates[0]
  return 'United States'
}

function locationLabel(cityName: string, state: string): string {
  return state === 'United States' ? `${cityName}, ${state}` : `${cityName}, ${state}`
}

async function getCityState(cityName: string, dbCategory: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('businesses')
    .select('state')
    .ilike('city', cityName)
    .eq('category', dbCategory)
    .eq('status', 'active')
    .limit(20)

  return stateLabel((data ?? []).map((row) => row.state))
}

export async function generateMetadata(
  { params }: { params: Promise<{ city: string; category: string }> }
): Promise<Metadata> {
  const { city, category } = await params
  const cityName = slugToCityName(city)
  const catInfo  = CATEGORY_MAP[category]

  if (!catInfo) return { title: 'Not found' }

  const cityState = await getCityState(cityName, catInfo.dbCategory)
  const place = locationLabel(cityName, cityState)

  return {
    title:       `Best ${catInfo.displayName} in ${place} | Markeetee`,
    description: `${catInfo.description} in ${place}. Real reviews, directions, hours, and contact info from the African diaspora community.`,
    alternates:  { canonical: `/${city}/${category}` },
    openGraph: {
      title:       `${catInfo.displayName} in ${place}`,
      description: catInfo.description,
      url:         `/${city}/${category}`,
      type:        'website',
      images:      ['/og-default.png'],
    },
    robots: { index: true, follow: true },
  }
}

export default async function CityCategoryPage(
  { params }: { params: Promise<{ city: string; category: string }> }
) {
  const { city, category } = await params
  const cityName = slugToCityName(city)
  const catInfo  = CATEGORY_MAP[category]

  if (!catInfo) notFound()

  const supabase = await createClient()

  const { data: businesses } = await supabase
    .from('businesses')
    .select('id, name, category, description, street, city, state, zip, phone, email, website, cover_image, rating, review_count, verified, plan, country, hours_open, lat, lng')
    .ilike('city', cityName)
    .eq('category', catInfo.dbCategory)
    .eq('status', 'active')
    .order('discovery_score', { ascending: false, nullsFirst: false })
    .order('rating',          { ascending: false, nullsFirst: false })
    .limit(50)

  if (!businesses || businesses.length === 0) notFound()

  const cityState = stateLabel(businesses.map((business) => business.state))
  const place = locationLabel(cityName, cityState)

  // Rich ItemList schema for Google
  const schema = {
    '@context': 'https://schema.org',
    '@type':    'ItemList',
    name:       `${catInfo.displayName} in ${place}`,
    numberOfItems: businesses.length,
    itemListElement: businesses.map((b, i) => ({
      '@type':   'ListItem',
      position:  i + 1,
      item: {
        '@type':  catInfo.dbCategory === 'restaurant' ? 'Restaurant' :
                  catInfo.dbCategory === 'food'       ? 'GroceryStore' :
                  catInfo.dbCategory === 'beauty'     ? 'HairSalon' :
                  catInfo.dbCategory === 'fashion'    ? 'ClothingStore' : 'LocalBusiness',
        name:             b.name,
        description:      b.description ?? undefined,
        telephone:        b.phone ?? undefined,
        url:              b.website ?? `https://markeetee.com/businesses/${b.id}`,
        image:            b.cover_image ?? undefined,
        address: {
          '@type':         'PostalAddress',
          streetAddress:   b.street ?? '',
          addressLocality: b.city,
          addressRegion:   b.state,
          postalCode:      b.zip ?? '',
          addressCountry:  'US',
        },
        geo: b.lat && b.lng ? {
          '@type':     'GeoCoordinates',
          latitude:    b.lat,
          longitude:   b.lng,
        } : undefined,
        aggregateRating: b.rating && b.review_count ? {
          '@type':     'AggregateRating',
          ratingValue: b.rating,
          reviewCount: b.review_count,
        } : undefined,
      },
    })),
  }

  return (
    <main className="min-h-screen" style={{ background:'#F8FAF9' }}>

      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* Breadcrumbs */}
      <nav className="max-w-5xl mx-auto px-4 pt-6 text-xs flex items-center gap-1 text-gray-500">
        <Link href="/" className="hover:text-gray-900">Home</Link>
        <ChevronRight size={11} />
        <Link href={`/${city}`} className="hover:text-gray-900">{cityName}</Link>
        <ChevronRight size={11} />
        <span className="text-gray-900 font-semibold">{catInfo.displayName}</span>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ background:'#E1F5EE' }}>
            {catInfo.icon}
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">
	              Best {catInfo.displayName} in {place}
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              {businesses.length} {businesses.length === 1 ? 'business' : 'businesses'} · Updated {new Date().toLocaleDateString('en-US', { month:'long', year:'numeric' })}
            </p>
          </div>
        </div>

        <p className="text-gray-600 leading-7 max-w-3xl">
	          {catInfo.longSeoCopy(place, businesses.length)}
        </p>
      </section>

      {/* Numbered list of businesses */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="space-y-5">
          {businesses.map((biz, i) => (
            <article key={biz.id} className="bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="grid md:grid-cols-[180px_1fr] gap-0">

                {/* Image */}
                <Link href={`/businesses/${biz.id}`}
                  className="block relative aspect-[4/3] md:aspect-auto md:h-full bg-gray-100 overflow-hidden">
                  {biz.cover_image ? (
	                    <Image src={biz.cover_image} alt={biz.name} fill sizes="(min-width: 768px) 180px, 100vw"
	                      className="object-cover hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl"
                      style={{ background:'linear-gradient(135deg,#E1F5EE,#9FE1CB)' }}>
                      {catInfo.icon}
                    </div>
                  )}
                </Link>

                {/* Content */}
                <div className="p-5 md:p-6">
                  <div className="flex items-start gap-3 mb-2">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background:'#085041' }}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <Link href={`/businesses/${biz.id}`}>
                        <h2 className="text-lg font-bold text-gray-900 hover:text-[#1D9E75] transition-colors line-clamp-1">
                          {biz.name}
                        </h2>
                      </Link>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 flex-wrap">
                        {biz.verified && (
                          <span className="font-bold px-2 py-0.5 rounded-full"
                            style={{ background:'#E1F5EE', color:'#085041' }}>
                            ✓ Verified
                          </span>
                        )}
                        {biz.rating > 0 && (
                          <span className="font-semibold text-amber-500">
                            ⭐ {biz.rating.toFixed(1)} ({biz.review_count})
                          </span>
                        )}
                        {biz.country && <span>· 🌍 {biz.country}</span>}
                      </div>
                    </div>
                  </div>

                  {biz.description && (
                    <p className="text-sm text-gray-600 leading-6 mt-2 line-clamp-2">
                      {biz.description}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {biz.street && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin size={11} className="flex-shrink-0" />
                        <span className="truncate">{biz.street}, {biz.city}, {biz.state}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2 flex-wrap">
                    <Link href={`/businesses/${biz.id}`}
                      className="text-xs font-semibold px-4 py-2 rounded-xl text-white hover:opacity-90"
                      style={{ background:'#1D9E75' }}>
                      View details
                    </Link>
                    {biz.phone && (
                      <a href={`tel:${biz.phone}`}
                        className="text-xs font-semibold px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:border-green-300 flex items-center gap-1">
                        <Phone size={11} /> Call
                      </a>
                    )}
                    {biz.website && (
                      <a href={biz.website} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-semibold px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:border-green-300 flex items-center gap-1">
                        <Globe size={11} /> Website
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Back to city */}
        <div className="mt-10 text-center">
          <Link href={`/${city}`}
            className="inline-flex items-center gap-2 text-sm font-semibold"
            style={{ color:'#1D9E75' }}>
            <ArrowLeft size={13} /> All African businesses in {cityName}
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Know an African-owned {catInfo.displayName.toLowerCase().slice(0, -1).replace(/^african /, '')} in {cityName}?
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Add it to Markeetee for free and help the diaspora find it.
          </p>
	          <Link href="/businesses/new"
            className="inline-block rounded-xl px-6 py-3 text-sm font-bold text-white hover:opacity-90"
            style={{ background:'#1D9E75' }}>
            List a business →
          </Link>
        </div>
      </section>
    </main>
  )
}
