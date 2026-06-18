import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import BusinessDetailClient from './BusinessDetailClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

// Generate dynamic OG metadata per business
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id }   = await params
  const supabase = await createClient()

  const { data: biz } = await supabase
    .from('businesses')
    .select('name, description, category, city, state, cover_image, rating, review_count, country')
    .eq('id', id)
    .single()

  if (!biz) {
    return {
      title: 'Business not found — Markeetee',
    }
  }

  const title       = `${biz.name} — Markeetee`
  const description = biz.description
    ?? `${biz.category} business in ${biz.city}, ${biz.state}. Rated ${biz.rating?.toFixed(1) ?? '—'} by the African diaspora community.`
  const image       = biz.cover_image ?? `${process.env.NEXT_PUBLIC_APP_URL}/og-default.png`
  const url         = `${process.env.NEXT_PUBLIC_APP_URL}/businesses/${id}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName:  'Markeetee',
      type:      'website',
      images: [{
        url,
        width:  1200,
        height: 630,
        alt:    biz.name,
      }],
    },
    twitter: {
      card:        'summary_large_image',
      title,
      description,
      images:      [image],
    },
  }
}

export default async function BusinessDetailPage({ params }: Props) {
  const { id } = await params
  return <BusinessDetailClient id={id} />
}