import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  ArrowRight,
  Building2,
  Map,
  MapPin,
  Search,
  Sparkles,
  Store,
  Utensils,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import BusinessCard from '@/components/businesses/BusinessCard'
import ListBusinessButton from '@/components/ui/ListBusinessButton'

export const dynamic = 'force-dynamic'

interface HomepageBusiness {
  id: string
  name: string
  category: string | null
  subcategory: string | null
  address: string | null
  city: string | null
  state: string | null
  cover_image: string | null
  rating: number | null
  review_count: number | null
  price_range: string | null
  tags: string[] | null
  lat: number | null
  lng: number | null
  verified: boolean | null
  premium: boolean | null
  featured: boolean | null
  country: string | null
}

interface HomepageData {
  featuredBusinesses: HomepageBusiness[]
  featuredError: boolean
}

const CATEGORIES = [
  {
    id: 'restaurant',
    name: 'Restaurants',
    description: 'Meals, bakeries, cafes, and catering',
    image: '/images/categories/restaurants.jpeg',
  },
  {
    id: 'food',
    name: 'Groceries',
    description: 'Markets, spices, ingredients, and pantry staples',
    image: '/images/categories/food.jpeg',
  },
  {
    id: 'beauty',
    name: 'Beauty & Hair',
    description: 'Salons, braiders, barbers, and beauty services',
    image: '/images/categories/beauty.jpeg',
  },
  {
    id: 'fashion',
    name: 'Fashion',
    description: 'Tailors, fabric, jewelry, and clothing',
    image: '/images/categories/fashion.jpeg',
  },
  {
    id: 'herbs',
    name: 'Herbs & Wellness',
    description: 'Wellness shops, natural care, and herbs',
    image: '/images/categories/wellness.jpeg',
  },
  {
    id: 'services',
    name: 'Services',
    description: 'Local professionals and community services',
    image: '/images/categories/services.jpeg',
  },
]

export default async function HomePage() {
  const data = await getHomepageData()

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FBF7EF] text-gray-950 dark:bg-[#07130f] dark:text-[#edf7f2]">
      <HeroSection />

      <CategoryShortcuts />

      <FeaturedBusinessesSection
        businesses={data.featuredBusinesses}
        hasError={data.featuredError}
      />

      <MapDiscoverySection />

      <BusinessOwnerSection />
    </main>
  )
}

async function getHomepageData(): Promise<HomepageData> {
  const supabase = await createClient()

  const featuredResult = await supabase
    .from('businesses')
    .select(`
      id,
      name,
      category,
      subcategory,
      address,
      city,
      state,
      cover_image,
      rating,
      review_count,
      price_range,
      tags,
      lat,
      lng,
      verified,
      premium,
      featured,
      country
    `)
    .or('featured.eq.true,plan.eq.storefront,plan.eq.premium')
    .order('featured', { ascending: false })
    .order('rating', { ascending: false, nullsFirst: false })
    .limit(6)

  if (featuredResult.error) {
    console.error(
      '[homepage] Featured businesses query failed:',
      featuredResult.error,
    )
  }

  return {
    featuredBusinesses:
      (featuredResult.data as HomepageBusiness[] | null) ?? [],
    featuredError: Boolean(featuredResult.error),
  }
}

function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden border-b border-[#E7DDCA] bg-[#FBF7EF] dark:border-[#20362d] dark:bg-[#07130f]">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl grid-cols-1 gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-14">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DCCFB8] bg-white/75 px-3 py-1.5 text-xs font-bold text-[#085041] shadow-sm dark:border-[#294239] dark:bg-[#10231d]/85 dark:text-[#9FE1CB]">
            <Sparkles size={14} aria-hidden="true" />
            Discover African-owned businesses across the U.S.
          </div>

          <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.96] tracking-tight text-[#053528] dark:text-[#f4faf7] sm:text-6xl lg:text-7xl">
            Africa is here. Find it.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-[#31594E] dark:text-[#b8cec5] sm:text-lg">
            Markeetee helps you discover African-owned restaurants,
            groceries, beauty services, fashion, wellness, and local
            services across the United States.
          </p>

          <SearchPanel />

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-[#45675E] dark:text-[#9fb5ac]">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 font-bold text-[#085041] underline-offset-4 hover:underline dark:text-[#9FE1CB]"
            >
              Browse all businesses
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <Link
              href="/map"
              className="inline-flex items-center gap-2 font-bold text-[#085041] underline-offset-4 hover:underline dark:text-[#9FE1CB]"
            >
              Explore the map
              <MapPin size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="relative min-h-[460px] lg:min-h-[620px]">
          <div className="absolute left-0 top-6 h-[72%] w-[58%] overflow-hidden rounded-[1.75rem] border-8 border-white bg-white shadow-2xl shadow-[#085041]/10 dark:border-[#172a23] dark:bg-[#101b17] dark:shadow-black/35">
            <Image
              src="/images/slideshow/slideshow1.jpeg"
              alt="African food and market goods"
              fill
              priority
              sizes="(max-width: 1024px) 60vw, 360px"
              className="object-cover"
            />
          </div>

          <div className="absolute right-0 top-0 h-[48%] w-[52%] overflow-hidden rounded-[1.5rem] border-8 border-white bg-white shadow-xl shadow-[#085041]/10 dark:border-[#172a23] dark:bg-[#101b17] dark:shadow-black/35">
            <Image
              src="/images/categories/fashion.jpeg"
              alt="African fashion and fabric"
              fill
              priority
              sizes="(max-width: 1024px) 50vw, 320px"
              className="object-cover"
            />
          </div>

          <div className="absolute bottom-4 right-4 h-[43%] w-[58%] overflow-hidden rounded-[1.5rem] border-8 border-white bg-white shadow-xl shadow-[#085041]/10 dark:border-[#172a23] dark:bg-[#101b17] dark:shadow-black/35">
            <Image
              src="/images/categories/beauty.jpeg"
              alt="African beauty and hair services"
              fill
              sizes="(max-width: 1024px) 58vw, 350px"
              className="object-cover"
            />
          </div>

          <div className="absolute bottom-0 left-5 max-w-[250px] rounded-2xl border border-[#D9CBB4] bg-white/95 p-4 shadow-xl backdrop-blur dark:border-[#294239] dark:bg-[#10231d]/95">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E1F5EE] text-[#085041] dark:bg-[#17382f] dark:text-[#9FE1CB]">
                <Store size={20} aria-hidden="true" />
              </span>
              <p className="text-sm font-bold leading-5 text-[#053528] dark:text-[#edf7f2]">
                Restaurants, markets, salons, shops, and services in one place.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function SearchPanel() {
  return (
    <form
      action="/search"
      method="GET"
      role="search"
      className="mt-8 rounded-[1.5rem] border border-[#E0D4C0] bg-white p-3 shadow-xl shadow-[#085041]/10 dark:border-[#294239] dark:bg-[#101b17] dark:shadow-black/30"
    >
      <div className="grid gap-3 lg:grid-cols-[1fr_0.74fr_0.74fr_auto]">
        <label className="group flex min-h-16 items-center gap-3 rounded-2xl bg-[#F8F2E8] px-4 focus-within:ring-2 focus-within:ring-[#085041] dark:bg-[#0c1713]">
          <Search
            size={20}
            className="shrink-0 text-[#085041]"
            aria-hidden="true"
          />
          <span className="sr-only">Business name or category</span>
          <input
            name="q"
            type="search"
            placeholder="Search food, fashion, salons..."
            className="w-full bg-transparent text-base font-semibold text-[#153B32] placeholder:text-[#7A8C86] focus:outline-none"
          />
        </label>

        <label className="group flex min-h-16 items-center gap-3 rounded-2xl bg-[#F8F2E8] px-4 focus-within:ring-2 focus-within:ring-[#085041] dark:bg-[#0c1713]">
          <Store
            size={20}
            className="shrink-0 text-[#085041]"
            aria-hidden="true"
          />
          <span className="sr-only">Category</span>
          <select
            name="category"
            defaultValue=""
            className="w-full bg-transparent text-base font-semibold text-[#153B32] focus:outline-none"
          >
            <option value="">Any category</option>
            {CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="group flex min-h-16 items-center gap-3 rounded-2xl bg-[#F8F2E8] px-4 focus-within:ring-2 focus-within:ring-[#085041] dark:bg-[#0c1713]">
          <MapPin
            size={20}
            className="shrink-0 text-[#085041]"
            aria-hidden="true"
          />
          <span className="sr-only">Location</span>
          <input
            name="city"
            type="search"
            placeholder="City, state, or ZIP"
            className="w-full bg-transparent text-base font-semibold text-[#153B32] placeholder:text-[#7A8C86] focus:outline-none"
          />
        </label>

        <button
          type="submit"
          className="inline-flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-[#085041] px-7 text-base font-bold text-white transition hover:bg-[#053528] focus:outline-none focus:ring-2 focus:ring-[#085041] focus:ring-offset-2"
        >
          Search
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
    </form>
  )
}

function CategoryShortcuts() {
  return (
    <PageSection className="bg-[#FBF7EF] dark:bg-[#07130f]">
      <SectionHeading
        eyebrow="Browse by need"
        title="Start with a category"
        description="Use the same categories that power Markeetee search."
        action={
          <Link
            href="/search"
            className="hidden text-sm font-bold text-[#085041] underline-offset-4 hover:underline dark:text-[#9FE1CB] sm:inline-flex"
          >
            View all businesses
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((category) => (
          <Link
            key={category.id}
            href={`/search?category=${category.id}`}
            className="group relative min-h-[210px] overflow-hidden rounded-2xl bg-[#085041] shadow-sm outline-none transition focus:ring-2 focus:ring-[#085041] focus:ring-offset-2 focus:ring-offset-[#FBF7EF] dark:shadow-black/25 dark:focus:ring-offset-[#07130f] sm:min-h-[230px]"
          >
            <Image
              src={category.image}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-[#052F26]/55" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <h3 className="text-2xl font-black tracking-tight">
                {category.name}
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-white/82">
                {category.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </PageSection>
  )
}

function FeaturedBusinessesSection({
  businesses,
  hasError,
}: {
  businesses: HomepageBusiness[]
  hasError: boolean
}) {
  return (
    <PageSection className="border-y border-[#E7DDCA] bg-[#F8F2E8] dark:border-[#20362d] dark:bg-[#0b1512]">
      <SectionHeading
        eyebrow="Featured on Markeetee"
        title="Discover places people can actually visit"
        description="These listings come from the current Markeetee directory. Each card links to the live business profile."
        action={
          <Link
            href="/search?sort=featured"
            className="hidden text-sm font-bold text-[#085041] underline-offset-4 hover:underline dark:text-[#9FE1CB] sm:inline-flex"
          >
            Browse featured
          </Link>
        }
      />

      {hasError ? (
        <Notice
          title="Featured businesses are temporarily unavailable"
          description="You can still use search to browse the directory."
          href="/search"
          label="Open search"
        />
      ) : businesses.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {businesses.map((business) => (
            <BusinessCard
              key={business.id}
              business={business}
            />
          ))}
        </div>
      ) : (
        <Notice
          title="No featured businesses yet"
          description="Browse all current listings, or add a business so customers can discover it."
          href="/search"
          label="Browse all businesses"
        />
      )}
    </PageSection>
  )
}

function MapDiscoverySection() {
  return (
    <PageSection className="bg-[#F6EFE3] dark:bg-[#08120f]">
      <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#B76E4B] dark:text-[#E3A57F]">
            Map discovery
          </p>
          <h2 className="mt-3 max-w-xl text-4xl font-black tracking-tight text-[#053528] dark:text-[#f4faf7] sm:text-5xl">
            Find African-owned businesses by place, not just name.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-8 text-[#4C625B] dark:text-[#b8cec5]">
            Open the map to browse nearby restaurants, stores,
            salons, fashion shops, and services with a location-first
            view.
          </p>
          <Link
            href="/map"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#085041] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#053528] focus:outline-none focus:ring-2 focus:ring-[#085041] focus:ring-offset-2 focus:ring-offset-[#F6EFE3]"
          >
            <Map size={17} aria-hidden="true" />
            Open map view
          </Link>
        </div>

        <Link
          href="/map"
          aria-label="Open Markeetee map view"
          className="group relative block min-h-[360px] overflow-hidden rounded-[2rem] border border-[#D9CBB4] bg-[#E6F0EA] shadow-xl shadow-[#085041]/10 outline-none focus:ring-2 focus:ring-[#085041] focus:ring-offset-2 focus:ring-offset-[#F6EFE3] dark:border-[#294239] dark:bg-[#10231d] dark:shadow-black/30 dark:focus:ring-offset-[#08120f]"
        >
          <div className="absolute inset-0 map-bg" />
          <div className="absolute inset-8 rounded-[1.5rem] border border-white/70 bg-white/35 dark:border-[#9FE1CB]/15 dark:bg-black/15" />
          <MapPinBubble className="left-[24%] top-[27%]" label="Groceries" />
          <MapPinBubble className="left-[66%] top-[34%]" label="Beauty" />
          <MapPinBubble className="left-[42%] top-[68%]" label="Food" />
          <MapPinBubble className="left-[76%] top-[72%]" label="Fashion" />
          <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-white/95 p-4 shadow-lg dark:bg-[#101b17]/95">
            <p className="text-sm font-black text-[#053528] dark:text-[#edf7f2]">
              Browse by city, category, and proximity.
            </p>
            <p className="mt-1 text-xs leading-5 text-[#5D716B] dark:text-[#9fb5ac]">
              This links to Markeetee&apos;s existing interactive map.
            </p>
          </div>
        </Link>
      </div>
    </PageSection>
  )
}

function MapPinBubble({
  className,
  label,
}: {
  className: string
  label: string
}) {
  return (
    <div
      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-[#085041] px-4 py-2 text-xs font-black text-white shadow-xl ${className}`}
    >
      {label}
    </div>
  )
}

function BusinessOwnerSection() {
  return (
    <section className="bg-[#053528] px-4 py-16 text-white dark:bg-[#06120e] sm:px-6 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-[#C5EBDD]">
            <Building2 size={14} aria-hidden="true" />
            For business owners
          </p>
          <h2 className="mt-5 max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">
            List your business for free.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/72">
            Add your business profile so customers can find your
            location, understand what you offer, and contact you from
            Markeetee.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ListBusinessButton
              className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3.5 text-sm font-black text-[#085041] transition hover:bg-[#E1F5EE] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#053528]"
            >
              List your business for free
            </ListBusinessButton>
            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center rounded-2xl border border-white/25 px-6 py-3.5 text-sm font-black text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#053528]"
            >
              How it works
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            'Create a searchable profile',
            'Add location and contact details',
            'Show photos, products, or services',
            'Manage your listing from the dashboard',
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-white/10 bg-white/[0.07] p-5"
            >
              <Utensils
                size={18}
                className="text-[#9FE1CB]"
                aria-hidden="true"
              />
              <p className="mt-4 text-sm font-bold leading-6 text-white">
                {item}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PageSection({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`px-4 py-16 sm:px-6 sm:py-20 ${className}`}>
      <div className="mx-auto max-w-7xl">
        {children}
      </div>
    </section>
  )
}

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#B76E4B] dark:text-[#E3A57F]">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-[#053528] dark:text-[#f4faf7] sm:text-5xl">
          {title}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-8 text-[#536A63] dark:text-[#b8cec5]">
          {description}
        </p>
      </div>
      {action}
    </div>
  )
}

function Notice({
  title,
  description,
  href,
  label,
}: {
  title: string
  description: string
  href: string
  label: string
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[#D6C7AD] bg-[#FBF7EF] px-6 py-12 text-center dark:border-[#294239] dark:bg-[#101b17]">
      <Store
        size={28}
        className="mx-auto text-[#085041] dark:text-[#9FE1CB]"
        aria-hidden="true"
      />
      <h3 className="mt-4 text-xl font-black text-[#053528] dark:text-[#edf7f2]">
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#5B716A] dark:text-[#9fb5ac]">
        {description}
      </p>
      <Link
        href={href}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#085041] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#053528]"
      >
        {label}
        <ArrowRight size={15} aria-hidden="true" />
      </Link>
    </div>
  )
}
