import { supabase } from '../lib/supabase'

export const authService = {
    async signInWithPassword(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        if (error) throw error
        return data
    },

    async signOut() {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    },

    async resetPasswordForEmail(email: string) {
        const redirectTo = `${window.location.origin}/update-password`
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo,
        })
        if (error) throw error
        return data
    },

    async updateUserPassword(password: string) {
        const { data, error } = await supabase.auth.updateUser({
            password,
        })
        if (error) throw error
        return data
    },

    async signInWithGoogle() {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        })
        if (error) throw error
        return data
    }
}
