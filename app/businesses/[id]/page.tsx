// app/businesses/[id]/page.tsx
import { notFound }          from 'next/navigation'
import Script                from 'next/script'
import { createClient }      from '@/lib/supabase/server'
import type { Metadata }     from 'next'
import BusinessDetailClient  from '@/components/businesses/BusinessDetailClient'

interface Props {
  params: Promise<{ id: string }>
}

// ── Dynamic SEO metadata ──────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id }   = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('businesses')
    .select('name, description, cover_image, city, state, category')
    .eq('id', id)
    .single()

  if (!data) return { title: 'Business | Markeetee' }

  return {
    title:       `${data.name} | Markeetee`,
    description: data.description
      ?? `Find ${data.name} on Markeetee — the African business directory for the US diaspora.`,
    openGraph: {
      title:       data.name,
      description: data.description ?? '',
      images:      data.cover_image ? [data.cover_image] : [],
    },
    alternates: {
      canonical: `/businesses/${id}`,
    },
  }
}

// ── Page ──────────────────────────────────────────────────────────────────
export default async function BusinessDetailPage({ params }: Props) {
  const { id }   = await params
  const supabase = await createClient()
  const { data: business, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !business) notFound()

  const [{ data: reviews }, { data: products }] = await Promise.all([
    supabase
      .from('reviews')
      .select('id,rating,title,body,created_at,helpful,verified,user_id,owner_reply,reply_at,images,profiles(name,avatar_url)')
      .eq('business_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('products')
      .select('id,name,price,description,image_url,images,available,sale_price,sale_active,sale_label,like_count,rating_avg,rating_count')
      .eq('business_id', id)
      .order('created_at', { ascending: false }),
  ])

  const businessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    description: business.description,
    image: business.cover_image,
    address: [business.address, business.city, business.state, business.zip].filter(Boolean).join(', '),
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://markeetee.com'}/businesses/${id}`,
    aggregateRating: business.rating
      ? {
          '@type': 'AggregateRating',
          ratingValue: business.rating,
          reviewCount: business.review_count ?? 0,
        }
      : undefined,
  }

  return (
    <>
      <Script
        id={`business-schema-${id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }}
      />
      <BusinessDetailClient
        id={id}
        initialBusiness={business}
        initialReviews={reviews ?? []}
        initialProducts={products ?? []}
      />
    </>
  )
}
