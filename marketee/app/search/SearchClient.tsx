'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search, X, MapPin, Star, BadgeCheck,
  LayoutGrid, List, Map, ChevronLeft, ChevronRight, SlidersHorizontal
} from 'lucide-react'
import { BusinessRow } from '@/lib/queries'

// ── Constants ──────────────────────────────────────────────────────────────
const FLAGS: Record<string, string> = {
  Nigeria: '🇳🇬', Ghana: '🇬🇭', Kenya: '🇰🇪',
  Senegal: '🇸🇳', 'South Africa': '🇿🇦', Ethiopia: '🇪🇹', Cameroon: '🇨🇲',
}

const COUNTRIES = ['Nigeria', 'Ghana', 'Kenya', 'Senegal', 'South Africa', 'Ethiopia', 'Cameroon']

const GRADIENTS: Record<string, string> = {
  food:       'linear-gradient(135deg,#c5eadb,#9fdcc3)',
  restaurant: 'linear-gradient(135deg,#EEEDFE,#AFA9EC)',
  fashion:    'linear-gradient(135deg,#FAEEDA,#FAC775)',
  beauty:     'linear-gradient(135deg,#FBEAF0,#ED93B1)',
  herbs:      'linear-gradient(135deg,#EAF3DE,#C0DD97)',
  music:      'linear-gradient(135deg,#FAECE7,#F0997B)',
  crafts:     'linear-gradient(135deg,#E6F1FB,#85B7EB)',
  services:   'linear-gradient(135deg,#F1EFE8,#B4B2A9)',
}

const ITEMS_PER_PAGE = 6

// ── Types ──────────────────────────────────────────────────────────────────
interface Category {
  id: string
  name: string
  icon: string
  count: number
}

interface Props {
  businesses: BusinessRow[]
  categories: Category[]
}

// ── Star rating row ────────────────────────────────────────────────────────
function StarRow({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size}
          className={i <= Math.round(rating ?? 0) ? 'text-amber-400 fill-current' : 'text-gray-200'} />
      ))}
    </div>
  )
}

// ── Single business card ───────────────────────────────────────────────────
function BusinessCard({ b }: { b: BusinessRow }) {
  const grad = GRADIENTS[b.category ?? ''] ?? GRADIENTS.services

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-green-400 transition-colors group">
      {/* Image / gradient */}
      <div className="relative h-36">
        {b.cover_image
          ? <img src={b.cover_image} alt={b.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full" style={{ background: grad }} />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {b.featured && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500 text-white">Featured</span>
          )}
          {b.premium && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white" style={{ background: '#1D9E75' }}>Premium</span>
          )}
          {b.verified && !b.featured && !b.premium && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/90 flex items-center gap-1" style={{ color: '#085041' }}>
              <BadgeCheck size={9} /> Verified
            </span>
          )}
        </div>

        {/* Country flag */}
        <div className="absolute top-2 right-2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center text-xs">
          {FLAGS[b.country ?? ''] ?? '🌍'}
        </div>

        {/* Price range */}
        {b.price_range && (
          <div className="absolute bottom-2 right-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/50 text-white">
            {b.price_range}
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-3">
        <p className="font-medium text-sm text-gray-900 truncate group-hover:text-green-700 transition-colors">{b.name}</p>
        <p className="text-xs text-gray-400 truncate mb-1.5">{b.subcategory ?? b.category} · {b.city}</p>

        <div className="flex items-center gap-1.5 mb-1.5">
          <StarRow rating={b.rating ?? 0} />
          <span className="text-xs font-medium text-gray-800">{(b.rating ?? 0).toFixed(1)}</span>
          <span className="text-xs text-gray-400">({b.review_count ?? 0})</span>
        </div>

        {b.address && (
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-2.5">
            <MapPin size={10} className="flex-shrink-0" style={{ color: '#1D9E75' }} />
            <span className="truncate">{b.address}</span>
          </div>
        )}

        {b.tags && b.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap mb-3">
            {b.tags.slice(0, 3).map(t => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: '#E1F5EE', color: '#085041' }}>{t}</span>
            ))}
          </div>
        )}

        <div className="flex gap-1.5">
          <Link href={`/businesses/${b.id}`}
            className="flex-1 text-center text-xs font-medium text-white py-1.5 rounded-lg hover:opacity-90 transition-opacity"
            style={{ background: '#1D9E75' }}>
            View Store
          </Link>
          {b.lat && b.lng && (
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs border border-gray-200 text-gray-500 px-2.5 py-1.5 rounded-lg hover:border-green-400 hover:text-green-700 transition-colors">
              <MapPin size={11} /> Map
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main search page component ─────────────────────────────────────────────
export default function SearchClient({ businesses = [], categories = [] }: Props) {
  const [query,        setQuery]        = useState('')
  const [city,         setCity]         = useState('')
  const [cat,          setCat]          = useState('')
  const [price,        setPrice]        = useState('')
  const [sort,         setSort]         = useState('rating')
  const [view,         setView]         = useState<'grid' | 'list'>('grid')
  const [country,      setCountry]      = useState('')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [premiumOnly,  setPremiumOnly]  = useState(false)
  const [minRating,    setMinRating]    = useState(0)
  const [page,         setPage]         = useState(1)
  const [sidebarOpen,  setSidebarOpen]  = useState(false)

  // ── Filtering + sorting ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let r = (businesses ?? []).filter(b => {
      const q     = query.toLowerCase()
      const mq    = !query  || b.name.toLowerCase().includes(q) ||
        (b.tags ?? []).some(t => t.toLowerCase().includes(q)) ||
        (b.description ?? '').toLowerCase().includes(q) ||
        (b.subcategory ?? '').toLowerCase().includes(q)
      const mc    = !cat          || b.category    === cat
      const mp    = !price        || b.price_range  === price
      const mco   = !country      || b.country      === country
      const mcity = !city         ||
        (b.city  ?? '').toLowerCase().includes(city.toLowerCase()) ||
        (b.state ?? '').toLowerCase().includes(city.toLowerCase()) ||
        (b.zip   ?? '').includes(city)
      const mv    = !verifiedOnly || b.verified
      const mpr   = !premiumOnly  || b.premium
      const mr    = (b.rating ?? 0) >= minRating
      return mq && mc && mp && mco && mcity && mv && mpr && mr
    })
    if (sort === 'rating')  r.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    if (sort === 'reviews') r.sort((a, b) => (b.review_count ?? 0) - (a.review_count ?? 0))
    if (sort === 'name')    r.sort((a, b) => a.name.localeCompare(b.name))
    return r
  }, [query, city, cat, price, sort, country, verifiedOnly, premiumOnly, minRating, businesses])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
  const activeFilters = [cat, price, country, verifiedOnly ? 'v' : '', premiumOnly ? 'p' : ''].filter(Boolean)

  function clearAll() {
    setCat(''); setPrice(''); setCountry(''); setCity('')
    setVerifiedOnly(false); setPremiumOnly(false); setMinRating(0); setQuery(''); setPage(1)
  }

  const ratingBreakdown = [5, 4, 3].map(s => ({
    s,
    pct: businesses.length
      ? businesses.filter(b => (b.rating ?? 0) >= s).length / businesses.length * 100
      : 0,
  }))

  // ── Sidebar ─────────────────────────────────────────────────────────────
  const Sidebar = () => (
    <aside className="w-full space-y-5">

      {/* Category */}
      <div>
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">Category</p>
        <div className="space-y-0.5">
          {[{ id: '', name: 'All categories', icon: '🌍', count: businesses.length }, ...categories].map(c => (
            <button key={c.id} onClick={() => { setCat(c.id); setPage(1) }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-colors"
              style={{
                background: cat === c.id ? '#E1F5EE' : 'transparent',
                color:      cat === c.id ? '#085041'  : '#374151',
                fontWeight: cat === c.id ? 500 : 400,
              }}>
              <span className="flex items-center gap-2">
                <span>{c.icon}</span>
                <span className="text-left">{c.name}</span>
              </span>
              <span className="text-[11px] px-1.5 py-0.5 rounded-full"
                style={{ background: cat === c.id ? '#085041' : '#F3F4F6', color: cat === c.id ? '#C5EADB' : '#6B7280' }}>
                {c.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Price */}
      <div>
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">Price range</p>
        <div className="flex gap-2">
          {['$', '$$', '$$$'].map(p => (
            <button key={p} onClick={() => { setPrice(price === p ? '' : p); setPage(1) }}
              className="flex-1 py-1.5 rounded-lg text-sm border transition-colors"
              style={{
                borderColor: price === p ? '#1D9E75' : '#E5E7EB',
                background:  price === p ? '#E1F5EE' : 'transparent',
                color:       price === p ? '#085041'  : '#4B5563',
                fontWeight:  price === p ? 500 : 400,
              }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Min rating */}
      <div>
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">Min. rating</p>
        <div className="space-y-2">
          {ratingBreakdown.map(({ s, pct }) => (
            <button key={s} onClick={() => { setMinRating(minRating === s ? 0 : s); setPage(1) }}
              className="w-full flex items-center gap-2 p-1.5 rounded-lg transition-colors"
              style={{ background: minRating === s ? '#E1F5EE' : 'transparent' }}>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={11} className={i <= s ? 'text-amber-400 fill-current' : 'text-gray-200'} />
                ))}
              </div>
              <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#1D9E75' }} />
              </div>
              <span className="text-[11px] text-gray-400 w-4 text-right">{s}+</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Country */}
      <div>
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">Country of origin</p>
        <div className="space-y-0.5">
          {COUNTRIES.map(c => {
            const cnt = businesses.filter(b => b.country === c).length
            return (
              <button key={c} onClick={() => { setCountry(country === c ? '' : c); setPage(1) }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-colors"
                style={{
                  background: country === c ? '#E1F5EE' : 'transparent',
                  color:      country === c ? '#085041'  : '#374151',
                  fontWeight: country === c ? 500 : 400,
                }}>
                <span>{FLAGS[c] ?? '🌍'} {c}</span>
                <span className="text-[11px] px-1.5 py-0.5 rounded-full"
                  style={{ background: country === c ? '#085041' : '#F3F4F6', color: country === c ? '#C5EADB' : '#6B7280' }}>
                  {cnt}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Features */}
      <div>
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">Features</p>
        <div className="space-y-1">
          {([
            ['Verified only',  verifiedOnly, (v: boolean) => { setVerifiedOnly(v); setPage(1) }],
            ['Premium stores', premiumOnly,  (v: boolean) => { setPremiumOnly(v);  setPage(1) }],
          ] as const).map(([label, val, set]) => (
            <label key={label} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer">
              <span className="text-sm text-gray-700">{label}</span>
              <input type="checkbox" checked={val} onChange={e => (set as (v: boolean) => void)(e.target.checked)}
                className="w-4 h-4 rounded cursor-pointer" style={{ accentColor: '#1D9E75' }} />
            </label>
          ))}
        </div>
      </div>

      {activeFilters.length > 0 && (
        <button onClick={clearAll}
          className="w-full text-xs text-gray-400 hover:text-red-500 transition-colors py-1 border-t border-gray-100 pt-3">
          Clear all filters
        </button>
      )}
    </aside>
  )

  // ── Page ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Sticky search bar */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2">

          {/* Keyword search */}
          <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:border-transparent transition-all">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1) }}
              placeholder="Search businesses, products, or services..."
              className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
            />
            {query && (
              <button onClick={() => { setQuery(''); setPage(1) }}>
                <X size={14} className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* City filter */}
          <div className="hidden sm:flex items-center gap-1.5 border border-gray-200 rounded-xl px-3 py-2 bg-white focus-within:ring-2 focus-within:border-transparent transition-all">
            <MapPin size={14} className="flex-shrink-0" style={{ color: '#1D9E75' }} />
            <input
              value={city}
              onChange={e => { setCity(e.target.value); setPage(1) }}
              placeholder="City, state, or zip"
              className="w-28 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400"
            />
            {city && (
              <button onClick={() => { setCity(''); setPage(1) }}>
                <X size={12} className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Mobile filter toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2 border rounded-xl text-sm font-medium transition-colors"
            style={{
              background:  sidebarOpen ? '#1D9E75' : 'white',
              borderColor: sidebarOpen ? '#1D9E75' : '#E5E7EB',
              color:       sidebarOpen ? 'white'   : '#4B5563',
            }}>
            <SlidersHorizontal size={14} />
            Filters
            {activeFilters.length > 0 && (
              <span className="text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full"
                style={{ background: sidebarOpen ? 'rgba(255,255,255,0.3)' : '#1D9E75', color: 'white' }}>
                {activeFilters.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">

          {/* Desktop sidebar */}
          <div className="hidden lg:block w-56 flex-shrink-0">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 sticky top-36">
              <Sidebar />
            </div>
          </div>

          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-40 flex">
              <div className="flex-1 bg-black/30" onClick={() => setSidebarOpen(false)} />
              <div className="w-72 bg-white h-full overflow-y-auto p-4 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-semibold text-gray-900">Filters</p>
                  <button onClick={() => setSidebarOpen(false)}>
                    <X size={18} className="text-gray-500" />
                  </button>
                </div>
                <Sidebar />
              </div>
            </div>
          )}

          {/* Main results */}
          <div className="flex-1 min-w-0">

            {/* Results bar */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">
                <span className="font-medium text-gray-900">{filtered.length}</span>
                {cat ? ` ${categories.find(c => c.id === cat)?.name ?? ''}` : ' businesses'}
                {city ? ` in ${city}` : ' near you'}
              </p>
              <div className="flex items-center gap-2">
                {/* View toggle */}
                <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5">
                  {(['grid', 'list'] as const).map(v => (
                    <button key={v} onClick={() => setView(v)}
                      className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
                        view === v ? 'bg-white border border-gray-200 text-gray-900 shadow-sm' : 'text-gray-400'
                      }`}>
                      {v === 'grid' ? <LayoutGrid size={13} /> : <List size={13} />}
                    </button>
                  ))}
                  <Link href="/map"
                    className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-white hover:text-gray-900 transition-colors">
                    <Map size={13} />
                  </Link>
                </div>
                {/* Sort */}
                <select value={sort} onChange={e => { setSort(e.target.value); setPage(1) }}
                  className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 outline-none cursor-pointer">
                  <option value="rating">Top rated</option>
                  <option value="reviews">Most reviewed</option>
                  <option value="name">A–Z</option>
                </select>
              </div>
            </div>

            {/* Active filter pills */}
            {activeFilters.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-4">
                {cat && (
                  <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full" style={{ background: '#E1F5EE', color: '#085041' }}>
                    {categories.find(c => c.id === cat)?.name}
                    <button onClick={() => { setCat(''); setPage(1) }}><X size={11} /></button>
                  </span>
                )}
                {price && (
                  <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full" style={{ background: '#E1F5EE', color: '#085041' }}>
                    Price: {price} <button onClick={() => { setPrice(''); setPage(1) }}><X size={11} /></button>
                  </span>
                )}
                {country && (
                  <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full" style={{ background: '#E1F5EE', color: '#085041' }}>
                    {FLAGS[country] ?? '🌍'} {country}
                    <button onClick={() => { setCountry(''); setPage(1) }}><X size={11} /></button>
                  </span>
                )}
                {verifiedOnly && (
                  <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full" style={{ background: '#E1F5EE', color: '#085041' }}>
                    Verified <button onClick={() => { setVerifiedOnly(false); setPage(1) }}><X size={11} /></button>
                  </span>
                )}
                {premiumOnly && (
                  <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full" style={{ background: '#E1F5EE', color: '#085041' }}>
                    Premium <button onClick={() => { setPremiumOnly(false); setPage(1) }}><X size={11} /></button>
                  </span>
                )}
                <button onClick={clearAll} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                  Clear all
                </button>
              </div>
            )}

            {/* Results — empty state */}
            {paginated.length === 0 ? (
              <div className="text-center py-24">
                <Search size={36} className="text-gray-200 mx-auto mb-4" />
                <h3 className="font-medium text-gray-700 mb-1">No businesses found</h3>
                <p className="text-sm text-gray-400 mb-4">Try adjusting your search or removing some filters</p>
                <button onClick={clearAll} className="text-sm font-medium underline" style={{ color: '#1D9E75' }}>
                  Clear all filters
                </button>
              </div>

            ) : view === 'grid' ? (
              /* Grid view */
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginated.map(b => <BusinessCard key={b.id} b={b} />)}
              </div>

            ) : (
              /* List view */
              <div className="space-y-3">
                {paginated.map(b => (
                  <div key={b.id}
                    className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-4 hover:border-green-300 transition-colors">
                    <div className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden">
                      {b.cover_image
                        ? <img src={b.cover_image} alt={b.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full" style={{ background: GRADIENTS[b.category ?? ''] ?? GRADIENTS.services }} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{b.name}</p>
                          <p className="text-xs text-gray-400 mb-1">
                            {b.subcategory ?? b.category} · {FLAGS[b.country ?? ''] ?? '🌍'} {b.country}
                          </p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {b.featured && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500 text-white">Featured</span>}
                          {b.premium  && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white" style={{ background: '#1D9E75' }}>Premium</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <StarRow rating={b.rating ?? 0} size={11} />
                        <span className="text-xs font-medium text-gray-800">{(b.rating ?? 0).toFixed(1)}</span>
                        <span className="text-xs text-gray-400">({b.review_count ?? 0})</span>
                        {b.price_range && (
                          <>
                            <span className="text-xs text-gray-300 mx-1">·</span>
                            <span className="text-xs text-gray-500">{b.price_range}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                        <MapPin size={10} style={{ color: '#1D9E75' }} />
                        {b.address}, {b.city}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {(b.tags ?? []).slice(0, 3).map(t => (
                            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: '#E1F5EE', color: '#085041' }}>{t}</span>
                          ))}
                        </div>
                        <div className="flex gap-1.5">
                          <Link href={`/businesses/${b.id}`}
                            className="text-xs font-medium text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                            style={{ background: '#1D9E75' }}>
                            View
                          </Link>
                          {b.lat && b.lng && (
                            <a href={`https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}`}
                              target="_blank" rel="noopener noreferrer"
                              className="text-xs border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg hover:border-green-300 hover:text-green-700 transition-colors flex items-center gap-1">
                              <MapPin size={10} /> Map
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-8">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:border-green-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft size={15} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button key={n} onClick={() => setPage(n)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-sm border transition-colors"
                    style={{
                      background:  page === n ? '#1D9E75' : 'white',
                      borderColor: page === n ? '#1D9E75' : '#E5E7EB',
                      color:       page === n ? 'white'   : '#4B5563',
                    }}>
                    {n}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:border-green-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight size={15} />
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}