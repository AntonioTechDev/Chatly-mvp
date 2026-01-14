/**
 * Supabase Client Configuration
 *
 * Centralized Supabase client with TypeScript support and error handling
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

// Environment variables validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  )
}

/**
 * Main Supabase client instance
 * Type-safe with Database types
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Auto-refresh tokens
    autoRefreshToken: true,

    // Persist session in localStorage
    persistSession: true,

    // Detect session from URL (for magic links, OAuth redirects)
    detectSessionInUrl: true,

    // Storage key for session
    storageKey: 'chatly-auth-token',

    // Flow type for PKCE (more secure for SPAs)
    flowType: 'pkce',
  },

  global: {
    headers: {
      'X-Client-Info': `chatly-mvp@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
    },
  },

  db: {
    schema: 'public',
  },

  // Realtime configuration (for live updates)
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

/**
 * Get current authenticated user
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    console.error('Error getting current user:', error)
    return null
  }

  return user
}

/**
 * Get current session
 */
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    console.error('Error getting session:', error)
    return null
  }

  return session
}

/**
 * Sign out user
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

/**
 * Sign in with email and password
 */
export const signInWithPassword = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Error signing in:', error)
    throw error
  }

  return data
}

/**
 * Sign up with email and password
 */
export const signUp = async (email: string, password: string, metadata?: object) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  })

  if (error) {
    console.error('Error signing up:', error)
    throw error
  }

  return data
}

/**
 * Send password reset email
 */
export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })

  if (error) {
    console.error('Error sending password reset:', error)
    throw error
  }
}

/**
 * Update user password
 */
export const updatePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    console.error('Error updating password:', error)
    throw error
  }
}

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const session = await getCurrentSession()
  return !!session
}

/**
 * Subscribe to auth state changes
 */
export const onAuthStateChange = (
  callback: (event: string, session: any) => void
) => {
  return supabase.auth.onAuthStateChange(callback)
}

// Export types for convenience
export type { Database } from '../types/database.types'
export type { User, Session } from '@supabase/supabase-js'
