import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import type { AuthContextType } from '../types/auth.types'
import type { PlatformClient } from '../types/database.types'
import toast from 'react-hot-toast'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

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
  const [isFetchingClient, setIsFetchingClient] = useState(false)
  const clientDataRef = useRef<PlatformClient | null>(null)
  const isInitializingRef = useRef(true)

  // Keep ref in sync with state
  useEffect(() => {
    clientDataRef.current = clientData
  }, [clientData])

  const fetchClientData = async (userId: string): Promise<{ client: PlatformClient | null, profile: any | null }> => {
    if (isFetchingClient) {
      return { client: null, profile: null }
    }

    setIsFetchingClient(true)

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          platform_clients (
            *
          )
        `)
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('❌ Error fetching profile:', error)
        return { client: null, profile: null }
      }

      const client = data?.platform_clients ? (Array.isArray(data.platform_clients) ? data.platform_clients[0] : data.platform_clients) : null;

      return { client: client as PlatformClient, profile: data }
    } catch (error) {
      console.error('❌ Exception in fetchClientData:', error)
      return { client: null, profile: null }
    } finally {
      setIsFetchingClient(false)
    }
  }

  const refreshClientData = async () => {
    if (!user) return
    const { client, profile } = await fetchClientData(user.id)
    setClientData(client)
    setProfile(profile)
  }

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        const { client, profile } = await fetchClientData(data.user.id)

        setUser(data.user)
        setSession(data.session)
        setClientData(client)
        setProfile(profile)

        toast.success('Login effettuato con successo!')
      }
    } catch (error: any) {
      toast.error(error.message || 'Errore durante il login')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
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
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        isInitializingRef.current = true
        const { data: { session } } = await supabase.auth.getSession()

        if (!mounted) return

        if (session?.user) {
          setUser(session.user)
          setSession(session)
          const { client, profile } = await fetchClientData(session.user.id)
          if (mounted) {
            setClientData(client)
            setProfile(profile)
          }
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error)
      } finally {
        if (mounted) {
          setIsLoading(false)
          isInitializingRef.current = false
        }
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (isInitializingRef.current) return
        if (!mounted) return

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          setSession(session)

          const currentClientData = clientDataRef.current
          if (!currentClientData || currentClientData.user_id !== session.user.id) {
            const { client, profile } = await fetchClientData(session.user.id)
            if (mounted) {
              setClientData(client)
              setProfile(profile)
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setSession(null)
          setClientData(null)
          setProfile(null)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setSession(session)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value: AuthContextType = {
    user,
    session,
    clientData,
    profile,
    isLoading,
    isAuthenticated: !!user && !!session,
    login,
    logout,
    refreshClientData,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
