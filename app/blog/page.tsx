// app/blog/page.tsx

import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  ArrowRight,
  BookOpen,
  Building2,
  CalendarDays,
  Clock3,
  MapPin,
  Newspaper,
  Search,
  Sparkles,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'African Business Guides, Stories & News | Markeetee',
  description:
    'Explore city guides, African business spotlights, diaspora stories, and community news from Markeetee.',
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: 'Markeetee Blog — African Business Guides and Stories',
    description:
      'Discover African restaurants, grocery stores, beauty businesses, fashion brands, services, and community stories across the United States.',
    url: '/blog',
    type: 'website',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'Markeetee African business guides and stories',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Markeetee Blog — African Business Guides and Stories',
    description:
      'Explore African-owned businesses, city guides, diaspora stories, and community news.',
    images: ['/og-default.png'],
  },
}

type BlogCategory =
  | 'guides'
  | 'spotlights'
  | 'stories'
  | 'news'

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  cover_image: string | null
  category: BlogCategory | null
  city: string | null
  read_time: number | null
  author: string | null
  published_at: string | null
  featured: boolean | null
}

interface BlogPageProps {
  searchParams: Promise<{
    category?: string
  }>
}

const CATEGORIES = [
  {
    id: 'all',
    label: 'All stories',
    icon: BookOpen,
  },
  {
    id: 'guides',
    label: 'City guides',
    icon: MapPin,
  },
  {
    id: 'spotlights',
    label: 'Business spotlights',
    icon: Building2,
  },
  {
    id: 'stories',
    label: 'Diaspora stories',
    icon: Sparkles,
  },
  {
    id: 'news',
    label: 'News',
    icon: Newspaper,
  },
] as const

const VALID_CATEGORIES = new Set(
  CATEGORIES
    .filter((category) => category.id !== 'all')
    .map((category) => category.id),
)

const BRAND = {
  dark: '#053528',
  primary: '#085041',
  green: '#1D9E75',
  mint: '#E1F5EE',
  lightMint: '#F4FBF8',
}

export default async function BlogPage({
  searchParams,
}: BlogPageProps) {
  const params = await searchParams

  const requestedCategory = params.category?.toLowerCase()

  const activeCategory =
    requestedCategory && VALID_CATEGORIES.has(requestedCategory as never)
      ? requestedCategory
      : 'all'

  const supabase = await createClient()

  let query = supabase
    .from('blog_posts')
    .select(`
      id,
      slug,
      title,
      excerpt,
      cover_image,
      category,
      city,
      read_time,
      author,
      published_at,
      featured
    `)
    .eq('published', true)
    .order('published_at', {
      ascending: false,
    })
    .limit(30)

  if (activeCategory !== 'all') {
    query = query.eq('category', activeCategory)
  }

  const {
    data,
    error,
  } = await query

  const posts = (data ?? []) as BlogPost[]

  const featuredPost =
    posts.find((post) => post.featured) ??
    posts[0] ??
    null

  const remainingPosts = featuredPost
    ? posts.filter((post) => post.id !== featuredPost.id)
    : []

  const activeCategoryLabel =
    CATEGORIES.find((category) => category.id === activeCategory)
      ?.label ?? 'All stories'

  return (
    <main className="min-h-screen bg-[#F7FAF8]">
      <BlogHero />

      <CategoryNavigation
        activeCategory={activeCategory}
      />

      {error ? (
        <BlogErrorState />
      ) : posts.length === 0 ? (
        <EmptyBlogState
          categoryLabel={activeCategoryLabel}
          showReset={activeCategory !== 'all'}
        />
      ) : (
        <>
          {featuredPost ? (
            <FeaturedPost post={featuredPost} />
          ) : null}

          <PostGrid
            posts={remainingPosts}
            activeCategoryLabel={activeCategoryLabel}
          />

          <BusinessOwnerCallout />
        </>
      )}
    </main>
  )
}

function BlogHero() {
  return (
    <section
      className="relative overflow-hidden text-white"
      style={{
        background:
          'linear-gradient(135deg, #053528 0%, #085041 65%, #1D9E75 100%)',
      }}
    >
      <div className="absolute -right-28 -top-40 h-[420px] w-[420px] rounded-full bg-white/5" />

      <div className="absolute -bottom-48 left-1/4 h-[380px] w-[380px] rounded-full bg-[#9FE1CB]/10" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
        <div className="max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.13em] text-[#C5EBDD] backdrop-blur">
            <BookOpen size={14} />
            Markeetee stories
          </span>

          <h1 className="mt-7 max-w-4xl text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
            Discover the businesses,
            <span className="block text-[#9FE1CB]">
              people, and stories of Africa.
            </span>
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-8 text-emerald-50/85 sm:text-lg">
            Explore city guides, business spotlights, community stories,
            and useful resources created for the African diaspora across
            the United States.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[#085041] transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Search size={16} />
              Explore businesses
            </Link>

            <Link
              href="/blog?category=guides"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/15"
            >
              Browse city guides
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function CategoryNavigation({
  activeCategory,
}: {
  activeCategory: string
}) {
  return (
    <div className="sticky top-[68px] z-30 border-b border-gray-200/80 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl overflow-x-auto px-4 sm:px-6">
        <nav
          aria-label="Blog categories"
          className="flex min-w-max items-center gap-2 py-3"
        >
          {CATEGORIES.map((category) => {
            const Icon = category.icon
            const selected = category.id === activeCategory

            return (
              <Link
                key={category.id}
                href={
                  category.id === 'all'
                    ? '/blog'
                    : `/blog?category=${category.id}`
                }
                aria-current={selected ? 'page' : undefined}
                className={[
                  'inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition',
                  selected
                    ? 'text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                ].join(' ')}
                style={
                  selected
                    ? {
                        backgroundColor: BRAND.primary,
                      }
                    : undefined
                }
              >
                <Icon size={14} />
                {category.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

function FeaturedPost({
  post,
}: {
  post: BlogPost
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p
            className="text-xs font-bold uppercase tracking-[0.14em]"
            style={{ color: BRAND.green }}
          >
            Editor&apos;s pick
          </p>

          <h2 className="mt-1 text-2xl font-extrabold text-gray-950">
            Featured story
          </h2>
        </div>

        <Link
          href="/blog"
          className="hidden items-center gap-1 text-sm font-bold sm:inline-flex"
          style={{ color: BRAND.green }}
        >
          View all stories
          <ArrowRight size={15} />
        </Link>
      </div>

      <Link
        href={`/blog/${post.slug}`}
        className="group grid overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl lg:grid-cols-[1.1fr_0.9fr]"
      >
        <BlogCoverImage
          post={post}
          featured
        />

        <article className="flex flex-col justify-center p-7 sm:p-9 lg:p-12">
          <PostTaxonomy post={post} />

          <h3 className="mt-5 text-2xl font-extrabold leading-tight text-gray-950 transition group-hover:text-[#1D9E75] sm:text-3xl lg:text-4xl">
            {post.title}
          </h3>

          <p className="mt-5 line-clamp-4 text-sm leading-7 text-gray-600 sm:text-base">
            {post.excerpt ||
              'Discover this latest story from the Markeetee community.'}
          </p>

          <PostMetadata
            post={post}
            className="mt-7"
          />

          <div
            className="mt-8 inline-flex items-center gap-2 text-sm font-bold"
            style={{ color: BRAND.green }}
          >
            Read full story
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </div>
        </article>
      </Link>
    </section>
  )
}

function PostGrid({
  posts,
  activeCategoryLabel,
}: {
  posts: BlogPost[]
  activeCategoryLabel: string
}) {
  if (posts.length === 0) {
    return null
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <p
            className="text-xs font-bold uppercase tracking-[0.14em]"
            style={{ color: BRAND.green }}
          >
            Latest from Markeetee
          </p>

          <h2 className="mt-1 text-2xl font-extrabold text-gray-950 sm:text-3xl">
            {activeCategoryLabel}
          </h2>
        </div>

        <p className="hidden text-sm text-gray-400 sm:block">
          {posts.length} {posts.length === 1 ? 'story' : 'stories'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
          />
        ))}
      </div>
    </section>
  )
}

function PostCard({
  post,
}: {
  post: BlogPost
}) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
    >
      <BlogCoverImage post={post} />

      <article className="flex flex-1 flex-col p-6">
        <PostTaxonomy post={post} compact />

        <h3 className="mt-4 line-clamp-2 text-lg font-extrabold leading-snug text-gray-950 transition group-hover:text-[#1D9E75]">
          {post.title}
        </h3>

        <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-500">
          {post.excerpt ||
            'Read the latest guide or story from the Markeetee community.'}
        </p>

        <div className="mt-auto pt-6">
          <PostMetadata post={post} />

          <div
            className="mt-5 flex items-center gap-2 text-sm font-bold"
            style={{ color: BRAND.green }}
          >
            Read story
            <ArrowRight
              size={15}
              className="transition-transform group-hover:translate-x-1"
            />
          </div>
        </div>
      </article>
    </Link>
  )
}

function BlogCoverImage({
  post,
  featured = false,
}: {
  post: BlogPost
  featured?: boolean
}) {
  return (
    <div
      className={[
        'relative overflow-hidden bg-gray-100',
        featured
          ? 'min-h-[280px] lg:min-h-[500px]'
          : 'aspect-[16/10]',
      ].join(' ')}
    >
      {post.cover_image ? (
        <Image
          src={post.cover_image}
          alt={post.title}
          fill
          sizes={
            featured
              ? '(max-width: 1024px) 100vw, 55vw'
              : '(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw'
          }
          className="object-cover transition duration-700 group-hover:scale-105"
        />
      ) : (
        <div
          className="flex h-full min-h-[240px] w-full items-center justify-center"
          style={{
            background:
              featured
                ? 'linear-gradient(135deg, #053528, #1D9E75)'
                : 'linear-gradient(135deg, #E1F5EE, #9FE1CB)',
          }}
        >
          <BookOpen
            size={featured ? 70 : 48}
            className={
              featured
                ? 'text-white/80'
                : 'text-[#085041]/70'
            }
          />
        </div>
      )}

      {post.featured ? (
        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-[#085041] shadow-sm backdrop-blur">
          <Sparkles size={12} />
          Featured
        </span>
      ) : null}
    </div>
  )
}

function PostTaxonomy({
  post,
  compact = false,
}: {
  post: BlogPost
  compact?: boolean
}) {
  const category = CATEGORIES.find(
    (item) => item.id === post.category,
  )

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {post.category ? (
        <span
          className="font-bold uppercase tracking-[0.1em]"
          style={{ color: BRAND.green }}
        >
          {category?.label ?? post.category}
        </span>
      ) : null}

      {post.category && post.city ? (
        <span className="text-gray-300">•</span>
      ) : null}

      {post.city ? (
        <span className="inline-flex items-center gap-1 text-gray-500">
          <MapPin size={compact ? 11 : 12} />
          {post.city}
        </span>
      ) : null}
    </div>
  )
}

function PostMetadata({
  post,
  className = '',
}: {
  post: BlogPost
  className?: string
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-400 ${className}`}
    >
      {post.published_at ? (
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays size={12} />

          {formatDate(post.published_at)}
        </span>
      ) : null}

      {post.read_time ? (
        <span className="inline-flex items-center gap-1.5">
          <Clock3 size={12} />
          {post.read_time} min read
        </span>
      ) : null}

      {post.author ? (
        <span className="truncate">
          By {post.author}
        </span>
      ) : null}
    </div>
  )
}

function BusinessOwnerCallout() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      <div
        className="relative overflow-hidden rounded-[2rem] px-7 py-10 text-white sm:px-10 lg:px-12"
        style={{
          background:
            'linear-gradient(135deg, #053528 0%, #085041 60%, #1D9E75 100%)',
        }}
      >
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/5" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-emerald-100">
              <Building2 size={13} />
              For African business owners
            </span>

            <h2 className="mt-5 text-3xl font-extrabold leading-tight">
              Have a story the community should know?
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-50/80 sm:text-base">
              List your business on Markeetee and give customers another
              way to discover your products, services, and story.
            </p>
          </div>

          <Link
            href="/auth/signup?role=owner"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[#085041] transition hover:-translate-y-0.5"
          >
            List your business
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}

function EmptyBlogState({
  categoryLabel,
  showReset,
}: {
  categoryLabel: string
  showReset: boolean
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="rounded-[2rem] border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ backgroundColor: BRAND.mint }}
        >
          <BookOpen
            size={28}
            style={{ color: BRAND.primary }}
          />
        </div>

        <h2 className="mt-6 text-2xl font-extrabold text-gray-950">
          No {categoryLabel.toLowerCase()} yet
        </h2>

        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-gray-500">
          New guides, stories, and business features are being prepared
          for the Markeetee community.
        </p>

        {showReset ? (
          <Link
            href="/blog"
            className="mt-7 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white"
            style={{ backgroundColor: BRAND.primary }}
          >
            Browse all stories
            <ArrowRight size={15} />
          </Link>
        ) : (
          <Link
            href="/search"
            className="mt-7 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white"
            style={{ backgroundColor: BRAND.primary }}
          >
            Explore businesses
            <ArrowRight size={15} />
          </Link>
        )}
      </div>
    </section>
  )
}

function BlogErrorState() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="rounded-[2rem] border border-red-100 bg-white px-6 py-16 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
          <Newspaper
            size={28}
            className="text-red-500"
          />
        </div>

        <h2 className="mt-6 text-2xl font-extrabold text-gray-950">
          The blog could not be loaded
        </h2>

        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-gray-500">
          Please refresh the page or return later while we reconnect to
          the latest Markeetee stories.
        </p>

        <Link
          href="/blog"
          className="mt-7 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white"
          style={{ backgroundColor: BRAND.primary }}
        >
          Try again
          <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  )
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date))
}