'use client'
import { useEffect, useState } from 'react'
import { MapPin, X, Navigation } from 'lucide-react'

interface Props {
  onLocation?: (coords: { lat: number; lng: number; city?: string }) => void
}

export default function LocationPrompt({ onLocation }: Props) {
  const [show,     setShow]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [denied,   setDenied]   = useState(false)

  useEffect(() => {
    // Only show if not already answered
    const answered = localStorage.getItem('location_prompt_answered')
    if (answered) return

    // Wait 3 seconds before showing — don't interrupt page load
    const timer = setTimeout(() => setShow(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  function dismiss() {
    localStorage.setItem('location_prompt_answered', 'dismissed')
    setShow(false)
  }

  async function allow() {
    setLoading(true)

    if (!navigator.geolocation) {
      setDenied(true)
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords

        // Store in localStorage for search pre-fill
        localStorage.setItem('user_lat',  String(lat))
        localStorage.setItem('user_lng',  String(lng))
        localStorage.setItem('location_prompt_answered', 'allowed')

        // Reverse geocode to get city using Google Maps Geocoding
        try {
          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
          if (apiKey) {
            const res  = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
            )
            const data = await res.json()
            const comp = data.results?.[0]?.address_components ?? []
            const city = comp.find((c: any) => c.types.includes('locality'))?.long_name
              || comp.find((c: any) => c.types.includes('administrative_area_level_2'))?.long_name
              || ''
            if (city) localStorage.setItem('user_city', city)
            onLocation?.({ lat, lng, city })

            // Dispatch storage event so any open map page reacts immediately
            window.dispatchEvent(new StorageEvent('storage', {
              key:      'user_lat',
              newValue: String(lat),
            }))
          } else {
            onLocation?.({ lat, lng })
          }
        } catch {
          onLocation?.({ lat, lng })
        }

        setShow(false)
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setDenied(true)
        }
        setLoading(false)
        localStorage.setItem('location_prompt_answered', 'denied')
      },
      { timeout: 10000, maximumAge: 300000 }
    )
  }

  if (!show) return null

  return (
    <>
      {/* Backdrop blur on mobile */}
      <div
        className="fixed inset-0 z-40 sm:hidden"
        style={{ background: 'rgba(0,0,0,0.3)' }}
        onClick={dismiss}
      />

      {/* Prompt card — bottom sheet on mobile, bottom-right on desktop */}
      <div
        className="fixed z-50 bottom-0 left-0 right-0 sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm"
        style={{ animation: 'slideUp 0.4s ease-out' }}
      >
        <div
          className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
          style={{ boxShadow: '0 -4px 40px rgba(0,0,0,0.15)' }}
        >
          {/* Green header strip */}
          <div
            className="px-5 pt-5 pb-4"
            style={{ background: 'linear-gradient(135deg,#085041,#1D9E75)' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <MapPin size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-white text-base leading-tight">
                    Find businesses near you
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#9FE1CB' }}>
                    Share your location for better results
                  </p>
                </div>
              </div>
              <button
                onClick={dismiss}
                className="text-white/60 hover:text-white transition-colors flex-shrink-0 mt-0.5"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-5 py-4">
            {denied ? (
              <div className="text-center py-2">
                <p className="text-sm text-gray-700 font-medium mb-1">Location access denied</p>
                <p className="text-xs text-gray-400 mb-4">
                  Enable location access in your browser settings to discover
                  African businesses near you.
                </p>
                <button onClick={dismiss}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700">
                  Close
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Allow Markeetee to use your location to show you African businesses,
                  restaurants, and services in your city and surrounding areas.
                </p>

                <div className="space-y-2 mb-4">
                  {[
                    'Businesses within your city',
                    'Nearby stores on the live map',
                    'Distance from your location',
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: '#E1F5EE' }}>
                        <span style={{ color: '#1D9E75', fontSize: '9px' }}>✓</span>
                      </div>
                      {item}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={allow}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold text-white py-2.5 rounded-xl disabled:opacity-60 hover:opacity-90 transition-opacity"
                    style={{ background: '#1D9E75' }}
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Detecting…
                      </>
                    ) : (
                      <>
                        <Navigation size={14} />
                        Allow location
                      </>
                    )}
                  </button>
                  <button
                    onClick={dismiss}
                    className="px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Not now
                  </button>
                </div>

                <p className="text-[10px] text-gray-400 text-center mt-3">
                  Your location is used only to find nearby businesses and is never stored on our servers.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}} />
    </>
  )
}