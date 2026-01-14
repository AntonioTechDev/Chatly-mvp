import { apiClient } from '../api/api-client'
import { supabase } from '../lib/supabase'
import type { WizardData } from '../types/auth-wizard.types'

export const authWizardService = {
    /**
     * Upserts the wizard data for the current user.
     * We store this in a 'profiles' or 'onboarding_progress' table.
     * For MVP, we'll assume a 'profiles' table with a JSONB column 'onboarding_data' or specific columns.
     * To hold the structure simple without migration, we might use a dedicated 'user_metadata' in auth.users 
     * but that requires admin rights usually. 
     * 
     * Best Approach for MVP without big migrations: 
     * Use the existing 'profiles' table. If columns don't exist, we should probably add them or specific 'metadata' jsonb column.
     * 
     * I'll assume standard 'profiles' update for now.
     */
    async saveStepData(userId: string, currentStep: number, data: Partial<WizardData>) {
        if (!currentStep) throw new Error('Current step is required');

        // Map step to endpoint
        let endpoint = '';
        switch (currentStep) {
            case 1: endpoint = '/onboarding/step-1'; break;
            case 2: endpoint = '/onboarding/step-2/verify-email'; break; // Assuming step 2 logic triggers this
            case 3: endpoint = '/onboarding/step-3'; break;
            case 4: endpoint = '/onboarding/step-4'; break;
            case 5: endpoint = '/onboarding/step-5'; break;
            case 6: endpoint = '/onboarding/step-6'; break;
            case 7:
                // Step 7 has multiple actions, handling basic save here or verify elsewhere?
                // The frontend likely calls specific methods for SMS. 
                // For now, if it's just saving data:
                endpoint = '/onboarding/step-7/send-sms';
                break;
            default: throw new Error(`Unknown step: ${currentStep}`);
        }

        // Special handling for Step 2 (Email/Verify) if it's just saving "emailVerified" status?
        // The backend endpoint for step-2 is /step-2/verify-email which just sets emailVerified=true.
        // If the data contains specific fields for step 1, pass them.

        await apiClient(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    /**
     * Retrieves the current wizard progress
     */
    async getWizardProgress(userId: string): Promise<Partial<WizardData> | null> {
        // @ts-ignore - profiles table not in generated types yet
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (error) return null

        const profile = data as any;

        // Map DB fields back to WizardData
        return {
            companyName: profile.company_name,
            website: profile.website,
            // ... map others
        }
    }
}
