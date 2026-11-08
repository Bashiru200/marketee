import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import BusinessDetailClient from '@/components/businesses/BusinessDetailClient'

interface Props {
  params: Promise<{ slug: string }>
}

/* ─────────────────────────────────────────────
   🧠 Fetch business (shared logic)
───────────────────────────────────────────── */
async function getBusinessBySlug(slug: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('businesses')
    .select(`
      id,
      name,
      description,
      cover_image,
      city,
      state,
      plan
    `)
    .eq('slug', slug)
    .single()

  if (error || !data) return null

  return data
}

/* ─────────────────────────────────────────────
   🔍 SEO Metadata
───────────────────────────────────────────── */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const biz = await getBusinessBySlug(slug)

  if (!biz || !['storefront', 'pro_store'].includes(String(biz.plan))) {
    return {
      title: 'Store not found — Markeetee',
    }
  }

  return {
    title: `${biz.name} — Markeetee Store`,
    description:
      biz.description ??
      `${biz.name} — African business on Markeetee`,

    openGraph: {
      title: biz.name,
      description: biz.description ?? '',
      images: biz.cover_image
        ? [{ url: biz.cover_image }]
        : [],
    },

    twitter: {
      card: 'summary_large_image',
      title: biz.name,
      images: biz.cover_image ? [biz.cover_image] : [],
    },
  }
}

/* ─────────────────────────────────────────────
   🧱 Page
───────────────────────────────────────────── */
export default async function StorePage({ params }: Props) {
  const { slug } = await params
  const biz = await getBusinessBySlug(slug)

  // 🚫 Not found or wrong plan
  if (!biz || !['storefront', 'pro_store'].includes(String(biz.plan))) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#FBF7EF]">
      <BusinessDetailClient id={biz.id} />
    </div>
  )
}
