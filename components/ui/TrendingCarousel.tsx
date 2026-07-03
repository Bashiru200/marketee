'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const CATEGORY_META: Record<string, { icon: string; label: string; color: string; bg: string; grad: string }> = {
  food:       { icon: '🍲', label: 'Food & Groceries', color: '#085041', bg: '#E1F5EE', grad: 'linear-gradient(135deg,#c5eadb,#9fdcc3)' },
  restaurant: { icon: '🍽️', label: 'Restaurants',      color: '#3B1F6B', bg: '#EEEDFE', grad: 'linear-gradient(135deg,#EEEDFE,#AFA9EC)' },
  fashion:    { icon: '👗', label: 'Fashion & Fabric',  color: '#7C3D0E', bg: '#FAEEDA', grad: 'linear-gradient(135deg,#FAEEDA,#FAC775)' },
  beauty:     { icon: '💆', label: 'Beauty & Hair',     color: '#831843', bg: '#FBEAF0', grad: 'linear-gradient(135deg,#FBEAF0,#ED93B1)' },
  herbs:      { icon: '🌿', label: 'Herbs & Wellness',  color: '#1A4D1A', bg: '#EAF3DE', grad: 'linear-gradient(135deg,#EAF3DE,#C0DD97)' },
  music:      { icon: '🎵', label: 'Music & Arts',      color: '#7C2D12', bg: '#FAECE7', grad: 'linear-gradient(135deg,#FAECE7,#F0997B)' },
  crafts:     { icon: '🏺', label: 'Crafts & Decor',    color: '#1E3A5F', bg: '#E6F1FB', grad: 'linear-gradient(135deg,#E6F1FB,#85B7EB)' },
  services:   { icon: '🛠️', label: 'Services',          color: '#374151', bg: '#F1EFE8', grad: 'linear-gradient(135deg,#F1EFE8,#B4B2A9)' },
  nightlife:  { icon: '🍺', label: 'Bars & Nightlife',  color: '#2D1B69', bg: '#EDE9FE', grad: 'linear-gradient(135deg,#2D1B69,#6B46C1)' },
}

const FALLBACK = { icon: '📦', label: '', color: '#374151', bg: '#F3F4F6', grad: 'linear-gradient(135deg,#F3F4F6,#E5E7EB)' }

interface Props {
  categories: string[]
  title?: string
}

const CARD_WIDTH    = 128   // px — width of each card
const CARD_GAP      = 16    // px — gap between cards
const CARD_STRIDE   = CARD_WIDTH + CARD_GAP
const SCROLL_SPEED  = 0.6   // px per frame — tweak for faster/slower

export default function TrendingCarousel({ categories, title = 'Trending now' }: Props) {
  const trackRef   = useRef<HTMLDivElement>(null)
  const pausedRef  = useRef(false)
  const posRef     = useRef(0)
  const rafRef     = useRef<number>(0)
  const [ready, setReady] = useState(false)

  // Build a tripled list so the infinite loop has plenty of runway
  const items = categories.length > 0
    ? [...categories, ...categories, ...categories]
    : []

  const loopWidth = categories.length * CARD_STRIDE

  useEffect(() => {
    if (!trackRef.current || items.length === 0) return
    setReady(true)

    function step() {
      if (!pausedRef.current) {
        posRef.current += SCROLL_SPEED
        // When we've scrolled one full loop, reset to beginning seamlessly
        if (posRef.current >= loopWidth) {
          posRef.current -= loopWidth
        }
        if (trackRef.current) {
          trackRef.current.style.transform = `translateX(-${posRef.current}px)`
        }
      }
      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [items.length, loopWidth])

  if (categories.length === 0) return null

  return (
    <section className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔥</span>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: '#E1F5EE', color: '#085041' }}>
            {categories.length} categories
          </span>
        </div>
        <Link
          href="/search"
          className="text-xs font-semibold hover:underline transition-colors"
          style={{ color: '#1D9E75' }}>
          Browse all →
        </Link>
      </div>

      {/* Carousel viewport */}
      <div
        className="relative overflow-hidden"
        style={{
          // Fade edges
          maskImage:       'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
        }}
        onMouseEnter={() => { pausedRef.current = true  }}
        onMouseLeave={() => { pausedRef.current = false }}
        onTouchStart={() => { pausedRef.current = true  }}
        onTouchEnd={()   => { pausedRef.current = false }}>

        {/* Scrolling track */}
        <div
          ref={trackRef}
          className="flex"
          style={{
            gap:       `${CARD_GAP}px`,
            willChange:'transform',
            opacity:    ready ? 1 : 0,
            transition: 'opacity 0.3s',
          }}>
          {items.map((cat, i) => {
            const meta  = CATEGORY_META[cat] ?? { ...FALLBACK, label: cat }
            const label = meta.label || cat.charAt(0).toUpperCase() + cat.slice(1)
            // Rank only applies to the first set
            const rank  = i < categories.length ? i + 1 : null

            return (
              <Link
                key={`${cat}-${i}`}
                href={`/search?category=${cat}`}
                className="group relative flex flex-col items-center justify-center gap-2 rounded-2xl flex-shrink-0 transition-transform duration-200 hover:scale-105 hover:shadow-lg"
                style={{
                  width:      `${CARD_WIDTH}px`,
                  height:     `${CARD_WIDTH}px`,
                  background: meta.grad,
                  minWidth:   `${CARD_WIDTH}px`,
                }}>

                {/* Rank badge */}
                {rank && rank <= 3 && (
                  <div
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow"
                    style={{
                      background: rank === 1 ? '#F59E0B' : rank === 2 ? '#9CA3AF' : '#CD7F32',
                    }}>
                    {rank}
                  </div>
                )}

                {/* Icon */}
                <span
                  className="text-3xl transition-transform duration-200 group-hover:scale-110 group-hover:-translate-y-1"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}>
                  {meta.icon}
                </span>

                {/* Label */}
                <span
                  className="text-[11px] font-bold text-center leading-tight px-2"
                  style={{ color: meta.color, maxWidth: '100px' }}>
                  {label}
                </span>

                {/* Hover overlay */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: 'rgba(255,255,255,0.15)' }}
                />
              </Link>
            )
          })}
        </div>
      </div>

      {/* Pause hint */}
      <p className="text-center text-xs text-gray-400 mt-3">
        Hover to pause · Click to explore
      </p>
    </section>
  )
}