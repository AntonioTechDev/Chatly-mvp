/**
 * Contact Service
 *
 * Handles all Supabase API calls for contacts (social_contacts table)
 */

import { supabase } from '../lib/supabase'
import type { SocialContact } from '../types/database.types'

export interface ContactFilters {
  platformClientId: string
  searchQuery?: string
  channels?: string[]
  startDate?: string
  endDate?: string
}

/**
 * Fetch contacts with filters
 */
export const getContacts = async (filters: ContactFilters): Promise<SocialContact[]> => {
  let query = supabase
    .from('social_contacts')
    .select('*')
    .eq('platform_client_id', filters.platformClientId)

  // Apply channel filter
  if (filters.channels && filters.channels.length > 0) {
    query = query.in('platform', filters.channels)
  }

  // Apply date range filter
  if (filters.startDate) {
    const start = new Date(filters.startDate)
    start.setHours(0, 0, 0, 0)
    query = query.gte('first_contact', start.toISOString())
  }

  if (filters.endDate) {
    const end = new Date(filters.endDate)
    end.setHours(23, 59, 59, 999)
    query = query.lte('first_contact', end.toISOString())
  }

  // Default order
  query = query.order('last_interaction', { ascending: false })

  const { data, error } = await query

  if (error) throw error

  return data || []
}

/**
 * Update contact fields
 */
export const updateContact = async (
  contactId: number,
  updates: Partial<SocialContact>
): Promise<SocialContact> => {
  const { data, error } = await supabase
    .from('social_contacts')
    .update(updates)
    .eq('id', contactId)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Failed to update contact')

  return data
}

/**
 * Subscribe to realtime contact changes
 */
export const subscribeToContacts = (
  platformClientId: string,
  callbacks: {
    onInsert?: (contact: SocialContact) => void
    onUpdate?: (contact: SocialContact) => void
    onDelete?: (contactId: number) => void
  }
) => {
  const channel = supabase
    .channel('contacts-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'social_contacts',
        filter: `platform_client_id=eq.${platformClientId}`,
      },
      (payload) => {
        if (payload.eventType === 'INSERT' && callbacks.onInsert) {
          callbacks.onInsert(payload.new as SocialContact)
        } else if (payload.eventType === 'UPDATE' && callbacks.onUpdate) {
          callbacks.onUpdate(payload.new as SocialContact)
        } else if (payload.eventType === 'DELETE' && callbacks.onDelete) {
          callbacks.onDelete(payload.old.id)
        }
      }
    )
    .subscribe()

  return channel
}
