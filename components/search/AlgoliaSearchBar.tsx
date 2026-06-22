'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { algoliasearch } from 'algoliasearch'
import { Search, X, Star, Loader2 } from 'lucide-react'
import Link from 'next/link'

const client = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY!
)

const INDEX = 'businesses'

const FLAGS: Record<string, string> = {
  Nigeria:'🇳🇬', Ghana:'🇬🇭', Kenya:'🇰🇪',
  Senegal:'🇸🇳', 'South Africa':'🇿🇦', Ethiopia:'🇪🇹',
}

const GRADIENTS: Record<string, string> = {
  food:       'linear-gradient(135deg,#c5eadb,#9fdcc3)',
  restaurant: 'linear-gradient(135deg,#EEEDFE,#AFA9EC)',
  fashion:    'linear-gradient(135deg,#FAEEDA,#FAC775)',
  beauty:     'linear-gradient(135deg,#FBEAF0,#ED93B1)',
  herbs:      'linear-gradient(135deg,#EAF3DE,#C0DD97)',
  music:      'linear-gradient(135deg,#FAECE7,#F0997B)',
  crafts:     'linear-gradient(135deg,#E6F1FB,#85B7EB)',
  services:   'linear-gradient(135deg,#F1EFE8,#B4B2A9)',
  nightlife: 'linear-gradient(135deg,#2D1B69,#6B46C1)',
}

interface Hit {
  objectID:     string
  name:         string
  category:     string
  subcategory:  string
  city:         string
  state:        string
  country:      string
  cover_image:  string | null
  rating:       number
  review_count: number
  price_range:  string
}

export default function AlgoliaSearchBar() {
  const router     = useRouter()
  const [query,    setQuery]    = useState('')
  const [loc,      setLocation] = useState('')
  const [hits,     setHits]     = useState<Hit[]>([])
  const [loading,  setLoading]  = useState(false)
  const [open,     setOpen]     = useState(false)
  const wrapRef    = useRef<HTMLDivElement>(null)
  const debounce   = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Debounced search — fires when query changes
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current)
    if (!query.trim()) { setHits([]); setOpen(false); return }

    debounce.current = setTimeout(async () => {
      setLoading(true)
      try {
        const filters = loc
          ? `city:"${loc}" OR state:"${loc}" OR zip:"${loc}"`
          : undefined

        const { results } = await client.search({
          requests: [{
            indexName: INDEX,
            query:     query.trim(),
            hitsPerPage: 6,
            ...(filters ? { filters } : {}),
          }],
        })

        const res = results[0]
        if ('hits' in res) {
          setHits(res.hits as Hit[])
          setOpen(true)
        }
      } catch (err) {
        console.error('[Algolia]', err)
      } finally {
        setLoading(false)
      }
    }, 250)
  }, [query])

  // Build search URL with both params
  function buildHref() {
    const params = new URLSearchParams()
    if (query.trim())    params.set('q',    query.trim())
    const qs = params.toString()
    return qs ? `/search?${qs}` : '/search'
  }

  function handleSearch() {
    setOpen(false)
    router.push(buildHref())
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter')  handleSearch()
    if (e.key === 'Escape') { setOpen(false); setQuery(''); setLocation('') }
  }

  return (
    <div ref={wrapRef} className="relative w-full max-w-2xl mx-auto">

      {/* Input row */}
      <div
        className="bg-white rounded-2xl shadow-xl overflow-hidden flex items-center"
        style={{ border: open ? '1.5px solid #1D9E75' : '1.5px solid transparent' }}
      >
        {/* Keyword */}
        <div className="flex items-center gap-2 flex-1 px-4 py-3 min-w-0">
          {loading
            ? <Loader2 size={17} className="text-gray-400 flex-shrink-0 animate-spin" />
            : <Search size={17} className="text-gray-400 flex-shrink-0" />
          }
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => hits.length > 0 && setOpen(true)}
            placeholder='Try "jollof rice" or "ankara"…'
            className="flex-1 text-sm text-gray-800 outline-none bg-transparent placeholder-gray-400 min-w-0"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
              <X size={13} />
            </button>
          )}
        </div>


        {/* Search button */}
        <Link
          href={buildHref()}
          onClick={() => setOpen(false)}
          className="flex-shrink-0 text-sm font-semibold text-white px-5 self-stretch flex items-center hover:opacity-90 transition-opacity"
          style={{ background: '#1D9E75' }}
        >
          Search
        </Link>
      </div>

      {/* Results dropdown */}
      {open && hits.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          <div className="divide-y divide-gray-50">
            {hits.map(hit => (
              <Link
                key={hit.objectID}
                href={`/businesses/${hit.objectID}`}
                onClick={() => { setOpen(false); setQuery(''); setLocation('') }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                  {hit.cover_image
                    ? <img src={hit.cover_image} alt={hit.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full" style={{ background: GRADIENTS[hit.category] ?? GRADIENTS.services }} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{hit.name}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {hit.subcategory || hit.category}
                    {hit.city  && ` · ${hit.city}`}
                    {hit.state && `, ${hit.state}`}
                    {hit.country && ` · ${FLAGS[hit.country] ?? '🌍'}`}
                  </p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1 text-xs text-gray-500">
                  {hit.rating > 0 && (
                    <>
                      <Star size={11} className="text-amber-400 fill-current" />
                      {hit.rating.toFixed(1)}
                    </>
                  )}
                  {hit.price_range && (
                    <span className="ml-1 text-gray-400">{hit.price_range}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {hits.length} result{hits.length !== 1 ? 's' : ''}
              {query    && ` for "${query}"`}

            </p>
            <Link
              href={buildHref()}
              onClick={() => setOpen(false)}
              className="text-xs font-medium hover:underline"
              style={{ color: '#1D9E75' }}
            >
              See all results →
            </Link>
          </div>
        </div>
      )}

      {/* No results */}
      {open && query && hits.length === 0 && !loading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 px-4 py-6 text-center z-50">
          <p className="text-sm text-gray-500 mb-1">
            No results
            {query    && ` for "${query}"`}
          </p>
          <p className="text-xs text-gray-400">Try a different keyword or location</p>
        </div>
      )}
    </div>
  )
}