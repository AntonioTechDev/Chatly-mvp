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
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingClient, setIsFetchingClient] = useState(false)
  const clientDataRef = useRef<PlatformClient | null>(null)
  const isInitializingRef = useRef(true)

  // Keep ref in sync with state
  useEffect(() => {
    clientDataRef.current = clientData
  }, [clientData])

  const fetchClientData = async (userId: string): Promise<PlatformClient | null> => {
    // Prevent duplicate fetches
    if (isFetchingClient) {
      if (import.meta.env.DEV) {
        console.log('⏸️ fetchClientData already in progress, skipping...')
      }
      return null
    }

    setIsFetchingClient(true)

    try {
      if (import.meta.env.DEV) {
        console.log('📊 fetchClientData called')
      }

      const { data, error } = await supabase
        .from('platform_clients')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        if (import.meta.env.DEV) {
          console.error('❌ Error fetching client data:', error)
        }
        return null
      }

      if (!data) {
        if (import.meta.env.DEV) {
          console.error('❌ No client data found for user')
        }
        return null
      }

      if (import.meta.env.DEV) {
        console.log('✅ Client data retrieved')
      }
      return data
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('❌ Exception in fetchClientData:', error)
      }
      return null
    } finally {
      setIsFetchingClient(false)
    }
  }

  const refreshClientData = async () => {
    if (!user) return
    const data = await fetchClientData(user.id)
    setClientData(data)
  }

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      if (import.meta.env.DEV) {
        console.log('🔐 Starting login...')
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (import.meta.env.DEV) {
          console.error('❌ Auth error:', error)
        }
        throw error
      }

      if (import.meta.env.DEV) {
        console.log('✅ Auth successful')
      }

      if (data.user) {
        if (import.meta.env.DEV) {
          console.log('🔍 Fetching client data...')
        }
        const clientData = await fetchClientData(data.user.id)

        if (!clientData) {
          if (import.meta.env.DEV) {
            console.error('❌ No platform client found')
          }
          toast.error('Account non trovato. Contatta il supporto.')
          await supabase.auth.signOut()
          throw new Error('No platform client found for this user')
        }

        if (import.meta.env.DEV) {
          console.log('✅ Client data fetched')
        }
        setUser(data.user)
        setSession(data.session)
        setClientData(clientData)
        toast.success('Login effettuato con successo!')
        if (import.meta.env.DEV) {
          console.log('✅ Login completed successfully')
        }
      }
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('❌ Login error:', error)
      }
      const message = error.message || 'Errore durante il login'
      toast.error(message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      setUser(null)
      setSession(null)
      setClientData(null)
      toast.success('Logout effettuato con successo')
    } catch (error: any) {
      console.error('Logout error:', error)
      toast.error('Errore durante il logout')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true

    // Check for existing session on mount
    const initializeAuth = async () => {
      try {
        isInitializingRef.current = true

        if (import.meta.env.DEV) {
          console.log('🔄 Initializing auth...')
        }

        const { data: { session } } = await supabase.auth.getSession()

        if (!mounted) return

        if (session?.user) {
          if (import.meta.env.DEV) {
            console.log('✅ Session found, fetching client data...')
          }
          setUser(session.user)
          setSession(session)
          const clientData = await fetchClientData(session.user.id)
          if (mounted) {
            setClientData(clientData)
          }
        } else {
          if (import.meta.env.DEV) {
            console.log('ℹ️ No session found')
          }
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error)
      } finally {
        if (mounted) {
          setIsLoading(false)
          isInitializingRef.current = false
          if (import.meta.env.DEV) {
            console.log('✅ Initialization complete')
          }
        }
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // CRITICAL: Ignore all events during initialization
        // This prevents race conditions where onAuthStateChange fires
        // before initializeAuth completes, causing premature isLoading=false
        if (isInitializingRef.current) {
          if (import.meta.env.DEV) {
            console.log('⏸️ Ignoring auth event during initialization:', event)
          }
          return
        }

        if (!mounted) return

        if (import.meta.env.DEV) {
          console.log('🔔 Auth state changed:', event)
        }

        // Only handle explicit sign in/out events, not initial session
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          setSession(session)

          // Only fetch client data if we don't already have it
          const currentClientData = clientDataRef.current
          if (!currentClientData || currentClientData.user_id !== session.user.id) {
            const newClientData = await fetchClientData(session.user.id)
            if (mounted) {
              setClientData(newClientData)
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setSession(null)
          setClientData(null)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Just update session, keep existing user and client data
          setSession(session)
        }

        // Note: We don't set isLoading here anymore
        // Only initializeAuth controls isLoading during startup
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
    isLoading,
    isAuthenticated: !!user && !!session,
    login,
    logout,
    refreshClientData,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
