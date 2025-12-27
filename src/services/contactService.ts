/**
 * Contact Service
 *
 * Handles all Supabase API calls for contacts (social_contacts table)
 */

import { supabase } from '../lib/supabase'
import { sanitizeInput } from '../lib/security-utils'
import type { SocialContact } from '../types/database.types'

/**
 * Escapes special characters in LIKE/ILIKE patterns to prevent SQL injection
 * @param input - String to escape
 * @returns Escaped string safe for LIKE/ILIKE queries
 */
const escapeLikePattern = (input: string): string => {
  return input.replace(/[%_]/g, '\\$&')
}

export interface ContactFilters {
  platformClientId: string
  searchQuery?: string
  channels?: string[]
  startDate?: string
  endDate?: string
}

/**
 * Fetch contacts with filters
 * Returns only master contacts (those without master_contact_id)
 */
export const getContacts = async (filters: ContactFilters): Promise<SocialContact[]> => {
  // If channel filter is applied, we need to find master contacts that have
  // the selected channel either as their main platform OR in their linked contacts
  if (filters.channels && filters.channels.length > 0) {
    // Step 1: Get all contacts (master + linked) that match the channel filter
    let channelQuery = supabase
      .from('social_contacts')
      .select('id, master_contact_id, platform')
      .eq('platform_client_id', filters.platformClientId)
      .in('platform', filters.channels)

    const { data: matchingContacts, error: channelError } = await channelQuery

    if (channelError) throw channelError

    // Step 2: Extract master contact IDs
    const masterContactIds = new Set<number>()

    for (const contact of matchingContacts || []) {
      if (contact.master_contact_id === null) {
        // This is a master contact with matching platform
        masterContactIds.add(contact.id)
      } else {
        // This is a linked contact with matching platform
        // Add its master to the set
        masterContactIds.add(contact.master_contact_id)
      }
    }

    if (masterContactIds.size === 0) {
      return []
    }

    // Step 3: Fetch full master contact data
    let query = supabase
      .from('social_contacts')
      .select('*')
      .eq('platform_client_id', filters.platformClientId)
      .in('id', Array.from(masterContactIds))

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

  // No channel filter - standard query
  let query = supabase
    .from('social_contacts')
    .select('*')
    .eq('platform_client_id', filters.platformClientId)
    .is('master_contact_id', null) // Only fetch master contacts

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
 * Get all linked contacts for a given contact
 * Returns the master contact and all linked contacts
 */
export const getLinkedContacts = async (contactId: number): Promise<SocialContact[]> => {
  // First, get the contact to determine if it's a master or linked contact
  const { data: contact, error: contactError } = await supabase
    .from('social_contacts')
    .select('*')
    .eq('id', contactId)
    .single()

  if (contactError) throw contactError
  if (!contact) return []

  // Determine the master contact ID
  const masterContactId = contact.master_contact_id || contact.id

  // Get the master contact and all linked contacts
  const { data, error } = await supabase
    .from('social_contacts')
    .select('*')
    .or(`id.eq.${masterContactId},master_contact_id.eq.${masterContactId}`)
    .order('platform')

  if (error) throw error

  return data || []
}

/**
 * Link a contact to a master contact
 * If targetContact already has a master, use that master instead
 */
export const linkContacts = async (
  contactId: number,
  targetContactId: number
): Promise<void> => {
  // Prevent linking to self
  if (contactId === targetContactId) {
    throw new Error('Cannot link a contact to itself')
  }

  // Get target contact to check if it has a master
  const { data: targetContact, error: targetError } = await supabase
    .from('social_contacts')
    .select('id, master_contact_id')
    .eq('id', targetContactId)
    .single()

  if (targetError) throw targetError
  if (!targetContact) throw new Error('Target contact not found')

  // Determine the actual master ID
  // If target already has a master, use that; otherwise, target becomes the master
  const masterContactId = targetContact.master_contact_id || targetContact.id

  // Get the contact being linked to check if it's already a master of other contacts
  const { data: existingLinked, error: linkedError } = await supabase
    .from('social_contacts')
    .select('id')
    .eq('master_contact_id', contactId)

  if (linkedError) throw linkedError

  // If this contact is already a master, we need to update all its linked contacts
  if (existingLinked && existingLinked.length > 0) {
    const linkedIds = existingLinked.map((c) => c.id)

    // Update all previously linked contacts to point to the new master
    const { error: updateError } = await supabase
      .from('social_contacts')
      .update({ master_contact_id: masterContactId })
      .in('id', linkedIds)

    if (updateError) throw updateError
  }

  // Link the contact to the master
  const { error: linkError } = await supabase
    .from('social_contacts')
    .update({ master_contact_id: masterContactId })
    .eq('id', contactId)

  if (linkError) throw linkError
}

/**
 * Unlink a contact from its master
 */
export const unlinkContact = async (contactId: number): Promise<void> => {
  const { error } = await supabase
    .from('social_contacts')
    .update({ master_contact_id: null })
    .eq('id', contactId)

  if (error) throw error
}

/**
 * Search contacts by name for linking
 */
export const searchContactsForLinking = async (
  platformClientId: string,
  searchQuery: string,
  excludeContactId?: number
): Promise<SocialContact[]> => {
  // Sanitize and escape search query to prevent SQL injection
  const sanitizedQuery = escapeLikePattern(sanitizeInput(searchQuery, 100))

  let query = supabase
    .from('social_contacts')
    .select('*')
    .eq('platform_client_id', platformClientId)
    .or(`display_name.ilike.%${sanitizedQuery}%,name.ilike.%${sanitizedQuery}%`)
    .limit(10)

  if (excludeContactId) {
    query = query.neq('id', excludeContactId)
  }

  const { data, error } = await query

  if (error) throw error

  return data || []
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
