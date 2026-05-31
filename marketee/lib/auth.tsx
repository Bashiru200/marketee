'use client'
import {
  createContext, useContext, useEffect,
  useState, useRef, useCallback, ReactNode
} from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

type Role = 'customer' | 'owner' | null

interface Profile {
  id:           string
  name:         string
  email:        string
  role:         Role
  business_id?: string
  avatar_url?:  string | null
}

interface AuthContextType {
  user:           User | null
  profile:        Profile | null
  session:        Session | null
  isOwner:        boolean
  isCustomer:     boolean
  isLoggedIn:     boolean
  loading:        boolean
  signOut:        () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user:           null,
  profile:        null,
  session:        null,
  isOwner:        false,
  isCustomer:     false,
  isLoggedIn:     false,
  loading:        true,
  signOut:        async () => {},
  refreshProfile: async () => {},
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
      .select('id, name, email, role, business_id, avatar_url')
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

    // Get initial session — fires INITIAL_SESSION event above
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

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      isOwner:    profile?.role === 'owner',
      isCustomer: profile?.role === 'customer',
      isLoggedIn: !!user,
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