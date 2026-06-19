/// <reference types="google.maps" />
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

  const [businesses,       setBusinesses]       = useState<BusinessRow[]>([])
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

  // ── Click a pin — pan map + scroll sidebar card into view ────────────
  function handlePinClick(b: BusinessRow) {
    const newId = b.id === selectedId ? null : b.id
    setSelectedId(newId)
    if (b.lat && b.lng) {
      setMapCenter({ lat: b.lat, lng: b.lng })
      setMapZoom(15)
    }
    // Scroll the sidebar card into view
    if (newId) {
      setTimeout(() => {
        document.getElementById(`biz-${newId}`)?.scrollIntoView({
          behavior: 'smooth',
          block:    'nearest',
        })
      }, 50)
    }
  }

  if (loading) return (
    <div className="h-[calc(100vh-4rem)] relative">


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

        {/* Sidebar hidden */}
        <div className="hidden">
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
      <div className="h-[calc(100vh-4rem)] relative">

        {/* ── Content ── */}
        <div className="h-[calc(100vh-4rem)] relative">
          {view === 'map' ? (
            <div className="h-full flex">

              {/* ── Google Map ── */}
              <div className="relative flex-1">
                <Map
                  mapId="markeetee-map"
                  defaultCenter={DEFAULT_CENTER}
                  defaultZoom={DEFAULT_ZOOM}
                  gestureHandling="greedy"
                  disableDefaultUI={true}
                  style={{ width: '100%', height: '100%' }}
                >
                  <MapController center={mapCenter} zoom={mapZoom} />

                  {/* User location blue dot */}
                  {userLocation && (
                    <AdvancedMarker position={userLocation}>
                      <div style={{
                        width:       '18px',
                        height:      '18px',
                        borderRadius:'50%',
                        background:  '#4285F4',
                        border:      '3px solid white',
                        boxShadow:   '0 2px 8px rgba(66,133,244,0.6)',
                      }} title="Your location" />
                    </AdvancedMarker>
                  )}

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
                      <div style={{ minWidth: '200px', maxWidth: '240px', fontFamily: 'system-ui, sans-serif', padding: '2px 4px 4px' }}>
                        <p style={{ fontWeight: 700, fontSize: '14px', margin: '0 0 4px', color: '#111827' }}>
                          {selected.name}
                        </p>
                        <p style={{ fontSize: '11px', color: '#6B7280', margin: '0 0 2px' }}>
                          {selected.city}{selected.state ? `, ${selected.state}` : ''}
                        </p>
                        {selected.rating > 0 && (
                          <p style={{ fontSize: '11px', color: '#F59E0B', margin: '0 0 10px' }}>
                            {'★'.repeat(Math.round(selected.rating))} {selected.rating.toFixed(1)}
                            <span style={{ color: '#6B7280' }}> ({selected.review_count})</span>
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <a href={`/businesses/${selected.id}`}
                            style={{ flex: 1, textAlign: 'center', background: '#1D9E75', color: 'white', fontSize: '12px', fontWeight: 600, padding: '7px 0', borderRadius: '8px', textDecoration: 'none' }}>
                            View
                          </a>
                          {selected.phone && (
                            <a href={`https://wa.me/${selected.phone.replace(/\D/g, '')}?text=${encodeURIComponent('Hi! I found you on Markeetee.')}`}
                              target="_blank" rel="noopener noreferrer"
                              style={{ flex: 1, textAlign: 'center', background: '#25D366', color: 'white', fontSize: '12px', fontWeight: 600, padding: '7px 0', borderRadius: '8px', textDecoration: 'none' }}>
                              WhatsApp
                            </a>
                          )}
                          <a href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{ flex: 1, textAlign: 'center', background: '#F3F4F6', color: '#374151', fontSize: '12px', fontWeight: 500, padding: '7px 0', borderRadius: '8px', textDecoration: 'none' }}>
                            Directions
                          </a>
                        </div>
                      </div>
                    </InfoWindow>
                  )}
                </Map>



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

              {/* ── Left sidebar — business list ── */}
              <div className="w-72 xl:w-80 flex-shrink-0 flex flex-col bg-white border-r border-gray-100 overflow-hidden">

                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {filtered.length} business{filtered.length !== 1 ? 'es' : ''}
                    </p>
                    <p className="text-xs text-gray-400">on map</p>
                  </div>
                  {selectedId && (
                    <button onClick={() => setSelectedId(null)}
                      className="text-xs font-medium px-2 py-1 rounded-lg transition-colors hover:bg-gray-50"
                      style={{ color: '#1D9E75' }}>
                      Clear
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400">
                      <p className="text-3xl mb-3">🔍</p>
                      <p className="text-sm font-medium text-gray-600">No businesses found</p>
                      <p className="text-xs mt-1">Try adjusting your filters</p>
                    </div>
                  ) : (
                    filtered.map(b => {
                      const isSelected = selectedId === b.id
                      return (
                        <button
                          key={b.id}
                          id={`biz-${b.id}`}
                          onClick={() => handlePinClick(b)}
                          className="w-full text-left flex gap-3 px-4 py-3 border-b border-gray-50 transition-all hover:bg-gray-50"
                          style={isSelected ? {
                            background: '#f0faf6',
                            borderLeft: '3px solid #1D9E75',
                            paddingLeft: '13px',
                          } : {}}
                        >
                          {/* Thumbnail */}
                          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                            {b.cover_image
                              ? <img src={b.cover_image} alt={b.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-2xl"
                                  style={{ background: GRADIENTS[b.category ?? ''] ?? GRADIENTS.services }}>
                                  {b.category === 'food' ? '🍲' : b.category === 'restaurant' ? '🍽️' :
                                   b.category === 'fashion' ? '👗' : b.category === 'beauty' ? '💆' :
                                   b.category === 'herbs' ? '🌿' : b.category === 'music' ? '🎵' :
                                   b.category === 'crafts' ? '🏺' : b.category === 'nightlife' ? '🍺' : '🛠️'}
                                </div>
                            }
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-gray-900 line-clamp-1 leading-snug">
                              {b.name}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                              {FLAGS[b.country ?? ''] ?? '🌍'}
                              <span className="truncate capitalize">{b.subcategory ?? b.category}</span>
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              {b.rating > 0 ? (
                                <span className="text-xs font-medium" style={{ color: '#F59E0B' }}>
                                  ★ {b.rating.toFixed(1)}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-300">No reviews</span>
                              )}
                              {b.price_range && (
                                <span className="text-xs text-gray-400">· {b.price_range}</span>
                              )}
                              {b.verified && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: '#E1F5EE', color: '#085041' }}>✓</span>
                              )}
                            </div>
                            {b.city && (
                              <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                                📍 {b.city}{b.state ? `, ${b.state}` : ''}
                              </p>
                            )}
                          </div>

                          {/* Arrow indicator when selected */}
                          {isSelected && (
                            <div className="flex-shrink-0 self-center">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#1D9E75' }} />
                            </div>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
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