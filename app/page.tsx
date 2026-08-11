// app/page.tsx

import Image from 'next/image'
import Link from 'next/link'
import type { ElementType, ReactNode } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Camera,
  CheckCircle2,
  ChevronRight,
  Compass,
  Globe2,
  Map,
  MapPin,
  MessageCircle,
  Package,
  Search,
  Star,
  Store,
  Users,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/server'

import BusinessCard from '@/components/businesses/BusinessCard'
import CategoryGrid from '@/components/ui/CategoryGrid'
import CountriesBar from '@/components/ui/CountriesBar'
import HeroSlideshow from '@/components/ui/HeroSlideshow'
import ListBusinessButton from '@/components/ui/ListBusinessButton'
import RecentlyClaimedSection from '@/components/ui/RecentlyClaimedSection'

export const dynamic = 'force-dynamic'

type RelatedProfile =
  | {
      name: string | null
      avatar_url: string | null
    }
  | null

type RelatedBusiness =
  | {
      name: string
      city: string | null
    }
  | null

interface CommunityReview {
  id: string
  rating: number
  body: string | null
  created_at: string
  profiles: RelatedProfile | RelatedProfile[]
  businesses: RelatedBusiness | RelatedBusiness[]
}

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
  reviews: CommunityReview[]
  totalBusinesses: number
  totalUsers: number
  featuredError: boolean
  reviewsError: boolean
}

const BRAND = {
  dark: '#053528',
  primary: '#085041',
  green: '#1D9E75',
  mint: '#E1F5EE',
  softMint: '#F2FBF7',
  paleMint: '#F7FCFA',
}

const OWNER_BENEFITS: Array<{
  icon: ElementType
  title: string
  description: string
}> = [
  {
    icon: MapPin,
    title: 'Map visibility',
    description:
      'Help nearby customers discover your location and get directions.',
  },
  {
    icon: Camera,
    title: 'Photo gallery',
    description:
      'Show customers your products, services, atmosphere, and work.',
  },
  {
    icon: Star,
    title: 'Community reviews',
    description:
      'Build trust through feedback from real Markeetee customers.',
  },
  {
    icon: MessageCircle,
    title: 'Direct enquiries',
    description:
      'Let customers reach you by WhatsApp, phone, email, or your website.',
  },
  {
    icon: Package,
    title: 'Product showcase',
    description:
      'Display products, menu items, services, and prices on your profile.',
  },
  {
    icon: BarChart3,
    title: 'Business insights',
    description:
      'Understand profile views, saves, searches, calls, and enquiries.',
  },
]

const CUSTOMER_STEPS: Array<{
  step: string
  icon: ElementType
  title: string
  description: string
}> = [
  {
    step: '01',
    icon: Search,
    title: 'Search',
    description:
      'Search by business, category, product, city, state, or ZIP code.',
  },
  {
    step: '02',
    icon: Compass,
    title: 'Discover',
    description:
      'Compare listings, browse photos, read reviews, and explore the map.',
  },
  {
    step: '03',
    icon: MessageCircle,
    title: 'Connect',
    description:
      'Call, send a WhatsApp enquiry, visit the website, or get directions.',
  },
]

const OWNER_STEPS: Array<{
  step: string
  icon: ElementType
  title: string
  description: string
}> = [
  {
    step: '01',
    icon: Store,
    title: 'Create your listing',
    description:
      'Add your business name, category, contact details, and location.',
  },
  {
    step: '02',
    icon: Camera,
    title: 'Complete your profile',
    description:
      'Upload photos and add your products, services, menu, and opening hours.',
  },
  {
    step: '03',
    icon: Users,
    title: 'Reach customers',
    description:
      'Appear in search, category discovery, and map results across Markeetee.',
  },
]

const FAQ_ITEMS = [
  {
    question: 'Is Markeetee free to use?',
    answer:
      'Yes. Customers can browse, search, save businesses, and leave reviews for free. Business owners can also create a basic listing at no cost.',
  },
  {
    question: 'Where is Markeetee available?',
    answer:
      'Businesses from cities and towns throughout the United States can join Markeetee. Coverage grows as more businesses create and claim listings.',
  },
  {
    question: 'How do I list my business?',
    answer:
      'Select “List your business,” create a business-owner account, and add your business details. You can continue improving your profile from the dashboard.',
  },
  {
    question: 'How can customers contact my business?',
    answer:
      'Depending on the details you provide, customers can contact you through WhatsApp, phone, email, your website, or map directions.',
  },
]

export default async function HomePage() {
  const data = await getHomepageData()

  const statistics = createStatistics({
    totalBusinesses: data.totalBusinesses,
    totalUsers: data.totalUsers,
  })

  return (
    <main className="min-h-screen overflow-hidden bg-white dark:bg-gray-950">
      <HeroSlideshow />

      {statistics.length > 0 ? (
        <StatisticsSection statistics={statistics} />
      ) : null}

      <CountriesBar />

      <CategorySection />

      <FeaturedBusinessesSection
        businesses={data.featuredBusinesses}
        hasError={data.featuredError}
      />

      <RecentlyClaimedSection />

      <HowItWorksSection />

      {data.reviews.length > 0 || data.reviewsError ? (
        <CommunityReviewsSection
          reviews={data.reviews}
          hasError={data.reviewsError}
        />
      ) : null}

      <MapPromotionSection />

      <BusinessOwnerSection
        totalBusinesses={data.totalBusinesses}
      />

      <FaqPreviewSection />

      <FinalCallToAction />
    </main>
  )
}

async function getHomepageData(): Promise<HomepageData> {
  const supabase = await createClient()

  const [
    featuredResult,
    reviewsResult,
    businessCountResult,
    userCountResult,
  ] = await Promise.all([
    supabase
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
      .or(
        'featured.eq.true,plan.eq.storefront,plan.eq.premium',
      )
      .order('featured', {
        ascending: false,
      })
      .order('rating', {
        ascending: false,
        nullsFirst: false,
      })
      .limit(6),

    supabase
      .from('reviews')
      .select(`
        id,
        rating,
        body,
        created_at,
        profiles(name, avatar_url),
        businesses(name, city)
      `)
      .gte('rating', 4)
      .order('created_at', {
        ascending: false,
      })
      .limit(3),

    supabase
      .from('businesses')
      .select('id', {
        count: 'exact',
        head: true,
      }),

    supabase
      .from('profiles')
      .select('id', {
        count: 'exact',
        head: true,
      }),
  ])

  if (featuredResult.error) {
    console.error(
      '[homepage] Featured businesses query failed:',
      featuredResult.error,
    )
  }

  if (reviewsResult.error) {
    console.error(
      '[homepage] Community reviews query failed:',
      reviewsResult.error,
    )
  }

  if (businessCountResult.error) {
    console.error(
      '[homepage] Business count query failed:',
      businessCountResult.error,
    )
  }

  if (userCountResult.error) {
    console.error(
      '[homepage] User count query failed:',
      userCountResult.error,
    )
  }

  return {
    featuredBusinesses:
      (featuredResult.data as HomepageBusiness[] | null) ?? [],

    reviews:
      (reviewsResult.data as CommunityReview[] | null) ?? [],

    totalBusinesses: businessCountResult.count ?? 0,
    totalUsers: userCountResult.count ?? 0,

    featuredError: Boolean(featuredResult.error),
    reviewsError: Boolean(reviewsResult.error),
  }
}

function createStatistics({
  totalBusinesses,
  totalUsers,
}: {
  totalBusinesses: number
  totalUsers: number
}) {
  const statistics: Array<{
    value: string
    label: string
  }> = []

  if (totalBusinesses > 0) {
    statistics.push({
      value: totalBusinesses.toLocaleString('en-US'),
      label:
        totalBusinesses === 1
          ? 'African business'
          : 'African businesses',
    })
  }

  if (totalUsers > 0) {
    statistics.push({
      value: totalUsers.toLocaleString('en-US'),
      label:
        totalUsers === 1
          ? 'Community member'
          : 'Community members',
    })
  }

  statistics.push(
    {
      value: '54',
      label: 'African countries represented',
    },
    {
      value: 'Free',
      label: 'To discover and browse',
    },
  )

  return statistics
}

function StatisticsSection({
  statistics,
}: {
  statistics: Array<{
    value: string
    label: string
  }>
}) {
  return (
    <section
      aria-label="Markeetee community statistics"
      className="-mt-px border-y border-white/5"
      style={{
        backgroundColor: BRAND.dark,
      }}
    >
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-8 px-4 py-9 sm:px-6 md:grid-cols-4 md:py-11">
        {statistics.map((statistic) => (
          <div
            key={statistic.label}
            className="relative text-center"
          >
            <p className="text-2xl font-extrabold tracking-tight text-[#9FE1CB] sm:text-3xl">
              {statistic.value}
            </p>

            <p className="mt-1.5 px-2 text-xs leading-5 text-emerald-50/65 sm:text-sm">
              {statistic.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

function CategorySection() {
  return (
    <PageSection>
      <SectionHeader
        eyebrow="Explore Markeetee"
        title="Browse by category"
        description="Find food, fashion, beauty, culture, services, and more from African-owned businesses."
        action={
          <SectionLink
            href="/search"
            label="View all businesses"
          />
        }
      />

      <CategoryGrid />

      <div className="mt-7 text-center sm:hidden">
        <SectionLink
          href="/search"
          label="View all businesses"
        />
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
    <PageSection
      className="border-y border-gray-100 bg-[#F8FAF9] dark:border-gray-800 dark:bg-gray-900/50"
    >
      <SectionHeader
        eyebrow="Community favorites"
        title="Featured businesses"
        description="Explore standout businesses and highly rated places from across the Markeetee community."
        action={
          <SectionLink
            href="/search?sort=featured"
            label="Browse all"
          />
        }
      />

      {hasError ? (
        <SectionError
          title="Featured businesses are temporarily unavailable"
          description="You can still explore all public listings through Markeetee search."
          href="/search"
          linkLabel="Open business search"
        />
      ) : businesses.length === 0 ? (
        <FeaturedEmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {businesses.map((business) => (
            <BusinessCard
              key={business.id}
              business={business}
            />
          ))}
        </div>
      )}

      {businesses.length > 0 ? (
        <div className="mt-9 text-center">
          <Link
            href="/search"
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 px-6 py-3 text-sm font-bold transition hover:-translate-y-0.5 hover:shadow-md"
            style={{
              borderColor: BRAND.green,
              color: BRAND.green,
            }}
          >
            Browse all businesses
            <ArrowRight size={16} />
          </Link>
        </div>
      ) : null}
    </PageSection>
  )
}

function FeaturedEmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center dark:border-gray-700 dark:bg-gray-900">
      <div
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{
          backgroundColor: BRAND.mint,
        }}
      >
        <Store
          size={28}
          style={{
            color: BRAND.primary,
          }}
        />
      </div>

      <h3 className="mt-5 text-lg font-extrabold text-gray-950 dark:text-white">
        Featured businesses are coming
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
        Create a Markeetee listing and complete your business
        profile to become eligible for community discovery.
      </p>

      <ListBusinessButton
        className="mt-6 inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold text-white"
        style={{
          backgroundColor: BRAND.green,
        }}
      />
    </div>
  )
}

function HowItWorksSection() {
  return (
    <PageSection>
      <SectionHeader
        centered
        eyebrow="Simple to get started"
        title="How Markeetee works"
        description="An easier way for customers to discover businesses and for owners to become more visible."
      />

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
        <HowItWorksCard
          type="customer"
          title="For customers"
          description="Find and support businesses connected to the African community."
          steps={CUSTOMER_STEPS}
          action={
            <Link
              href="/search"
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white transition hover:opacity-95"
              style={{
                backgroundColor: BRAND.green,
              }}
            >
              Start exploring
              <ArrowRight size={16} />
            </Link>
          }
        />

        <HowItWorksCard
          type="owner"
          title="For business owners"
          description="Create a strong business presence customers can discover and trust."
          steps={OWNER_STEPS}
          action={
            <ListBusinessButton
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white transition hover:opacity-95"
              style={{
                backgroundColor: BRAND.primary,
              }}
            />
          }
        />
      </div>
    </PageSection>
  )
}

function HowItWorksCard({
  type,
  title,
  description,
  steps,
  action,
}: {
  type: 'customer' | 'owner'
  title: string
  description: string
  steps: Array<{
    step: string
    icon: ElementType
    title: string
    description: string
  }>
  action: ReactNode
}) {
  const customer = type === 'customer'

  return (
    <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
      <div className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
          style={{
            backgroundColor: customer
              ? BRAND.green
              : BRAND.primary,
          }}
        >
          {customer ? (
            <Users size={21} />
          ) : (
            <Store size={21} />
          )}
        </div>

        <div>
          <h3 className="text-xl font-extrabold text-gray-950 dark:text-white">
            {title}
          </h3>

          <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {steps.map((step) => {
          const Icon = step.icon

          return (
            <div
              key={step.step}
              className="flex items-start gap-4"
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: customer
                    ? BRAND.mint
                    : '#C5EBDD',
                  color: customer
                    ? BRAND.green
                    : BRAND.primary,
                }}
              >
                <Icon size={19} />
              </div>

              <div>
                <p
                  className="text-[11px] font-extrabold uppercase tracking-[0.1em]"
                  style={{
                    color: customer
                      ? BRAND.green
                      : BRAND.primary,
                  }}
                >
                  Step {step.step}
                </p>

                <p className="mt-1 font-bold text-gray-950 dark:text-white">
                  {step.title}
                </p>

                <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  {step.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {action}
    </article>
  )
}

function CommunityReviewsSection({
  reviews,
  hasError,
}: {
  reviews: CommunityReview[]
  hasError: boolean
}) {
  return (
    <PageSection
      className="border-y border-gray-100 bg-[#F8FAF9] dark:border-gray-800 dark:bg-gray-900/50"
    >
      <SectionHeader
        centered
        eyebrow="Community voices"
        title="What customers are saying"
        description="Recent feedback shared by people supporting businesses through Markeetee."
      />

      {hasError ? (
        <SectionError
          title="Reviews are temporarily unavailable"
          description="Browse Markeetee to discover businesses and read reviews directly on their profiles."
          href="/search"
          linkLabel="Explore businesses"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
              />
            ))}
          </div>

          <div className="mt-9 text-center">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 text-sm font-bold transition hover:opacity-75"
              style={{
                color: BRAND.green,
              }}
            >
              Find a business to review
              <ChevronRight size={16} />
            </Link>
          </div>
        </>
      )}
    </PageSection>
  )
}

function ReviewCard({
  review,
}: {
  review: CommunityReview
}) {
  const profile = unwrapRelation(review.profiles)
  const business = unwrapRelation(review.businesses)

  const reviewerName =
    profile?.name?.trim() || 'A Markeetee customer'

  const reviewerInitial =
    reviewerName.charAt(0).toUpperCase() || 'M'

  const safeRating = Math.max(
    0,
    Math.min(5, Math.round(review.rating || 0)),
  )

  const reviewText = review.body?.trim() || 'Great experience.'

  return (
    <article className="flex h-full flex-col rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div
        className="mb-4 flex gap-1"
        aria-label={`${safeRating} out of 5 stars`}
      >
        {Array.from({
          length: 5,
        }).map((_, index) => (
          <Star
            key={index}
            size={15}
            className={
              index < safeRating
                ? 'fill-amber-400 text-amber-400'
                : 'text-gray-200 dark:text-gray-700'
            }
          />
        ))}
      </div>

      <blockquote className="flex-1 text-sm leading-7 text-gray-700 dark:text-gray-300">
        “
        {reviewText.length > 180
          ? `${reviewText.slice(0, 180).trim()}…`
          : reviewText}
        ”
      </blockquote>

      <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
        {profile?.avatar_url ? (
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
            <Image
              src={profile.avatar_url}
              alt={reviewerName}
              fill
              sizes="40px"
              className="object-cover"
            />
          </div>
        ) : (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white"
            style={{
              backgroundColor: BRAND.primary,
            }}
          >
            {reviewerInitial}
          </div>
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-gray-950 dark:text-white">
            {reviewerName}
          </p>

          {business?.name ? (
            <p className="mt-0.5 truncate text-xs text-gray-400">
              Reviewed {business.name}
              {business.city ? ` · ${business.city}` : ''}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-gray-400">
              Markeetee community member
            </p>
          )}
        </div>
      </div>
    </article>
  )
}

function MapPromotionSection() {
  const mapPins = [
    {
      top: '18%',
      left: '27%',
      size: 'large',
      icon: '🍲',
    },
    {
      top: '47%',
      left: '68%',
      size: 'medium',
      icon: '💆🏾',
    },
    {
      top: '72%',
      left: '24%',
      size: 'small',
      icon: '👗',
    },
    {
      top: '19%',
      left: '76%',
      size: 'small',
      icon: '🛠️',
    },
  ] as const

  return (
    <PageSection>
      <div
        className="relative overflow-hidden rounded-[2rem] border border-emerald-100"
        style={{
          background:
            'linear-gradient(135deg, #F2FBF7 0%, #D6F1E7 100%)',
        }}
      >
        <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-white/45" />

        <div className="relative grid gap-10 px-7 py-10 sm:px-10 md:grid-cols-[1fr_320px] md:items-center md:px-14 md:py-14">
          <div className="text-center md:text-left">
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold"
              style={{
                backgroundColor: '#FFFFFF',
                color: BRAND.primary,
              }}
            >
              <Map size={14} />
              Interactive discovery
            </span>

            <h2
              className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl"
              style={{
                color: BRAND.dark,
              }}
            >
              Explore businesses on the map
            </h2>

            <p
              className="mt-4 max-w-xl text-sm leading-7 sm:text-base"
              style={{
                color: BRAND.primary,
              }}
            >
              Browse businesses by location, filter by category,
              and find nearby stores, restaurants, salons, and
              services.
            </p>

            <Link
              href="/map"
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:opacity-95"
              style={{
                backgroundColor: BRAND.primary,
              }}
            >
              <MapPin size={17} />
              Open map view
            </Link>
          </div>

          <div
            aria-hidden="true"
            className="relative mx-auto hidden h-64 w-72 md:block"
          >
            <div className="absolute inset-0 rounded-[2rem] border border-white/70 bg-white/35 shadow-inner backdrop-blur-sm" />

            <div className="absolute left-8 top-10 h-px w-52 rotate-12 bg-[#9FDCC3]" />
            <div className="absolute left-8 top-32 h-px w-52 -rotate-12 bg-[#9FDCC3]" />
            <div className="absolute left-28 top-6 h-52 w-px rotate-12 bg-[#9FDCC3]" />

            {mapPins.map((pin, index) => {
              const dimension =
                pin.size === 'large'
                  ? 48
                  : pin.size === 'medium'
                    ? 40
                    : 32

              return (
                <div
                  key={index}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{
                    top: pin.top,
                    left: pin.left,
                  }}
                >
                  <div
                    className="flex items-center justify-center rounded-full border-4 border-white text-base shadow-xl"
                    style={{
                      width: dimension,
                      height: dimension,
                      backgroundColor: BRAND.primary,
                    }}
                  >
                    {pin.icon}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </PageSection>
  )
}

function BusinessOwnerSection({
  totalBusinesses,
}: {
  totalBusinesses: number
}) {
  return (
    <section
      className="relative overflow-hidden px-4 py-20 text-white sm:px-6"
      style={{
        background:
          'linear-gradient(135deg, #053528 0%, #085041 65%, #1D9E75 100%)',
      }}
    >
      <div className="absolute -right-40 -top-48 h-[500px] w-[500px] rounded-full bg-white/5" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-[#9FE1CB]">
            <Store size={14} />
            For African business owners
          </span>

          <h2 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Get discovered by customers looking for what you offer.
          </h2>

          <p className="mt-5 max-w-2xl text-base leading-8 text-emerald-50/75 sm:text-lg">
            Create your Markeetee business profile, showcase your
            services and products, and give customers an easier way
            to contact and visit you.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ListBusinessButton
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold transition hover:-translate-y-0.5"
              style={{
                color: BRAND.primary,
              }}
            />

            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-bold text-[#C5EBDD] transition hover:bg-white/10"
            >
              See how it works
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-9 flex flex-wrap gap-x-8 gap-y-5 border-t border-white/15 pt-8">
            {totalBusinesses > 0 ? (
              <OwnerStatistic
                value={totalBusinesses.toLocaleString('en-US')}
                label="Businesses listed"
              />
            ) : null}

            <OwnerStatistic
              value="Free"
              label="Basic listing"
            />

            <OwnerStatistic
              value="Minutes"
              label="To get started"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {OWNER_BENEFITS.map((benefit) => {
            const Icon = benefit.icon

            return (
              <article
                key={benefit.title}
                className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm transition hover:bg-white/10"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#9FE1CB]">
                  <Icon size={19} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">
                    {benefit.title}
                  </h3>

                  <p className="mt-1.5 text-xs leading-5 text-emerald-50/60">
                    {benefit.description}
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function OwnerStatistic({
  value,
  label,
}: {
  value: string
  label: string
}) {
  return (
    <div>
      <p className="text-xl font-extrabold text-white sm:text-2xl">
        {value}
      </p>

      <p className="mt-1 text-xs text-[#9FE1CB]">
        {label}
      </p>
    </div>
  )
}

function FaqPreviewSection() {
  return (
    <PageSection className="max-w-4xl">
      <SectionHeader
        centered
        eyebrow="Questions and answers"
        title="Common questions"
        description="Helpful information for customers and business owners getting started with Markeetee."
      />

      <div className="grid gap-4">
        {FAQ_ITEMS.map((item) => (
          <article
            key={item.question}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2
                size={19}
                className="mt-0.5 shrink-0"
                style={{
                  color: BRAND.green,
                }}
              />

              <div>
                <h3 className="font-bold text-gray-950 dark:text-white">
                  {item.question}
                </h3>

                <p className="mt-2 text-sm leading-7 text-gray-600 dark:text-gray-400">
                  {item.answer}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-7 text-center">
        <Link
          href="/faq"
          className="inline-flex items-center gap-2 text-sm font-bold transition hover:opacity-75"
          style={{
            color: BRAND.green,
          }}
        >
          View all frequently asked questions
          <ChevronRight size={16} />
        </Link>
      </div>
    </PageSection>
  )
}

function FinalCallToAction() {
  return (
    <section className="px-4 pb-20 sm:px-6">
      <div
        className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] px-6 py-12 text-center sm:px-12 sm:py-16"
        style={{
          background:
            'linear-gradient(135deg, #E1F5EE 0%, #C5EBDD 100%)',
        }}
      >
        <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-white/35" />

        <div className="relative">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/65"
            style={{
              color: BRAND.primary,
            }}
          >
            <Globe2 size={29} />
          </div>

          <h2
            className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl"
            style={{
              color: BRAND.dark,
            }}
          >
            Discover more of your community
          </h2>

          <p
            className="mx-auto mt-4 max-w-2xl text-sm leading-7 sm:text-base"
            style={{
              color: BRAND.primary,
            }}
          >
            Explore restaurants, grocery stores, fashion, beauty,
            wellness, professional services, and more through
            Markeetee.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:opacity-95"
              style={{
                backgroundColor: BRAND.green,
              }}
            >
              Explore businesses
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/map"
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 bg-white/30 px-6 py-3.5 text-sm font-bold transition hover:bg-white/50"
              style={{
                borderColor: BRAND.green,
                color: BRAND.primary,
              }}
            >
              <MapPin size={16} />
              View the map
            </Link>
          </div>
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

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  centered = false,
}: {
  eyebrow?: string
  title: string
  description: string
  action?: ReactNode
  centered?: boolean
}) {
  return (
    <div
      className={`mb-9 gap-6 ${
        centered
          ? 'mx-auto max-w-3xl text-center'
          : 'flex items-end justify-between'
      }`}
    >
      <div>
        {eyebrow ? (
          <p
            className="text-xs font-extrabold uppercase tracking-[0.13em]"
            style={{
              color: BRAND.green,
            }}
          >
            {eyebrow}
          </p>
        ) : null}

        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-950 dark:text-white sm:text-4xl">
          {title}
        </h2>

        <p
          className={`mt-3 text-sm leading-7 text-gray-500 dark:text-gray-400 sm:text-base ${
            centered ? 'mx-auto max-w-2xl' : 'max-w-2xl'
          }`}
        >
          {description}
        </p>
      </div>

      {!centered && action ? (
        <div className="hidden shrink-0 sm:block">
          {action}
        </div>
      ) : null}
    </div>
  )
}

function SectionLink({
  href,
  label,
}: {
  href: string
  label: string
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-sm font-bold transition hover:gap-3 hover:opacity-80"
      style={{
        color: BRAND.green,
      }}
    >
      {label}
      <ArrowRight size={15} />
    </Link>
  )
}

function SectionError({
  title,
  description,
  href,
  linkLabel,
}: {
  title: string
  description: string
  href: string
  linkLabel: string
}) {
  return (
    <div className="rounded-3xl border border-amber-200 bg-amber-50 px-6 py-12 text-center">
      <h3 className="text-lg font-extrabold text-amber-950">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-amber-800">
        {description}
      </p>

      <Link
        href={href}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-900 px-5 py-3 text-sm font-bold text-white"
      >
        {linkLabel}
        <ArrowRight size={15} />
      </Link>
    </div>
  )
}

function unwrapRelation<T>(
  value: T | T[] | null,
): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value
}