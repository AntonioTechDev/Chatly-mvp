import React, { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import type { AuthContextType } from '@core/types/auth.types'
import type { PlatformClient } from '@core/types/database.types'
import toast from 'react-hot-toast'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Debug helpers
const logDebug = (action: string, data?: any) => {
  console.log(`[AuthContext] ${action}:`, {
    timestamp: new Date().toISOString(),
    ...data
  })
}

const logError = (action: string, error: any) => {
  console.error(`[AuthContext] ❌ ${action}:`, {
    timestamp: new Date().toISOString(),
    error: error?.message || error,
    stack: error?.stack
  })
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [clientData, setClientData] = useState<PlatformClient | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isFetchingRef = useRef(false)
  const clientDataRef = useRef<PlatformClient | null>(null)
  const isInitializingRef = useRef(true)

  // Keep ref in sync with state
  useEffect(() => {
    clientDataRef.current = clientData
  }, [clientData])

  const fetchClientData = useCallback(async (userId: string): Promise<{ client: PlatformClient | null, profile: any | null }> => {
    logDebug('fetchClientData CALLED', { userId, isFetching: isFetchingRef.current })

    if (isFetchingRef.current) {
      logDebug('fetchClientData SKIPPED - already fetching')
      return { client: null, profile: null }
    }

    isFetchingRef.current = true

    try {
      logDebug('fetchClientData QUERYING database', { userId })

      // First, get the profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (profileError) {
        logError('fetchClientData PROFILE QUERY ERROR', profileError)
        return { client: null, profile: null }
      }

      logDebug('fetchClientData PROFILE retrieved', {
        hasProfile: !!profileData,
        profileId: profileData?.id,
        hasPlatformClientId: !!profileData?.platform_client_id
      })

      // Then, get the platform_client by user_id (more reliable than FK relationship)
      const { data: clientData, error: clientError } = await supabase
        .from('platform_clients')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (clientError && clientError.code !== 'PGRST116') { // PGRST116 = no rows found (not an error)
        logError('fetchClientData CLIENT QUERY ERROR', clientError)
      }

      logDebug('fetchClientData SUCCESS', {
        hasProfile: !!profileData,
        hasClient: !!clientData,
        profileId: profileData?.id,
        clientId: clientData?.id
      })

      return {
        client: clientData as PlatformClient,
        profile: profileData
      }
    } catch (error) {
      logError('fetchClientData EXCEPTION', error)
      return { client: null, profile: null }
    } finally {
      isFetchingRef.current = false
    }
  }, [])

  const refreshClientData = useCallback(async () => {
    if (!user) return
    const { client, profile } = await fetchClientData(user.id)
    setClientData(client)
    setProfile(profile)
  }, [user, fetchClientData])

  const login = useCallback(async (email: string, password: string) => {
    logDebug('login STARTED', { email })

    try {
      setIsLoading(true)
      logDebug('login CALLING Supabase signInWithPassword')

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        logError('login SUPABASE ERROR', error)
        throw error
      }

      logDebug('login SUPABASE SUCCESS', {
        hasUser: !!data.user,
        hasSession: !!data.session,
        userId: data.user?.id
      })

      if (data.user) {
        logDebug('login FETCHING client data', { userId: data.user.id })
        const { client, profile } = await fetchClientData(data.user.id)

        logDebug('login SETTING state', {
          hasClient: !!client,
          hasProfile: !!profile
        })

        setUser(data.user)
        setSession(data.session)
        setClientData(client)
        setProfile(profile)

        logDebug('login COMPLETED successfully')
        toast.success('Login effettuato con successo!')
      }
    } catch (error: any) {
      logError('login FAILED', error)
      toast.error(error.message || 'Errore durante il login')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [fetchClientData])

  const logout = useCallback(async () => {
    try {
      setIsLoading(true)
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      setClientData(null)
      setProfile(null)
      toast.success('Logout effettuato con successo')
    } catch (error: any) {
      console.error('Logout error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      logDebug('initializeAuth STARTED')

      try {
        isInitializingRef.current = true
        logDebug('initializeAuth GETTING session')

        const { data: { session } } = await supabase.auth.getSession()

        if (!mounted) {
          logDebug('initializeAuth ABORTED - component unmounted')
          return
        }

        logDebug('initializeAuth SESSION retrieved', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id
        })

        if (session?.user) {
          setUser(session.user)
          setSession(session)

          logDebug('initializeAuth FETCHING client data', { userId: session.user.id })
          const { client, profile } = await fetchClientData(session.user.id)

          if (mounted) {
            logDebug('initializeAuth SETTING client data', {
              hasClient: !!client,
              hasProfile: !!profile
            })
            setClientData(client)
            setProfile(profile)
          }
        }

        logDebug('initializeAuth COMPLETED')
      } catch (error) {
        logError('initializeAuth FAILED', error)
      } finally {
        if (mounted) {
          setIsLoading(false)
          isInitializingRef.current = false
          logDebug('initializeAuth FINALIZED', { isLoading: false })
        }
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logDebug('onAuthStateChange EVENT', {
          event,
          hasSession: !!session,
          userId: session?.user?.id,
          isInitializing: isInitializingRef.current,
          mounted
        })

        if (isInitializingRef.current) {
          logDebug('onAuthStateChange SKIPPED - initializing')
          return
        }
        if (!mounted) {
          logDebug('onAuthStateChange SKIPPED - unmounted')
          return
        }

        if (event === 'SIGNED_IN' && session?.user) {
          logDebug('onAuthStateChange SIGNED_IN', { userId: session.user.id })
          setUser(session.user)
          setSession(session)

          const currentClientData = clientDataRef.current
          logDebug('onAuthStateChange CHECKING client data', {
            hasCurrent: !!currentClientData,
            currentUserId: currentClientData?.user_id,
            newUserId: session.user.id
          })

          if (!currentClientData || currentClientData.user_id !== session.user.id) {
            logDebug('onAuthStateChange FETCHING new client data')
            const { client, profile } = await fetchClientData(session.user.id)
            if (mounted) {
              setClientData(client)
              setProfile(profile)
              logDebug('onAuthStateChange CLIENT DATA updated')
            }
          } else {
            logDebug('onAuthStateChange REUSING existing client data')
          }
        } else if (event === 'SIGNED_OUT') {
          logDebug('onAuthStateChange SIGNED_OUT')
          setUser(null)
          setSession(null)
          setClientData(null)
          setProfile(null)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          logDebug('onAuthStateChange TOKEN_REFRESHED')
          setSession(session)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchClientData])

  const value: AuthContextType = useMemo(() => ({
    user,
    session,
    clientData,
    profile,
    isLoading,
    isAuthenticated: !!user && !!session,
    login,
    logout,
    refreshClientData,
  }), [user, session, clientData, profile, isLoading, login, logout, refreshClientData])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
