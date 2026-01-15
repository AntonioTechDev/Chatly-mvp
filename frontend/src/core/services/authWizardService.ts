import { apiClient } from '../api/api-client'
import { supabase } from '../lib/supabase'
import type { WizardData } from '../types/auth-wizard.types'

export const authWizardService = {
    /**
     * Signs up a new user with Supabase Auth
     */
    async signUp(email: string, password: string) {
        // We use signUp with email redirecting to the wizard page (or just default)
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                // Pass default metadata to ensure consistency across auth methods
                data: {
                    full_name: '',
                    avatar_url: '',
                },
                // emailRedirectTo: window.location.origin // Optional, for magic link flow
            }
        });
        if (error) throw error;
        return data;
    },

    /**
     * Upserts the wizard data for the current user.
     */
    async saveStepData(userId: string, currentStep: number, data: Partial<WizardData>) {
        if (!currentStep) throw new Error('Current step is required');

        // Map step to endpoint
        let endpoint = '';
        switch (currentStep) {
            case 1: endpoint = '/onboarding/step-1'; break;
            case 2: endpoint = '/onboarding/step-2/verify-email'; break;
            case 3: endpoint = '/onboarding/step-3'; break;
            case 4: endpoint = '/onboarding/step-4'; break;
            case 5: endpoint = '/onboarding/step-5'; break;
            case 6: endpoint = '/onboarding/step-6'; break;
            case 7:
                // If providing code, it's verify. If just saving step, it's generic save.
                // Assuming separate call for SMS actions. This is just saving state locally if needed?
                // Actually the wizard calls specialized methods for sms. 
                // We'll treat this as saving 'phone' if passed.
                endpoint = '/onboarding/step-7/send-sms'; // This seems wrong if we are just saving data.
                // Let's assume step 7 logic splits: send vs verify.
                // If data has 'phone', we might call a different endpoint or just skip if handled by UI.
                return; // Step 7 handled via specific methods below
            default: throw new Error(`Unknown step: ${currentStep}`);
        }

        await apiClient(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async sendPhoneOtp(phone: string) {
        const { error } = await supabase.auth.signInWithOtp({
            phone: phone,
        });
        if (error) throw error;
    },

    async verifyPhoneOtp(phone: string, token: string) {
        const { data, error } = await supabase.auth.verifyOtp({
            phone,
            token,
            type: 'sms',
        });
        if (error) throw error;
        return data;
    },

    /**
     * Sends an email OTP (if enabled in Supabase) or resends confirmation link
     */
    async sendEmailOtp(email: string) {
        // Option A: If using OTPs for Email (requires Supabase config "Email OTP")
        const { error } = await supabase.auth.signInWithOtp({
            email,
            // options: { shouldCreateUser: false } // ensure we are verifying existing user
        });

        // Option B: If using Magic Link/Confirm Link, merely resend:
        // const { error } = await supabase.auth.resend({
        //    type: 'signup',
        //    email,
        // });

        // Given the UI expects a CODE, we try signInWithOtp.
        if (error) throw error;
    },

    async verifyEmailOtp(email: string, token: string) {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'signup',
        });
        if (error) throw error;
        return data;
    },

    async completeOnboarding() {
        return apiClient('/onboarding/complete', {
            method: 'POST'
        });
    },

    /**
     * Retrieves the current wizard progress from Backend
     */
    async getWizardProgress(userId: string): Promise<{ currentStep: number; data: Partial<WizardData> } | null> {
        try {
            const response = await apiClient<any>('/onboarding/status');
            return response; // Expects { currentStep, onboardingStatus, data }
        } catch (err) {
            console.error('Failed to load wizard status', err);
            return null;
        }
    }
}
