import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import MainSidebar from '../components/layout/MainSidebar'
import { supabase } from '../lib/supabase'
import type { Message } from '../types/database.types'
import toast from 'react-hot-toast'

const LogActivityPage: React.FC = () => {
  const { user, clientData } = useAuth()
  const navigate = useNavigate()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterChannel, setFilterChannel] = useState<string>('all')
  const [filterSenderType, setFilterSenderType] = useState<string>('all')
  const [filterDirection, setFilterDirection] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedMessage, setExpandedMessage] = useState<number | null>(null)

  useEffect(() => {
    if (!user || !clientData) {
      navigate('/login')
      return
    }

    fetchMessages()
    subscribeToMessages()
  }, [user, clientData, navigate, filterChannel, filterSenderType, filterDirection])

  const fetchMessages = async () => {
    if (!clientData?.id) return

    try {
      setIsLoading(true)

      // Get conversations for this client
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('platform_client_id', clientData.id)

      if (convError) throw convError

      const conversationIds = conversations?.map(c => c.id) || []

      if (conversationIds.length === 0) {
        setMessages([])
        setIsLoading(false)
        return
      }

      // Build query
      let query = supabase
        .from('messages')
        .select('*')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false })
        .limit(100)

      // Apply filters
      if (filterDirection !== 'all') {
        query = query.eq('direction', filterDirection)
      }
      if (filterSenderType !== 'all') {
        query = query.eq('sender_type', filterSenderType)
      }

      const { data: messagesData, error: messagesError } = await query

      if (messagesError) throw messagesError

      setMessages(messagesData || [])
    } catch (error: any) {
      console.error('Error fetching messages:', error)
      toast.error('Errore nel caricamento dei messaggi')
    } finally {
      setIsLoading(false)
    }
  }

  const subscribeToMessages = () => {
    if (!clientData?.id) return

    const messagesChannel = supabase
      .channel('log-activity-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newMessage = payload.new as Message

          // Verify message belongs to this client's conversations
          const { data: conversation } = await supabase
            .from('conversations')
            .select('platform_client_id')
            .eq('id', newMessage.conversation_id)
            .single()

          if (conversation?.platform_client_id === clientData.id) {
            // Check if message matches current filters
            const matchesFilters =
              (filterDirection === 'all' || newMessage.direction === filterDirection) &&
              (filterSenderType === 'all' || newMessage.sender_type === filterSenderType)

            if (matchesFilters) {
              setMessages(prev => [newMessage, ...prev].slice(0, 100))
            }
          }
        }
      )
      .subscribe()

    return () => {
      messagesChannel.unsubscribe()
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const getSenderTypeLabel = (senderType: string | null) => {
    switch (senderType) {
      case 'user': return 'Cliente'
      case 'human_agent': return 'Agente'
      case 'bot': return 'Bot'
      case 'ai': return 'AI Assistant'
      default: return 'Sistema'
    }
  }

  const getSenderTypeColor = (senderType: string | null) => {
    switch (senderType) {
      case 'user': return 'bg-blue-100 text-blue-800'
      case 'human_agent': return 'bg-green-100 text-green-800'
      case 'bot': return 'bg-purple-100 text-purple-800'
      case 'ai': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDirectionLabel = (direction: string | null) => {
    return direction === 'inbound' ? 'Ricevuto' : 'Inviato'
  }

  const getDirectionColor = (direction: string | null) => {
    return direction === 'inbound' ? 'text-green-600' : 'text-blue-600'
  }

  // Filter messages by search query
  const filteredMessages = messages.filter(msg => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      msg.content_text?.toLowerCase().includes(query) ||
      msg.sender_type?.toLowerCase().includes(query) ||
      msg.direction?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <MainSidebar
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Log Activity</h1>
                <p className="text-sm text-gray-600 mt-1">Tutti i messaggi in tempo reale</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-sm text-gray-600">Live</span>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="p-6">
            {/* Filters Section */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtri</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cerca
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cerca nel testo..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Direction Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Direzione
                  </label>
                  <select
                    value={filterDirection}
                    onChange={(e) => setFilterDirection(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">Tutti</option>
                    <option value="inbound">Ricevuti</option>
                    <option value="outbound">Inviati</option>
                  </select>
                </div>

                {/* Sender Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo Mittente
                  </label>
                  <select
                    value={filterSenderType}
                    onChange={(e) => setFilterSenderType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">Tutti</option>
                    <option value="user">Cliente</option>
                    <option value="human_agent">Agente</option>
                    <option value="bot">Bot</option>
                    <option value="ai">AI Assistant</option>
                  </select>
                </div>

                {/* Reset Filters */}
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setFilterDirection('all')
                      setFilterSenderType('all')
                      setSearchQuery('')
                    }}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Reset Filtri
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Count */}
            <div className="mb-4 text-sm text-gray-600">
              {filteredMessages.length} messaggi trovati
            </div>

            {/* Messages List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {filteredMessages.length === 0 ? (
                <div className="p-12 text-center">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-gray-500">Nessun messaggio trovato</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Header */}
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSenderTypeColor(msg.sender_type)}`}>
                              {getSenderTypeLabel(msg.sender_type)}
                            </span>
                            <span className={`text-xs font-medium ${getDirectionColor(msg.direction)}`}>
                              {getDirectionLabel(msg.direction)}
                            </span>
                            <span className="text-xs text-gray-500">{formatDate(msg.created_at)}</span>
                          </div>

                          {/* Message Content */}
                          <div className={`${expandedMessage === msg.id ? '' : 'line-clamp-2'}`}>
                            <p className="text-sm text-gray-900">
                              {msg.content_text || <span className="italic text-gray-500">[Media o contenuto non testuale]</span>}
                            </p>
                          </div>

                          {/* Metadata */}
                          {expandedMessage === msg.id && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <dl className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <dt className="font-medium text-gray-500">ID Messaggio</dt>
                                  <dd className="text-gray-900 mt-1">{msg.id}</dd>
                                </div>
                                <div>
                                  <dt className="font-medium text-gray-500">ID Conversazione</dt>
                                  <dd className="text-gray-900 mt-1">{msg.conversation_id}</dd>
                                </div>
                                {msg.platform_message_id && (
                                  <div>
                                    <dt className="font-medium text-gray-500">ID Platform</dt>
                                    <dd className="text-gray-900 mt-1">{msg.platform_message_id}</dd>
                                  </div>
                                )}
                                {msg.sender_id && (
                                  <div>
                                    <dt className="font-medium text-gray-500">Sender ID</dt>
                                    <dd className="text-gray-900 mt-1">{msg.sender_id}</dd>
                                  </div>
                                )}
                              </dl>
                            </div>
                          )}
                        </div>

                        {/* Expand Button */}
                        <button
                          onClick={() => setExpandedMessage(expandedMessage === msg.id ? null : msg.id)}
                          className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <svg
                            className={`w-5 h-5 transform transition-transform ${expandedMessage === msg.id ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default LogActivityPage
