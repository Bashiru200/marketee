import Link from 'next/link'
import { Search, MapPin, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import BusinessCard from '@/components/business/BusinessCard'
import ListBusinessButton from '@/components/ui/ListBusinessButton'

const CATEGORIES = [
  { id: 'food',       name: 'Food & Groceries',  icon: '🍲' },
  { id: 'restaurant', name: 'Restaurants',        icon: '🍽️' },
  { id: 'fashion',    name: 'Fashion & Fabric',   icon: '👗' },
  { id: 'beauty',     name: 'Beauty & Hair',      icon: '💆' },
  { id: 'herbs',      name: 'Herbs & Wellness',   icon: '🌿' },
  { id: 'music',      name: 'Music & Arts',       icon: '🎵' },
  { id: 'crafts',     name: 'Crafts & Decor',     icon: '🏺' },
  { id: 'services',   name: 'Services',           icon: '🛠️' },
]

// Cache home page for 60 seconds
export const revalidate = 60

export default async function HomePage() {
  const supabase = await createClient()

  const [featuredRes, totalRes] = await Promise.all([
    supabase
      .from('businesses')
      .select('id, name, category, subcategory, address, city, state, cover_image, rating, review_count, price_range, tags, lat, lng, verified, premium, featured, country')
      .eq('featured', true)
      .order('rating', { ascending: false })
      .limit(3),
    supabase
      .from('businesses')
      .select('id', { count: 'exact', head: true }),
  ])

  const featured  = featuredRes.data  ?? []
  const totalBiz  = totalRes.count    ?? 0

  const stats = [
    { num: totalBiz > 0 ? `${totalBiz}+` : '0', label: 'African businesses' },
    { num: '6',    label: 'US cities' },
    { num: '54',   label: 'Countries' },
    { num: '12k+', label: 'Diaspora users' },
  ]

  return (
    <div>
      {/* Hero */}
      <section className="text-white py-20 px-4" style={{ background: 'linear-gradient(135deg,#085041,#0F6E56,#1D9E75)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm mb-6 border"
            style={{ background: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.2)' }}>
            <span className="w-2 h-2 rounded-full bg-green-400" />
            Now live in Houston, TX
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">
            Africa is here. <span style={{ color: '#9FE1CB' }}>Find it.</span>
          </h1>
          <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color: '#9FE1CB' }}>
            Discover African-owned grocery stores, restaurants, fashion, beauty salons, and more — all mapped in one place.
          </p>
          <div className="bg-white rounded-2xl p-2 flex flex-col sm:flex-row gap-2 max-w-xl mx-auto shadow-xl">
            <div className="flex items-center gap-2 flex-1 px-3">
              <Search size={17} className="text-gray-400 flex-shrink-0" />
              <span className="text-gray-400 text-sm select-none">Try &quot;jollof rice&quot; or &quot;ankara fabric&quot;</span>
            </div>
            <Link href="/search"
              className="text-sm font-semibold text-white px-5 py-2.5 rounded-xl text-center transition-opacity hover:opacity-90"
              style={{ background: '#1D9E75' }}>
              Search
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {['Jollof Rice','Ankara Fabric','Hair Braiding','Palm Oil','Suya'].map(t => (
              <Link key={t} href={`/search?q=${t}`}
                className="text-xs px-3 py-1 rounded-full transition-colors"
                style={{ background: 'rgba(255,255,255,0.12)', color: '#9FE1CB' }}>
                {t}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: '#053528' }}>
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map(({ num, label }) => (
            <div key={label}>
              <div className="text-3xl font-bold" style={{ color: '#5DCAA5' }}>{num}</div>
              <div className="text-sm mt-1" style={{ color: '#9FE1CB' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Browse by category</h2>
            <p className="text-gray-500 mt-1">Find exactly what you&apos;re looking for</p>
          </div>
          <Link href="/search" className="hidden sm:flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80" style={{ color: '#0F6E56' }}>
            View all <ArrowRight size={15} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {CATEGORIES.map(cat => (
            <Link key={cat.id} href={`/search?category=${cat.id}`}
              className="group bg-white rounded-2xl p-5 border border-gray-100 hover:border-green-300 hover:shadow-md transition-all text-center">
              <div className="text-3xl mb-2">{cat.icon}</div>
              <div className="font-semibold text-sm text-gray-900 group-hover:text-green-700">{cat.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured businesses */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Featured stores</h2>
              <p className="text-gray-500 mt-1">Top-rated African businesses near you</p>
            </div>
            <Link href="/search" className="hidden sm:flex items-center gap-1 text-sm font-medium hover:opacity-80 transition-opacity" style={{ color: '#0F6E56' }}>
              See all <ArrowRight size={15} />
            </Link>
          </div>

          {featured.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-4">🏪</div>
              <p className="text-sm">No featured businesses yet.</p>
              <ListBusinessButton className="inline-block mt-4 text-sm font-medium" style={{ color: '#1D9E75' }} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map(b => <BusinessCard key={b.id} business={b} />)}
            </div>
          )}
        </div>
      </section>

      {/* Map CTA */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="rounded-3xl p-8 md:p-12 text-center" style={{ background: 'linear-gradient(135deg,#e8f7f1,#c5eadb)' }}>
          <div className="text-5xl mb-4">🗺️</div>
          <h2 className="text-3xl font-bold mb-3" style={{ color: '#053528' }}>Explore the live map</h2>
          <p className="mb-6 max-w-md mx-auto" style={{ color: '#085041' }}>
            See every African business plotted on a map. Get directions in one tap.
          </p>
          <Link href="/map"
            className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
            style={{ background: '#085041' }}>
            <MapPin size={17} /> Open map view
          </Link>
        </div>
      </section>

      {/* Owner CTA */}
      <section className="text-white py-16 px-4 text-center" style={{ background: '#085041' }}>
        <h2 className="text-3xl font-bold mb-4">Own an African business?</h2>
        <p className="text-lg mb-8 max-w-lg mx-auto" style={{ color: '#9FE1CB' }}>
          List your business for free and get discovered by thousands of diaspora customers.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <ListBusinessButton
            className="bg-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
            style={{ color: '#085041' }} />
          <Link href="/search"
            className="border font-medium px-6 py-3 rounded-xl hover:opacity-80 transition-opacity"
            style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#9FE1CB' }}>
            Explore businesses
          </Link>
        </div>
      </section>
    </div>
  )
}