import React, { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Message, ConversationWithRelations } from '../types/database.types'
import toast from 'react-hot-toast'
import { escapeRegex } from '../lib/security-utils'

interface ChatAreaProps {
  conversation: ConversationWithRelations
  onToggleLeadDetails: () => void
  isLeadDetailsPanelOpen: boolean
}

const MESSAGES_PER_PAGE = 30

const ChatArea: React.FC<ChatAreaProps> = ({ conversation, onToggleLeadDetails, isLeadDetailsPanelOpen }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = useCallback(async (loadMore = false) => {
    try {
      const loadingFn = loadMore ? setIsLoadingMore : setIsLoading
      loadingFn(true)

      // Use callback form to get current messages without depending on messages state
      if (loadMore) {
        setMessages((currentMessages) => {
          // If we're loading more and have messages, fetch older ones
          if (currentMessages.length > 0) {
            const oldestMessage = currentMessages[0]
            supabase
              .from('messages')
              .select('*')
              .eq('conversation_id', conversation.id)
              .lt('created_at', oldestMessage.created_at)
              .order('created_at', { ascending: true })
              .limit(MESSAGES_PER_PAGE)
              .then(({ data, error }) => {
                if (error) {
                  console.error('Error fetching more messages:', error)
                  toast.error('Errore caricamento messaggi')
                } else {
                  setMessages((prev) => [...(data || []), ...prev])
                  setHasMore((data || []).length === MESSAGES_PER_PAGE)
                }
                setIsLoadingMore(false)
              })
          }
          return currentMessages
        })
      } else {
        // Initial load: get last 30 messages
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true })
          .limit(MESSAGES_PER_PAGE)

        if (error) throw error

        setMessages(data || [])
        setHasMore((data || []).length === MESSAGES_PER_PAGE)
        // Scroll to bottom on initial load
        setTimeout(scrollToBottom, 100)
        setIsLoading(false)
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error)
      toast.error('Errore caricamento messaggi')
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [conversation.id])

  useEffect(() => {
    // Reset state when conversation changes
    setMessages([])
    setIsLoading(true)
    setHasMore(true)

    // Fetch initial messages
    fetchMessages()

    // Setup realtime subscription
    channelRef.current = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message
          setMessages((prev) => {
            // Check if message already exists (to avoid duplicates)
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev
            }
            return [...prev, newMessage]
          })
          setTimeout(scrollToBottom, 100)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          )
        }
      )
      .subscribe()

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
    }
  }, [conversation.id, fetchMessages])

  // Filter messages client-side
  const filteredMessages = messages.filter((message) => {
    // Apply search filter
    if (searchQuery && message.content_text) {
      if (!message.content_text.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
    }

    // Apply date range filter
    if ((startDate || endDate) && message.created_at) {
      const messageDate = new Date(message.created_at)
      messageDate.setHours(0, 0, 0, 0)

      if (startDate) {
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        if (messageDate < start) {
          return false
        }
      }

      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        if (messageDate > end) {
          return false
        }
      }
    }

    return true
  })

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

  const handleScroll = () => {
    if (!messagesContainerRef.current || isLoadingMore || !hasMore) return

    const { scrollTop } = messagesContainerRef.current

    // Load more when scrolled to top
    if (scrollTop < 100) {
      fetchMessages(true)
    }
  }

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getLeadName = () => {
    return (
      conversation.social_contact?.display_name ||
      conversation.social_contact?.name ||
      conversation.social_contact?.phone ||
      'Sconosciuto'
    )
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Caricamento messaggi...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-700 font-semibold">
                {getLeadName().charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{getLeadName()}</h3>
              <p className="text-xs text-gray-500">{conversation.channel}</p>
            </div>
          </div>
          <button
            onClick={onToggleLeadDetails}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            title={isLeadDetailsPanelOpen ? "Nascondi dettagli lead" : "Mostra dettagli lead"}
          >
            {isLeadDetailsPanelOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>

        {/* Filters */}
        <div className="mt-4 space-y-2">
          {/* Search Input */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cerca nei messaggi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Date Range */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
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
            <span className="text-gray-500 text-sm">→</span>
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
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                title="Cancella filtro date"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {isLoadingMore && (
          <div className="text-center py-2">
            <div className="inline-block animate-spin h-5 w-5 border-2 border-primary-600 border-t-transparent rounded-full"></div>
          </div>
        )}

        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="mt-4 text-sm text-gray-500">
              {searchQuery || startDate || endDate ? 'Nessun messaggio corrisponde ai filtri' : 'Nessun messaggio trovato'}
            </p>
          </div>
        ) : (
          filteredMessages.map((message, index) => {
            const senderType = message.sender_type || 'user'
            // Client messages on left, agent/bot/ai on right
            const isLeftAligned = senderType === 'user' || senderType === 'system'

            // Determina colori basati su sender_type
            const getSenderColors = () => {
              switch (senderType) {
                case 'user':
                  return {
                    bg: 'bg-blue-50',
                    text: 'text-gray-900',
                    timeText: 'text-gray-500',
                    label: 'Cliente',
                    labelColor: 'text-blue-700'
                  }
                case 'human_agent':
                  return {
                    bg: 'bg-blue-600',
                    text: 'text-white',
                    timeText: 'text-blue-100',
                    label: 'Agente',
                    labelColor: 'text-blue-700'
                  }
                case 'bot':
                  return {
                    bg: 'bg-green-600',
                    text: 'text-white',
                    timeText: 'text-green-100',
                    label: 'Bot',
                    labelColor: 'text-green-700'
                  }
                case 'ai':
                  return {
                    bg: 'bg-purple-600',
                    text: 'text-white',
                    timeText: 'text-purple-100',
                    label: 'AI Assistant',
                    labelColor: 'text-purple-700'
                  }
                case 'system':
                  return {
                    bg: 'bg-yellow-100',
                    text: 'text-yellow-900',
                    timeText: 'text-yellow-600',
                    label: 'Sistema',
                    labelColor: 'text-yellow-700'
                  }
                default:
                  return {
                    bg: 'bg-gray-200',
                    text: 'text-gray-900',
                    timeText: 'text-gray-500',
                    label: 'Sconosciuto',
                    labelColor: 'text-gray-700'
                  }
              }
            }

            const colors = getSenderColors()
            const showDate =
              index === 0 ||
              formatDate(filteredMessages[index - 1]?.created_at) !== formatDate(message.created_at)

            return (
              <React.Fragment key={message.id}>
                {showDate && (
                  <div className="flex justify-center">
                    <span className="px-3 py-1 text-xs bg-gray-200 text-gray-600 rounded-full">
                      {formatDate(message.created_at)}
                    </span>
                  </div>
                )}
                <div className={`flex ${isLeftAligned ? 'justify-start' : 'justify-end'}`}>
                  <div className="max-w-md">
                    <div className={`px-4 py-2 rounded-lg shadow-sm ${colors.bg} ${colors.text}`}>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`text-xs font-medium ${colors.labelColor}`}>
                          {colors.label}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content_text ? highlightText(message.content_text, searchQuery) : '[Media]'}
                      </p>
                      <p className={`text-xs mt-1 ${colors.timeText}`}>
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

export default ChatArea
