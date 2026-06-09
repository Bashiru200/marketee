'use client'
import {
  createContext, useContext, useEffect,
  useState, useRef, useCallback, ReactNode
} from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { AdminPermission } from '@/lib/permissions'

type Role = 'customer' | 'owner' | null

interface Profile {
  id:                  string
  name:                string
  email:               string
  role:                Role
  business_id?:        string
  avatar_url?:         string | null
  is_admin?:           boolean
  admin_role?:         'super_admin' | 'admin' | null
  admin_permissions?:  AdminPermission[]
}

interface AuthContextType {
  user:             User | null
  profile:          Profile | null
  session:          Session | null
  isOwner:          boolean
  isCustomer:       boolean
  isLoggedIn:       boolean
  isAdmin:          boolean
  isSuperAdmin:     boolean
  adminPermissions: AdminPermission[]
  hasPermission:    (permission: AdminPermission) => boolean
  loading:          boolean
  signOut:          () => Promise<void>
  refreshProfile:   () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user:             null,
  profile:          null,
  session:          null,
  isOwner:          false,
  isCustomer:       false,
  isLoggedIn:       false,
  isAdmin:          false,
  isSuperAdmin:     false,
  adminPermissions: [],
  hasPermission:    () => false,
  loading:          true,
  signOut:          async () => {},
  refreshProfile:   async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useRef(createClient()).current

  const [user,    setUser]    = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, business_id, avatar_url, is_admin, admin_role, admin_permissions')
      .eq('id', userId)
      .single()
    if (!error && data) setProfile(data as Profile)
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    if (user?.id) await loadProfile(user.id)
  }, [user?.id, loadProfile])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, currentSession: Session | null) => {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        if (currentSession?.user) {
          await loadProfile(currentSession.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    
    supabase.auth.getSession().then(({ data: { session: initial } }: { data: { session: Session | null } }) => {
      if (!initial) setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase, loadProfile])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setSession(null)
  }, [supabase])

  const isSuperAdmin     = profile?.admin_role === 'super_admin'
  const adminPermissions = (profile?.admin_permissions ?? []) as AdminPermission[]

  const hasPermission = useCallback((permission: AdminPermission): boolean => {
    if (profile?.admin_role === 'super_admin') return true
    return adminPermissions.includes(permission)
  }, [profile?.admin_role, adminPermissions])

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      isOwner:    profile?.role === 'owner',
      isCustomer: profile?.role === 'customer',
      isLoggedIn: !!user,
      isAdmin:    profile?.is_admin === true,
      isSuperAdmin,
      adminPermissions,
      hasPermission,
      loading,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}