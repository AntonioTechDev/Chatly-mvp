/**
 * useConversations Hook
 *
 * Manages all business logic for conversations:
 * - Fetching conversations from Supabase
 * - Search and date filtering
 * - Realtime subscriptions
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  getConversations,
  subscribeToConversations,
  subscribeToConversationMessages,
} from '../services/conversationService'
import type { ConversationWithRelations } from '../types/database.types'
import toast from 'react-hot-toast'

export const useConversations = (channel: 'whatsapp' | 'instagram' | 'messenger') => {
  const { clientData } = useAuth()

  // State - Data
  const [conversations, setConversations] = useState<ConversationWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State - Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!clientData?.id) return

    setIsLoading(true)
    setError(null)

    try {
      const data = await getConversations({
        platformClientId: clientData.id,
        channel,
      })

      setConversations(data)
    } catch (err: any) {
      console.error('Error fetching conversations:', err)
      setError(err.message || 'Errore caricamento conversazioni')
      toast.error('Errore caricamento conversazioni')
    } finally {
      setIsLoading(false)
    }
  }, [clientData?.id, channel])

  // Initial fetch
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Realtime subscription for conversations
  useEffect(() => {
    if (!clientData?.id) return

    const conversationsChannel = subscribeToConversations(channel, {
      onInsert: (newConversation) => {
        setConversations((prev) => [newConversation, ...prev])
      },
      onUpdate: (updatedConversation) => {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === updatedConversation.id
              ? { ...conv, ...updatedConversation }
              : conv
          )
        )
      },
    })

    return () => {
      conversationsChannel.unsubscribe()
    }
  }, [clientData?.id, channel])

  // Realtime subscription for new messages
  useEffect(() => {
    const messagesChannel = subscribeToConversationMessages({
      onNewMessage: (newMessage) => {
        // Update the conversation's last message and move to top
        setConversations((prev) => {
          const convIndex = prev.findIndex(
            (c) => c.id === newMessage.conversation_id
          )
          if (convIndex === -1) return prev

          const updatedConversations = [...prev]
          const conversation = { ...updatedConversations[convIndex] }
          conversation.messages = [newMessage]

          // Remove from current position and add to top
          updatedConversations.splice(convIndex, 1)
          return [conversation, ...updatedConversations]
        })
      },
    })

    return () => {
      messagesChannel.unsubscribe()
    }
  }, [])

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      // Search filter
      const matchesSearch =
        !searchQuery ||
        conv.social_contact?.display_name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        conv.social_contact?.name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        conv.social_contact?.phone?.includes(searchQuery) ||
        conv.social_contact?.email
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase())

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

  // Handlers - Search
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
  }, [])

  // Handlers - Date filters
  const handleDateChange = useCallback(
    (type: 'start' | 'end', value: string) => {
      if (type === 'start') {
        setStartDate(value)
      } else {
        setEndDate(value)
      }
    },
    []
  )

  const handleClearFilters = useCallback(() => {
    setSearchQuery('')
    setStartDate('')
    setEndDate('')
  }, [])

  // Return everything
  return {
    // Data
    conversations: filteredConversations,
    allConversations: conversations,
    isLoading,
    error,

    // Filter state
    searchQuery,
    startDate,
    endDate,

    // Actions
    handleSearchChange,
    handleDateChange,
    handleClearFilters,
    refetch: fetchConversations,
  }
}
