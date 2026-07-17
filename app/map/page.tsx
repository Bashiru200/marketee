/// <reference types="google.maps" />
'use client'
import { AFRICAN_FLAGS } from '@/lib/africanFlags'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary
} from '@vis.gl/react-google-maps'
import { Search, X, MapPin, Loader2, Navigation, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { getHoursStatus } from '@/lib/businessHours'

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!
const DEFAULT_CENTER  = { lat: 39.5, lng: -98.35 }
const DEFAULT_ZOOM    = 4

// ── Apple Maps style ──────────────────────────────────────────────────────
const MAP_STYLE = [
  { featureType:'all',              elementType:'labels.text.fill',   stylers:[{ color:'#6b6b6b' }] },
  { featureType:'all',              elementType:'labels.text.stroke', stylers:[{ color:'#ffffff' }, { weight:2 }] },
  { featureType:'road',             elementType:'geometry',           stylers:[{ color:'#ffffff' }] },
  { featureType:'road.highway',     elementType:'geometry',           stylers:[{ color:'#f5f5f5' }] },
  { featureType:'water',            elementType:'geometry',           stylers:[{ color:'#c9e8f5' }] },
  { featureType:'landscape',        elementType:'geometry',           stylers:[{ color:'#f0f0f0' }] },
  { featureType:'landscape.natural',elementType:'geometry',           stylers:[{ color:'#e8f0e8' }] },
  { featureType:'poi.park',         elementType:'geometry',           stylers:[{ color:'#d4e8d4' }] },
  { featureType:'poi',              elementType:'labels',             stylers:[{ visibility:'off' }] },
  { featureType:'transit',          elementType:'labels',             stylers:[{ visibility:'off' }] },
]

const CATEGORY_PIN: Record<string, string> = {
  food:'🍲', restaurant:'🍽️', fashion:'👗', beauty:'💇',
  herbs:'🌿', music:'🎵', crafts:'🏺', services:'🛠️', nightlife:'🍸',
}

const CATEGORIES = [
  { id:'all',        label:'All',         icon:'🌍' },
  { id:'restaurant', label:'Restaurants', icon:'🍽️' },
  { id:'food',       label:'Food',        icon:'🍲' },
  { id:'beauty',     label:'Beauty',      icon:'💇' },
  { id:'fashion',    label:'Fashion',     icon:'👗' },
  { id:'services',   label:'Services',    icon:'🛠️' },
  { id:'herbs',      label:'Wellness',    icon:'🌿' },
  { id:'music',      label:'Music',       icon:'🎵' },
]

function distanceMiles(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 3958.8, dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

interface BusinessRow {
  id: string; name: string; category: string | null
  street: string | null; address: string | null; city: string | null
  state: string | null; phone: string | null; country: string | null
  cover_image: string | null; rating: number; review_count: number
  verified: boolean; featured: boolean; plan: string | null
  lat: number; lng: number; hours_open?: string | null; days_open?: string[] | null
}

// ── Location search autocomplete ──────────────────────────────────────────
function LocationSearch({ onPlace }: { onPlace: (lat: number, lng: number) => void }) {
  const placesLib = useMapsLibrary('places')
  const inputRef  = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')

  useEffect(() => {
    if (!placesLib || !inputRef.current) return
    const ac = new placesLib.Autocomplete(inputRef.current, {
      types: ['(cities)'], componentRestrictions: { country:'us' },
    })
    ac.addListener('place_changed', () => {
      const p = ac.getPlace()
      if (p.geometry?.location) {
        onPlace(p.geometry.location.lat(), p.geometry.location.lng())
        setValue(p.name ?? '')
      }
    })
  }, [placesLib, onPlace])

  return (
    <div className="flex items-center gap-1 border-l border-gray-200 pl-3">
      <MapPin size={13} className="text-gray-400 flex-shrink-0" />
      <input ref={inputRef} value={value} onChange={e => setValue(e.target.value)}
        placeholder="Location…"
        className="w-28 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400" />
      {value && (
        <button onClick={() => setValue('')}>
          <X size={11} className="text-gray-400" />
        </button>
      )}
    </div>
  )
}

// ── Map bounds fitter ─────────────────────────────────────────────────────
function BoundsFitter({ businesses, trigger }: { businesses: BusinessRow[]; trigger: number }) {
  const map = useMap()
  useEffect(() => {
    if (!map || businesses.length === 0) return
    if (businesses.length === 1) {
      map.panTo({ lat: businesses[0].lat, lng: businesses[0].lng })
      map.setZoom(14)
      return
    }
    const bounds = new google.maps.LatLngBounds()
    businesses.forEach(b => bounds.extend({ lat: b.lat, lng: b.lng }))
    map.fitBounds(bounds, { top: 120, bottom: 160, left: 40, right: 40 })
  }, [trigger])
  return null
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function MapPage() {
  const supabase = createClient()

  const [businesses,   setBusinesses]   = useState<BusinessRow[]>([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [category,     setCategory]     = useState('all')
  const [selectedId,   setSelectedId]   = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locating,     setLocating]     = useState(false)
  const [showList,     setShowList]     = useState(false)
  const [fitTrigger,   setFitTrigger]   = useState(0)
  const [mapCenter,    setMapCenter]    = useState(DEFAULT_CENTER)
  const [mapZoom,      setMapZoom]      = useState(DEFAULT_ZOOM)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('businesses')
        .select('id,name,category,street,address,city,state,phone,country,cover_image,rating,review_count,verified,featured,plan,lat,lng,hours_open,days_open')
        .not('lat', 'is', null).not('lng', 'is', null)
        .order('featured', { ascending: false })
        .order('rating',   { ascending: false })
      setBusinesses((data ?? []) as BusinessRow[])
      setLoading(false)
    }
    load()
  }, [])

  // ── Filtered businesses ────────────────────────────────────────────────
  const filtered = businesses.filter(b => {
    const q = search.toLowerCase()
    const matchSearch = !search
      || b.name.toLowerCase().includes(q)
      || (b.city ?? '').toLowerCase().includes(q)
      || (b.category ?? '').toLowerCase().includes(q)
    const matchCat = category === 'all' || b.category === category
    return matchSearch && matchCat
  })

  // Sort by distance if we have user location
  const sorted = userLocation
    ? [...filtered].sort((a, b) =>
        distanceMiles(userLocation.lat, userLocation.lng, a.lat, a.lng) -
        distanceMiles(userLocation.lat, userLocation.lng, b.lat, b.lng)
      )
    : filtered

  const selected   = businesses.find(b => b.id === selectedId) ?? null
  const hoursStatus = selected ? getHoursStatus(selected.hours_open, selected.days_open ?? []) : null

  // ── Category click — zoom to user location nearby results ─────────────
  function handleCategoryClick(catId: string) {
    setCategory(catId)
    setSelectedId(null)

    // If same category — deselect (toggle off)
    if (catId === category) {
      setCategory('all')
      return
    }

    // If we have user location — zoom to show nearby filtered results
    if (userLocation) {
      setTimeout(() => setFitTrigger(t => t + 1), 50)
    } else {
      // No user location — prompt them to share location for best results
      // Still fit bounds to all filtered results
      setTimeout(() => setFitTrigger(t => t + 1), 50)
    }
  }

  // ── Locate me ─────────────────────────────────────────────────────────
  function locateMe() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        setMapCenter(loc)
        setMapZoom(13)
        setLocating(false)
        // After locating, fit nearby businesses
        setTimeout(() => setFitTrigger(t => t + 1), 300)
      },
      () => setLocating(false),
      { enableHighAccuracy: true }
    )
  }

  function handlePinClick(b: BusinessRow) {
    setSelectedId(b.id === selectedId ? null : b.id)
    setMapCenter({ lat: b.lat - 0.003, lng: b.lng })
    setMapZoom(15)
  }

  const handlePlace = useCallback((lat: number, lng: number) => {
    setUserLocation({ lat, lng })
    setMapCenter({ lat, lng })
    setMapZoom(13)
    setTimeout(() => setFitTrigger(t => t + 1), 300)
  }, [])

  // Nearby count (within 10 miles of user)
  const nearbyCount = userLocation
    ? filtered.filter(b => distanceMiles(userLocation.lat, userLocation.lng, b.lat, b.lng) <= 10).length
    : null

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
          styles={MAP_STYLE}
          className="w-full h-full"
          onClick={() => setSelectedId(null)}>

          <BoundsFitter businesses={sorted} trigger={fitTrigger} />

          {/* User location pulse dot */}
          {userLocation && (
            <AdvancedMarker position={userLocation} zIndex={20}>
              <div className="relative w-5 h-5">
                <div className="absolute inset-0 rounded-full animate-ping opacity-40"
                  style={{ background:'#007AFF' }} />
                <div className="relative w-5 h-5 rounded-full border-2 border-white shadow-lg"
                  style={{ background:'#007AFF' }} />
              </div>
            </AdvancedMarker>
          )}

          {/* Business pins */}
          {sorted.map(b => {
            const isSelected = selectedId === b.id
            const isNearby   = userLocation
              ? distanceMiles(userLocation.lat, userLocation.lng, b.lat, b.lng) <= 10
              : true
            const dimmed = category !== 'all' && !isNearby && !isSelected

            return (
              <AdvancedMarker
                key={b.id}
                position={{ lat: b.lat, lng: b.lng }}
                onClick={() => handlePinClick(b)}
                zIndex={isSelected ? 10 : isNearby ? 2 : 1}>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  cursor: 'pointer',
                  opacity: dimmed ? 0.35 : 1,
                  transform: isSelected ? 'scale(1.35)' : 'scale(1)',
                  transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                  filter: isSelected
                    ? 'drop-shadow(0 6px 12px rgba(0,0,0,0.35))'
                    : 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                }}>
                  <div style={{
                    width: 38, height: 38,
                    borderRadius: '50% 50% 50% 0',
                    transform: 'rotate(-45deg)',
                    background: isSelected ? '#085041' : '#DC2626',
                    border: `2.5px solid ${isSelected ? '#053528' : '#991B1B'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ transform:'rotate(45deg)', fontSize:17, lineHeight:1 }}>
                      {CATEGORY_PIN[b.category ?? ''] ?? '📍'}
                    </span>
                  </div>
                  <div style={{
                    width:6, height:6, marginTop:2, borderRadius:'50%',
                    background: isSelected ? '#085041' : '#DC2626',
                  }} />
                </div>
              </AdvancedMarker>
            )
          })}
        </Map>

        {/* ── FLOATING SEARCH BAR ── */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 z-30">
          <div className="flex items-center gap-2 bg-white/96 backdrop-blur-xl rounded-2xl shadow-lg border border-white/60 px-4 py-3">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setTimeout(() => setFitTrigger(t => t+1), 100) }}
              placeholder="Search African businesses…"
              className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400 font-medium min-w-0"
            />
            {search && (
              <button onClick={() => { setSearch(''); setTimeout(() => setFitTrigger(t => t+1), 100) }}>
                <X size={14} className="text-gray-400" />
              </button>
            )}
            <LocationSearch onPlace={handlePlace} />
          </div>
        </div>

        {/* ── CATEGORY PILLS ── */}
        <div className="absolute top-[4.5rem] left-0 right-0 z-30 px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 pb-1" style={{ width:'max-content' }}>
            {CATEGORIES.map(cat => {
              const isActive  = category === cat.id
              const catCount  = cat.id === 'all'
                ? filtered.length
                : businesses.filter(b => b.category === cat.id &&
                    (!search || b.name.toLowerCase().includes(search.toLowerCase()) ||
                     (b.city ?? '').toLowerCase().includes(search.toLowerCase()))
                  ).length

              return (
                <button key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all shadow-sm"
                  style={isActive
                    ? { background:'#1D9E75', color:'white', boxShadow:'0 2px 8px rgba(29,158,117,0.4)' }
                    : { background:'rgba(255,255,255,0.95)', color:'#374151', backdropFilter:'blur(12px)', border:'1px solid rgba(0,0,0,0.06)' }
                  }>
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  {catCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: isActive ? 'rgba(255,255,255,0.25)' : '#F3F4F6',
                        color:      isActive ? 'white' : '#6B7280',
                      }}>
                      {catCount}
                    </span>
                  )}
                  {/* X to clear — only show on active non-all category */}
                  {isActive && cat.id !== 'all' && (
                    <span
                      onClick={e => { e.stopPropagation(); setCategory('all'); setFitTrigger(t => t+1) }}
                      className="ml-0.5 opacity-70 hover:opacity-100 cursor-pointer"
                      style={{ fontSize:12 }}>
                      ✕
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── LOCATE ME ── */}
        <button onClick={locateMe} disabled={locating}
          className="absolute z-30 w-12 h-12 bg-white/96 backdrop-blur-xl rounded-2xl shadow-lg border border-white/60 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          style={{ bottom: selected ? '14rem' : '9rem', right:'1rem' }}>
          {locating
            ? <Loader2 size={18} className="animate-spin text-gray-500" />
            : <Navigation size={18} style={{ color:'#007AFF' }} />
          }
        </button>

        {/* ── RESULTS PILL ── */}
        {!loading && (
          <div className="absolute z-30"
            style={{ bottom: selected ? '14rem' : '9rem', left:'1rem' }}>
            <div className="bg-white/96 backdrop-blur-xl rounded-full shadow-lg border border-white/60 px-4 py-2 text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              {category !== 'all' && (
                <span>{CATEGORY_PIN[category] ?? '📍'}</span>
              )}
              <span>
                {sorted.length} {sorted.length === 1 ? 'business' : 'businesses'}
                {nearbyCount !== null && category !== 'all' && ` · ${nearbyCount} nearby`}
              </span>
              {(category !== 'all' || search) && (
                <button
                  onClick={() => { setCategory('all'); setSearch(''); setFitTrigger(t => t+1) }}
                  className="ml-1 text-gray-400 hover:text-gray-600">
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── BOTTOM LIST SHEET ── */}
        {!selected && (
          <div className={`absolute bottom-0 left-0 right-0 z-20 transition-transform duration-300 ease-out ${showList ? 'translate-y-0' : 'translate-y-[calc(100%-5rem)]'}`}>
            <div className="bg-white/96 backdrop-blur-xl rounded-t-3xl shadow-2xl border-t border-white/60 max-h-[60vh] flex flex-col">
              <button onClick={() => setShowList(v => !v)}
                className="w-full py-3 flex flex-col items-center gap-1">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
                <p className="text-xs font-semibold text-gray-500">
                  {showList ? 'Hide list' : `${sorted.length} businesses${nearbyCount !== null ? ` · ${nearbyCount} nearby` : ''}`}
                </p>
              </button>

              {showList && (
                <div className="overflow-y-auto flex-1 pb-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
                      <Loader2 size={16} className="animate-spin" /> Loading…
                    </div>
                  ) : sorted.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-3xl mb-2">🔍</p>
                      <p className="text-sm text-gray-500">No businesses found</p>
                      <button onClick={() => { setCategory('all'); setSearch('') }}
                        className="mt-3 text-sm font-semibold px-4 py-2 rounded-xl"
                        style={{ background:'#1D9E75', color:'white' }}>
                        Clear filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 px-4">
                      {sorted.map(b => {
                        const dist = userLocation
                          ? distanceMiles(userLocation.lat, userLocation.lng, b.lat, b.lng)
                          : null
                        return (
                          <button key={b.id}
                            onClick={() => { handlePinClick(b); setShowList(false) }}
                            className="flex gap-3 p-3 rounded-2xl text-left transition-all border"
                            style={selectedId === b.id
                              ? { background:'#f0faf6', borderColor:'#1D9E75' }
                              : { background:'white', borderColor:'#F3F4F6' }
                            }>
                            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
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
                              <div className="flex items-center gap-2 mt-0.5">
                                {b.rating > 0 && (
                                  <p className="text-xs text-amber-500">⭐ {b.rating.toFixed(1)}</p>
                                )}
                                {dist !== null && (
                                  <p className="text-xs text-gray-400">{dist.toFixed(1)} mi</p>
                                )}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SELECTED BUSINESS CARD ── */}
        {selected && (
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-40 transition-all duration-300">
            <div className="bg-white/98 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">

              {/* Drag handle on mobile */}
              <div className="flex justify-center pt-2 md:hidden">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>

              {selected.cover_image ? (
                <div className="relative h-28">
                  <img src={selected.cover_image} alt={selected.name}
                    className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
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
                <div className="relative h-14 flex items-center px-4"
                  style={{ background:'linear-gradient(135deg,#053528,#1D9E75)' }}>
                  <span className="text-3xl">{CATEGORY_PIN[selected.category ?? ''] ?? '🏪'}</span>
                  <button onClick={() => setSelectedId(null)}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white">
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="px-4 pt-3 pb-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 leading-tight truncate">{selected.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 capitalize">
                      {selected.category} · {selected.city}, {selected.state}
                      {userLocation && (
                        <span className="ml-1 text-gray-400">
                          · {distanceMiles(userLocation.lat, userLocation.lng, selected.lat, selected.lng).toFixed(1)} mi
                        </span>
                      )}
                    </p>
                  </div>
                  {selected.rating > 0 && (
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-bold text-amber-500">⭐ {selected.rating.toFixed(1)}</p>
                      <p className="text-[10px] text-gray-400">{selected.review_count} reviews</p>
                    </div>
                  )}
                </div>

                {hoursStatus && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <Clock size={11} className="text-gray-400" />
                    <span className="text-xs font-semibold"
                      style={{ color: hoursStatus.status === 'open' ? '#1D9E75' : '#EF4444' }}>
                      {hoursStatus.label}
                    </span>
                    {selected.hours_open && (
                      <span className="text-xs text-gray-400">· {selected.hours_open}</span>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Link href={`/businesses/${selected.id}`}
                    className="flex-1 text-center text-sm font-semibold text-white py-2.5 rounded-2xl hover:opacity-90"
                    style={{ background:'#1D9E75' }}>
                    View
                  </Link>
                  {selected.phone && (
                    <a href={`tel:${selected.phone}`}
                      className="flex-1 text-center text-sm font-semibold py-2.5 rounded-2xl border-2"
                      style={{ borderColor:'#1D9E75', color:'#1D9E75' }}>
                      Call
                    </a>
                  )}
                  {selected.phone && (
                    <a href={`https://wa.me/${selected.phone.replace(/\D/g,'')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex-1 text-center text-sm font-semibold py-2.5 rounded-2xl bg-green-50"
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