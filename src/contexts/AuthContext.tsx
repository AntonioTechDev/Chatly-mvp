import React, { createContext, useContext, useEffect, useState } from 'react'
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

  const fetchClientData = async (userId: string): Promise<PlatformClient | null> => {
    try {
      const { data, error } = await supabase
        .from('platform_clients')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Error fetching client data:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in fetchClientData:', error)
      return null
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

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      if (data.user) {
        const clientData = await fetchClientData(data.user.id)
        if (!clientData) {
          toast.error('Account non trovato. Contatta il supporto.')
          await supabase.auth.signOut()
          throw new Error('No platform client found for this user')
        }

        setUser(data.user)
        setSession(data.session)
        setClientData(clientData)
        toast.success('Login effettuato con successo!')
      }
    } catch (error: any) {
      console.error('Login error:', error)
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
    // Check for existing session on mount
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)
          setSession(session)
          const clientData = await fetchClientData(session.user.id)
          setClientData(clientData)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)

        if (session?.user) {
          setUser(session.user)
          setSession(session)
          const clientData = await fetchClientData(session.user.id)
          setClientData(clientData)
        } else {
          setUser(null)
          setSession(null)
          setClientData(null)
        }

        setIsLoading(false)
      }
    )

    return () => {
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
