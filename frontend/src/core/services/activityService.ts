import { supabase } from '@/core/lib/supabase'
import type { Message } from '@/core/types/database.types'

export interface ActivityFilter {
    channel: string
    senderType: string
    direction: string
}

export const fetchActivityLogs = async (
    platformClientId: number,
    filters: ActivityFilter
): Promise<Message[]> => {
    try {
        // Get conversations for this client
        const { data: conversations, error: convError } = await supabase
            .from('conversations')
            .select('id')
            .eq('platform_client_id', platformClientId)

        if (convError) throw convError

        const conversationIds = conversations?.map(c => c.id) || []

        if (conversationIds.length === 0) {
            return []
        }

        // Build query
        let query = supabase
            .from('messages')
            .select('*')
            .in('conversation_id', conversationIds)
            .order('created_at', { ascending: false })
            .limit(100)

        // Apply filters
        if (filters.direction !== 'all') {
            query = query.eq('direction', filters.direction)
        }
        if (filters.senderType !== 'all') {
            query = query.eq('sender_type', filters.senderType)
        }

        const { data: messagesData, error: messagesError } = await query

        if (messagesError) throw messagesError

        return messagesData || []
    } catch (error) {
        console.error('Error in fetchActivityLogs:', error)
        throw error
    }
}

export const verifyMessageOwnership = async (
    messageId: number,
    platformClientId: number
): Promise<boolean> => {
    // We need to fetch the message first to get conversation_id, or if we have the message object we just need conversation_id.
    // In the calling code we have the message object usually.
    // Let's assume we pass conversation_id
    return false
}

export const verifyConversationOwnership = async (
    conversationId: number,
    platformClientId: number
): Promise<boolean> => {
    const { data: conversation } = await supabase
        .from('conversations')
        .select('platform_client_id')
        .eq('id', conversationId)
        .single()

    return conversation?.platform_client_id === platformClientId
}
