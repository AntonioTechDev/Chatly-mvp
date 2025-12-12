/**
 * Message Service
 *
 * Handles all Supabase API calls for messages
 */

import { supabase } from '../lib/supabase'
import type { Message } from '../types/database.types'

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
