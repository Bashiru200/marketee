'use client'
import { AFRICAN_FLAGS } from '@/lib/africanFlags'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ElementType } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  Search, X, MapPin, Star, BadgeCheck,
  SlidersHorizontal, Loader2, ChevronDown,
  Store, Utensils, ShoppingBag, Scissors, Shirt,
  Leaf, Music, Palette, Wrench
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import SaveButton from '@/components/ui/SaveButton'

// ── Types ─────────────────────────────────────────────────────────────────
interface Business {
  id: string; name: string; category: string | null; subcategory: string | null
  description: string | null; city: string | null; state: string | null
  cover_image: string | null; rating: number; review_count: number
  price_range: string | null; tags: string[] | null; country: string | null
  verified: boolean; premium: boolean; featured: boolean
}

interface Category { id: string; name: string; icon: string; count: number }

interface Product {
  id:           string
  name:         string
  price:        number
  description:  string | null
  image_url:    string | null
  available:    boolean
  business_id:  string
  like_count?:   number
  rating_avg?:   number
  rating_count?: number
  businesses: {
    id:          string
    name:        string
    city:        string | null
    state:       string | null
    cover_image: string | null
    verified:    boolean
    phone:       string | null
    category:    string | null
  } | null
}

import ProductModal from '@/components/ui/ProductModal'
import { Heart } from 'lucide-react'

type SearchTab = 'businesses' | 'products'



interface Props {
  initialBusinesses: Business[]
  totalCount:        number
  pageSize:          number
  categories:        Category[]
  initialTab?:       SearchTab
}

// ── Constants ─────────────────────────────────────────────────────────────


const GRADIENTS: Record<string, string> = {
  food:'linear-gradient(135deg,#c5eadb,#9fdcc3)',
  restaurant:'linear-gradient(135deg,#EEEDFE,#AFA9EC)',
  fashion:'linear-gradient(135deg,#FAEEDA,#FAC775)',
  beauty:'linear-gradient(135deg,#FBEAF0,#ED93B1)',
  herbs:'linear-gradient(135deg,#EAF3DE,#C0DD97)',
  music:'linear-gradient(135deg,#FAECE7,#F0997B)',
  crafts:'linear-gradient(135deg,#E6F1FB,#85B7EB)',
  services:'linear-gradient(135deg,#F1EFE8,#B4B2A9)',
  nightlife:'linear-gradient(135deg,#2D1B69,#6B46C1)',
}

const SORT_OPTIONS = [
  { value:'featured', label:'Featured first' },
  { value:'rating',   label:'Highest rated'  },
  { value:'newest',   label:'Newest first'   },
  { value:'reviews',  label:'Most reviewed'  },
]

const CATEGORY_META: Record<string, { label: string; icon: ElementType; tone: string }> = {
  food:       { label:'Food & Groceries', icon: ShoppingBag, tone:'#0F6E56' },
  restaurant: { label:'Restaurants',      icon: Utensils,    tone:'#7C3AED' },
  fashion:   { label:'Fashion',          icon: Shirt,       tone:'#B45309' },
  beauty:    { label:'Beauty & Hair',    icon: Scissors,    tone:'#BE185D' },
  herbs:     { label:'Herbs & Wellness', icon: Leaf,        tone:'#4D7C0F' },
  music:     { label:'Music & Arts',     icon: Music,       tone:'#C2410C' },
  crafts:    { label:'Crafts & Decor',   icon: Palette,     tone:'#0369A1' },
  services:  { label:'Services',         icon: Wrench,      tone:'#475569' },
  nightlife: { label:'Bars & Nightlife', icon: Store,       tone:'#5B21B6' },
}

function getCategoryMeta(category: string | null) {
  return CATEGORY_META[category ?? ''] ?? { label: category ?? 'Business', icon: Store, tone:'#085041' }
}

function BusinessImageFallback({ business }: { business: Business }) {
  const meta = getCategoryMeta(business.category)
  const Icon = meta.icon

  return (
    <div className="flex h-full w-full items-center justify-center" style={{ background: GRADIENTS[business.category ?? ''] ?? GRADIENTS.services }}>
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/50 bg-white/80 shadow-lg backdrop-blur-sm">
        <Icon size={34} style={{ color: meta.tone }} aria-hidden="true" />
      </div>
    </div>
  )
}

// ── Card component ────────────────────────────────────────────────────────
function BizCard({ b }: { b: Business }) {
  const meta = getCategoryMeta(b.category)

  return (
    <article className="group overflow-hidden rounded-3xl border border-[#E7DDCA] bg-[#FFFDF8] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#9FDCC3] hover:shadow-xl hover:shadow-[#085041]/10 dark:border-[#20362d] dark:bg-[#101b17] dark:shadow-black/20 dark:hover:border-[#9FE1CB]/45">
      {/* Cover */}
      <Link href={`/businesses/${b.id}`} className="relative block h-48 overflow-hidden bg-gray-100 outline-none focus:ring-2 focus:ring-[#085041] focus:ring-offset-2 dark:bg-[#0c1713] dark:focus:ring-[#9FE1CB] dark:focus:ring-offset-[#07130f]">
        {b.cover_image ? (
          <Image
            src={b.cover_image}
            alt={b.name}
            fill
            sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : <BusinessImageFallback business={b} />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />

        {/* Badges */}
        <div className="absolute left-3 top-3 flex gap-1.5">
          {b.featured && (
            <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
              Featured
            </span>
          )}
          {b.verified && (
            <span className="flex items-center gap-0.5 rounded-full px-2.5 py-1 text-[10px] font-bold text-white shadow-sm"
              style={{ background:'#1D9E75' }}>
              <BadgeCheck size={9} /> Verified
            </span>
          )}
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex max-w-full items-center rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-bold text-[#085041] shadow-sm dark:bg-[#10231d]/92 dark:text-[#9FE1CB]">
              <span className="truncate">{b.subcategory ?? meta.label}</span>
            </span>
          </div>
          {b.country && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/95 text-sm shadow dark:bg-[#10231d]/95">
              {AFRICAN_FLAGS[b.country] ?? '🌍'}
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/businesses/${b.id}`}
              className="line-clamp-1 text-lg font-bold text-gray-950 transition-colors hover:text-[#085041] dark:text-gray-100"
            >
              {b.name}
            </Link>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <MapPin size={12} className="shrink-0 text-[#1D9E75]" />
              <span className="truncate">
                {[b.city, b.state].filter(Boolean).join(', ') || 'Location available on profile'}
              </span>
            </p>
          </div>
          <SaveButton businessId={b.id} size="sm" />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-[#20362d]">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5" aria-label={`${b.rating ?? 0} out of 5 stars`}>
              <Star size={14} className="fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {b.rating > 0 ? b.rating.toFixed(1) : 'New'}
              </span>
              <span className="text-xs text-gray-400">({b.review_count ?? 0})</span>
            </div>
            {b.price_range && (
              <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">{b.price_range}</p>
            )}
          </div>

          <Link
            href={`/businesses/${b.id}`}
            className="shrink-0 rounded-xl bg-[#085041] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#053528] focus:outline-none focus:ring-2 focus:ring-[#085041] focus:ring-offset-2 dark:bg-[#1D9E75] dark:text-[#03110d] dark:hover:bg-[#9FE1CB] dark:focus:ring-[#9FE1CB] dark:focus:ring-offset-[#07130f]"
          >
            View
          </Link>
        </div>
      </div>
    </article>
  )
}


// ── Product card ──────────────────────────────────────────────────────────
function ProductCard({ p, onOpen }: { p: Product; onOpen: (p: Product) => void }) {
  const waMsg = p.businesses?.phone
    ? encodeURIComponent(`Hi ${p.businesses.name}! I'm interested in "${p.name}" ($${p.price?.toFixed(2)}) — is it available?`)
    : null
  const waUrl = p.businesses?.phone && waMsg
    ? `https://wa.me/${p.businesses.phone.replace(/\D/g, '')}?text=${waMsg}`
    : null

  return (
    <button type="button"
      className="bg-[#FFFDF8] dark:bg-gray-800 rounded-2xl border border-[#E7DDCA] dark:border-gray-700 overflow-hidden hover:border-green-200 hover:shadow-md hover:shadow-[#085041]/10 transition-all flex flex-col cursor-pointer text-left w-full"
      onClick={() => onOpen(p)}>
      {/* Product image */}
      <div className="relative h-44 overflow-hidden bg-[#F8F2E8] dark:bg-gray-700 pointer-events-none">
        {p.image_url ? (
          <Image src={p.image_url} alt={p.name} fill
            sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw"
            className="object-cover pointer-events-none" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl pointer-events-none">📦</div>
        )}
        {!p.available && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ background:'rgba(0,0,0,0.45)' }}>
            <span className="text-xs font-semibold text-white bg-gray-800 px-3 py-1 rounded-full">
              Out of stock
            </span>
          </div>
        )}
        {/* Likes + rating overlay */}
        {((p.like_count ?? 0) > 0 || (p.rating_count ?? 0) > 0) && (
          <div className="absolute bottom-2 left-2 flex gap-1.5 pointer-events-none">
            {(p.rating_count ?? 0) > 0 && (
              <div className="flex items-center gap-1 bg-[#FFFDF8] dark:bg-gray-800/95 backdrop-blur-sm px-2 py-1 rounded-full">
                <Star size={10} fill="#F59E0B" style={{ color: '#F59E0B' }} />
                <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{p.rating_avg?.toFixed(1)}</span>
              </div>
            )}
            {(p.like_count ?? 0) > 0 && (
              <div className="flex items-center gap-1 bg-[#FFFDF8] dark:bg-gray-800/95 backdrop-blur-sm px-2 py-1 rounded-full">
                <Heart size={10} fill="#D4537E" style={{ color: '#D4537E' }} />
                <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{p.like_count}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <p className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{p.name}</p>
        {p.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{p.description}</p>
        )}
        <p className="text-lg font-bold mt-2" style={{ color:'#1D9E75' }}>
          ${p.price?.toFixed(2)}
        </p>

        {/* Business info */}
        {p.businesses && (
          <Link href={`/businesses/${p.businesses.id}`}
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-2 mt-2 pt-2 border-t border-[#E7DDCA] dark:border-gray-700 hover:opacity-80 transition-opacity">
            {p.businesses.cover_image ? (
              <div className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                <Image src={p.businesses.cover_image} alt={p.businesses.name}
                  fill sizes="24px" className="object-cover" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                style={{ background:'#085041' }}>
                {p.businesses.name[0]}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{p.businesses.name}</p>
                {p.businesses.verified && (
                  <BadgeCheck size={10} style={{ color:'#1D9E75', flexShrink:0 }} />
                )}
              </div>
              {(p.businesses.city || p.businesses.state) && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                  {[p.businesses.city, p.businesses.state].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </Link>
        )}

        {/* CTA */}
        <div className="mt-3 flex gap-2">
          {waUrl ? (
            <a href={waUrl} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-white py-2 rounded-lg hover:opacity-90 transition-opacity"
              style={{ background:'#25D366' }}>
              💬 Enquire
            </a>
          ) : (
            <Link href={`/businesses/${p.business_id}`}
              onClick={e => e.stopPropagation()}
              className="flex-1 flex items-center justify-center text-xs font-semibold text-white py-2 rounded-lg hover:opacity-90 transition-opacity"
              style={{ background:'#1D9E75' }}>
              View store
            </Link>
          )}
        </div>
      </div>
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────
export default function SearchClient({
  initialBusinesses, totalCount, pageSize, categories, initialTab = 'businesses',
}: Props) {
  const supabase     = createClient()
  const searchParams = useSearchParams()

  // State
  const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses)
  const [loading,    setLoading]    = useState(false)
  const [loadingMore,setLoadingMore]= useState(false)
  const [total,      setTotal]      = useState(totalCount)
  const [page,       setPage]       = useState(0) // 0 = first page already loaded
  const [hasMore,    setHasMore]    = useState(totalCount > pageSize)

  // Tab
  const [activeTab,  setActiveTab]  = useState<SearchTab>(
    (searchParams.get('tab') as SearchTab) ?? initialTab
  )

  // Product state
  const [products,      setProducts]      = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productTotal,  setProductTotal]  = useState(0)
  const [productPage,   setProductPage]   = useState(0)
  const [productHasMore,setProductHasMore]= useState(false)
  const [productLoading,setProductLoading]= useState(false)
  const [productLoadingMore, setProductLoadingMore] = useState(false)
  const [maxPrice,   setMaxPrice]   = useState(0)
  const [inStockOnly,setInStockOnly]= useState(false)

  // Filters
  const [query,    setQuery]    = useState(searchParams.get('q')        ?? '')
  const [city,     setCity]     = useState(searchParams.get('city')     ?? '')
  const [cat,      setCat]      = useState(searchParams.get('category') ?? '')
  const [country,  setCountry]  = useState('')
  const [sort,     setSort]     = useState('featured')
  const [minRating,setMinRating]= useState(0)
  const [price,    setPrice]    = useState('')
  const [verified, setVerified] = useState(false)
  const [showFilters,setShowFilters] = useState(false)

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null)
  const skippedInitialBusinessFetch = useRef(false)

  // ── Fetch page from Supabase ──────────────────────────────────────────
  const fetchPage = useCallback(async (pageNum: number, replace = false) => {
    if (pageNum === 0 && replace === false) return // already have initial data

    const isFirst = pageNum === 0
    if (isFirst) setLoading(true)
    else         setLoadingMore(true)

    let q = supabase
      .from('businesses')
      .select(`
        id, name, category, subcategory, description,
        address, city, state, zip, country,
        cover_image, rating, review_count,
        price_range, tags, lat, lng,
        verified, premium, featured
      `, { count: 'exact' })

    // Filters
    if (query.trim())   q = q.ilike('name',     `%${query.trim()}%`)
    if (city.trim())    q = q.or(`city.ilike.%${city.trim()}%,state.ilike.%${city.trim()}%,zip.eq.${city.trim()}`)
    if (cat)            q = q.eq('category',     cat)
    if (country)        q = q.eq('country',      country)
    if (verified)       q = q.eq('verified',     true)
    if (price)          q = q.eq('price_range',  price)
    if (minRating > 0)  q = q.gte('rating',      minRating)

    // Sort
    if (sort === 'featured') q = q.order('featured', { ascending:false }).order('rating', { ascending:false })
    if (sort === 'rating')   q = q.order('rating',   { ascending:false })
    if (sort === 'newest')   q = q.order('created_at',{ ascending:false })
    if (sort === 'reviews')  q = q.order('review_count',{ ascending:false })

    // Pagination
    q = q.range(pageNum * pageSize, (pageNum + 1) * pageSize - 1)

    const { data, count: cnt } = await q

    const results = (data ?? []) as Business[]

    if (replace) {
      setPage(pageNum)
      setBusinesses(results)
    } else {
      setBusinesses(prev => [...prev, ...results])
    }

    const newTotal = cnt ?? 0
    setTotal(newTotal)
    setHasMore((pageNum + 1) * pageSize < newTotal)
    setLoading(false)
    setLoadingMore(false)
  }, [query, city, cat, country, verified, price, minRating, sort, pageSize, supabase])

  // ── Fetch products ───────────────────────────────────────────────────────
  const fetchProducts = useCallback(async (pageNum: number, replace = false) => {
    const isFirst = pageNum === 0
    if (isFirst) setProductLoading(true)
    else         setProductLoadingMore(true)

    let q = supabase
      .from('products')
      .select(`
        id, name, price, description, image_url, available, business_id,
        like_count, rating_avg, rating_count,
        businesses(id, name, city, state, cover_image, verified, phone, category)
      `, { count:'exact' })
      .eq('available', true)

    if (query.trim())    q = q.ilike('name', `%${query.trim()}%`)
    if (inStockOnly)     q = q.eq('available', true)
    if (maxPrice > 0)    q = q.lte('price', maxPrice)
    if (cat)             q = q.eq('businesses.category', cat)

    q = q.order('name', { ascending: true })
         .range(pageNum * pageSize, (pageNum + 1) * pageSize - 1)

    const { data, count: cnt } = await q

    const results = (data ?? []) as Product[]

    if (replace) {
      setProductPage(pageNum)
      setProducts(results)
    } else {
      setProducts(prev => [...prev, ...results])
    }

    setProductTotal(cnt ?? 0)
    setProductHasMore((pageNum + 1) * pageSize < (cnt ?? 0))
    setProductLoading(false)
    setProductLoadingMore(false)
  }, [query, inStockOnly, maxPrice, cat, pageSize, supabase])

  // ── Re-fetch when filters change ──────────────────────────────────────
  useEffect(() => {
    if (!skippedInitialBusinessFetch.current) {
      skippedInitialBusinessFetch.current = true
      return
    }

    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) void fetchPage(0, true)
    })
    return () => { cancelled = true }
  }, [fetchPage])

  // Re-fetch products when filters change
  useEffect(() => {
    if (activeTab !== 'products') return
    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) void fetchProducts(0, true)
    })
    return () => { cancelled = true }
  }, [fetchProducts, activeTab])

  // ── Infinite scroll observer ──────────────────────────────────────────
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          const nextPage = page + 1
          setPage(nextPage)
          fetchPage(nextPage, false)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading, page, fetchPage])

  // Product infinite scroll sentinel
  const productSentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = productSentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && productHasMore && !productLoadingMore && !productLoading) {
        const nextPage = productPage + 1
        setProductPage(nextPage)
        fetchProducts(nextPage, false)
      }
    }, { threshold: 0.1 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [productHasMore, productLoadingMore, productLoading, productPage, fetchProducts])

  // ── Active filter count ───────────────────────────────────────────────
  const activeFilters = [cat, country, price, verified, minRating > 0].filter(Boolean).length

  function clearAll() {
    setQuery(''); setCity(''); setCat(''); setCountry('')
    setPrice(''); setVerified(false); setMinRating(0)
  }

  const COUNTRIES = ['Nigeria','Ghana','Kenya','Senegal','South Africa','Ethiopia','Cameroon']

  return (
    <div className="min-h-screen bg-[#FBF7EF] px-4 py-8 dark:bg-[#07130f]">
      <div className="mx-auto max-w-7xl">

      {/* Tab switcher */}
      <div className="flex gap-1 bg-[#FFFDF8] dark:bg-[#101b17] border border-[#E7DDCA] dark:border-[#20362d] rounded-2xl p-1 mb-5 w-fit shadow-sm dark:shadow-black/20">
        {([
          ['businesses', '🏪', 'Businesses'],
          ['products',   '📦', 'Products'  ],
        ] as const).map(([tab, icon, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={activeTab === tab
              ? { background:'#1D9E75', color:'white' }
              : { color:'var(--search-tab-muted, #6B7280)' }
            }>
            <span>{icon}</span> {label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex items-center gap-2 flex-1 bg-[#FFFDF8] dark:bg-[#101b17] border border-[#D9CBB4] dark:border-[#20362d] rounded-xl px-4 py-3 shadow-sm dark:shadow-black/15">
          <Search size={16} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder='Search businesses or products'
            className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
          />
          {query && <button onClick={() => setQuery('')}><X size={14} className="text-gray-400 dark:text-gray-500" /></button>}
        </div>
        <div className="flex items-center gap-2 bg-[#FFFDF8] dark:bg-[#101b17] border border-[#D9CBB4] dark:border-[#20362d] rounded-xl px-4 py-3 shadow-sm dark:shadow-black/15 sm:w-52">
          <MapPin size={14} style={{ color:'#1D9E75' }} className="flex-shrink-0" />
          <input
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="Enter city, state or zip"
            className="flex-1 text-sm outline-none bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-400"
          />
          {city && <button onClick={() => setCity('')}><X size={13} className="text-gray-400 dark:text-gray-500" /></button>}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#D9CBB4] bg-[#FFFDF8] dark:bg-[#101b17] text-sm font-medium transition-colors hover:border-green-300 shadow-sm dark:border-[#20362d] dark:text-[#b8cec5] dark:shadow-black/15 dark:hover:border-[#9FE1CB]/45"
          style={activeFilters > 0 ? { borderColor:'#1D9E75', color:'#1D9E75', background:'#f0faf6' } : { color:'#374151' }}
        >
          <SlidersHorizontal size={15} />
          Filters
          {activeFilters > 0 && (
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ background:'#1D9E75' }}>
              {activeFilters}
            </span>
          )}
          <ChevronDown size={13} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Products tab content */}
      {activeTab === 'products' && (
        <div>
          {/* Product filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="flex items-center gap-2 bg-[#FFFDF8] dark:bg-[#101b17] border border-[#D9CBB4] dark:border-[#20362d] rounded-xl px-3 py-2">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide whitespace-nowrap">Max price</span>
              <input type="number" min={0} max={500} step={5}
                value={maxPrice || ''}
                onChange={e => setMaxPrice(Number(e.target.value))}
                placeholder="Enter max price"
                className="w-20 text-sm outline-none bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-400" />
              {maxPrice > 0 && (
                <button onClick={() => setMaxPrice(0)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:text-gray-500">
                  <X size={12} />
                </button>
              )}
            </div>
            <label className="flex items-center gap-2 bg-[#FFFDF8] dark:bg-[#101b17] border border-[#D9CBB4] dark:border-[#20362d] rounded-xl px-4 py-2 cursor-pointer hover:border-green-300 transition-colors dark:hover:border-[#9FE1CB]/45">
              <input type="checkbox" checked={inStockOnly} onChange={e => setInStockOnly(e.target.checked)}
                className="rounded accent-green-600" />
              <span className="text-sm text-gray-700 dark:text-gray-300">In stock only</span>
            </label>
          </div>

          {/* Results count */}
          <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-5">
            {productLoading ? 'Searching…' : (
              <><span className="font-semibold text-gray-900 dark:text-gray-100">{productTotal}</span> product{productTotal !== 1 ? 's' : ''}
              {query ? ` for "${query}"` : ''}</>
            )}
          </p>

          {/* Product grid */}
          {productLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length:6 }).map((_, i) => (
                <div key={i} className="bg-[#FFFDF8] dark:bg-gray-800 rounded-2xl border border-[#E7DDCA] dark:border-gray-700 dark:border-gray-700 overflow-hidden">
                  <div className="h-44 bg-gray-200 dark:bg-gray-600" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
                  <div className="p-4 space-y-2">
                    <div className="h-5 w-2/3 bg-gray-200 dark:bg-gray-600 rounded" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
                    <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-600 rounded" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
                  </div>
                </div>
              ))}
              <style dangerouslySetInnerHTML={{ __html:'@keyframes shimmer{0%,100%{opacity:1}50%{opacity:.4}}' }} />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-5xl mb-4">📦</div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">No products found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Try a different search term or remove filters</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(p => <ProductCard key={p.id} p={p} onOpen={setSelectedProduct} />)}
              </div>
              <div ref={productSentinelRef} className="h-10 flex items-center justify-center mt-8">
                {productLoadingMore && (
                  <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
                    <Loader2 size={16} className="animate-spin" style={{ color:'#1D9E75' }} />
                    Loading more products…
                  </div>
                )}
                {!productHasMore && products.length > 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">Showing all {productTotal} product{productTotal !== 1 ? 's' : ''}</p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Businesses tab content */}
      {activeTab === 'businesses' && (
      <>
      {/* Filter panel */}
      {showFilters && (
        <div className="bg-[#FFFDF8] dark:bg-[#101b17] rounded-2xl border border-[#E7DDCA] dark:border-[#20362d] p-5 mb-6 shadow-sm dark:shadow-black/20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Category</label>
              <div className="flex flex-wrap gap-1.5">
                {categories.map(c => (
                  <button key={c.id} onClick={() => setCat(cat === c.id ? '' : c.id)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors"
                    style={cat === c.id
                      ? { background:'#1D9E75', borderColor:'#1D9E75', color:'white' }
                      : { borderColor:'#E5E7EB', color:'#374151' }
                    }>
                    {c.icon} {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Country */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Country of origin</label>
              <select value={country} onChange={e => setCountry(e.target.value)}
                className="w-full border border-gray-200 dark:border-[#20362d] dark:bg-[#0c1713] dark:text-gray-100 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent">
                <option value="">All countries</option>
                {COUNTRIES.map(c => (
                  <option key={c} value={c}>{AFRICAN_FLAGS[c] ?? '🌍'} {c}</option>
                ))}
              </select>
            </div>

            {/* Price range */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                Price range {price && <span className="font-bold ml-1" style={{ color:'#1D9E75' }}>{price}</span>}
              </label>
              <input
                type="range" min={0} max={3}
                value={['','$','$$','$$$'].indexOf(price) === -1 ? 0 : ['','$','$$','$$$'].indexOf(price)}
                onChange={e => setPrice(['','$','$$','$$$'][Number(e.target.value)])}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ accentColor:'#1D9E75' }}
              />
              <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                <span>Any</span><span>$</span><span>$$</span><span>$$$</span>
              </div>
            </div>

            {/* Min rating + verified */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                  Min rating {minRating > 0 && <span className="font-bold ml-1" style={{ color:'#1D9E75' }}>{minRating}★+</span>}
                </label>
                <div className="flex gap-1">
                  {[0,3,4,5].map(r => (
                    <button key={r} onClick={() => setMinRating(minRating === r ? 0 : r)}
                      className="flex-1 py-1.5 rounded-lg text-xs border transition-colors"
                      style={minRating === r && r > 0
                        ? { background:'#1D9E75', borderColor:'#1D9E75', color:'white' }
                        : { borderColor:'#E5E7EB', color:'#374151' }
                      }>
                      {r === 0 ? 'Any' : `${r}★`}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={verified} onChange={e => setVerified(e.target.checked)}
                  className="rounded accent-green-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <BadgeCheck size={13} style={{ color:'#1D9E75' }} /> Verified only
                </span>
              </label>
            </div>
          </div>

          {activeFilters > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <span className="text-xs text-gray-400 dark:text-gray-500">{activeFilters} filter{activeFilters !== 1 ? 's' : ''} active</span>
              <button onClick={clearAll} className="text-xs font-medium hover:underline" style={{ color:'#1D9E75' }}>
                Clear all
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sort + results count */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
          {loading ? 'Searching…' : (
            <>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{total}</span>
              {' '}business{total !== 1 ? 'es' : ''}
              {cat     ? ` in ${categories.find(c => c.id === cat)?.name ?? cat}` : ''}
              {city    ? ` near ${city}`   : ''}
              {query   ? ` for "${query}"` : ''}
            </>
          )}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">Sort:</span>
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="text-sm border border-gray-200 dark:border-[#20362d] dark:bg-[#101b17] dark:text-gray-100 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:border-transparent cursor-pointer">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Results grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#FFFDF8] dark:bg-gray-800 rounded-2xl border border-[#E7DDCA] dark:border-gray-700 dark:border-gray-700 overflow-hidden">
              <div className="h-44 bg-gray-200 dark:bg-gray-600" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
              <div className="p-4 space-y-2">
                <div className="h-5 w-2/3 bg-gray-200 dark:bg-gray-600 rounded" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
                <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-600 rounded" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
                <div className="h-3 w-1/3 bg-gray-200 dark:bg-gray-600 rounded" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
              </div>
            </div>
          ))}
          <style dangerouslySetInnerHTML={{ __html:'@keyframes shimmer{0%,100%{opacity:1}50%{opacity:.4}}' }} />
        </div>
      ) : businesses.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">No businesses found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-6">
            Try a different search term, city, or remove some filters
          </p>
          {activeFilters > 0 && (
            <button onClick={clearAll}
              className="text-sm font-semibold text-white px-5 py-2.5 rounded-xl"
              style={{ background:'#1D9E75' }}>
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map(b => <BizCard key={b.id} b={b} />)}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-10 flex items-center justify-center mt-8">
            {loadingMore && (
              <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
                <Loader2 size={16} className="animate-spin" style={{ color:'#1D9E75' }} />
                Loading more businesses…
              </div>
            )}
            {!hasMore && businesses.length > 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Showing all {total} business{total !== 1 ? 'es' : ''}
              </p>
            )}
          </div>
        </>
      )}
      </>
      )}

      {/* Product detail modal — opens on product card click */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          businessName={selectedProduct.businesses?.name ?? 'this business'}
          businessPhone={selectedProduct.businesses?.phone ?? null}
          onClose={() => setSelectedProduct(null)}
        />
      )}
      </div>
    </div>
  )
}
