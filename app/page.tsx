import Link from 'next/link'
import Image from 'next/image'
import { MapPin, ArrowRight, Star, BadgeCheck, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import BusinessCard from '@/components/businesses/BusinessCard'
import AlgoliaSearchBar from '@/components/search/AlgoliaSearchBar'
import ListBusinessButton from '@/components/ui/ListBusinessButton'


export const dynamic = 'force-dynamic'
export const revalidate = 60

const CATEGORIES = [
  { id:'food',       name:'Food & Groceries', icon:'🍲' },
  { id:'restaurant', name:'Restaurants',       icon:'🍽️' },
  { id:'fashion',    name:'Fashion & Fabric',  icon:'👗' },
  { id:'beauty',     name:'Beauty & Hair',     icon:'💆' },
  { id:'herbs',      name:'Herbs & Wellness',  icon:'🌿' },
  { id:'music',      name:'Music & Arts',      icon:'🎵' },
  { id:'crafts',     name:'Crafts & Decor',    icon:'🏺' },
  { id:'services',   name:'Services',          icon:'🛠️' },
  { id:'nightlife', name:'Bars & Nightlife', icon:'🍺' },
]

const COUNTRIES = [
  { flag:'🇳🇬', name:'Nigeria'      },
  { flag:'🇬🇭', name:'Ghana'        },
  { flag:'🇰🇪', name:'Kenya'        },
  { flag:'🇸🇳', name:'Senegal'      },
  { flag:'🇿🇦', name:'South Africa' },
  { flag:'🇪🇹', name:'Ethiopia'     },
  { flag:'🇨🇲', name:'Cameroon'     },
  { flag:'🇨🇮', name:"Côte d'Ivoire"},
]

const OWNER_BENEFITS = [
  { icon:'📍', title:'Map pin',         desc:'Customers get directions straight to your door' },
  { icon:'📸', title:'Photo gallery',   desc:'Showcase your products and store with photos'   },
  { icon:'⭐', title:'Reviews',         desc:'Build trust with verified community reviews'     },
  { icon:'💬', title:'WhatsApp enquiry',desc:'Customers contact you directly on WhatsApp'     },
  { icon:'📦', title:'Product showcase',desc:'List your menu or products with prices'         },
  { icon:'📊', title:'Analytics',       desc:'See views, saves, and enquiries per week'       },
]

const HOW_IT_WORKS_CUSTOMER = [
  { step:'01', icon:'🔍', title:'Search', desc:'Type what you\'re looking for and your city. Instant results.' },
  { step:'02', icon:'🗺️', title:'Discover', desc:'Browse businesses on the live map or list view with ratings.' },
  { step:'03', icon:'💬', title:'Connect', desc:'Call, WhatsApp, or get directions in one tap.' },
]

const HOW_IT_WORKS_OWNER = [
  { step:'01', icon:'📝', title:'List free', desc:'Add your business name, category, location and contact. 3 minutes.' },
  { step:'02', icon:'📸', title:'Add photos', desc:'Upload a cover photo and products to stand out.' },
  { step:'03', icon:'🚀', title:'Get found', desc:'Appear in search, on the map, and in category browsing.' },
]

export default async function HomePage() {
  const supabase = await createClient()

  const [featuredRes, recentReviewsRes, totalBizRes, totalUsersRes] = await Promise.all([
    supabase
      .from('businesses')
      .select('id,name,category,subcategory,address,city,state,cover_image,rating,review_count,price_range,tags,lat,lng,verified,premium,featured,country')
      .or('featured.eq.true,plan.eq.storefront,plan.eq.premium')
      .order('rating', { ascending: false })
      .limit(6),
    supabase
      .from('reviews')
      .select('id,rating,body,created_at,profiles(name,avatar_url),businesses(name,city)')
      .order('created_at', { ascending: false })
      .gte('rating', 4)
      .limit(3),
    supabase.from('businesses').select('id', { count:'exact', head:true }),
    supabase.from('profiles').select('id',  { count:'exact', head:true }),
  ])

  const featured    = featuredRes.data      ?? []
  const reviews     = (recentReviewsRes.data ?? []) as any[]
  const totalBiz    = totalBizRes.count     ?? 0
  const totalUsers  = totalUsersRes.count   ?? 0

  const STATS = [
    { num: totalBiz   > 0 ? `${totalBiz}+`   : '420+', label:'African businesses' },
    { num: '6',                                          label:'US cities'         },
    { num: '54',                                         label:'Countries'         },
    { num: totalUsers > 0 ? `${totalUsers.toLocaleString()}+` : '12k+', label:'Diaspora users' },
  ]

  return (
    <div>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden text-white"
        style={{ background:'linear-gradient(135deg,#053528,#085041,#0F6E56)' }}>
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage:"url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />

        <div className="relative max-w-4xl mx-auto px-4 py-24 text-center">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm mb-6 border"
            style={{ background:'rgba(255,255,255,0.1)', borderColor:'rgba(255,255,255,0.2)' }}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Now live in Houston, TX · More cities coming soon
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-5 tracking-tight">
            Africa is here.{' '}
            <span style={{ color:'#9FE1CB' }}>Find it.</span>
          </h1>

          <p className="text-xl mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color:'rgba(255,255,255,0.8)' }}>
            Discover Nigerian, Ghanaian, Kenyan and more African-owned grocery stores,
            restaurants, fashion, beauty salons, and services — all in one place.
          </p>

          {/* Algolia search bar */}
          <div className="max-w-2xl mx-auto mb-6">
            <AlgoliaSearchBar />
          </div>

          {/* Quick search tags */}
          <div className="flex flex-wrap justify-center gap-2">
            {['Jollof Rice','Ankara Fabric','Hair Braiding','Palm Oil','Egusi Soup','Shea Butter'].map(t => (
              <Link key={t} href={`/search?tab=products&q=${encodeURIComponent(t)}`}
                className="text-xs px-4 py-1.5 rounded-full border transition-all hover:bg-white/20"
                style={{ background:'rgba(255,255,255,0.08)', borderColor:'rgba(255,255,255,0.2)', color:'#9FE1CB' }}>
                {t}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1440 60L1440 0C1200 40 960 60 720 60C480 60 240 40 0 0L0 60Z" fill="#FAFAF9"/>
          </svg>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section style={{ background:'#053528' }} className="-mt-1">
        <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map(({ num, label }) => (
            <div key={label}>
              <div className="text-3xl font-bold" style={{ color:'#5DCAA5' }}>{num}</div>
              <div className="text-sm mt-1" style={{ color:'#9FE1CB' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Countries we serve ── */}
      <section className="bg-white border-b border-gray-100 py-5">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Serving the diaspora from
            </span>
            {COUNTRIES.map(({ flag, name }) => (
              <div key={name} className="flex items-center gap-1.5 text-sm text-gray-600">
                <span className="text-lg">{flag}</span>
                <span className="font-medium">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Browse by category</h2>
            <p className="text-gray-500 mt-1">Find exactly what you&apos;re looking for</p>
          </div>
          <Link href="/search" className="hidden sm:flex items-center gap-1 text-sm font-medium hover:opacity-80 transition-opacity" style={{ color:'#0F6E56' }}>
            View all <ArrowRight size={15} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {CATEGORIES.map(cat => (
            <Link key={cat.id} href={`/search?category=${cat.id}`}
              className="group bg-white rounded-2xl p-5 border border-gray-100 hover:border-green-300 hover:shadow-md transition-all text-center">
              <div className="text-3xl mb-2">{cat.icon}</div>
              <div className="font-semibold text-sm text-gray-900 group-hover:text-green-700 transition-colors">
                {cat.name}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured businesses ── */}
      <section className="py-16" style={{ background:'#FAFAF9' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Featured stores</h2>
              <p className="text-gray-500 mt-1">Top-rated African businesses near you</p>
            </div>
            <Link href="/search" className="hidden sm:flex items-center gap-1 text-sm font-medium hover:opacity-80 transition-opacity" style={{ color:'#0F6E56' }}>
              See all <ArrowRight size={15} />
            </Link>
          </div>

          {featured.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-4">🏪</div>
              <p className="text-sm mb-2">No featured businesses yet.</p>
              <Link href="/auth/signup" className="text-sm font-medium" style={{ color:'#1D9E75' }}>
                List your business →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map(b => <BusinessCard key={b.id} business={b} />)}
            </div>
          )}

          <div className="text-center mt-8">
            <Link href="/search"
              className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl border-2 transition-all hover:shadow-md"
              style={{ borderColor:'#1D9E75', color:'#1D9E75' }}>
              Browse all businesses <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">How Markeetee works</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Simple for customers. Powerful for business owners.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* For customers */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background:'#1D9E75' }}>
                👤
              </div>
              <h3 className="font-bold text-xl text-gray-900">For customers</h3>
            </div>
            <div className="space-y-5">
              {HOW_IT_WORKS_CUSTOMER.map(s => (
                <div key={s.step} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background:'#E1F5EE' }}>
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold mb-0.5" style={{ color:'#1D9E75' }}>Step {s.step}</p>
                    <p className="font-semibold text-gray-900">{s.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/search"
              className="mt-6 w-full flex items-center justify-center gap-2 text-sm font-semibold text-white py-3 rounded-xl hover:opacity-90 transition-opacity"
              style={{ background:'#1D9E75' }}>
              Start exploring →
            </Link>
          </div>

          {/* For owners */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background:'#085041' }}>
                🏪
              </div>
              <h3 className="font-bold text-xl text-gray-900">For business owners</h3>
            </div>
            <div className="space-y-5">
              {HOW_IT_WORKS_OWNER.map(s => (
                <div key={s.step} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background:'#c5eadb' }}>
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold mb-0.5" style={{ color:'#085041' }}>Step {s.step}</p>
                    <p className="font-semibold text-gray-900">{s.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/auth/signup"
              className="mt-6 w-full flex items-center justify-center gap-2 text-sm font-semibold text-white py-3 rounded-xl hover:opacity-90 transition-opacity"
              style={{ background:'#085041' }}>
              List your business free →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Recent reviews ── */}
      {reviews.length > 0 && (
        <section className="py-16" style={{ background:'#FAFAF9' }}>
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">What the community says</h2>
              <p className="text-gray-500">Real reviews from the African diaspora</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.map((r: any) => {
                const name    = r.profiles?.name ?? 'A customer'
                const initial = name[0]?.toUpperCase() ?? '?'
                return (
                  <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col">
                    {/* Stars */}
                    <div className="flex gap-0.5 mb-3">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} size={14}
                          className={i <= r.rating ? 'text-amber-400 fill-current' : 'text-gray-200'} />
                      ))}
                    </div>
                    {/* Body */}
                    <p className="text-sm text-gray-700 leading-relaxed flex-1 mb-4">
                      &ldquo;{r.body?.slice(0, 160)}{r.body?.length > 160 ? '…' : ''}&rdquo;
                    </p>
                    {/* Author + business */}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                      {r.profiles?.avatar_url ? (
                        <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                          <Image
                            src={r.profiles.avatar_url}
                            alt={name}
                            fill
                            sizes="32px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background:'#085041' }}>
                          {initial}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                        {r.businesses?.name && (
                          <p className="text-xs text-gray-400 truncate">
                            on {r.businesses.name}
                            {r.businesses.city ? ` · ${r.businesses.city}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="text-center mt-8">
              <Link href="/search"
                className="inline-flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity"
                style={{ color:'#1D9E75' }}>
                Find a business to review <ChevronRight size={15} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Map preview CTA ── */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="rounded-3xl overflow-hidden relative"
          style={{ background:'linear-gradient(135deg,#e8f7f1,#c5eadb)', minHeight:'280px' }}>
          {/* Content */}
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 p-10 md:p-14">
            <div className="text-center md:text-left">
              <div className="text-5xl mb-4">🗺️</div>
              <h2 className="text-3xl font-bold mb-3" style={{ color:'#053528' }}>
                Explore the live map
              </h2>
              <p className="max-w-md leading-relaxed" style={{ color:'#085041' }}>
                Every African business plotted on an interactive map.
                Filter by category, get directions in one tap, and discover
                stores you never knew were near you.
              </p>
              <Link href="/map"
                className="inline-flex items-center gap-2 mt-6 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                style={{ background:'#085041' }}>
                <MapPin size={17} /> Open map view
              </Link>
            </div>
            {/* Fake map pins decoration */}
            <div className="relative w-56 h-56 flex-shrink-0 hidden md:block">
              {[
                { top:'20%', left:'30%', size:'lg' },
                { top:'50%', left:'60%', size:'md' },
                { top:'70%', left:'20%', size:'sm' },
                { top:'15%', left:'70%', size:'sm' },
              ].map(({ top, left, size }, i) => (
                <div key={i} className="absolute flex flex-col items-center"
                  style={{ top, left, transform:'translate(-50%,-50%)' }}>
                  <div className="rounded-full shadow-lg flex items-center justify-center text-white font-bold"
                    style={{
                      width:  size === 'lg' ? '44px' : size === 'md' ? '36px' : '28px',
                      height: size === 'lg' ? '44px' : size === 'md' ? '36px' : '28px',
                      background: '#085041',
                      fontSize: size === 'lg' ? '18px' : '14px',
                    }}>
                    🏪
                  </div>
                  <div className="w-1.5 h-3 rounded-b-full mt-0.5" style={{ background:'#085041' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Owner CTA (full width) ── */}
      <section className="py-20 px-4" style={{ background:'linear-gradient(135deg,#053528,#085041)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left — copy */}
            <div className="text-white">
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-6 border"
                style={{ background:'rgba(255,255,255,0.1)', borderColor:'rgba(255,255,255,0.2)', color:'#9FE1CB' }}>
                🏪 For African business owners
              </div>
              <h2 className="text-4xl font-bold leading-tight mb-4">
                Get found by thousands of diaspora customers
              </h2>
              <p className="text-lg leading-relaxed mb-8" style={{ color:'rgba(255,255,255,0.75)' }}>
                Your community is searching for you right now.
                List your African business on Markeetee for free
                and start getting enquiries via WhatsApp, phone, and map directions.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <ListBusinessButton
                  className="inline-flex items-center justify-center gap-2 bg-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity text-sm"
                  style={{ color:'#085041' }}>
                  List your business — it&apos;s free
                </ListBusinessButton>
                <Link href="/how-it-works"
                  className="inline-flex items-center justify-center gap-2 border font-medium px-6 py-3 rounded-xl hover:opacity-80 transition-opacity text-sm"
                  style={{ borderColor:'rgba(255,255,255,0.3)', color:'#9FE1CB' }}>
                  How it works <ArrowRight size={15} />
                </Link>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-6 mt-8 pt-8 border-t" style={{ borderColor:'rgba(255,255,255,0.15)' }}>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{totalBiz > 0 ? `${totalBiz}+` : '420+'}</p>
                  <p className="text-xs mt-0.5" style={{ color:'#9FE1CB' }}>Businesses listed</p>
                </div>
                <div className="w-px h-10" style={{ background:'rgba(255,255,255,0.2)' }} />
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">Free</p>
                  <p className="text-xs mt-0.5" style={{ color:'#9FE1CB' }}>Basic listing</p>
                </div>
                <div className="w-px h-10" style={{ background:'rgba(255,255,255,0.2)' }} />
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">3 min</p>
                  <p className="text-xs mt-0.5" style={{ color:'#9FE1CB' }}>To go live</p>
                </div>
              </div>
            </div>

            {/* Right — benefits grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {OWNER_BENEFITS.map(({ icon, title, desc }) => (
                <div key={title}
                  className="flex items-start gap-3 p-4 rounded-2xl"
                  style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)' }}>
                  <span className="text-2xl flex-shrink-0">{icon}</span>
                  <div>
                    <p className="font-semibold text-white text-sm">{title}</p>
                    <p className="text-xs mt-0.5" style={{ color:'rgba(255,255,255,0.6)' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ preview ── */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Common questions</h2>
          <p className="text-gray-500">Everything you need to know</p>
        </div>
        <div className="space-y-4">
          {[
            { q:'Is Markeetee free to use?',        a:'Yes — browsing, searching, and leaving reviews is completely free. Business listings are also free to create.' },
            { q:'Which cities is Markeetee in?',    a:'We launched in Houston, TX and are expanding to Atlanta, Dallas, New York, and Washington DC next.' },
            { q:'How do I list my business?',       a:'Click "List your business", create a free owner account, and fill in your details. Your listing goes live immediately.' },
            { q:'How do customers contact me?',     a:'Via WhatsApp, phone call, email, or Google Maps directions — all directly from your listing page.' },
          ].map(({ q, a }) => (
            <div key={q} className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="font-semibold text-gray-900 mb-2">{q}</p>
              <p className="text-sm text-gray-600 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-6">
          <Link href="/faq"
            className="inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-80 transition-opacity"
            style={{ color:'#1D9E75' }}>
            View all FAQs <ChevronRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-4 pb-16">
        <div className="max-w-2xl mx-auto text-center rounded-3xl p-12"
          style={{ background:'linear-gradient(135deg,#E1F5EE,#c5eadb)' }}>
          <div className="text-5xl mb-4">🌍</div>
          <h2 className="text-3xl font-bold mb-3" style={{ color:'#053528' }}>
            Your community is waiting
          </h2>
          <p className="mb-8 leading-relaxed" style={{ color:'#085041' }}>
            Join thousands of diaspora Africans who discover and support
            African-owned businesses every day on Markeetee.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/search"
              className="inline-flex items-center justify-center gap-2 text-white text-sm font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
              style={{ background:'#1D9E75' }}>
              Explore businesses
            </Link>
            <Link href="/map"
              className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl border-2 transition-all hover:shadow-md"
              style={{ borderColor:'#1D9E75', color:'#085041' }}>
              <MapPin size={15} /> View the map
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}