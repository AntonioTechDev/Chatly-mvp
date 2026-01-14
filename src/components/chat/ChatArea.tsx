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
import type { ConversationWithRelations } from '@/core/types/database.types'
import { useMessages } from '@/core/hooks/useMessages'
import { SearchBar } from '../ui/SearchBar/SearchBar'
import { MessagesList } from './MessagesList/MessagesList'
import { sendHumanOperatorMessage } from '@/core/services/messageService'
import { updateConversationStatus } from '@/core/services/conversationService'
import './ChatArea.css'
import AiSparklesIcon from '@/img/ai-sparkles-icon.svg?react'
import PanelToggleIcon from '@/img/panel-toggle-icon.svg?react'
import EyeIcon from '@/img/eye-icon.svg?react'
import SendIcon from '@/img/send-icon.svg?react'
import AlertCircleIcon from '@/img/alert-circle-icon.svg?react'
import InformationCircleIcon from '@/img/information-circle-icon.svg?react'
import CalendarIcon from '@/img/calendar-icon.svg?react'
import CloseIcon from '@/img/close-icon.svg?react'

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

  // AI status derived from conversation prop
  const aiStatus = conversation.status?.toLowerCase() || 'active'
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
      setSendError('Impossibile inviare il messaggio')
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
    try {
      setIsTogglingAI(true)
      const currentStatus = aiStatus
      // Toggle: active -> Deactivated, deactivated -> Active
      const newStatus = currentStatus === 'active' ? 'Deactivated' : 'Active'
      await updateConversationStatus(conversation.id, newStatus)
      // No need to set local state, parent will update 'conversation' prop via subscription
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
                  <AiSparklesIcon className="ai-icon" />
                  <span className="ai-status-text">AI {aiStatus === 'active' ? 'Attivo' : 'Off'}</span>
                </>
              )}
            </button>
            <button
              onClick={onToggleLeadDetails}
              className="toggle-btn"
              title={isLeadDetailsPanelOpen ? 'Nascondi dettagli lead' : 'Mostra dettagli lead'}
            >
              {isLeadDetailsPanelOpen ? (
                <PanelToggleIcon />
              ) : (
                <EyeIcon />
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
              <CalendarIcon className="date-icon" />
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
              <CalendarIcon className="date-icon" />
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
                <CloseIcon />
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
            <AlertCircleIcon className="error-icon" />
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
              <SendIcon className="send-icon" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatArea
