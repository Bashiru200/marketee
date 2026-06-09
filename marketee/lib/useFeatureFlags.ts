'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface FeatureFlag {
  key:     string
  enabled: boolean
}

// Module-level cache so flags are fetched once per session
let cachedFlags: Record<string, boolean> | null = null
let fetchPromise: Promise<void> | null = null

export function useFeatureFlags() {
  const supabase = createClient()
  const [flags,   setFlags]   = useState<Record<string, boolean>>(cachedFlags ?? {})
  const [loading, setLoading] = useState(!cachedFlags)

  useEffect(() => {
    if (cachedFlags) {
      setFlags(cachedFlags)
      setLoading(false)
      return
    }

    if (!fetchPromise) {
      fetchPromise = supabase
        .from('feature_flags')
        .select('key, enabled')
        .then(({ data }: { data: FeatureFlag[] | null }) => {
          const map: Record<string, boolean> = {}
          ;(data ?? []).forEach(f => { map[f.key] = f.enabled })
          cachedFlags = map
        })
    }

    const promise = fetchPromise!
    promise.then(() => {
      setFlags(cachedFlags ?? {})
      setLoading(false)
    })
  }, [])

  const isEnabled = useCallback((key: string, defaultValue = true): boolean => {
    if (loading) return defaultValue
    return cachedFlags?.[key] ?? defaultValue
  }, [loading])

  return { flags, loading, isEnabled }
}

// Invalidate cache (call after admin updates a flag)
export function invalidateFlagCache() {
  cachedFlags  = null
  fetchPromise = null
}