import { supabase } from '../lib/supabase'

// Debug helpers
const logDebug = (method: string, action: string, data?: any) => {
  console.log(`[authService:${method}] ${action}:`, {
    timestamp: new Date().toISOString(),
    ...data
  })
}

const logError = (method: string, action: string, error: any) => {
  console.error(`[authService:${method}] ❌ ${action}:`, {
    timestamp: new Date().toISOString(),
    error: error?.message || error,
    stack: error?.stack
  })
}

export const authService = {
    async signInWithPassword(email: string, password: string) {
        logDebug('signInWithPassword', 'CALLED', { email })

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                logError('signInWithPassword', 'ERROR', error)
                throw error
            }

            logDebug('signInWithPassword', 'SUCCESS', {
                hasUser: !!data.user,
                hasSession: !!data.session,
                userId: data.user?.id
            })

            return data
        } catch (error) {
            logError('signInWithPassword', 'EXCEPTION', error)
            throw error
        }
    },

    async signOut() {
        logDebug('signOut', 'CALLED')

        try {
            const { error } = await supabase.auth.signOut()
            if (error) {
                logError('signOut', 'ERROR', error)
                throw error
            }
            logDebug('signOut', 'SUCCESS')
        } catch (error) {
            logError('signOut', 'EXCEPTION', error)
            throw error
        }
    },

    async resetPasswordForEmail(email: string) {
        logDebug('resetPasswordForEmail', 'CALLED', { email })

        try {
            const redirectTo = `${window.location.origin}/update-password`
            logDebug('resetPasswordForEmail', 'REDIRECTING TO', { redirectTo })

            const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo,
            })

            if (error) {
                logError('resetPasswordForEmail', 'ERROR', error)
                throw error
            }

            logDebug('resetPasswordForEmail', 'SUCCESS')
            return data
        } catch (error) {
            logError('resetPasswordForEmail', 'EXCEPTION', error)
            throw error
        }
    },

    async updateUserPassword(password: string) {
        logDebug('updateUserPassword', 'CALLED')

        try {
            const { data, error } = await supabase.auth.updateUser({
                password,
            })

            if (error) {
                logError('updateUserPassword', 'ERROR', error)
                throw error
            }

            logDebug('updateUserPassword', 'SUCCESS', {
                hasUser: !!data.user
            })
            return data
        } catch (error) {
            logError('updateUserPassword', 'EXCEPTION', error)
            throw error
        }
    },

    async signInWithGoogle() {
        logDebug('signInWithGoogle', 'CALLED')

        try {
            const redirectTo = `${window.location.origin}/auth/callback`
            logDebug('signInWithGoogle', 'REDIRECTING TO', { redirectTo })

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            })

            if (error) {
                logError('signInWithGoogle', 'ERROR', error)
                throw error
            }

            logDebug('signInWithGoogle', 'SUCCESS', {
                url: data.url,
                provider: data.provider
            })
            return data
        } catch (error) {
            logError('signInWithGoogle', 'EXCEPTION', error)
            throw error
        }
    }
}
