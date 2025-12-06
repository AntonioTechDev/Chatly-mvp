import React, { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import type { ConversationWithRelations } from '../types/database.types'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { escapeRegex } from '../lib/security-utils'

interface ConversationsSidebarProps {
  channel: 'whatsapp' | 'instagram' | 'messenger'
  selectedConversationId: number | null
  onSelectConversation: (conversation: ConversationWithRelations) => void
}

const ConversationsSidebar: React.FC<ConversationsSidebarProps> = ({
  channel,
  selectedConversationId,
  onSelectConversation,
}) => {
  const { clientData } = useAuth()
  const [conversations, setConversations] = useState<ConversationWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    if (!clientData?.id) return

    const fetchConversations = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select(`
            *,
            social_contact:social_contacts(*),
            platform_client:platform_clients(*)
          `)
          .eq('platform_client_id', clientData.id)
          .eq('channel', channel)
          .order('started_at', { ascending: false })

        if (error) throw error

        // Fetch last message for each conversation
        const conversationsWithMessages = await Promise.all(
          (data || []).map(async (conv) => {
            const { data: messages } = await supabase
              .from('messages')
              .select('*')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)

            return {
              ...conv,
              messages: messages || []
            }
          })
        )

        setConversations(conversationsWithMessages as ConversationWithRelations[])
      } catch (error: any) {
        console.error('Error fetching conversations:', error)
        toast.error('Errore caricamento conversazioni')
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversations()

    // Realtime subscription for new conversations
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
            setConversations(prev => [{ ...data, messages: [] } as ConversationWithRelations, ...prev])
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
        async (payload) => {
          // Update the conversation in the list
          setConversations(prev =>
            prev.map(conv =>
              conv.id === payload.new.id
                ? { ...conv, ...payload.new }
                : conv
            )
          )
        }
      )
      .subscribe()

    // Realtime subscription for new messages
    const messagesChannel = supabase
      .channel(`messages:${channel}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMessage = payload.new
          // Update the conversation's last message and move to top
          setConversations(prev => {
            const convIndex = prev.findIndex(c => c.id === newMessage.conversation_id)
            if (convIndex === -1) return prev

            const updatedConversations = [...prev]
            const conversation = { ...updatedConversations[convIndex] }
            conversation.messages = [newMessage]

            // Remove from current position and add to top
            updatedConversations.splice(convIndex, 1)
            return [conversation, ...updatedConversations]
          })
        }
      )
      .subscribe()

    return () => {
      conversationsChannel.unsubscribe()
      messagesChannel.unsubscribe()
    }
  }, [clientData?.id, channel])

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      // Search filter
      const matchesSearch =
        !searchQuery ||
        conv.social_contact?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.social_contact?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.social_contact?.phone?.includes(searchQuery) ||
        conv.social_contact?.email?.toLowerCase().includes(searchQuery.toLowerCase())

      // Date range filter
      if (startDate || endDate) {
        const convDate = new Date(conv.started_at)
        convDate.setHours(0, 0, 0, 0)

        if (startDate) {
          const start = new Date(startDate)
          start.setHours(0, 0, 0, 0)
          if (convDate < start) {
            return false
          }
        }

        if (endDate) {
          const end = new Date(endDate)
          end.setHours(23, 59, 59, 999)
          if (convDate > end) {
            return false
          }
        }
      }

      return matchesSearch
    })
  }, [conversations, searchQuery, startDate, endDate])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Ieri'
    } else if (diffDays < 7) {
      return `${diffDays}g fa`
    } else {
      return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
    }
  }

  const getLastMessage = (conv: ConversationWithRelations) => {
    if (!conv.messages || conv.messages.length === 0) return 'Nessun messaggio'
    const lastMsg = conv.messages[conv.messages.length - 1]
    return lastMsg.content_text || 'Media'
  }

  // Highlight search text
  const highlightText = (text: string, query: string) => {
    if (!query || !text) return text

    // Escape regex special characters to prevent ReDoS
    const escapedQuery = escapeRegex(query)
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'))
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={index} className="bg-yellow-200 text-gray-900">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    )
  }

  const getChannelIcon = () => {
    switch (channel) {
      case 'whatsapp':
        return (
          <svg className="w-5 h-5 text-whatsapp" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
        )
      case 'instagram':
        return (
          <svg className="w-5 h-5 text-instagram" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
        )
      case 'messenger':
        return (
          <svg className="w-5 h-5 text-messenger" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.11C24 4.975 18.627 0 12 0zm1.193 14.963l-3.056-3.259-5.963 3.259L10.732 8l3.13 3.259L19.752 8l-6.559 6.963z"/>
          </svg>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="w-96 bg-white border-r border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Caricamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full lg:w-96 bg-white lg:border-r border-gray-200 flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          {getChannelIcon()}
          <h2 className="text-lg font-semibold text-gray-900 capitalize">{channel}</h2>
          <span className="ml-auto text-sm text-gray-500">
            {filteredConversations.length}
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Cerca conversazioni..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Date Range Filter */}
        <div className="mt-2 space-y-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Data inizio"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Data fine"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('')
                  setEndDate('')
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors flex-shrink-0"
                title="Cancella filtro date"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="mt-4 text-sm text-gray-500">
              {searchQuery || startDate || endDate ? 'Nessuna conversazione corrisponde ai filtri' : 'Nessuna conversazione trovata'}
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv)}
              className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left ${
                selectedConversationId === conv.id ? 'bg-primary-50' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <p className="font-medium text-gray-900 truncate flex-1">
                  {highlightText(
                    conv.social_contact?.display_name ||
                      conv.social_contact?.name ||
                      conv.social_contact?.phone ||
                      'Sconosciuto',
                    searchQuery
                  )}
                </p>
                <span className="text-xs text-gray-500 ml-2">
                  {formatTime(conv.started_at)}
                </span>
              </div>
              <p className="text-sm text-gray-600 truncate">
                {highlightText(getLastMessage(conv), searchQuery)}
              </p>
              {conv.status && (
                <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                  conv.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {conv.status}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  )
}

export default ConversationsSidebar
