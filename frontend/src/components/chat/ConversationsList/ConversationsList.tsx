/**
 * ConversationsList Component (Composition - Presentational)
 *
 * Presentational component that:
 * - Receives conversations[] from Page/Component
 * - Handles rendering (list view, empty state)
 * - Renders ConversationCard for each conversation
 */

import React from 'react'
import { ConversationCard } from '../ConversationCard/ConversationCard'
import './ConversationsList.css'
import type { ConversationWithRelations } from '@/core/types/database.types'

interface ConversationsListProps {
  conversations: ConversationWithRelations[]
  selectedConversationId?: number | null
  emptyMessage?: string
  onConversationClick?: (conversation: ConversationWithRelations) => void
}

export const ConversationsList: React.FC<ConversationsListProps> = ({
  conversations,
  selectedConversationId = null,
  emptyMessage = 'Nessuna conversazione trovata',
  onConversationClick,
}) => {
  // Empty state
  if (conversations.length === 0) {
    return (
      <div className="conversations-list empty">
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

  // Conversations list
  return (
    <div className="conversations-list">
      {conversations.map((conversation) => (
        <ConversationCard
          key={conversation.id}
          conversation={conversation}
          isSelected={conversation.id === selectedConversationId}
          onClick={onConversationClick}
        />
      ))}
    </div>
  )
}

export default ConversationsList
