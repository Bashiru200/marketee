import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export type AdminAccess = {
  id: string
  email: string | null
  name: string | null
  isSuperAdmin: boolean
}

function getServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY
}

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = getServiceRoleKey()

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase service-role environment variables')
  }

  return createServiceClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function requireAdminAccess({
  superAdminOnly = false,
}: {
  superAdminOnly?: boolean
} = {}): Promise<AdminAccess> {
  const userClient = await createServerClient()
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser()

  if (userError || !user) {
    throw new Error('UNAUTHENTICATED')
  }

  const admin = createAdminClient()
  const { data: profile, error } = await admin
    .from('profiles')
    .select('id, email, name, is_admin, admin_role')
    .eq('id', user.id)
    .single()

  if (error || !profile?.is_admin) {
    throw new Error('FORBIDDEN')
  }

  const isSuperAdmin = profile.admin_role === 'super_admin'
  if (superAdminOnly && !isSuperAdmin) {
    throw new Error('FORBIDDEN')
  }

  return {
    id: profile.id,
    email: profile.email ?? user.email ?? null,
    name: profile.name ?? null,
    isSuperAdmin,
  }
}

export function authErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : ''

  if (message === 'UNAUTHENTICATED') {
    return Response.json({ error: 'Sign in required' }, { status: 401 })
  }

  if (message === 'FORBIDDEN') {
    return Response.json({ error: 'Admin access required' }, { status: 403 })
  }

  throw error
}
