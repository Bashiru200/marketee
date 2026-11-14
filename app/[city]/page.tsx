// app/[city]/page.tsx
// Programmatic SEO landing page — one per NC city
// Example URLs:
//   /charlotte       → "African-owned businesses in Charlotte, NC"
//   /durham          → "African-owned businesses in Durham, NC"
//   /winston-salem   → "African-owned businesses in Winston-Salem, NC"

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MapPin, Search, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 3600  // Regenerate every hour

// ─────────────────────────────────────────────────────────────────────────
// Category metadata for display + SEO
// ─────────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'restaurant', name: 'Restaurants',       icon: '🍽️', slug: 'restaurants' },
  { id: 'food',       name: 'Food & Groceries', icon: '🍲', slug: 'groceries'    },
  { id: 'fashion',    name: 'Fashion & Fabric', icon: '👗', slug: 'fashion'      },
  { id: 'beauty',     name: 'Beauty & Hair',    icon: '💇', slug: 'hair-braiding'},
  { id: 'herbs',      name: 'Herbs & Wellness', icon: '🌿', slug: 'wellness'     },
  { id: 'music',      name: 'Music & Arts',     icon: '🎵', slug: 'music-arts'   },
  { id: 'crafts',     name: 'Crafts & Decor',   icon: '🏺', slug: 'crafts'       },
  { id: 'services',   name: 'Services',         icon: '🛠️', slug: 'services'     },
  { id: 'nightlife',  name: 'Bars & Nightlife', icon: '🍹', slug: 'nightlife'    },
] as const

// ─────────────────────────────────────────────────────────────────────────
// Convert slug ↔ pretty name
// ─────────────────────────────────────────────────────────────────────────
function slugToCityName(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                        .replace('Winston Salem', 'Winston-Salem')
                        .replace('Wake Forest', 'Wake Forest')
}

function stateLabel(states: Array<string | null | undefined>): string {
  const uniqueStates = Array.from(new Set(states.filter(Boolean) as string[]))
  if (uniqueStates.length === 1) return uniqueStates[0]
  return 'United States'
}

function locationLabel(cityName: string, state: string): string {
  return state === 'United States' ? `${cityName}, ${state}` : `${cityName}, ${state}`
}

async function getCityState(cityName: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('businesses')
    .select('state')
    .ilike('city', cityName)
    .eq('status', 'active')
    .limit(20)

  return stateLabel((data ?? []).map((row) => row.state))
}

// ─────────────────────────────────────────────────────────────────────────
// generateMetadata — SEO meta per city
// ─────────────────────────────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ city: string }> }
): Promise<Metadata> {
  const { city } = await params
  const cityName = slugToCityName(city)
  const cityState = await getCityState(cityName)
  const place = locationLabel(cityName, cityState)

  return {
    title:       `African-Owned Businesses in ${place} | Markeetee`,
    description: `Discover African-owned restaurants, grocery stores, hair braiding salons, fashion boutiques, and more in ${place}. Reviews, directions, and contact info on Markeetee.`,
    alternates:  { canonical: `/${city}` },
    openGraph: {
      title:       `African-Owned Businesses in ${place}`,
      description: `Find every African-owned business in ${place} — restaurants, groceries, salons, and more.`,
      url:         `/${city}`,
      type:        'website',
      images:      ['/og-default.png'],
    },
    robots: { index: true, follow: true },
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────
export default async function CityPage(
  { params }: { params: Promise<{ city: string }> }
) {
  const { city } = await params
  const cityName = slugToCityName(city)
  const supabase = await createClient()

  // Fetch businesses in this city
  const { data: businesses, error } = await supabase
    .from('businesses')
    .select('id, name, category, description, street, city, state, zip, phone, website, cover_image, rating, review_count, verified, plan, country')
    .ilike('city', cityName)
    .eq('status', 'active')
    .order('discovery_score', { ascending: false, nullsFirst: false })
    .order('rating',          { ascending: false, nullsFirst: false })
    .limit(100)

  if (error || !businesses || businesses.length === 0) {
    notFound()
  }

  // Group by category
  const byCategory = CATEGORIES.map(cat => ({
    ...cat,
    businesses: businesses.filter(b => b.category === cat.id),
  })).filter(c => c.businesses.length > 0)

  const totalCount = businesses.length
  const cityState = stateLabel(businesses.map((business) => business.state))
  const place = locationLabel(cityName, cityState)

  // ─────────────────────────────────────────────────────────────────────
  // LocalBusiness schema JSON-LD
  // ─────────────────────────────────────────────────────────────────────
  const schema = {
    '@context': 'https://schema.org',
    '@type':    'CollectionPage',
    name:       `African-Owned Businesses in ${place}`,
    description:`Directory of African-owned businesses in ${place}`,
    url:        `https://markeetee.com/${city}`,
    mainEntity: {
      '@type':          'ItemList',
      numberOfItems:    totalCount,
      itemListElement:  businesses.slice(0, 20).map((b, i) => ({
        '@type':    'ListItem',
        position:   i + 1,
        item: {
          '@type':  'LocalBusiness',
          name:     b.name,
          address: {
            '@type':         'PostalAddress',
            streetAddress:   b.street ?? '',
            addressLocality: b.city,
            addressRegion:   b.state,
            postalCode:      b.zip ?? '',
            addressCountry:  'US',
          },
          telephone:         b.phone ?? undefined,
          url:               b.website ?? `https://markeetee.com/businesses/${b.id}`,
          aggregateRating:   b.rating && b.review_count ? {
            '@type':         'AggregateRating',
            ratingValue:     b.rating,
            reviewCount:     b.review_count,
          } : undefined,
        },
      })),
    },
  }

  return (
    <main className="min-h-screen" style={{ background:'#F8FAF9' }}>

      {/* JSON-LD for Google rich results */}
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* ─── Hero ─── */}
      <section className="text-white" style={{ background:'linear-gradient(135deg,#053528,#085041 60%,#1D9E75)' }}>
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">

          {/* Breadcrumb */}
          <nav className="text-xs mb-6" style={{ color:'#9FE1CB' }}>
            <Link href="/" className="hover:underline">Home</Link>
            <span className="mx-2">›</span>
            <span>{cityName}</span>
          </nav>

          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-green-100 mb-5">
            <MapPin size={11} /> {place}
          </span>

          <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">
            African-Owned Businesses in {cityName}
          </h1>

          <p className="text-lg text-green-100 leading-8 max-w-2xl">
            Discover {totalCount} African-owned {totalCount === 1 ? 'business' : 'businesses'} in {place} —
            restaurants, grocery markets, hair braiding salons, fashion boutiques, and more.
            Real reviews from the African diaspora community.
          </p>

          <div className="mt-8 flex gap-3 flex-wrap">
            <Link href={`/search?city=${encodeURIComponent(cityName)}`}
              className="rounded-2xl bg-white px-6 py-3 text-sm font-bold flex items-center gap-2"
              style={{ color:'#085041' }}>
              <Search size={14} /> Search in {cityName}
            </Link>
            <Link href={`/map?city=${encodeURIComponent(cityName)}`}
              className="rounded-2xl border-2 border-white/30 px-6 py-3 text-sm font-bold text-white flex items-center gap-2">
              <MapPin size={14} /> View on map
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Category jump-links ─── */}
      <section className="border-b border-gray-100 bg-white sticky top-16 z-20">
        <div className="max-w-6xl mx-auto px-4 overflow-x-auto">
          <div className="flex gap-2 py-3">
            {byCategory.map(cat => (
              <a key={cat.id} href={`#${cat.slug}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors">
                <span>{cat.icon}</span>
                {cat.name}
                <span className="text-xs text-gray-400">({cat.businesses.length})</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Business sections by category ─── */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        {byCategory.map(cat => (
          <div key={cat.id} id={cat.slug} className="mb-14 scroll-mt-32">

            <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background:'#E1F5EE' }}>
                    {cat.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {cat.name} in {cityName}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {cat.businesses.length} {cat.businesses.length === 1 ? 'business' : 'businesses'} listed
                    </p>
                  </div>
                </div>
              </div>
              <Link href={`/${city}/${cat.slug}`}
                className="text-sm font-semibold flex items-center gap-1"
                style={{ color:'#1D9E75' }}>
                View all {cat.name.toLowerCase()} <ArrowRight size={13} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cat.businesses.slice(0, 6).map(biz => (
                <Link key={biz.id} href={`/businesses/${biz.id}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all">
                  <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
                    {biz.cover_image ? (
	                      <Image src={biz.cover_image} alt={biz.name} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
	                        className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl"
                        style={{ background:'linear-gradient(135deg,#E1F5EE,#9FE1CB)' }}>
                        {cat.icon}
                      </div>
                    )}
                    {biz.verified && (
                      <span className="absolute top-3 left-3 bg-white/95 backdrop-blur rounded-full px-2 py-1 text-[10px] font-bold flex items-center gap-1"
                        style={{ color:'#085041' }}>
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 leading-snug line-clamp-1 group-hover:text-[#1D9E75] transition-colors">
                      {biz.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                      {biz.street ?? cityName}
                    </p>
                    {biz.rating > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-xs">
                        <span className="text-amber-500 font-bold">⭐ {biz.rating.toFixed(1)}</span>
                        <span className="text-gray-400">({biz.review_count})</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* ─── SEO content block ─── */}
      <section className="bg-white border-t border-gray-100 py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            About African-owned businesses in {cityName}
          </h2>
          <div className="prose prose-sm max-w-none text-gray-600 leading-7 space-y-4">
            <p>
              {cityName} is home to a growing African diaspora community — Nigerian, Ghanaian,
              Ethiopian, Kenyan, Senegalese, and other West and East African families who have built
              vibrant small businesses across the city. From authentic jollof rice to intricate
              hair braiding, from ankara fabric boutiques to specialty grocery stores stocking
              everything from egusi seeds to palm oil — if you are part of the diaspora or just
              curious about African culture, there is something to discover.
            </p>
            <p>
              Markeetee lists {totalCount} African-owned {totalCount === 1 ? 'business' : 'businesses'} in {cityName},
              with real reviews from the community, accurate contact information, and direct
              messaging via WhatsApp. Each business is listed for free, with business owners
              encouraged to claim their listing and keep it up to date.
            </p>
            <p>
              Whether you are searching for a late-night Ethiopian restaurant, a Senegalese
              braider for Senegalese twists, or a one-stop African market for shopping, this
              guide will help you find it fast — right here in {cityName}.
            </p>
          </div>

          <div className="mt-10 bg-gradient-to-br rounded-2xl p-6 text-center" style={{ background:'linear-gradient(135deg,#053528,#1D9E75)' }}>
            <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color:'#9FE1CB' }}>
              Own a business in {cityName}?
            </p>
            <h3 className="text-xl font-bold text-white mb-4">
              List your business free on Markeetee
            </h3>
            <p className="text-sm mb-5" style={{ color:'#E1F5EE' }}>
              Get discovered by the African diaspora in {cityName}. 6 months of premium features free during launch.
            </p>
            <Link href="/businesses/new"
              className="inline-block rounded-xl bg-white px-6 py-3 text-sm font-bold"
              style={{ color:'#085041' }}>
              Claim my business →
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
