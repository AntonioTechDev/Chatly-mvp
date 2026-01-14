import { supabase } from '@/core/lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export interface ApiRequestOptions extends RequestInit {
    headers?: Record<string, string>;
}

export const apiClient = async <T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> => {
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
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
};
