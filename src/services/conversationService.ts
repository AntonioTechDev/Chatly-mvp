/**
 * Conversation Service
 *
 * Handles all Supabase API calls for conversations
 */

import { supabase } from '../lib/supabase'
import type { ConversationWithRelations } from '../types/database.types'

export interface ConversationFilters {
  platformClientId: string
  channel: 'whatsapp' | 'instagram' | 'messenger'
  searchQuery?: string
  startDate?: string
  endDate?: string
}

/**
 * Fetch conversations with relations and last message
 * Optimized to avoid N+1 queries
 */
export const getConversations = async (
  filters: ConversationFilters
): Promise<ConversationWithRelations[]> => {
  // Fetch conversations with relations
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select(`
      *,
      social_contact:social_contacts(*),
      platform_client:platform_clients(*)
    `)
    .eq('platform_client_id', filters.platformClientId)
    .eq('channel', filters.channel)
    .order('started_at', { ascending: false })

  if (convError) throw convError

  if (!conversations || conversations.length === 0) {
    return []
  }

  // Fetch last message for each conversation (single query)
  const conversationIds = conversations.map((c) => c.id)

  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select('*')
    .in('conversation_id', conversationIds)
    .order('created_at', { ascending: false })

  if (msgError) throw msgError

  // Group messages by conversation_id and get only the latest
  const lastMessagesByConv = new Map()
  messages?.forEach((msg) => {
    if (!lastMessagesByConv.has(msg.conversation_id)) {
      lastMessagesByConv.set(msg.conversation_id, msg)
    }
  })

  // Attach last message to each conversation
  const conversationsWithMessages = conversations.map((conv) => ({
    ...conv,
    messages: lastMessagesByConv.has(conv.id)
      ? [lastMessagesByConv.get(conv.id)]
      : [],
  }))

  return conversationsWithMessages as ConversationWithRelations[]
}

/**
 * Subscribe to realtime conversation changes
 */
export const subscribeToConversations = (
  channel: string,
  callbacks: {
    onInsert?: (conversation: ConversationWithRelations) => void
    onUpdate?: (conversation: Partial<ConversationWithRelations> & { id: number }) => void
  }
) => {
  const conversationsChannel = supabase
    .channel(`conversations:${channel}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'conversations',
        filter: `channel=eq.${channel}`,
      },
      async (payload) => {
        if (!callbacks.onInsert) return

        // Fetch the full conversation with relations
        const { data } = await supabase
          .from('conversations')
          .select(`
            *,
            social_contact:social_contacts(*),
            platform_client:platform_clients(*)
          `)
          .eq('id', payload.new.id)
          .single()

        if (data) {
          callbacks.onInsert({ ...data, messages: [] } as ConversationWithRelations)
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations',
        filter: `channel=eq.${channel}`,
      },
      (payload) => {
        if (callbacks.onUpdate) {
          callbacks.onUpdate(payload.new as any)
        }
      }
    )
    .subscribe()

  return conversationsChannel
}

/**
 * Subscribe to realtime message changes for conversations
 */
export const subscribeToConversationMessages = (
  callbacks: {
    onNewMessage?: (message: any) => void
  }
) => {
  const messagesChannel = supabase
    .channel('conversation-messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      (payload) => {
        if (callbacks.onNewMessage) {
          callbacks.onNewMessage(payload.new)
        }
      }
    )
    .subscribe()

  return messagesChannel
}
