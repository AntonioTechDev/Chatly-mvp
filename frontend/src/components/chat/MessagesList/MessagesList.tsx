/**
 * MessagesList Component (Composition - Presentational)
 *
 * Presentational component that:
 * - Receives messages[] from Chat component
 * - Handles rendering (list view, empty state)
 * - Renders MessageCard for each message
 * - Supports infinite scroll with load more indicator
 */

import React, { useEffect, useRef } from 'react'
import { MessageCard } from '../MessageCard/MessageCard'
import './MessagesList.css'
import type { MessageWithRelations } from '@/core/types/database.types'

interface MessagesListProps {
  messages: MessageWithRelations[]
  emptyMessage?: string
  isLoadingMore?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  scrollToBottom?: boolean
}

export const MessagesList: React.FC<MessagesListProps> = ({
  messages,
  emptyMessage = 'Nessun messaggio',
  isLoadingMore = false,
  hasMore = false,
  onLoadMore,
  scrollToBottom = true,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (scrollToBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, scrollToBottom])

  // Handle scroll for infinite scroll (load older messages)
  const handleScroll = () => {
    const container = messagesContainerRef.current
    if (!container || !onLoadMore || isLoadingMore || !hasMore) return

    // Check if scrolled to top
    if (container.scrollTop === 0) {
      onLoadMore()
    }
  }

  // Empty state
  if (messages.length === 0) {
    return (
      <div className="messages-list empty">
        <svg className="icon empty" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <p className="message">{emptyMessage}</p>
      </div>
    )
  }

  // Format date for date separators
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <div
      className="messages-list"
      ref={messagesContainerRef}
      onScroll={handleScroll}
    >
      {/* Load more indicator */}
      {isLoadingMore && (
        <div className="load-more-indicator">
          <div className="spinner"></div>
          <span>Caricamento messaggi...</span>
        </div>
      )}

      {/* Messages */}
      {messages.map((message, index) => {
        const showDate =
          index === 0 ||
          formatDate(messages[index - 1]?.created_at) !== formatDate(message.created_at)

        return (
          <React.Fragment key={message.id}>
            {showDate && (
              <div className="date-separator">
                <span className="date-label">{formatDate(message.created_at)}</span>
              </div>
            )}
            <MessageCard
              message={message}
              isOutgoing={
                message.sender_type === 'ai' ||
                message.sender_type === 'bot' ||
                message.sender_type === 'human_agent' ||
                message.sender_type === 'system'
              }
            />
          </React.Fragment>
        )
      })}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  )
}

export default MessagesList
