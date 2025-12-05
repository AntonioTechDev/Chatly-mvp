import type { User, Session } from '@supabase/supabase-js'
import type { PlatformClient } from './database.types'

export interface AuthUser {
  id: string
  email: string
  clientData: PlatformClient | null
}

export interface AuthState {
  user: User | null
  session: Session | null
  clientData: PlatformClient | null
  isLoading: boolean
  isAuthenticated: boolean
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshClientData: () => Promise<void>
}
