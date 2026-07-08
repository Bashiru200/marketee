/// <reference types="google.maps" />
'use client'
import { AFRICAN_FLAGS } from '@/lib/africanFlags'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  APIProvider, Map, AdvancedMarker, Pin,
  InfoWindow, useMap, useMapsLibrary
} from '@vis.gl/react-google-maps'
import { Search, X, MapPin, List, LayoutGrid, Loader2, Navigation } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { BusinessRow } from '@/lib/queries'
import Link from 'next/link'
import { getHoursStatus } from '@/lib/businessHours'
import HoursBadge from '@/components/ui/HoursBadge'

type BusinessRowWithHours = BusinessRow & {
  hours_open?: string | null
  days_open?: string[] | null
}

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!

// Houston, TX default center
const DEFAULT_CENTER = { lat: 29.7604, lng: -95.3698 }
const DEFAULT_ZOOM   = 11

// Haversine formula — distance in miles between two lat/lng points
function distanceMiles(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R    = 3958.8 // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a    = Math.sin(dLat/2) ** 2 +
               Math.cos(lat1 * Math.PI / 180) *
               Math.cos(lat2 * Math.PI / 180) *
               Math.sin(dLng/2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const RADIUS_OPTIONS = [
  { label: '10 mi',  value: 10  },
  { label: '20 mi',  value: 20  },
  { label: '50 mi',  value: 50  },
  { label: '100 mi', value: 100 },
  { label: 'All',    value: 0   },
]



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
  const inputRef  = useRef<HTMLInputElement>(null)
  const placesLib = useMapsLibrary('places')
  const acRef     = useRef<google.maps.places.Autocomplete | null>(null)

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
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:border-transparent transition-all w-52 sm:w-60">
      <Navigation size={14} className="flex-shrink-0" style={{ color: '#1D9E75' }} />
      <input
        ref={inputRef}
        type="text"
        placeholder="City or area…"
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

  const [businesses,       setBusinesses]       = useState<BusinessRowWithHours[]>([])
  const [loading,          setLoading]          = useState(true)
  const [selectedId,       setSelectedId]       = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [search,           setSearch]           = useState('')
  const [view,             setView]             = useState<'map' | 'list'>('map')
  const [mapCenter,        setMapCenter]        = useState(DEFAULT_CENTER)
  const [mapZoom,          setMapZoom]          = useState(DEFAULT_ZOOM)
  const [userLocation,     setUserLocation]     = useState<{ lat: number; lng: number } | null>(null)
  const [radius,           setRadius]           = useState(20) // miles

  // ── Read saved location from LocationPrompt on mount ──────────────────
  useEffect(() => {
    function applyStoredLocation() {
      try {
        const lat  = parseFloat(localStorage.getItem('user_lat')  ?? '')
        const lng  = parseFloat(localStorage.getItem('user_lng')  ?? '')
        const city = localStorage.getItem('user_city') ?? ''
        if (!isNaN(lat) && !isNaN(lng)) {
          setMapCenter({ lat, lng })
          setMapZoom(12)
          setUserLocation({ lat, lng })
          if (city) setSearch(city)
        }
      } catch {}
    }

    // Run on mount
    applyStoredLocation()

    // Also listen for live updates when user clicks Allow on the prompt
    window.addEventListener('storage', applyStoredLocation)
    return () => window.removeEventListener('storage', applyStoredLocation)
  }, [])

  // ── Fetch businesses ───────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('businesses')
        .select(`
          id, name, category, subcategory, description,
          address, street, city, state, zip, country,
          cover_image, logo_url, rating, review_count,
          price_range, tags, lat, lng,
          verified, premium, featured, plan, slug,
          phone, email, website,
          hours_open, days_open
        `)
        .not('lat', 'is', null)
        .not('lng', 'is', null)
        .order('plan',     { ascending: false })
        .order('featured', { ascending: false })
        .order('rating',   { ascending: false })
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
      (b.city ?? '').toLowerCase().includes(q) ||
      (b.tags ?? []).some(t => t.toLowerCase().includes(q))
    const mc = !selectedCategory || b.category === selectedCategory

    // Radius filter — only apply when we have a user/map center location
    const mr = radius === 0 || !b.lat || !b.lng ? true :
      distanceMiles(mapCenter.lat, mapCenter.lng, b.lat, b.lng) <= radius

    return ms && mc && mr
  })

  const selected = businesses.find(b => b.id === selectedId) ?? null

  // ── When user picks a location from search ────────────────────────────
  const handlePlace = useCallback((lat: number, lng: number) => {
    setMapCenter({ lat, lng })
    setMapZoom(13)
  }, [])

  // ── Click a pin / business card ──────────────────────────────────────
  function handlePinClick(b: BusinessRow) {
    const newId = b.id === selectedId ? null : b.id
    setSelectedId(newId)
    if (b.lat && b.lng) {
      setMapCenter({ lat: b.lat, lng: b.lng })
      setMapZoom(15)
    }
    // On desktop: scroll the sidebar card into view
    if (newId) {
      setTimeout(() => {
        document.getElementById(`biz-${newId}`)?.scrollIntoView({
          behavior: 'smooth',
          block:    'nearest',
        })
      }, 50)
    }
  }

  return (
  <APIProvider apiKey={GOOGLE_MAPS_KEY}>
    <div className="h-[calc(100vh-4rem)] bg-[#F8FAF9] flex flex-col">

      {/* FILTER BAR */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 z-20">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-3 lg:items-center">

          {/* Search */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex-1">
            <Search size={15} className="text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search business, city, food, fashion..."
              className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')}>
                <X size={14} className="text-gray-400" />
              </button>
            )}
          </div>

          {/* Location */}
          <LocationSearch
            onPlace={(lat, lng) => {
              setMapCenter({ lat, lng })
              setUserLocation({ lat, lng })
              setMapZoom(13)
            }}
          />

          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>

          {/* Radius */}
          <select
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700"
          >
            {RADIUS_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          {/* View toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setView('map')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold ${
                view === 'map' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              <MapPin size={14} />
              Map
            </button>

            <button
              type="button"
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold ${
                view === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              <List size={14} />
              List
            </button>
          </div>

          {/* Clear filters */}
          {(search || selectedCategory || radius !== 20) && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setSelectedCategory('')
                setRadius(20)
                setSelectedId(null)
                setMapCenter(DEFAULT_CENTER)
                setMapZoom(DEFAULT_ZOOM)
              }}
              className="text-xs font-semibold text-gray-500 hover:text-green-700"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="max-w-7xl mx-auto mt-2">
          <p className="text-xs text-gray-400">
            Showing {filtered.length} of {businesses.length} businesses
          </p>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 min-h-0">
        {view === 'map' ? (
          <div className="h-full flex flex-col md:flex-row overflow-hidden">

            {/* BUSINESS LIST SIDEBAR */}
            <div className="w-full md:w-80 bg-white border-r border-gray-100 overflow-y-auto order-2 md:order-1">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <p className="text-3xl mb-2">🔍</p>
                  <p className="text-sm font-medium">No businesses found</p>
                  <p className="text-xs mt-1">Try changing your filters</p>
                </div>
              ) : (
                filtered.map((b) => {
                  const isSelected = selectedId === b.id

                  return (
                    <button
                      key={b.id}
                      id={`biz-${b.id}`}
                      onClick={() => handlePinClick(b)}
                      className="w-full text-left flex gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-all"
                      style={
                        isSelected
                          ? {
                              background: '#f0faf6',
                              borderLeft: '3px solid #1D9E75',
                              paddingLeft: '13px',
                            }
                          : {}
                      }
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                        {b.cover_image ? (
                          <img
                            src={b.cover_image}
                            alt={b.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-2xl"
                            style={{
                              background:
                                GRADIENTS[b.category ?? ''] ?? GRADIENTS.services,
                            }}
                          >
                            {CATEGORIES.find((c) => c.id === b.category)?.icon ?? '🏪'}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-gray-900 line-clamp-1">
                          {b.name}
                        </p>

                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          {AFRICAN_FLAGS[b.country ?? ''] ?? '🌍'}
                          <span className="truncate capitalize">
                            {b.subcategory ?? b.category}
                          </span>
                        </p>

                        <p className="text-[11px] text-gray-400 mt-1 truncate">
                          📍 {[b.city, b.state].filter(Boolean).join(', ') || 'No location'}
                        </p>

                        <div className="flex items-center gap-1.5 mt-1">
                          {b.rating > 0 ? (
                            <span className="text-xs font-medium text-amber-500">
                              ★ {b.rating.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">No reviews</span>
                          )}

                          {b.verified && (
                            <span
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                              style={{ background: '#E1F5EE', color: '#085041' }}
                            >
                              ✓ Verified
                            </span>
                          )}
                        </div>

                        {b.hours_open && (
                          <div className="mt-1">
                            <HoursBadge
                              hoursOpen={b.hours_open}
                              daysOpen={b.days_open}
                            />
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* MAP */}
            <div className="relative flex-1 h-72 md:h-full order-1 md:order-2">
              <Map
                mapId="markeetee-map"
                defaultCenter={DEFAULT_CENTER}
                defaultZoom={DEFAULT_ZOOM}
                gestureHandling="greedy"
                disableDefaultUI={true}
                style={{ width: '100%', height: '100%' }}
              >
                <MapController center={mapCenter} zoom={mapZoom} />

                {userLocation && (
                  <AdvancedMarker position={userLocation}>
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: '#4285F4',
                        border: '3px solid white',
                        boxShadow: '0 2px 8px rgba(66,133,244,0.6)',
                      }}
                    />
                  </AdvancedMarker>
                )}

                {filtered.map((b) =>
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
                )}

                {selected && selected.lat && selected.lng && (
                  <InfoWindow
                    position={{ lat: selected.lat, lng: selected.lng }}
                    onCloseClick={() => setSelectedId(null)}
                    pixelOffset={[0, -40]}
                  >
                    <div style={{ minWidth: '210px', fontFamily: 'system-ui, sans-serif' }}>
                      <p style={{ fontWeight: 700, fontSize: '14px', margin: '0 0 4px' }}>
                        {selected.name}
                      </p>

                      <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 8px' }}>
                        {[selected.city, selected.state].filter(Boolean).join(', ')}
                      </p>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <a
                          href={`/businesses/${selected.id}`}
                          style={{
                            flex: 1,
                            textAlign: 'center',
                            background: '#1D9E75',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 600,
                            padding: '7px 0',
                            borderRadius: '8px',
                            textDecoration: 'none',
                          }}
                        >
                          View
                        </a>

                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            flex: 1,
                            textAlign: 'center',
                            background: '#F3F4F6',
                            color: '#374151',
                            fontSize: '12px',
                            fontWeight: 500,
                            padding: '7px 0',
                            borderRadius: '8px',
                            textDecoration: 'none',
                          }}
                        >
                          Directions
                        </a>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-4">
            <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.length === 0 ? (
                <div className="col-span-full text-center py-16 text-gray-400">
                  <p className="text-2xl mb-2">🔍</p>
                  <p className="text-sm">No businesses found</p>
                </div>
              ) : (
                filtered.map((b) => (
                  <Link
                    key={b.id}
                    href={`/businesses/${b.id}`}
                    className="bg-white rounded-xl border border-gray-100 hover:border-green-300 hover:shadow-md transition-all flex gap-3 p-4"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      {b.cover_image ? (
                        <img
                          src={b.cover_image}
                          alt={b.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full"
                          style={{
                            background:
                              GRADIENTS[b.category ?? ''] ?? GRADIENTS.services,
                          }}
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-900 line-clamp-1">
                        {b.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        📍 {[b.city, b.state].filter(Boolean).join(', ') || 'No location'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {b.rating > 0
                          ? `⭐ ${b.rating.toFixed(1)} (${b.review_count})`
                          : 'No reviews yet'}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  </APIProvider>
)}