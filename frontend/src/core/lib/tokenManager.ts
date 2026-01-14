/**
 * Platform Token Manager
 *
 * Secure token management using Supabase Vault for encrypted storage.
 * This module provides type-safe functions to store, retrieve, update, and delete
 * OAuth tokens for various platforms (WhatsApp, Instagram, Messenger).
 *
 * Security Features:
 * - All tokens are encrypted using Supabase Vault (pgsodium)
 * - Tokens never appear in plain text in the database
 * - Type-safe operations with proper error handling
 * - Hard delete implementation (no soft delete)
 */

import { supabase } from './supabase'

/**
 * Supported platform types for token management
 */
export type PlatformType = 'whatsapp' | 'instagram' | 'messenger'

/**
 * Result type for token operations
 */
export interface TokenOperationResult {
  success: boolean
  error?: string
  secretId?: string
}

/**
 * Result type for token retrieval
 */
export interface TokenRetrievalResult {
  success: boolean
  token?: string
  error?: string
}

/**
 * Stores a platform token securely in Supabase Vault
 *
 * @param platformClientId - The platform client ID
 * @param tokenType - Type of token ('whatsapp', 'instagram', or 'messenger')
 * @param tokenValue - The actual token value to encrypt and store
 * @returns Promise with operation result including secret ID
 *
 * @example
 * ```typescript
 * const result = await storePlatformToken(123, 'whatsapp', 'EAABwz...')
 * if (result.success) {
 *   console.log('Token stored with secret ID:', result.secretId)
 * }
 * ```
 */
export async function storePlatformToken(
  platformClientId: number,
  tokenType: PlatformType,
  tokenValue: string
): Promise<TokenOperationResult> {
  try {
    // Validate inputs
    if (!platformClientId || platformClientId <= 0) {
      return {
        success: false,
        error: 'Invalid platform client ID',
      }
    }

    if (!tokenValue || tokenValue.trim() === '') {
      return {
        success: false,
        error: 'Token value cannot be empty',
      }
    }

    // Call the database function to store the token
    const { data, error } = await supabase.rpc('store_platform_token', {
      p_platform_client_id: platformClientId,
      p_token_type: tokenType,
      p_token_value: tokenValue,
    })

    if (error) {
      console.error('Error storing platform token:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      secretId: data,
    }
  } catch (err) {
    console.error('Unexpected error storing platform token:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Retrieves and decrypts a platform token from Supabase Vault
 *
 * @param platformClientId - The platform client ID
 * @param tokenType - Type of token to retrieve
 * @returns Promise with the decrypted token value
 *
 * @example
 * ```typescript
 * const result = await getPlatformToken(123, 'whatsapp')
 * if (result.success && result.token) {
 *   // Use the token for API calls
 *   console.log('Token:', result.token)
 * }
 * ```
 */
export async function getPlatformToken(
  platformClientId: number,
  tokenType: PlatformType
): Promise<TokenRetrievalResult> {
  try {
    // Validate inputs
    if (!platformClientId || platformClientId <= 0) {
      return {
        success: false,
        error: 'Invalid platform client ID',
      }
    }

    // Call the database function to retrieve the token
    const { data, error } = await supabase.rpc('get_platform_token', {
      p_platform_client_id: platformClientId,
      p_token_type: tokenType,
    })

    if (error) {
      console.error('Error retrieving platform token:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    // Handle case where token doesn't exist
    if (!data) {
      return {
        success: true,
        token: undefined,
      }
    }

    return {
      success: true,
      token: data,
    }
  } catch (err) {
    console.error('Unexpected error retrieving platform token:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Updates an existing platform token in Supabase Vault
 *
 * @param platformClientId - The platform client ID
 * @param tokenType - Type of token to update
 * @param newTokenValue - The new token value to encrypt and store
 * @returns Promise with operation result including secret ID
 *
 * @example
 * ```typescript
 * const result = await updatePlatformToken(123, 'instagram', 'new-token-123')
 * if (result.success) {
 *   console.log('Token updated successfully')
 * }
 * ```
 */
export async function updatePlatformToken(
  platformClientId: number,
  tokenType: PlatformType,
  newTokenValue: string
): Promise<TokenOperationResult> {
  try {
    // Validate inputs
    if (!platformClientId || platformClientId <= 0) {
      return {
        success: false,
        error: 'Invalid platform client ID',
      }
    }

    if (!newTokenValue || newTokenValue.trim() === '') {
      return {
        success: false,
        error: 'New token value cannot be empty',
      }
    }

    // Call the database function to update the token
    const { data, error } = await supabase.rpc('update_platform_token', {
      p_platform_client_id: platformClientId,
      p_token_type: tokenType,
      p_new_token_value: newTokenValue,
    })

    if (error) {
      console.error('Error updating platform token:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      secretId: data,
    }
  } catch (err) {
    console.error('Unexpected error updating platform token:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Permanently deletes a platform token from Supabase Vault (HARD DELETE)
 *
 * WARNING: This is a permanent operation and cannot be undone.
 *
 * @param platformClientId - The platform client ID
 * @param tokenType - Type of token to delete
 * @returns Promise with operation result
 *
 * @example
 * ```typescript
 * const result = await deletePlatformToken(123, 'messenger')
 * if (result.success) {
 *   console.log('Token permanently deleted')
 * }
 * ```
 */
export async function deletePlatformToken(
  platformClientId: number,
  tokenType: PlatformType
): Promise<TokenOperationResult> {
  try {
    // Validate inputs
    if (!platformClientId || platformClientId <= 0) {
      return {
        success: false,
        error: 'Invalid platform client ID',
      }
    }

    // Call the database function to delete the token
    const { data, error } = await supabase.rpc('delete_platform_token', {
      p_platform_client_id: platformClientId,
      p_token_type: tokenType,
    })

    if (error) {
      console.error('Error deleting platform token:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: data === true,
      error: data === false ? 'Token not found' : undefined,
    }
  } catch (err) {
    console.error('Unexpected error deleting platform token:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Utility function to get all token types for a platform client
 * Returns which tokens are configured (have secret IDs)
 *
 * @param platformClientId - The platform client ID
 * @returns Promise with configured token types
 *
 * @example
 * ```typescript
 * const configured = await getConfiguredTokenTypes(123)
 * console.log('Configured platforms:', configured)
 * // Output: ['whatsapp', 'instagram']
 * ```
 */
export async function getConfiguredTokenTypes(
  platformClientId: number
): Promise<PlatformType[]> {
  try {
    const { data, error } = await supabase
      .from('platform_clients')
      .select('whatsapp_token_secret_id, instagram_token_secret_id, messenger_token_secret_id')
      .eq('id', platformClientId)
      .single()

    if (error || !data) {
      console.error('Error fetching configured tokens:', error)
      return []
    }

    const configured: PlatformType[] = []

    if (data.whatsapp_token_secret_id) configured.push('whatsapp')
    if (data.instagram_token_secret_id) configured.push('instagram')
    if (data.messenger_token_secret_id) configured.push('messenger')

    return configured
  } catch (err) {
    console.error('Unexpected error fetching configured tokens:', err)
    return []
  }
}

/**
 * Validates if a token exists for a given platform
 *
 * @param platformClientId - The platform client ID
 * @param tokenType - Type of token to check
 * @returns Promise with boolean indicating if token exists
 *
 * @example
 * ```typescript
 * const exists = await hasToken(123, 'whatsapp')
 * if (exists) {
 *   console.log('WhatsApp token is configured')
 * }
 * ```
 */
export async function hasToken(
  platformClientId: number,
  tokenType: PlatformType
): Promise<boolean> {
  try {
    const columnMap = {
      whatsapp: 'whatsapp_token_secret_id',
      instagram: 'instagram_token_secret_id',
      messenger: 'messenger_token_secret_id',
    }

    const { data, error } = await supabase
      .from('platform_clients')
      .select(columnMap[tokenType])
      .eq('id', platformClientId)
      .single()

    if (error || !data) {
      return false
    }

    return (data as any)[columnMap[tokenType]] !== null
  } catch (err) {
    console.error('Unexpected error checking token existence:', err)
    return false
  }
}
