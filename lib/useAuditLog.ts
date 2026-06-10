import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'

export type AuditAction =
  | 'verify_business'   | 'unverify_business'
  | 'set_plan'          | 'downgrade_plan'
  | 'delete_business'   | 'suspend_business'   | 'unsuspend_business'
  | 'ban_user'          | 'unban_user'
  | 'make_admin'        | 'remove_admin'
  | 'reset_password'
  | 'delete_review'     | 'flag_review'        | 'unflag_review'
  | 'feature_business'  | 'unfeature_business'
  | 'grant_permission'  | 'revoke_permission'

export type EntityType = 'business' | 'user' | 'review' | 'plan'

interface LogParams {
  action:      AuditAction
  entityType:  EntityType
  entityId?:   string
  entityName?: string
  details?:    Record<string, unknown>
}

export function useAuditLog() {
  const supabase = createClient()
  const { user } = useAuth()

  const log = useCallback(async ({
    action, entityType, entityId, entityName, details,
  }: LogParams) => {
    if (!user?.id) return
    try {
      await supabase.from('audit_logs').insert({
        admin_id:    user.id,
        action,
        entity_type: entityType,
        entity_id:   entityId   ?? null,
        entity_name: entityName ?? null,
        details:     details    ?? null,
      })
    } catch (err) {
      // Never block the UI for audit log failures
      console.warn('[audit]', err)
    }
  }, [supabase, user?.id])

  return { log }
}