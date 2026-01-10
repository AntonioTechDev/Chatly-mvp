/**
 * useMessages Hook
 *
 * Manages all business logic for messages:
 * - Fetching messages with pagination
 * - Search and date filtering
 * - Realtime subscriptions
 * - Infinite scroll
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getMessages,
  searchMessages,
  subscribeToMessages,
} from '../services/messageService'
import type { Message } from '../types/database.types'
import toast from 'react-hot-toast'

const MESSAGES_PER_PAGE = 30

export const useMessages = (conversationId: number | null) => {
  // State - Data
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State - Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // State - Sending
  const [isSending, setIsSending] = useState(false)

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return

    setIsLoading(true)
    setError(null)

    try {
      const data = await getMessages(conversationId, MESSAGES_PER_PAGE)
      setMessages(data)
      setHasMore(data.length === MESSAGES_PER_PAGE)
    } catch (err: any) {
      console.error('Error fetching messages:', err)
      setError(err.message || 'Errore caricamento messaggi')
      toast.error('Errore caricamento messaggi')
    } finally {
      setIsLoading(false)
    }
  }, [conversationId])

  // Load more messages (for infinite scroll)
  const loadMoreMessages = useCallback(async () => {
    if (!conversationId || isLoadingMore || !hasMore || messages.length === 0)
      return

    setIsLoadingMore(true)

    try {
      const oldestMessage = messages[0]
      const data = await getMessages(
        conversationId,
        MESSAGES_PER_PAGE,
        oldestMessage.created_at || undefined
      )

      setMessages((prev) => [...data, ...prev])
      setHasMore(data.length === MESSAGES_PER_PAGE)
    } catch (err: any) {
      console.error('Error loading more messages:', err)
      toast.error('Errore caricamento messaggi')
    } finally {
      setIsLoadingMore(false)
    }
  }, [conversationId, messages, isLoadingMore, hasMore])

  // Search messages
  const handleSearch = useCallback(async () => {
    if (!conversationId) return

    setIsLoading(true)

    try {
      const data = await searchMessages(
        conversationId,
        searchQuery,
        startDate,
        endDate
      )
      setMessages(data)
      setHasMore(false) // Disable pagination during search
    } catch (err: any) {
      console.error('Error searching messages:', err)
      toast.error('Errore ricerca messaggi')
    } finally {
      setIsLoading(false)
    }
  }, [conversationId, searchQuery, startDate, endDate])

  // Initial fetch on conversation change
  useEffect(() => {
    if (conversationId) {
      setMessages([])
      setIsLoading(true)
      setHasMore(true)
      fetchMessages()
    }
  }, [conversationId, fetchMessages])

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return

    const channel = subscribeToMessages(conversationId, {
      onInsert: (newMessage) => {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === newMessage.id)) return prev
          return [...prev, newMessage]
        })
      },
      onUpdate: (updatedMessage) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === updatedMessage.id ? updatedMessage : msg
          )
        )
      },
    })

    return () => {
      channel.unsubscribe()
    }
  }, [conversationId])

  // Handlers - Filters
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
  }, [])

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
    fetchMessages() // Reload messages without filters
  }, [fetchMessages])

  // Has active filters
  const hasActiveFilters = useMemo(() => {
    return !!(searchQuery || startDate || endDate)
  }, [searchQuery, startDate, endDate])

  // Return everything
  return {
    // Data
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    error,

    // Filter state
    searchQuery,
    startDate,
    endDate,
    hasActiveFilters,

    // Actions
    handleSearchChange,
    handleDateChange,
    handleClearFilters,
    handleSearch,
    loadMoreMessages,
    refetch: fetchMessages,
  }
}
