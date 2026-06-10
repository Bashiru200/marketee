'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import AlgoliaSearchBar from '@/components/search/AlgoliaSearchBar'
import ListBusinessButton from '@/components/ui/ListBusinessButton'
import slide1 from '@/public/images/slideshow/slideshow1.jpeg'
import slide2 from '@/public/images/slideshow/slideshow2.jpeg'
import slide3 from '@/public/images/slideshow/slideshow3.jpeg'
import slide4 from '@/public/images/slideshow/slideshow4.jpeg'
import slide5 from '@/public/images/slideshow/slideshow5.jpeg'


// ── Slide images ──────────────────────────────────────────────────────────
// Replace these with real photos from your Supabase storage or Unsplash
// Ideal: real photos of African businesses, food, fashion, beauty salons
const SLIDES = [
  {
    src:     slide1,   
    alt:     'African restaurant',
    credit:  'Restaurant',
  },
  {
    src:     slide2,
    alt:     'African fashion and fabric',
    credit:  'Fashion',
  },
  {
    src:     slide3,
    alt:     'African beauty salon',
    credit:  'Beauty',
  },
  {
    src:     slide4,
    alt:     'African food and cuisine',
    credit:  'Food',
  },
  {
    src:     slide5,
    alt:     'African market and shopping',
    credit:  'Market',
  },
]

const INTERVAL = 5000 // 5 seconds per slide

export default function HeroSlideshow() {
  const [current,  setCurrent]  = useState(0)
  const [prev,     setPrev]     = useState<number | null>(null)
  const [fading,   setFading]   = useState(false)
  const [paused,   setPaused]   = useState(false)

  useEffect(() => {
    if (paused) return
    const timer = setInterval(() => {
      setPrev(current)
      setFading(true)
      setTimeout(() => {
        setCurrent(c => (c + 1) % SLIDES.length)
        setFading(false)
        setPrev(null)
      }, 800)
    }, INTERVAL)
    return () => clearInterval(timer)
  }, [current, paused])

  function goTo(index: number) {
    if (index === current) return
    setPrev(current)
    setFading(true)
    setTimeout(() => {
      setCurrent(index)
      setFading(false)
      setPrev(null)
    }, 800)
  }

  return (
    <section
      className="relative overflow-hidden"
      style={{ minHeight: '88vh' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Slide images ── */}
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-800"
          style={{
            opacity:   i === current ? (fading ? 0 : 1)
                     : i === prev    ? (fading ? 1 : 0)
                     : 0,
            zIndex:    i === current ? 2 : i === prev ? 1 : 0,
            transition:'opacity 800ms ease-in-out',
          }}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            priority={i === 0}
            sizes="100vw"
            className="object-cover"
          />
          {/* Dark gradient overlay so text is always readable */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(
                to bottom,
                rgba(0,0,0,0.25) 0%,
                rgba(0,0,0,0.45) 40%,
                rgba(0,0,0,0.70) 100%
              )`,
            }}
          />
          {/* Green tint on top of overlay for brand consistency */}
          <div
            className="absolute inset-0"
            style={{ background:'rgba(5,53,40,0.30)', mixBlendMode:'multiply' }}
          />
        </div>
      ))}

      {/* ── Content (floats over photos) ── */}
      <div
        className="relative z-10 max-w-4xl mx-auto px-4 flex flex-col items-center justify-center text-center text-white"
        style={{ minHeight:'88vh', paddingTop:'6rem', paddingBottom:'6rem' }}
      >
        {/* Live badge */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm mb-6 border"
          style={{ background:'rgba(255,255,255,0.12)', borderColor:'rgba(255,255,255,0.25)' }}
        >
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Now live in Houston, TX · More cities coming soon
        </div>

        {/* Main headline */}
        <h1
          className="text-5xl md:text-7xl font-bold leading-tight mb-5 tracking-tight"
          style={{ textShadow:'0 2px 20px rgba(0,0,0,0.4)' }}
        >
          Home has never{' '}
          <span style={{ color:'#9FE1CB' }}>felt this close.</span>
        </h1>

        {/* Subheadline */}
        <p
          className="text-xl mb-10 max-w-2xl leading-relaxed"
          style={{ color:'rgba(255,255,255,0.85)', textShadow:'0 1px 8px rgba(0,0,0,0.3)' }}
        >
          Discover Nigerian, Ghanaian, Kenyan and more African-owned
          grocery stores, restaurants, fashion, beauty salons, and services
          — all in one place.
        </p>

        {/* Search bar */}
        <div className="w-full max-w-2xl mb-6">
          <AlgoliaSearchBar />
        </div>

        {/* Quick tags */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {['Jollof Rice','Ankara Fabric','Hair Braiding','Palm Oil','Egusi Soup','Shea Butter'].map(t => (
            <Link
              key={t}
              href={`/search?tab=products&q=${encodeURIComponent(t)}`}
              className="text-xs px-4 py-1.5 rounded-full border transition-all hover:bg-white/20"
              style={{
                background:  'rgba(255,255,255,0.10)',
                borderColor: 'rgba(255,255,255,0.25)',
                color:       '#9FE1CB',
              }}
            >
              {t}
            </Link>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/search"
            className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-white px-8 py-3.5 rounded-xl hover:opacity-90 transition-opacity"
            style={{ background:'#1D9E75' }}
          >
            Explore businesses
          </Link>
          <ListBusinessButton
            className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-8 py-3.5 rounded-xl border-2 transition-all hover:bg-white/10"
            style={{ borderColor:'rgba(255,255,255,0.5)', color:'white' }}
          />
        </div>
      </div>

      {/* ── Slide indicators ── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className="transition-all duration-300 rounded-full"
            style={{
              width:      i === current ? '28px' : '8px',
              height:     '8px',
              background: i === current
                ? '#9FE1CB'
                : 'rgba(255,255,255,0.4)',
            }}
          />
        ))}
      </div>

      {/* ── Progress bar ── */}
      <div
        className="absolute bottom-0 left-0 z-10 h-0.5"
        style={{ background:'rgba(255,255,255,0.2)', width:'100%' }}
      >
        {!paused && (
          <div
            key={current}
            className="h-full"
            style={{
              background: '#1D9E75',
              animation:  `progress ${INTERVAL}ms linear forwards`,
            }}
          />
        )}
      </div>

      {/* Progress bar keyframe */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes progress {
          from { width: 0% }
          to   { width: 100% }
        }
      `}} />

      {/* ── Bottom wave ── */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 60L1440 60L1440 0C1200 40 960 60 720 60C480 60 240 40 0 0L0 60Z" fill="#FAFAF9"/>
        </svg>
      </div>
    </section>
  )
}