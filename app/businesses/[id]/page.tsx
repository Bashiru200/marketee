// app/businesses/[id]/page.tsx
import { notFound }          from 'next/navigation'
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
  }
}

// ── Page ──────────────────────────────────────────────────────────────────
export default async function BusinessDetailPage({ params }: Props) {
  const { id }   = await params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', id)
    .single()

  if (error || !data) notFound()

  return <BusinessDetailClient id={id} />
}