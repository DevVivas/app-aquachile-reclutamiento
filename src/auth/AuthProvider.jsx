import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase.js'
import { getProfile, logout } from '@/services/authService.js'
import { AuthContext } from './authContext.js'

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (nextSession) => {
    setSession(nextSession)
    if (!nextSession?.user) {
      setProfile(null)
      setLoading(false)
      return
    }
    try {
      setProfile(await getProfile(nextSession.user.id))
    } catch {
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => active && loadProfile(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      // Evita llamadas a Supabase dentro del callback (recomendación oficial): diferir.
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        setTimeout(() => active && loadProfile(nextSession), 0)
      } else {
        setSession(nextSession)
      }
    })
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [loadProfile])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      isStaff: Boolean(profile?.approved),
      isAdmin: Boolean(profile?.approved && profile?.role === 'admin'),
      refreshProfile: () => loadProfile(session),
      signOut: logout,
    }),
    [session, profile, loading, loadProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
