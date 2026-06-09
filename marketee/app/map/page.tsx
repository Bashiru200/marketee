'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  APIProvider, Map, AdvancedMarker, Pin,
  InfoWindow, useMap, useMapsLibrary
} from '@vis.gl/react-google-maps'
import { Search, X, MapPin, List, LayoutGrid, Loader2, Navigation } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { BusinessRow } from '@/lib/queries'
import Link from 'next/link'

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!

// Houston, TX default center
const DEFAULT_CENTER = { lat: 29.7604, lng: -95.3698 }
const DEFAULT_ZOOM   = 11

const FLAGS: Record<string, string> = {
  Nigeria: '🇳🇬', Ghana: '🇬🇭', Kenya: '🇰🇪',
  Senegal: '🇸🇳', 'South Africa': '🇿🇦', Ethiopia: '🇪🇹',
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
  nightlife:   'linear-gradient(135deg,#2D1B69,#6B46C1)',
}

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

// ── Location search box (uses Places Autocomplete) ──────────────────────────
function LocationSearch({ onPlace }: { onPlace: (lat: number, lng: number) => void }) {
  const inputRef    = useRef<HTMLInputElement>(null)
  const placesLib   = useMapsLibrary('places')
  const acRef       = useRef<google.maps.places.Autocomplete | null>(null)

  useEffect(() => {
    if (!placesLib || !inputRef.current) return

    acRef.current = new placesLib.Autocomplete(inputRef.current, {
      types:  ['(cities)'],
      fields: ['geometry', 'formatted_address'],
    })

    const listener = acRef.current.addListener('place_changed', () => {
      const place = acRef.current!.getPlace()
      if (place.geometry?.location) {
        onPlace(
          place.geometry.location.lat(),
          place.geometry.location.lng(),
        )
      }
    })

    return () => google.maps.event.removeListener(listener)
  }, [placesLib, onPlace])

  return (
    <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-white focus-within:ring-2 focus-within:border-transparent transition-all w-52">
      <Navigation size={14} className="flex-shrink-0" style={{ color: '#1D9E75' }} />
      <input
        ref={inputRef}
        type="text"
        placeholder="Search location..."
        className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400 min-w-0"
      />
    </div>
  )
}

// ── Map controller — pans/zooms when center changes ─────────────────────────
function MapController({ center, zoom }: { center: google.maps.LatLngLiteral; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    if (!map) return
    map.panTo(center)
    map.setZoom(zoom)
  }, [map, center, zoom])
  return null
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function MapPage() {
  const supabase = createClient()

  const [businesses,       setBusinesses]       = useState<BusinessRow[]>([])
  const [loading,          setLoading]          = useState(true)
  const [selectedId,       setSelectedId]       = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [search,           setSearch]           = useState('')
  const [view,             setView]             = useState<'map' | 'list'>('map')
  const [mapCenter,        setMapCenter]        = useState(DEFAULT_CENTER)
  const [mapZoom,          setMapZoom]          = useState(DEFAULT_ZOOM)

  // ── Fetch businesses ───────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, category, subcategory, address, city, state, cover_image, rating, review_count, price_range, tags, lat, lng, verified, premium, featured, country')
        .not('lat', 'is', null)
        .not('lng', 'is', null)
        .order('featured', { ascending: false })
      if (error) console.error('[MapPage]', error)
      setBusinesses(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  // ── Filter ────────────────────────────────────────────────────────────
  const filtered = businesses.filter(b => {
    const q  = search.toLowerCase()
    const ms = !search ||
      b.name.toLowerCase().includes(q) ||
      (b.tags ?? []).some(t => t.toLowerCase().includes(q))
    const mc = !selectedCategory || b.category === selectedCategory
    return ms && mc
  })

  const selected = businesses.find(b => b.id === selectedId) ?? null

  // ── When user picks a location from search ────────────────────────────
  const handlePlace = useCallback((lat: number, lng: number) => {
    setMapCenter({ lat, lng })
    setMapZoom(13)
  }, [])

  // ── Click a pin — pan map to it ───────────────────────────────────────
  function handlePinClick(b: BusinessRow) {
    setSelectedId(b.id === selectedId ? null : b.id)
    if (b.lat && b.lng) {
      setMapCenter({ lat: b.lat, lng: b.lng })
      setMapZoom(15)
    }
  }

  if (loading) return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Toolbar skeleton */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="flex-1 h-10 bg-gray-200 rounded-xl" style={{ animation: 'shimmer 1.8s ease-in-out infinite' }} />
          <div className="w-44 h-10 bg-gray-200 rounded-xl" style={{ animation: 'shimmer 1.8s ease-in-out infinite' }} />
          <div className="w-24 h-10 bg-gray-200 rounded-xl" style={{ animation: 'shimmer 1.8s ease-in-out infinite' }} />
        </div>
        <div className="max-w-7xl mx-auto flex gap-2 mt-2 overflow-hidden">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-7 w-28 bg-gray-200 rounded-full flex-shrink-0" style={{ animation: 'shimmer 1.8s ease-in-out infinite' }} />
          ))}
        </div>
      </div>

      {/* Map + sidebar skeleton */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map area */}
        <div className="flex-1 relative" style={{ background: 'linear-gradient(135deg,#f0faf6,#e8f7f1)', animation: 'shimmer 1.8s ease-in-out infinite' }}>
          {/* Fake pins */}
          {[
            { top: '30%', left: '25%' }, { top: '45%', left: '55%' },
            { top: '60%', left: '35%' }, { top: '25%', left: '65%' },
          ].map((pos, i) => (
            <div key={i} className="absolute flex flex-col items-center" style={{ top: pos.top, left: pos.left }}>
              <div className="h-6 w-20 bg-gray-300 rounded-full mb-0.5" style={{ animation: 'shimmer 1.8s ease-in-out infinite' }} />
              <div className="w-2.5 h-2.5 bg-gray-300 rounded-full" style={{ animation: 'shimmer 1.8s ease-in-out infinite' }} />
            </div>
          ))}
          {/* Stats overlay */}
          <div className="absolute top-4 left-4 bg-white/80 rounded-xl px-4 py-2">
            <div className="h-3 w-16 bg-gray-200 rounded mb-1.5" style={{ animation: 'shimmer 1.8s ease-in-out infinite' }} />
            <div className="h-4 w-24 bg-gray-200 rounded" style={{ animation: 'shimmer 1.8s ease-in-out infinite' }} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden md:flex flex-col w-72 bg-white border-l border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <div className="h-4 w-32 bg-gray-200 rounded" style={{ animation: 'shimmer 1.8s ease-in-out infinite' }} />
          </div>
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex gap-3 p-4 border-b border-gray-50">
              <div className="w-12 h-12 rounded-lg bg-gray-200 flex-shrink-0" style={{ animation: 'shimmer 1.8s ease-in-out infinite' }} />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded" style={{ animation: 'shimmer 1.8s ease-in-out infinite' }} />
                <div className="h-3 w-24 bg-gray-200 rounded" style={{ animation: 'shimmer 1.8s ease-in-out infinite' }} />
                <div className="h-3 w-16 bg-gray-200 rounded" style={{ animation: 'shimmer 1.8s ease-in-out infinite' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes shimmer{0%,100%{opacity:1}50%{opacity:.4}}' }} />
    </div>
  )

  return (
    <APIProvider apiKey={GOOGLE_MAPS_KEY} >
      <div className="h-[calc(100vh-4rem)] flex flex-col">

        {/* ── Toolbar ── */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 z-10">
          <div className="max-w-7xl mx-auto flex items-center gap-2 flex-wrap">

            {/* Keyword search */}
            <div className="flex-1 min-w-48 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:border-transparent transition-all">
              <Search size={15} className="text-gray-400 flex-shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search businesses..."
                className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
              />
              {search && (
                <button onClick={() => setSearch('')}>
                  <X size={13} className="text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {/* Location search */}
            <LocationSearch onPlace={handlePlace} />

            {/* Map / List toggle */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {(['map', 'list'] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 capitalize ${
                    view === v ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
                  }`}>
                  {v === 'map' ? <MapPin size={13} /> : <LayoutGrid size={13} />}
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Category pills */}
          <div className="max-w-7xl mx-auto flex gap-2 mt-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('')}
              className="flex-shrink-0 text-xs px-3 py-1 rounded-full font-medium transition-colors"
              style={{
                background: !selectedCategory ? '#1D9E75' : '#F3F4F6',
                color:      !selectedCategory ? 'white'   : '#4B5563',
              }}>
              All ({businesses.length})
            </button>
            {CATEGORIES.filter(cat => businesses.some(b => b.category === cat.id)).map(cat => {
              const count    = businesses.filter(b => b.category === cat.id).length
              const isActive = selectedCategory === cat.id
              return (
                <button key={cat.id}
                  onClick={() => setSelectedCategory(isActive ? '' : cat.id)}
                  className="flex-shrink-0 text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 transition-colors"
                  style={{
                    background: isActive ? '#1D9E75' : '#F3F4F6',
                    color:      isActive ? 'white'   : '#4B5563',
                  }}>
                  {cat.icon} {cat.name} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-hidden">
          {view === 'map' ? (
            <div className="h-full flex">

              {/* ── Google Map ── */}
              <div className="flex-1 relative">
                <Map
                  mapId="markeetee-map"
                  defaultCenter={DEFAULT_CENTER}
                  defaultZoom={DEFAULT_ZOOM}
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                  mapTypeControl={false}
                  streetViewControl={false}
                  fullscreenControl={false}
                  style={{ width: '100%', height: '100%' }}
                >
                  <MapController center={mapCenter} zoom={mapZoom} />

                  {/* Business pins */}
                  {filtered.map(b => (
                    b.lat && b.lng ? (
                      <AdvancedMarker
                        key={b.id}
                        position={{ lat: b.lat, lng: b.lng }}
                        onClick={() => handlePinClick(b)}
                        zIndex={selectedId === b.id ? 10 : 1}
                      >
                        <Pin
                          background={selectedId === b.id ? '#085041' : '#1D9E75'}
                          borderColor={selectedId === b.id ? '#053528' : '#0F6E56'}
                          glyphColor="white"
                          scale={selectedId === b.id ? 1.3 : 1}
                        />
                      </AdvancedMarker>
                    ) : null
                  ))}

                  {/* Info window on selected pin */}
                  {selected && selected.lat && selected.lng && (
                    <InfoWindow
                      position={{ lat: selected.lat, lng: selected.lng }}
                      onCloseClick={() => setSelectedId(null)}
                      pixelOffset={[0, -40]}
                    >
                      <div style={{ width: '220px', fontFamily: 'system-ui, sans-serif' }}>
                        {/* Cover */}
                        <div style={{ height: '100px', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px' }}>
                          {selected.cover_image ? (
                            <img src={selected.cover_image} alt={selected.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', background: GRADIENTS[selected.category ?? ''] ?? GRADIENTS.services }} />
                          )}
                        </div>
                        {/* Info */}
                        <p style={{ fontWeight: 600, fontSize: '13px', marginBottom: '3px', color: '#111' }}>
                          {selected.name}
                        </p>
                        <p style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>
                          {[selected.address, selected.city, selected.state].filter(Boolean).join(', ')}
                        </p>
                        {selected.rating > 0 && (
                          <p style={{ fontSize: '11px', color: '#6B7280', marginBottom: '10px' }}>
                            ⭐ {selected.rating.toFixed(1)} · {selected.review_count} reviews
                            {selected.price_range ? ` · ${selected.price_range}` : ''}
                          </p>
                        )}
                        {/* Actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {selected.phone && (
                            <a
                              href={`https://wa.me/${selected.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi! I found your business on Markeetee — ${selected.name}.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#25D366', color: 'white', fontSize: '12px', fontWeight: 600, padding: '7px 0', borderRadius: '8px', textDecoration: 'none' }}>
                              💬 WhatsApp
                            </a>
                          )}
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <a href={`/businesses/${selected.id}`}
                              style={{ flex: 1, textAlign: 'center', background: '#1D9E75', color: 'white', fontSize: '12px', fontWeight: 600, padding: '6px 0', borderRadius: '8px', textDecoration: 'none' }}>
                              View Store
                            </a>
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 500, padding: '6px 10px', borderRadius: '8px', border: '1px solid #E5E7EB', color: '#374151', textDecoration: 'none' }}>
                              Directions
                            </a>
                          </div>
                        </div>
                      </div>
                    </InfoWindow>
                  )}
                </Map>

                {/* Stats overlay */}
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 shadow-md z-10">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Markeetee</p>
                  <p className="text-sm font-bold text-gray-800">
                    {filtered.length} business{filtered.length !== 1 ? 'es' : ''} on map
                  </p>
                </div>

                {/* No coords warning */}
                {businesses.length > 0 && filtered.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white/90 rounded-2xl px-8 py-6 text-center shadow-lg">
                      <p className="text-2xl mb-2">🔍</p>
                      <p className="text-sm font-medium text-gray-700">No businesses match your filter</p>
                      <p className="text-xs text-gray-400 mt-1">Try a different category or clear the search</p>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Sidebar list ── */}
              <div className="hidden md:flex flex-col w-72 bg-white border-l border-gray-100 overflow-y-auto">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">
                    {filtered.length} business{filtered.length !== 1 ? 'es' : ''}
                  </p>
                  {selectedId && (
                    <button onClick={() => setSelectedId(null)}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                      Clear selection
                    </button>
                  )}
                </div>

                {filtered.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-center p-6 text-gray-400">
                    <div><p className="text-2xl mb-2">🔍</p><p className="text-sm">No businesses found</p></div>
                  </div>
                ) : filtered.map(b => (
                  <button key={b.id}
                    onClick={() => handlePinClick(b)}
                    className="w-full text-left flex gap-3 p-4 border-b border-gray-50 transition-colors hover:bg-gray-50"
                    style={selectedId === b.id ? { background: '#f0faf6', borderLeft: '3px solid #1D9E75' } : {}}>
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      {b.cover_image
                        ? <img src={b.cover_image} alt={b.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full" style={{ background: GRADIENTS[b.category ?? ''] ?? GRADIENTS.services }} />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-gray-900 line-clamp-1">{b.name}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        {FLAGS[b.country ?? ''] ?? '🌍'}
                        <span className="truncate">{b.subcategory ?? b.category}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {b.rating > 0 ? `⭐ ${b.rating.toFixed(1)}` : 'No rating yet'}
                        {b.price_range ? ` · ${b.price_range}` : ''}
                      </p>
                      {!b.lat || !b.lng ? (
                        <p className="text-[10px] text-amber-500 mt-0.5">⚠ No coordinates set</p>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            </div>

          ) : (
            /* ── List view ── */
            <div className="overflow-y-auto h-full p-4">
              <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.length === 0 ? (
                  <div className="col-span-full text-center py-16 text-gray-400">
                    <p className="text-2xl mb-2">🔍</p>
                    <p className="text-sm">No businesses found</p>
                  </div>
                ) : filtered.map(b => (
                  <Link key={b.id} href={`/businesses/${b.id}`}
                    className="bg-white rounded-xl border border-gray-100 hover:border-green-300 hover:shadow-md transition-all flex gap-3 p-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      {b.cover_image
                        ? <img src={b.cover_image} alt={b.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full" style={{ background: GRADIENTS[b.category ?? ''] ?? GRADIENTS.services }} />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-900 line-clamp-1">{b.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <MapPin size={10} style={{ color: '#1D9E75' }} />
                        {[b.city, b.state].filter(Boolean).join(', ') || 'No location'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {b.rating > 0 ? `⭐ ${b.rating.toFixed(1)} (${b.review_count})` : 'No reviews yet'}
                        {b.price_range ? ` · ${b.price_range}` : ''}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </APIProvider>
  )
}