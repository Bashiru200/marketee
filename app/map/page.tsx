/// <reference types="google.maps" />
'use client'
import { AFRICAN_FLAGS } from '@/lib/africanFlags'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  APIProvider, Map, AdvancedMarker,
  InfoWindow, useMap, useMapsLibrary
} from '@vis.gl/react-google-maps'
import { Search, X, MapPin, Loader2, Navigation, ChevronLeft, ChevronRight, Phone, Globe, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { getHoursStatus } from '@/lib/businessHours'

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!

const DEFAULT_CENTER = { lat: 39.5, lng: -98.35 }
const DEFAULT_ZOOM   = 4

// ── Apple Maps style map theme ────────────────────────────────────────────
const APPLE_MAP_STYLE = [
  { featureType:'all',        elementType:'labels.text.fill',   stylers:[{ color:'#6b6b6b' }] },
  { featureType:'all',        elementType:'labels.text.stroke', stylers:[{ color:'#ffffff' }, { weight:2 }] },
  { featureType:'road',       elementType:'geometry',           stylers:[{ color:'#ffffff' }] },
  { featureType:'road.highway', elementType:'geometry',         stylers:[{ color:'#f5f5f5' }] },
  { featureType:'road.arterial', elementType:'geometry',        stylers:[{ color:'#ffffff' }] },
  { featureType:'water',      elementType:'geometry',           stylers:[{ color:'#c9e8f5' }] },
  { featureType:'landscape',  elementType:'geometry',           stylers:[{ color:'#f0f0f0' }] },
  { featureType:'landscape.natural', elementType:'geometry',    stylers:[{ color:'#e8f0e8' }] },
  { featureType:'poi.park',   elementType:'geometry',           stylers:[{ color:'#d4e8d4' }] },
  { featureType:'poi',        elementType:'labels',             stylers:[{ visibility:'off' }] },
  { featureType:'transit',    elementType:'labels',             stylers:[{ visibility:'off' }] },
  { featureType:'administrative', elementType:'geometry',       stylers:[{ color:'#e0e0e0' }] },
  { featureType:'administrative.country', elementType:'labels.text.fill', stylers:[{ color:'#9e9e9e' }] },
  { featureType:'administrative.locality', elementType:'labels.text.fill', stylers:[{ color:'#757575' }] },
]

// ── Category icons ────────────────────────────────────────────────────────
const CATEGORY_PIN: Record<string, string> = {
  food:       '🍲',
  restaurant: '🍽️',
  fashion:    '👗',
  beauty:     '💇',
  herbs:      '🌿',
  music:      '🎵',
  crafts:     '🏺',
  services:   '🛠️',
  nightlife:  '🍸',
}

const CATEGORIES = [
  { id:'all',        label:'All',        icon:'🌍' },
  { id:'restaurant', label:'Restaurants', icon:'🍽️' },
  { id:'food',       label:'Food',        icon:'🍲' },
  { id:'beauty',     label:'Beauty',      icon:'💇' },
  { id:'fashion',    label:'Fashion',     icon:'👗' },
  { id:'services',   label:'Services',    icon:'🛠️' },
  { id:'herbs',      label:'Wellness',    icon:'🌿' },
  { id:'music',      label:'Music',       icon:'🎵' },
]

function distanceMiles(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R    = 3958.8
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a    = Math.sin(dLat/2) ** 2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

interface BusinessRow {
  id: string; name: string; category: string | null; subcategory?: string | null
  street: string | null; address: string | null; city: string | null
  state: string | null; zip: string | null; phone: string | null
  website: string | null; country: string | null; cover_image: string | null
  rating: number; review_count: number; verified: boolean; featured: boolean
  plan: string | null; lat: number; lng: number
  hours_open?: string | null; days_open?: string[] | null
}

// ── Location search ───────────────────────────────────────────────────────
function LocationSearch({ onPlace }: { onPlace: (lat: number, lng: number, name: string) => void }) {
  const map         = useMap()
  const placesLib   = useMapsLibrary('places')
  const inputRef    = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')

  useEffect(() => {
    if (!placesLib || !inputRef.current) return
    const ac = new placesLib.Autocomplete(inputRef.current, { types: ['(cities)'], componentRestrictions: { country:'us' } })
    ac.addListener('place_changed', () => {
      const place = ac.getPlace()
      if (place.geometry?.location) {
        onPlace(place.geometry.location.lat(), place.geometry.location.lng(), place.name ?? '')
      }
    })
  }, [placesLib, onPlace])

  return (
    <div className="relative flex items-center">
      <MapPin size={14} className="absolute left-3 text-gray-400 pointer-events-none" />
      <input ref={inputRef} value={value} onChange={e => setValue(e.target.value)}
        placeholder="Search location…"
        className="pl-8 pr-3 py-2 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400 w-36" />
      {value && <button onClick={() => setValue('')}><X size={12} className="text-gray-400" /></button>}
    </div>
  )
}

// ── Main map controller ───────────────────────────────────────────────────
function MapController({ center, zoom }: { center: { lat: number; lng: number }; zoom: number }) {
  const map = useMap()
  useEffect(() => { if (map) { map.panTo(center); map.setZoom(zoom) } }, [map, center, zoom])
  return null
}

export default function MapPage() {
  const supabase = createClient()
  const [businesses,    setBusinesses]    = useState<BusinessRow[]>([])
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [category,      setCategory]      = useState('all')
  const [selectedId,    setSelectedId]    = useState<string | null>(null)
  const [mapCenter,     setMapCenter]     = useState(DEFAULT_CENTER)
  const [mapZoom,       setMapZoom]       = useState(DEFAULT_ZOOM)
  const [userLocation,  setUserLocation]  = useState<{ lat: number; lng: number } | null>(null)
  const [locating,      setLocating]      = useState(false)
  const [showSearch,    setShowSearch]    = useState(false)
  const [showList,      setShowList]      = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('businesses')
        .select('id,name,category,subcategory,street,address,city,state,zip,phone,website,country,cover_image,rating,review_count,verified,featured,plan,lat,lng,hours_open,days_open')
        .not('lat', 'is', null).not('lng', 'is', null)
        .order('featured', { ascending: false })
        .order('rating',   { ascending: false })
      setBusinesses((data ?? []) as BusinessRow[])
      setLoading(false)
    }
    load()
  }, [])

  function locateMe() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc); setMapCenter(loc); setMapZoom(13); setLocating(false)
      },
      () => setLocating(false)
    )
  }

  const filtered = businesses.filter(b => {
    const q = search.toLowerCase()
    const matchSearch = !search
      || b.name.toLowerCase().includes(q)
      || (b.city ?? '').toLowerCase().includes(q)
      || (b.category ?? '').toLowerCase().includes(q)
    const matchCat = category === 'all' || b.category === category
    return matchSearch && matchCat
  })

  const selected = businesses.find(b => b.id === selectedId) ?? null

  function handlePinClick(b: BusinessRow) {
    setSelectedId(b.id === selectedId ? null : b.id)
    setMapCenter({ lat: b.lat - 0.002, lng: b.lng })
    setMapZoom(15)
  }

  // getHoursStatus returns a complex type; cast to any to avoid TS property errors when accessing fields below
  const hoursStatus: any = selected ? getHoursStatus(selected.hours_open, selected.days_open ?? []) : null

  return (
    <APIProvider apiKey={GOOGLE_MAPS_KEY}>
      <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden bg-gray-100">

        {/* ── FULL SCREEN MAP ── */}
        <Map
          defaultCenter={DEFAULT_CENTER}
          defaultZoom={DEFAULT_ZOOM}
          gestureHandling="greedy"
          disableDefaultUI
          mapId="markeetee-map"
          styles={APPLE_MAP_STYLE}
          className="w-full h-full"
          onClick={() => setSelectedId(null)}>

          <MapController center={mapCenter} zoom={mapZoom} />

          {/* User location dot */}
          {userLocation && (
            <AdvancedMarker position={userLocation} zIndex={20}>
              <div className="relative">
                <div className="w-5 h-5 rounded-full border-3 border-white shadow-lg" style={{ background:'#007AFF' }} />
                <div className="absolute inset-0 w-5 h-5 rounded-full animate-ping opacity-40" style={{ background:'#007AFF' }} />
              </div>
            </AdvancedMarker>
          )}

          {/* Business pins */}
          {filtered.map(b => (
            <AdvancedMarker
              key={b.id}
              position={{ lat: b.lat, lng: b.lng }}
              onClick={() => handlePinClick(b)}
              zIndex={selectedId === b.id ? 10 : 1}>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                cursor: 'pointer',
                transform: selectedId === b.id ? 'scale(1.3)' : 'scale(1)',
                transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                filter: selectedId === b.id
                  ? 'drop-shadow(0 6px 12px rgba(0,0,0,0.3))'
                  : 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
              }}>
                <div style={{
                  width: 38, height: 38,
                  borderRadius: '50% 50% 50% 0',
                  transform: 'rotate(-45deg)',
                  background: selectedId === b.id ? '#085041' : '#DC2626',
                  border: `2.5px solid ${selectedId === b.id ? '#053528' : '#991B1B'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ transform: 'rotate(45deg)', fontSize: 17, lineHeight: 1 }}>
                    {CATEGORY_PIN[b.category ?? ''] ?? '📍'}
                  </span>
                </div>
                <div style={{
                  width: 6, height: 6,
                  background: selectedId === b.id ? '#085041' : '#DC2626',
                  borderRadius: '50%', marginTop: 2,
                }} />
              </div>
            </AdvancedMarker>
          ))}
        </Map>

        {/* ── FLOATING SEARCH BAR (Apple Maps style) ── */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 z-30">
          <div className="flex items-center gap-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 px-4 py-3">
            <Search size={16} className="text-gray-400 flex-shrink-0" />
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search African businesses…"
              className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400 font-medium"
            />
            {search
              ? <button onClick={() => setSearch('')}><X size={15} className="text-gray-400" /></button>
              : <div className="w-px h-4 bg-gray-200" />
            }
            <LocationSearch onPlace={(lat, lng) => {
              setMapCenter({ lat, lng })
              setUserLocation({ lat, lng })
              setMapZoom(13)
            }} />
          </div>
        </div>

        {/* ── CATEGORY PILLS (Apple Maps style horizontal scroll) ── */}
        <div className="absolute top-20 left-0 right-0 z-30 px-4 overflow-x-auto">
          <div className="flex gap-2 pb-1" style={{ width: 'max-content' }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setCategory(cat.id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all shadow-sm border"
                style={category === cat.id
                  ? { background:'#1D9E75', color:'white', borderColor:'#1D9E75' }
                  : { background:'white', color:'#374151', borderColor:'rgba(255,255,255,0.8)', backdropFilter:'blur(12px)' }
                }>
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── LOCATE ME button ── */}
        <button onClick={locateMe} disabled={locating}
          className="absolute bottom-48 right-4 z-30 w-12 h-12 bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 flex items-center justify-center hover:scale-105 transition-transform">
          {locating
            ? <Loader2 size={18} className="animate-spin text-gray-500" />
            : <Navigation size={18} style={{ color:'#007AFF' }} />
          }
        </button>

        {/* ── RESULTS COUNT pill ── */}
        {!loading && (
          <div className="absolute bottom-48 left-4 z-30">
            <div className="bg-white/95 backdrop-blur-xl rounded-full shadow-lg border border-white/50 px-4 py-2 text-xs font-semibold text-gray-600">
              {filtered.length} {filtered.length === 1 ? 'business' : 'businesses'}
            </div>
          </div>
        )}

        {/* ── BUSINESSES LIST SHEET (swipeable bottom sheet) ── */}
        <div className={`absolute bottom-0 left-0 right-0 z-20 transition-transform duration-300 ease-out ${showList ? 'translate-y-0' : 'translate-y-[calc(100%-5rem)]'}`}>
          <div className="bg-white/95 backdrop-blur-xl rounded-t-3xl shadow-2xl border-t border-white/50 max-h-[70vh] flex flex-col">
            {/* Handle + header */}
            <button onClick={() => setShowList(v => !v)} className="w-full py-3 flex flex-col items-center gap-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
              <p className="text-xs font-semibold text-gray-500">
                {showList ? 'Hide list' : `${filtered.length} nearby businesses`}
              </p>
            </button>

            {showList && (
              <div className="overflow-y-auto flex-1 pb-6">
                {loading ? (
                  <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
                    <Loader2 size={16} className="animate-spin" /> Loading…
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-2xl mb-2">🔍</p>
                    <p className="text-sm text-gray-500">No businesses found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 px-4">
                    {filtered.map(b => (
                      <button key={b.id} onClick={() => { handlePinClick(b); setShowList(false) }}
                        className="flex gap-3 p-3 rounded-2xl text-left transition-all hover:bg-gray-50 border border-gray-100"
                        style={selectedId === b.id ? { background:'#f0faf6', borderColor:'#1D9E75' } : {}}>
                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                          {b.cover_image
                            ? <img src={b.cover_image} alt={b.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-2xl">
                                {CATEGORY_PIN[b.category ?? ''] ?? '🏪'}
                              </div>
                          }
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-gray-900 truncate">{b.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {AFRICAN_FLAGS[b.country ?? ''] ?? '🌍'} {b.city}, {b.state}
                          </p>
                          {b.rating > 0 && (
                            <p className="text-xs text-amber-500 mt-0.5">
                              {'⭐'.repeat(Math.round(b.rating))} {b.rating.toFixed(1)}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── SELECTED BUSINESS CARD (Apple Maps style bottom card) ── */}
        {selected && (
          <div className="absolute bottom-[5rem] left-4 right-4 z-40 transition-all duration-300">
            <div className="bg-white/98 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">

              {/* Cover image or gradient header */}
              {selected.cover_image ? (
                <div className="relative h-32">
                  <img src={selected.cover_image} alt={selected.name}
                    className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <button onClick={() => setSelectedId(null)}
                    className="absolute top-3 right-3 w-8 h-8 bg-black/30 backdrop-blur rounded-full flex items-center justify-center text-white">
                    <X size={14} />
                  </button>
                  {selected.verified && (
                    <span className="absolute top-3 left-3 text-xs font-bold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur text-white">
                      ✓ Verified
                    </span>
                  )}
                </div>
              ) : (
                <div className="relative h-16 flex items-center px-4"
                  style={{ background: 'linear-gradient(135deg, #053528, #1D9E75)' }}>
                  <span className="text-3xl mr-3">{CATEGORY_PIN[selected.category ?? ''] ?? '🏪'}</span>
                  <button onClick={() => setSelectedId(null)}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white">
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Info */}
              <div className="px-4 pt-3 pb-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-base leading-tight truncate">{selected.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 capitalize">
                      {selected.category} · {selected.city}, {selected.state}
                    </p>
                  </div>
                  {selected.rating > 0 && (
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-bold text-amber-500">⭐ {selected.rating.toFixed(1)}</p>
                      <p className="text-[10px] text-gray-400">{selected.review_count} reviews</p>
                    </div>
                  )}
                </div>

                {/* Hours status */}
                {hoursStatus && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <Clock size={12} className="text-gray-400" />
                    <span className="text-xs font-semibold" style={{ color: hoursStatus.open ? '#1D9E75' : '#EF4444' }}>
                      {hoursStatus.open ? 'Open' : 'Closed'}
                    </span>
                    {selected.hours_open && (
                      <span className="text-xs text-gray-400">· {selected.hours_open}</span>
                    )}
                  </div>
                )}

                {/* Action buttons — Apple Maps style pill buttons */}
                <div className="flex gap-2">
                  <Link href={`/businesses/${selected.id}`}
                    className="flex-1 text-center text-sm font-semibold text-white py-2.5 rounded-2xl transition-opacity hover:opacity-90"
                    style={{ background:'#1D9E75' }}>
                    View
                  </Link>
                  {selected.phone && (
                    <a href={`tel:${selected.phone}`}
                      className="flex-1 text-center text-sm font-semibold py-2.5 rounded-2xl border-2 transition-all"
                      style={{ borderColor:'#1D9E75', color:'#1D9E75' }}>
                      Call
                    </a>
                  )}
                  {selected.phone && (
                    <a href={`https://wa.me/${selected.phone.replace(/\D/g,'')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex-1 text-center text-sm font-semibold py-2.5 rounded-2xl bg-green-50 transition-all"
                      style={{ color:'#25D366' }}>
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </APIProvider>
  )
}