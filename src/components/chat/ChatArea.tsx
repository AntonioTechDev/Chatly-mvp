/**
 * ChatArea
 *
 * Refactored following best practices:
 * - Uses useMessages hook for all business logic
 * - Uses composition components (MessagesList)
 * - Uses basic components (SearchBar)
 * - Component only handles layout and orchestration
 */

import React, { useState } from 'react'
import type { ConversationWithRelations } from '../../types/database.types'
import { useMessages } from '../../hooks/useMessages'
import { SearchBar } from '../ui/SearchBar/SearchBar'
import { MessagesList } from './MessagesList/MessagesList'
import { sendHumanOperatorMessage } from '../../services/messageService'
import { updateConversationStatus } from '../../services/conversationService'
import './ChatArea.css'

interface ChatAreaProps {
  conversation: ConversationWithRelations
  onToggleLeadDetails: () => void
  isLeadDetailsPanelOpen: boolean
}

const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  onToggleLeadDetails,
  isLeadDetailsPanelOpen,
}) => {
  // Get all data and actions from hook
  const {
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    searchQuery,
    startDate,
    endDate,
    hasActiveFilters,
    handleSearchChange,
    handleDateChange,
    handleClearFilters,
    handleSearch,
    loadMoreMessages,
  } = useMessages(conversation.id)

  // Message input state
  const [messageText, setMessageText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  // AI status state
  const [aiStatus, setAiStatus] = useState<string>(() => {
    const status = conversation.status?.toLowerCase() || 'active'
    return status
  })
  const [isTogglingAI, setIsTogglingAI] = useState(false)

  const getLeadName = () => {
    return (
      conversation.social_contact?.display_name ||
      conversation.social_contact?.name ||
      conversation.social_contact?.phone ||
      'Sconosciuto'
    )
  }

  const handleSendMessage = async () => {
    // Validate message
    if (!messageText.trim()) {
      return
    }

    // Validate required data
    if (!conversation.social_contact) {
      setSendError('Errore: dati del contatto mancanti')
      return
    }

    if (!conversation.platform_client) {
      setSendError('Errore: dati del client mancanti')
      return
    }

    setIsSending(true)
    setSendError(null)

    try {
      await sendHumanOperatorMessage(
        messageText,
        conversation.id,
        conversation.social_contact,
        conversation.platform_client
      )

      // Clear input on success
      setMessageText('')
    } catch (error) {
      console.error('Failed to send message:', error)
      setSendError(
        error instanceof Error ? error.message : 'Errore durante l\'invio del messaggio'
      )
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleToggleAI = async () => {
    setIsTogglingAI(true)
    try {
      const currentStatus = aiStatus.toLowerCase()
      // Toggle: active -> Deactivated, deactivated -> Active
      const newStatus = currentStatus === 'active' ? 'Deactivated' : 'Active'
      await updateConversationStatus(conversation.id, newStatus)
      setAiStatus(newStatus.toLowerCase())
    } catch (error) {
      console.error('Failed to toggle AI status:', error)
    } finally {
      setIsTogglingAI(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="chat-area">
        <div className="loading">
          <div className="loading-content">
            <div className="spinner"></div>
            <p className="loading-text">Caricamento messaggi...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-area">
      {/* Header */}
      <div className="header">
        <div className="header-top">
          <div className="header-user">
            <div className="avatar">
              <span className="avatar-text">
                {getLeadName().charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="user-name">{getLeadName()}</h3>
              <p className="user-channel">{conversation.channel}</p>
            </div>
          </div>
          <div className="header-actions">
            <button
              onClick={handleToggleAI}
              disabled={isTogglingAI}
              className={`ai-toggle-btn ${aiStatus === 'active' ? 'active' : 'deactivated'}`}
              title={aiStatus === 'active' ? 'AI Attivo - Clicca per disattivare' : 'AI Disattivato - Clicca per attivare'}
            >
              {isTogglingAI ? (
                <div className="spinner-small"></div>
              ) : (
                <>
                  <svg className="ai-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  <span className="ai-status-text">
                    {aiStatus === 'active' ? 'AI Attivo' : 'AI Off'}
                  </span>
                </>
              )}
            </button>
            <button
              onClick={onToggleLeadDetails}
              className="toggle-btn"
              title={isLeadDetailsPanelOpen ? 'Nascondi dettagli lead' : 'Mostra dettagli lead'}
            >
              {isLeadDetailsPanelOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="filters">
          {/* Search Input */}
          <SearchBar
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Cerca nei messaggi..."
          />

          {/* Date Range */}
          <div className="date-range">
            <div className="date-input-wrapper">
              <svg
                className="date-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleDateChange('start', e.target.value)}
                placeholder="Data inizio"
                className="date-input"
              />
            </div>
            <span className="date-separator">→</span>
            <div className="date-input-wrapper">
              <svg
                className="date-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleDateChange('end', e.target.value)}
                placeholder="Data fine"
                className="date-input"
              />
            </div>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="clear-filters-btn"
                title="Cancella filtri"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <MessagesList
        messages={messages}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        onLoadMore={loadMoreMessages}
        emptyMessage={
          hasActiveFilters
            ? 'Nessun messaggio corrisponde ai filtri'
            : 'Nessun messaggio trovato'
        }
      />

      {/* Message Input Area */}
      <div className="input-container">
        {sendError && (
          <div className="error">
            <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{sendError}</span>
          </div>
        )}
        <div className="input-wrapper">
          <div className="textarea-container">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Scrivi un messaggio..."
              disabled={isSending}
              rows={1}
              className="textarea"
            />
            <div className="char-counter">
              {messageText.length > 0 && `${messageText.length}`}
            </div>
          </div>
          <button
            onClick={handleSendMessage}
            disabled={isSending || !messageText.trim()}
            className="send-btn"
            title={isSending ? 'Invio in corso...' : 'Invia messaggio (Enter)'}
          >
            {isSending ? (
              <div className="spinner"></div>
            ) : (
              <svg
                className="send-icon"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
        <div className="hint">
          <svg className="hint-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Premi Invio per inviare, Shift+Invio per andare a capo
        </div>
      </div>
    </div>
  )
}

export default ChatArea
