import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import BusinessDetailClient from '@/components/business/BusinessDetailClient'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug }   = await params
  const supabase   = await createClient()
  const { data: biz } = await supabase
    .from('businesses')
    .select('name, description, cover_image, city, state')
    .eq('slug', slug)
    .eq('plan', 'storefront')
    .single()

  if (!biz) return { title: 'Store not found — Markeetee' }

  return {
    title:       `${biz.name} — Markeetee Store`,
    description: biz.description ?? `${biz.name} on Markeetee`,
    openGraph: {
      title:  biz.name,
      images: biz.cover_image ? [{ url: biz.cover_image }] : [],
    },
  }
}

export default async function StorePage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: biz } = await supabase
    .from('businesses')
    .select('id, plan')
    .eq('slug', slug)
    .single()

  if (!biz || biz.plan !== 'storefront') notFound()

  return <BusinessDetailClient id={biz.id} />
}