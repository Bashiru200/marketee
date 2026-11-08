import crypto from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

export type EmailPreferenceType = 'marketing' | 'reviews' | 'broadcast'

export interface EmailPreference {
  email: string
  token: string
  unsubscribed_from: string[] | null
  unsubscribed_all: boolean | null
}

export function isSubscribedToEmailType(
  preference: Pick<EmailPreference, 'unsubscribed_from' | 'unsubscribed_all'> | null | undefined,
  type: EmailPreferenceType,
) {
  if (!preference) return true
  if (preference.unsubscribed_all) return false
  return !(preference.unsubscribed_from ?? []).includes(type)
}

export async function ensureUnsubscribeToken(
  supabase: SupabaseClient,
  email: string,
  userId?: string | null,
): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase()

  const { data: existing } = await supabase
    .from('email_preferences')
    .select('token')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (existing?.token) return existing.token

  const token = crypto.randomBytes(24).toString('hex')

  await supabase.from('email_preferences').upsert({
    email: normalizedEmail,
    user_id: userId ?? null,
    token,
    unsubscribed_from: [],
    unsubscribed_all: false,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'email' })

  return token
}
