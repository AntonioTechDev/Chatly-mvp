import { supabase } from '@/core/lib/supabase'
import type { Message, Conversation, SocialContact } from '@/core/types/database.types'

export interface DashboardStats {
    totalConversations: number
    totalMessages: number
    totalLeads: number
    conversationsByChannel: { name: string; value: number }[]
    messagesBySender: { name: string; value: number }[]
    messagesLast7Days: { date: string; messages: number }[]
}

export type TimeRange = '7d' | '1m' | '3m' | '6m' | '1y'

export interface ReportData {
    conversations: (Conversation & { messages: Message[] })[]
    leads: SocialContact[]
    startDate: string
    endDate: string
}

export const fetchDashboardStats = async (
    platformClientId: number,
    timeRange: TimeRange
): Promise<DashboardStats> => {
    try {
        const { start, end } = calculateDateRange(timeRange)

        // Fetch ONLY conversations count and data (without messages) - MUCH FASTER
        const { data: conversations, error: convError, count: totalConversations } = await supabase
            .from('conversations')
            .select('id, channel', { count: 'exact' })
            .eq('platform_client_id', platformClientId)

        if (convError) throw convError

        // Count leads
        const { count: totalLeads, error: leadsError } = await supabase
            .from('social_contacts')
            .select('id', { count: 'exact', head: true })
            .eq('platform_client_id', platformClientId)

        if (leadsError) throw leadsError

        // Count total messages - much faster than loading all
        const { count: totalMessages, error: messagesError } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .in('conversation_id', conversations?.map(c => c.id) || [])

        if (messagesError) throw messagesError

        // Process conversations by channel
        const channelCounts = conversations?.reduce((acc: any, conv) => {
            const channel = conv.channel || 'unknown'
            acc[channel] = (acc[channel] || 0) + 1
            return acc
        }, {})

        const conversationsByChannel = Object.entries(channelCounts || {}).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value: value as number
        }))

        // Fetch ONLY recent messages for sender type stats (last 100 instead of ALL)
        const { data: recentMessagesForStats } = await supabase
            .from('messages')
            .select('sender_type')
            .in('conversation_id', conversations?.map(c => c.id) || [])
            .order('created_at', { ascending: false })
            .limit(100)

        // Messages by sender type
        const senderCounts = recentMessagesForStats?.reduce((acc: any, msg) => {
            const type = msg.sender_type || 'unknown'
            acc[type] = (acc[type] || 0) + 1
            return acc
        }, {}) || {}

        const messagesBySender = Object.entries(senderCounts).map(([name, value]) => ({
            name: name === 'user' ? 'Cliente' : name === 'human_agent' ? 'Agente' : name === 'bot' ? 'Bot' : name === 'ai' ? 'AI Assistant' : 'Sistema',
            value: value as number
        }))

        // Determine the grouping interval
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        let intervals: { start: Date; end: Date; label: string }[] = []

        if (timeRange === '7d') {
            // Daily for 7 days
            intervals = Array.from({ length: 7 }, (_, i) => {
                const date = new Date(start)
                date.setDate(start.getDate() + i)
                return {
                    start: new Date(date.setHours(0, 0, 0, 0)),
                    end: new Date(date.setHours(23, 59, 59, 999)),
                    label: date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
                }
            })
        } else if (timeRange === '1m') {
            // Daily for 1 month (30 days)
            const days = 30
            intervals = Array.from({ length: days }, (_, i) => {
                const date = new Date(start)
                date.setDate(start.getDate() + i)
                return {
                    start: new Date(date.setHours(0, 0, 0, 0)),
                    end: new Date(date.setHours(23, 59, 59, 999)),
                    label: date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
                }
            })
        } else {
            // Weekly aggregation for 3m, 6m, 1y
            const weeks = Math.ceil(daysDiff / 7)
            intervals = Array.from({ length: weeks }, (_, i) => {
                const weekStart = new Date(start)
                weekStart.setDate(start.getDate() + (i * 7))
                const weekEnd = new Date(weekStart)
                weekEnd.setDate(weekStart.getDate() + 6)
                weekEnd.setHours(23, 59, 59, 999)
                return {
                    start: weekStart,
                    end: weekEnd > end ? end : weekEnd,
                    label: weekStart.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
                }
            })
        }

        // Fetch messages for the entire range
        const { data: rangeMessages } = await supabase
            .from('messages')
            .select('created_at')
            .in('conversation_id', conversations?.map(c => c.id) || [])
            .gte('created_at', start.toISOString())
            .lte('created_at', end.toISOString())
            .order('created_at', { ascending: true })

        const messagesLast7Days = intervals.map(interval => {
            const count = rangeMessages?.filter(msg => {
                if (!msg.created_at) return false
                const msgDate = new Date(msg.created_at)
                return msgDate >= interval.start && msgDate <= interval.end
            }).length || 0
            return {
                date: interval.label,
                messages: count
            }
        })

        return {
            totalConversations: totalConversations || 0,
            totalMessages: totalMessages || 0,
            totalLeads: totalLeads || 0,
            conversationsByChannel,
            messagesBySender,
            messagesLast7Days
        }

    } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        throw error
    }
}

export const fetchReportData = async (
    platformClientId: number,
    startDate: string,
    endDate: string
): Promise<{ conversations: any[]; leads: any[] }> => {
    // Fetch data for the selected period
    const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('*, messages(*)')
        .eq('platform_client_id', platformClientId)
        .gte('started_at', startDate)
        .lte('started_at', endDate + 'T23:59:59')

    if (convError) throw convError

    const { data: leads, error: leadsError } = await supabase
        .from('social_contacts')
        .select('*')
        .eq('platform_client_id', platformClientId)
        .gte('first_contact', startDate)
        .lte('first_contact', endDate + 'T23:59:59')

    if (leadsError) throw leadsError

    return { conversations: conversations || [], leads: leads || [] }
}

const calculateDateRange = (timeRange: TimeRange) => {
    const end = new Date()
    const start = new Date()

    switch (timeRange) {
        case '7d':
            start.setDate(end.getDate() - 6)
            break
        case '1m':
            start.setMonth(end.getMonth() - 1)
            break
        case '3m':
            start.setMonth(end.getMonth() - 3)
            break
        case '6m':
            start.setMonth(end.getMonth() - 6)
            break
        case '1y':
            start.setFullYear(end.getFullYear() - 1)
            break
    }

    return { start, end }
}
