/**
 * Supabase Query Helpers
 *
 * Reusable query functions with error handling and TypeScript support
 */

import { supabase } from './supabase'
import type {
  PlatformClient,
  SocialContact,
  Conversation,
  Message,
  Appointment,
  ConversationWithRelations,
  MessageWithRelations,
  SocialContactWithRelations,
  DocumentMatch,
} from '../types/database.types'

// ============================================================================
// PLATFORM CLIENTS
// ============================================================================

export const getPlatformClient = async (id: number) => {
  const { data, error } = await supabase
    .from('platform_clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as PlatformClient
}

export const getPlatformClientByEmail = async (email: string) => {
  const { data, error } = await supabase
    .from('platform_clients')
    .select('*')
    .eq('email', email)
    .single()

  if (error) throw error
  return data as PlatformClient
}

export const updatePlatformClient = async (
  id: number,
  updates: Partial<PlatformClient>
) => {
  const { data, error } = await supabase
    .from('platform_clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as PlatformClient
}

// ============================================================================
// SOCIAL CONTACTS
// ============================================================================

export const getSocialContacts = async (platformClientId: number) => {
  const { data, error } = await supabase
    .from('social_contacts')
    .select('*')
    .eq('platform_client_id', platformClientId)
    .order('last_interaction', { ascending: false })

  if (error) throw error
  return data as SocialContact[]
}

export const getSocialContact = async (id: number) => {
  const { data, error } = await supabase
    .from('social_contacts')
    .select(`
      *,
      platform_client:platform_clients(*),
      messages(*),
      conversations(*),
      appointments(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as SocialContactWithRelations
}

export const getSocialContactByPlatformUser = async (
  platformClientId: number,
  platform: string,
  platformUserId: string
) => {
  const { data, error } = await supabase
    .from('social_contacts')
    .select('*')
    .eq('platform_client_id', platformClientId)
    .eq('platform', platform)
    .eq('platform_user_id', platformUserId)
    .single()

  if (error) throw error
  return data as SocialContact
}

export const updateSocialContact = async (
  id: number,
  updates: Partial<SocialContact>
) => {
  const { data, error } = await supabase
    .from('social_contacts')
    .update({
      ...updates,
      last_interaction: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as SocialContact
}

export const createSocialContact = async (
  contact: Omit<SocialContact, 'id' | 'created_at' | 'updated_at'>
) => {
  const { data, error } = await supabase
    .from('social_contacts')
    .insert(contact)
    .select()
    .single()

  if (error) throw error
  return data as SocialContact
}

// ============================================================================
// CONVERSATIONS
// ============================================================================

export const getConversations = async (
  platformClientId: number,
  status?: string
) => {
  let query = supabase
    .from('conversations')
    .select(`
      *,
      social_contact:social_contacts(*),
      platform_client:platform_clients(*),
      messages(*)
    `)
    .eq('platform_client_id', platformClientId)
    .order('started_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) throw error
  return data as ConversationWithRelations[]
}

export const getConversation = async (id: number) => {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      social_contact:social_contacts(*),
      platform_client:platform_clients(*),
      messages(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as ConversationWithRelations
}

export const createConversation = async (
  conversation: Omit<Conversation, 'id' | 'started_at'>
) => {
  const { data, error } = await supabase
    .from('conversations')
    .insert(conversation)
    .select()
    .single()

  if (error) throw error
  return data as Conversation
}

export const updateConversation = async (
  id: number,
  updates: Partial<Conversation>
) => {
  const { data, error } = await supabase
    .from('conversations')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Conversation
}

export const closeConversation = async (id: number) => {
  return updateConversation(id, {
    status: 'closed',
    closed_at: new Date().toISOString(),
  })
}

// ============================================================================
// MESSAGES
// ============================================================================

export const getMessages = async (
  conversationId: number,
  limit: number = 100
) => {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      social_contact:social_contacts(*),
      conversation:conversations(*)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) throw error
  return data as MessageWithRelations[]
}

export const createMessage = async (
  message: Omit<Message, 'id' | 'created_at'>
) => {
  const { data, error } = await supabase
    .from('messages')
    .insert(message)
    .select()
    .single()

  if (error) throw error
  return data as Message
}

export const getMessagesBySocialContact = async (
  socialContactId: number,
  limit: number = 50
) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('social_contact_id', socialContactId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as Message[]
}

// ============================================================================
// APPOINTMENTS
// ============================================================================

export const getAppointments = async (
  platformClientId: number,
  status?: string
) => {
  let query = supabase
    .from('appointments')
    .select(`
      *,
      social_contact:social_contacts(*),
      platform_client:platform_clients(*)
    `)
    .eq('platform_client_id', platformClientId)
    .order('scheduled_for', { ascending: true })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export const createAppointment = async (
  appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>
) => {
  const { data, error } = await supabase
    .from('appointments')
    .insert(appointment)
    .select()
    .single()

  if (error) throw error
  return data as Appointment
}

export const updateAppointment = async (
  id: number,
  updates: Partial<Appointment>
) => {
  const { data, error } = await supabase
    .from('appointments')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Appointment
}

// ============================================================================
// DOCUMENTS & RAG
// ============================================================================

export const searchDocuments = async (
  queryEmbedding: string,
  platformClientId?: number,
  matchCount: number = 5
) => {
  const filter = platformClientId
    ? { platform_client_id: platformClientId }
    : undefined

  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_count: matchCount,
    filter,
  })

  if (error) throw error
  return data as DocumentMatch[]
}

// ============================================================================
// REALTIME SUBSCRIPTIONS
// ============================================================================

export const subscribeToMessages = (
  conversationId: number,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`messages:conversation_id=eq.${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      callback
    )
    .subscribe()
}

export const subscribeToConversations = (
  platformClientId: number,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`conversations:platform_client_id=eq.${platformClientId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `platform_client_id=eq.${platformClientId}`,
      },
      callback
    )
    .subscribe()
}

// ============================================================================
// STATS & ANALYTICS
// ============================================================================

export const getConversationStats = async (platformClientId: number) => {
  const { count: totalConversations } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('platform_client_id', platformClientId)

  const { count: openConversations } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('platform_client_id', platformClientId)
    .eq('status', 'open')

  const { count: totalContacts } = await supabase
    .from('social_contacts')
    .select('*', { count: 'exact', head: true })
    .eq('platform_client_id', platformClientId)

  const { count: qualifiedLeads } = await supabase
    .from('social_contacts')
    .select('*', { count: 'exact', head: true })
    .eq('platform_client_id', platformClientId)
    .eq('qualification_status', 'qualified')

  return {
    totalConversations: totalConversations || 0,
    openConversations: openConversations || 0,
    totalContacts: totalContacts || 0,
    qualifiedLeads: qualifiedLeads || 0,
  }
}
