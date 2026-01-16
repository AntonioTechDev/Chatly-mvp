import { supabase } from '@/lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface ApiRequestOptions extends RequestInit {
    headers?: Record<string, string>;
}

export const apiClient = async <T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        };

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const errorMsg = `API Error: ${response.status} ${response.statusText}`;
            throw new Error(errorMsg);
        }

        return response.json() as Promise<T>;
    } catch (error) {
        console.error('API Request Failed:', error);
        throw error;
    }
};
