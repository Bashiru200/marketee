'use client'
import { AFRICAN_FLAGS } from '@/lib/africanCountries'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search, X, MapPin, Star, BadgeCheck, LayoutGrid,
  List, ChevronLeft, ChevronRight, SlidersHorizontal
} from 'lucide-react'
import { BusinessRow } from '@/lib/queries'



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

interface Props {
  businesses: BusinessRow[]
  categories: { id: string; name: string; icon: string; count: number }[]
}

function BusinessCard({ b }: { b: BusinessRow }) {
  const grad = GRADIENTS[b.category ?? ''] || GRADIENTS.services
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-green-400 transition-colors group">
      <div className="relative h-36">
        {b.cover_image
          ? <img src={b.cover_image} alt={b.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full" style={{ background: grad }} />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute top-2 left-2 flex gap-1">
          {b.featured && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500 text-white">Featured</span>}
          {b.premium  && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-600 text-white">Premium</span>}
          {b.verified && !b.featured && !b.premium && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/90 text-green-800 flex items-center gap-1">
              <BadgeCheck size={9} /> Verified
            </span>
          )}
        </div>
        <div className="absolute top-2 right-2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center text-xs">
          {AFRICAN_FLAGS[b.country ?? ''] || '🌍'}
        </div>
        {b.price_range && (
          <div className="absolute bottom-2 right-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/50 text-white">
            {b.price_range}
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-medium text-sm text-gray-900 truncate group-hover:text-green-700 transition-colors">{b.name}</p>
        <p className="text-xs text-gray-400 truncate mb-1.5">{b.subcategory ?? b.category} · {b.city}</p>
        <div className="flex items-center gap-1.5 mb-1.5">
          {[1,2,3,4,5].map(i => (
            <Star key={i} size={11} className={i <= Math.round(b.rating) ? 'text-amber-400 fill-current' : 'text-gray-200'} />
          ))}
          <span className="text-xs font-medium text-gray-800">{b.rating?.toFixed(1) || '—'}</span>
          <span className="text-xs text-gray-400">({b.review_count})</span>
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
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-800">{t}</span>
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

export default function BusinessGrid({ businesses, categories }: Props) {
  const [query,        setQuery]        = useState('')
  const [city,         setCity]         = useState('')
  const [cat,          setCat]          = useState('')
  const [price,        setPrice]        = useState('')
  const [sort,         setSort]         = useState('rating')
  const [view,         setView]         = useState<'grid'|'list'>('grid')
  const [country,      setCountry]      = useState('')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [page,         setPage]         = useState(1)
  const [filtersOpen,  setFiltersOpen]  = useState(false)

  const filtered = useMemo(() => {
    let r = businesses.filter(b => {
      const q  = query.toLowerCase()
      const mq = !query  || b.name.toLowerCase().includes(q) ||
        (b.tags ?? []).some(t => t.toLowerCase().includes(q)) ||
        (b.description ?? '').toLowerCase().includes(q)
      const mc    = !cat          || b.category === cat
      const mp    = !price        || b.price_range === price
      const mco   = !country      || b.country === country
      const mcity = !city         || (b.city ?? '').toLowerCase().includes(city.toLowerCase()) || (b.state ?? '').toLowerCase().includes(city.toLowerCase())
      const mv    = !verifiedOnly || b.verified
      return mq && mc && mp && mco && mcity && mv
    })
    if (sort === 'rating')  r.sort((a,b) => b.rating - a.rating)
    if (sort === 'reviews') r.sort((a,b) => b.review_count - a.review_count)
    if (sort === 'name')    r.sort((a,b) => a.name.localeCompare(b.name))
    return r
  }, [query, city, cat, price, sort, country, verifiedOnly, businesses])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated  = filtered.slice((page-1)*ITEMS_PER_PAGE, page*ITEMS_PER_PAGE)

  const activeFilters = [cat, price, country, verifiedOnly ? 'v' : ''].filter(Boolean)

  function clearAll() {
    setQuery(''); setCity(''); setCat(''); setPrice('')
    setCountry(''); setVerifiedOnly(false); setPage(1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search bar */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:border-transparent transition-all">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input value={query} onChange={e => { setQuery(e.target.value); setPage(1) }}
              placeholder='Search by name, category, or tag'
              className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400" />
            {query && <button onClick={() => { setQuery(''); setPage(1) }}><X size={14} className="text-gray-400" /></button>}
          </div>
          <div className="hidden sm:flex items-center gap-1.5 border border-gray-200 rounded-xl px-3 py-2 bg-white focus-within:ring-2 focus-within:border-transparent transition-all">
            <MapPin size={14} className="flex-shrink-0" style={{ color: '#1D9E75' }} />
            <input value={city} onChange={e => { setCity(e.target.value); setPage(1) }}
              placeholder="Enter city or state"
              className="w-28 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400" />
            {city && <button onClick={() => { setCity(''); setPage(1) }}><X size={12} className="text-gray-400" /></button>}
          </div>
          <button onClick={() => setFiltersOpen(!filtersOpen)}
            className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-sm font-medium transition-colors ${filtersOpen ? 'text-white border-green-600' : 'bg-white border-gray-200 text-gray-600'}`}
            style={filtersOpen ? { background: '#1D9E75' } : {}}>
            <SlidersHorizontal size={14} />
            Filters
            {activeFilters.length > 0 && (
              <span className="bg-white/30 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {activeFilters.length}
              </span>
            )}
          </button>
        </div>

        {/* Filter panel */}
        {filtersOpen && (
          <div className="max-w-7xl mx-auto px-4 pb-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Category</p>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => { setCat(''); setPage(1) }}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!cat ? 'text-white' : 'bg-gray-100 text-gray-600'}`}
                    style={!cat ? { background: '#1D9E75' } : {}}>All</button>
                  {categories.map(c => (
                    <button key={c.id} onClick={() => { setCat(c.id === cat ? '' : c.id); setPage(1) }}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${cat === c.id ? 'text-white' : 'bg-gray-100 text-gray-600'}`}
                      style={cat === c.id ? { background: '#1D9E75' } : {}}>
                      {c.icon} {c.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Price</p>
                <div className="flex gap-2">
                  {['$','$$','$$$'].map(p => (
                    <button key={p} onClick={() => { setPrice(price === p ? '' : p); setPage(1) }}
                      className={`flex-1 py-1.5 rounded-lg text-sm border transition-colors ${price === p ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`}
                      style={price === p ? { background: '#1D9E75' } : {}}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Features</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={verifiedOnly} onChange={e => { setVerifiedOnly(e.target.checked); setPage(1) }}
                    className="w-4 h-4 rounded" />
                  <span className="text-sm text-gray-700">Verified only</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Results bar */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-900">{filtered.length}</span>
            {cat ? ` ${categories.find(c => c.id === cat)?.name}` : ' businesses'}
            {city ? ` in ${city}` : ' near you'}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5">
              {(['grid','list'] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${view === v ? 'bg-white border border-gray-200 shadow-sm text-gray-900' : 'text-gray-400'}`}>
                  {v === 'grid' ? <LayoutGrid size={13} /> : <List size={13} />}
                </button>
              ))}
            </div>
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
            {cat && <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-green-50 text-green-800">
              {categories.find(c=>c.id===cat)?.name} <button onClick={()=>{setCat('');setPage(1)}}><X size={11}/></button></span>}
            {price && <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-green-50 text-green-800">
              {price} <button onClick={()=>{setPrice('');setPage(1)}}><X size={11}/></button></span>}
            {verifiedOnly && <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-green-50 text-green-800">
              Verified <button onClick={()=>{setVerifiedOnly(false);setPage(1)}}><X size={11}/></button></span>}
            <button onClick={clearAll} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Clear all</button>
          </div>
        )}

        {/* Grid / list */}
        {paginated.length === 0 ? (
          <div className="text-center py-24">
            <Search size={36} className="text-gray-200 mx-auto mb-4" />
            <h3 className="font-medium text-gray-700 mb-1">No businesses found</h3>
            <p className="text-sm text-gray-400 mb-4">Try adjusting your search or removing some filters</p>
            <button onClick={clearAll} className="text-sm font-medium underline" style={{ color: '#1D9E75' }}>Clear all filters</button>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginated.map(b => <BusinessCard key={b.id} b={b} />)}
          </div>
        ) : (
          <div className="space-y-3">
            {paginated.map(b => (
              <div key={b.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-4 hover:border-green-300 transition-colors">
                <div className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden">
                  {b.cover_image
                    ? <img src={b.cover_image} alt={b.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full" style={{ background: GRADIENTS[b.category ?? ''] || GRADIENTS.services }} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-gray-900 truncate">{b.name}</p>
                    <div className="flex gap-1 flex-shrink-0">
                      {b.featured && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500 text-white">Featured</span>}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mb-1">{b.subcategory ?? b.category} · {AFRICAN_FLAGS[b.country ?? ''] || '🌍'} {b.country}</p>
                  <div className="flex items-center gap-1.5 mb-1">
                    {[1,2,3,4,5].map(i=><Star key={i} size={10} className={i<=Math.round(b.rating)?'text-amber-400 fill-current':'text-gray-200'} />)}
                    <span className="text-xs font-medium text-gray-800">{b.rating?.toFixed(1)||'—'}</span>
                    <span className="text-xs text-gray-400">({b.review_count})</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={10} style={{color:'#1D9E75'}}/>{b.city}, {b.state}</span>
                    <Link href={`/businesses/${b.id}`}
                      className="text-xs font-medium text-white px-3 py-1.5 rounded-lg hover:opacity-90"
                      style={{ background: '#1D9E75' }}>View</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-8">
            <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}
              className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:border-green-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft size={15} />
            </button>
            {Array.from({length:totalPages},(_,i)=>i+1).map(n=>(
              <button key={n} onClick={()=>setPage(n)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors ${page===n?'text-white border border-transparent':'border border-gray-200 text-gray-600 hover:border-green-300'}`}
                style={page===n?{background:'#1D9E75'}:{}}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
              className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:border-green-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}