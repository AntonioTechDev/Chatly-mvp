
import React, { useEffect, useState } from 'react'
import { useAuth } from '@/core/contexts/AuthContext'
import { Bell, Check, Clock, Filter, MessageSquare, Phone, Search, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import MainSidebar from '../components/layout/MainSidebar'
import { supabase } from '@/core/lib/supabase'
import type { Json, Message } from '@/core/types/database.types'
import toast from 'react-hot-toast'
import { fetchActivityLogs, verifyConversationOwnership } from '@/core/services/activityService'

import './LogActivityPage.css'
import MenuIcon from '@/img/menu-icon.svg?react'
import InboxIcon from '@/img/inbox-icon.svg?react'
import ChevronDownIcon from '@/img/chevron-down-icon.svg?react'

const LogActivityPage: React.FC = () => {
  const { user, clientData } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDirection, setFilterDirection] = useState('all')
  const [filterSenderType, setFilterSenderType] = useState('all')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [expandedMessage, setExpandedMessage] = useState<number | null>(null)

  useEffect(() => {
    if (clientData?.id) {
      loadMessages()

      // Simple refresh interval instead of complex realtime for now
      const interval = setInterval(loadMessages, 30000)
      return () => clearInterval(interval)
    }
  }, [clientData?.id, filterDirection, filterSenderType])

  const loadMessages = async () => {
    if (!clientData?.id) return
    setIsLoading(true)
    try {
      const data = await fetchActivityLogs(clientData.id, {
        channel: 'all', // Not used in UI yet but required by interface
        direction: filterDirection,
        senderType: filterSenderType
      })
      setMessages(data)
    } catch (error) {
      console.error('Error fetching activity logs:', error)
      toast.error('Errore nel caricamento dei log')
    } finally {
      setIsLoading(false)
    }
  }

  const getSenderTypeLabel = (type: string | null) => {
    switch (type) {
      case 'user': return 'Cliente'
      case 'human_agent': return 'Agente'
      case 'bot': return 'Bot'
      case 'ai': return 'AI'
      default: return 'Sistema'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleString('it-IT')
  }

  const getSenderTypeColor = (senderType: string | null) => {
    switch (senderType) {
      case 'user': return 'sender-user'
      case 'human_agent': return 'sender-agent'
      case 'bot': return 'sender-bot'
      case 'ai': return 'sender-ai'
      default: return 'sender-system'
    }
  }

  const getDirectionLabel = (direction: string | null) => {
    return direction === 'incoming' ? 'Ricevuto' : 'Inviato'
  }

  const getDirectionColor = (direction: string | null) => {
    return direction === 'incoming' ? 'direction-incoming' : 'direction-outgoing'
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
    <div className="log-activity-layout">
      {/* Main Sidebar */}
      <div className={`sidebar-wrapper ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
        {isMobileSidebarOpen && (
          <div
            className="mobile-overlay"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}
        <div className="sidebar-container">
          <MainSidebar onChannelSelect={(channel) => {
            if (channel) {
              navigate('/inbox', { state: { selectedChannel: channel } })
            }
          }} />
        </div>
      </div>

      <main className="log-main-content">
        <div className="log-header">
          <div className="header-container">
            <div className="title-section">
              <button
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="mobile-menu-btn"
              >
                <MenuIcon />
              </button>
              <div className="title-text">
                <h1>Log Activity</h1>
                <p>Tutti i messaggi in tempo reale</p>
              </div>
            </div>
            <div className="live-indicator">
              <span className="indicator-dot">
                <span className="ping"></span>
                <span className="dot"></span>
              </span>
              <span>Live</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="content-check">
            {/* Filters Section */}
            <div className="filters-section">
              <h3>Filtri</h3>
              <div className="filters-grid">
                {/* Search */}
                <div className="filter-group">
                  <label>Cerca</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cerca nel testo..."
                    className="form-input"
                  />
                </div>

                {/* Direction Filter */}
                <div className="filter-group">
                  <label>Direzione</label>
                  <select
                    value={filterDirection}
                    onChange={(e) => setFilterDirection(e.target.value)}
                    className="form-select"
                  >
                    <option value="all">Tutti</option>
                    <option value="incoming">Ricevuti</option>
                    <option value="outgoing">Inviati</option>
                  </select>
                </div>

                {/* Sender Type Filter */}
                <div className="filter-group">
                  <label>Tipo Mittente</label>
                  <select
                    value={filterSenderType}
                    onChange={(e) => setFilterSenderType(e.target.value)}
                    className="form-select"
                  >
                    <option value="all">Tutti</option>
                    <option value="user">Cliente</option>
                    <option value="human_agent">Agente</option>
                    <option value="bot">Bot</option>
                    <option value="ai">AI Assistant</option>
                  </select>
                </div>

                {/* Reset Filters */}
                <div className="reset-wrapper">
                  <button
                    onClick={() => {
                      setFilterDirection('all')
                      setFilterSenderType('all')
                      setSearchQuery('')
                    }}
                  >
                    Reset Filtri
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Count */}
            <div className="messages-count">
              {filteredMessages.length} messaggi trovati
            </div>

            {/* Messages List */}
            <div className="messages-list-container">
              {filteredMessages.length === 0 ? (
                <div className="empty-state">
                  <InboxIcon />
                  <p>Nessun messaggio trovato</p>
                </div>
              ) : (
                <div className="messages-list">
                  {filteredMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="message-item"
                    >
                      <div className="item-content">
                        <div className="main-info">
                          {/* Header */}
                          <div className="header-badges">
                            <span className={`badge ${getSenderTypeColor(msg.sender_type)}`}>
                              {getSenderTypeLabel(msg.sender_type)}
                            </span>
                            <span className={`badge ${getDirectionColor(msg.direction)}`}>
                              {getDirectionLabel(msg.direction)}
                            </span>
                            <span className="timestamp">{formatDate(msg.created_at)}</span>
                          </div>

                          {/* Message Content */}
                          <div className={`message-text ${expandedMessage === msg.id ? '' : 'collapsed'}`}>
                            <p>
                              {msg.content_text || <span className="italic">[Media o contenuto non testuale]</span>}
                            </p>
                          </div>

                          {/* Metadata */}
                          {expandedMessage === msg.id && (
                            <div className="metadata">
                              <dl>
                                <div>
                                  <dt>ID Messaggio</dt>
                                  <dd>{msg.id}</dd>
                                </div>
                                <div>
                                  <dt>ID Conversazione</dt>
                                  <dd>{msg.conversation_id}</dd>
                                </div>
                                {msg.platform_message_id && (
                                  <div>
                                    <dt>ID Platform</dt>
                                    <dd>{msg.platform_message_id}</dd>
                                  </div>
                                )}
                              </dl>
                            </div>
                          )}
                        </div>

                        {/* Expand Button */}
                        <button
                          onClick={() => setExpandedMessage(expandedMessage === msg.id ? null : msg.id)}
                          className="expand-btn"
                        >
                          <ChevronDownIcon className={expandedMessage === msg.id ? 'rotated' : ''} />
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
