/**
 * Message Service
 *
 * Handles all Supabase API calls for messages
 */

import { supabase } from '../lib/supabase'
import type { Message, SocialContact, Tables } from '../types/database.types'

type PlatformClient = Tables<'platform_clients'>

export interface MessageFilters {
  conversationId: number
  searchQuery?: string
  startDate?: string
  endDate?: string
}

const MESSAGES_PER_PAGE = 30

/**
 * Fetch messages for a conversation (paginated)
 */
export const getMessages = async (
  conversationId: number,
  limit: number = MESSAGES_PER_PAGE,
  beforeTimestamp?: string
): Promise<Message[]> => {
  let query = supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit)

  // For pagination: load messages before a certain timestamp
  if (beforeTimestamp) {
    query = query.lt('created_at', beforeTimestamp)
  }

  const { data, error } = await query

  if (error) throw error

  return data || []
}

/**
 * Search messages in a conversation
 */
export const searchMessages = async (
  conversationId: number,
  searchQuery: string,
  startDate?: string,
  endDate?: string
): Promise<Message[]> => {
  let query = supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  // Search in message content
  if (searchQuery) {
    query = query.ilike('content_text', `%${searchQuery}%`)
  }

  // Date range filter
  if (startDate) {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    query = query.gte('created_at', start.toISOString())
  }

  if (endDate) {
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)
    query = query.lte('created_at', end.toISOString())
  }

  const { data, error } = await query

  if (error) throw error

  return data || []
}

/**
 * Subscribe to realtime message changes for a conversation
 */
export const subscribeToMessages = (
  conversationId: number,
  callbacks: {
    onInsert?: (message: Message) => void
    onUpdate?: (message: Message) => void
  }
) => {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        if (callbacks.onInsert) {
          callbacks.onInsert(payload.new as Message)
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        if (callbacks.onUpdate) {
          callbacks.onUpdate(payload.new as Message)
        }
      }
    )
    .subscribe()

  return channel
}

/**
 * Send a message (placeholder - to be implemented with actual API)
 */
export const sendMessage = async (
  conversationId: number,
  content: string,
  senderType: 'human_agent' | 'ai' | 'bot' = 'human_agent'
): Promise<Message> => {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      content_text: content,
      sender_type: senderType,
      direction: 'outbound',
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error

  return data
}

/**
 * Interface for webhook payload data
 */
interface HumanOperatorWebhookPayload {
  message: string
  platform: string
  platform_user_id: string
  platform_client_id: number
  social_contact_id: number
  conversation_id: number
  direction: string
  created_at: string
  platform_client_whatsapp_phone?: string
  senderID?: string
}

/**
 * Send a message from human operator via webhook
 *
 * @param message - The message text to send
 * @param conversationId - The conversation ID
 * @param socialContact - The social contact data
 * @param platformClient - The platform client data
 * @returns Promise that resolves when the webhook call is successful
 */
export const sendHumanOperatorMessage = async (
  message: string,
  conversationId: number,
  socialContact: SocialContact,
  platformClient: PlatformClient
): Promise<void> => {
  // Determine webhook URL based on environment
  // MODE is automatically set by Vite: 'development' in localhost, 'production' on Vercel
  const isProduction = import.meta.env.MODE === 'production'
  const webhookUrl = isProduction
    ? import.meta.env.VITE_HUMAN_OPERATOR_WEBHOOK_PROD
    : import.meta.env.VITE_HUMAN_OPERATOR_WEBHOOK_TEST

  if (!webhookUrl) {
    throw new Error('Human operator webhook URL is not configured')
  }

  // Build base payload
  const payload: HumanOperatorWebhookPayload = {
    message,
    platform: socialContact.platform,
    platform_user_id: socialContact.platform_user_id,
    platform_client_id: socialContact.platform_client_id,
    social_contact_id: socialContact.id,
    conversation_id: conversationId,
    direction: 'outgoing',
    created_at: new Date().toISOString(),
  }

  // Add platform-specific fields
  const platform = socialContact.platform.toLowerCase()

  if (platform === 'whatsapp') {
    if (!platformClient.whatsapp_phone_id) {
      throw new Error('WhatsApp phone ID is not configured for this platform client')
    }
    payload.platform_client_whatsapp_phone = platformClient.whatsapp_phone_id
  } else if (platform === 'instagram') {
    if (!platformClient.instagram_account_id) {
      throw new Error('Instagram account ID is not configured for this platform client')
    }
    payload.senderID = platformClient.instagram_account_id
  } else if (platform === 'messenger') {
    if (!platformClient.messenger_page_id) {
      throw new Error('Messenger page ID is not configured for this platform client')
    }
    payload.senderID = platformClient.messenger_page_id
  } else {
    throw new Error(`Unsupported platform: ${socialContact.platform}`)
  }

  // Call the webhook
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to send message via webhook: ${response.status} - ${errorText}`)
  }
}
