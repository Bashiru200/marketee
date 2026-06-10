import { createClient } from '@/lib/supabase/client'

export interface BusinessRow {
  id: string
  name: string
  category: string | null
  subcategory: string | null
  description: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  phone: string | null
  email: string | null
  website: string | null
  country: string | null
  price_range: string | null
  lat: number | null
  lng: number | null
  verified: boolean
  premium: boolean
  featured: boolean
  rating: number
  review_count: number
  tags: string[] | null
  cover_image: string | null
  hours: Record<string, string> | null
}

export async function fetchBusinesses(): Promise<BusinessRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .order('featured', { ascending: false })
    .order('rating', { ascending: false })
  if (error) { console.error('[fetchBusinesses]', error); return [] }
  return data ?? []
}

export async function fetchBusinessById(id: string): Promise<BusinessRow | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', id)
    .single()
  if (error) { console.error('[fetchBusinessById]', error); return null }
  return data
}

export async function fetchFeaturedBusinesses(): Promise<BusinessRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('featured', true)
    .order('rating', { ascending: false })
    .limit(3)
  if (error) { console.error('[fetchFeaturedBusinesses]', error); return [] }
  return data ?? []
}