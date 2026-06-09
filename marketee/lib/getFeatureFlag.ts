// lib/getFeatureFlag.ts
// Server-only helper — only import this in Server Components or Route Handlers
// Do NOT import in 'use client' files

import { createClient } from '@/lib/supabase/server'

export async function getFeatureFlag(key: string, defaultValue = true): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('feature_flags')
    .select('enabled')
    .eq('key', key)
    .single()
  return data?.enabled ?? defaultValue
}