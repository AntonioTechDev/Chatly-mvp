/**
 * ConversationCard Component (Composition)
 *
 * Displays a single conversation with:
 * - Contact name and avatar
 * - Last message preview
 * - Timestamp
 * - Unread indicator
 * - Uses basic components (Card, Badge)
 */

import React, { useMemo } from 'react'
import { Card } from '../../ui/Card/Card'
import { Badge } from '../../ui/Badge/Badge'
import './ConversationCard.css'
import type { ConversationWithRelations } from '@/core/types/database.types'

interface ConversationCardProps {
  conversation: ConversationWithRelations
  isSelected?: boolean
  onClick?: (conversation: ConversationWithRelations) => void
}

export const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
  isSelected = false,
  onClick,
}) => {
  // Get contact display name
  const contactName = useMemo(() => {
    const contact = conversation.social_contact
    return (
      contact?.display_name ||
      contact?.name ||
      contact?.phone ||
      'Sconosciuto'
    )
  }, [conversation.social_contact])

  // Get last message
  const lastMessage = useMemo(() => {
    const messages = conversation.messages
    if (!messages || messages.length === 0) return null
    return messages[messages.length - 1]
  }, [conversation.messages])

  // Format timestamp
  const formatTime = useMemo(() => {
    const date = lastMessage?.created_at || conversation.started_at
    if (!date) return ''

    const messageDate = new Date(date)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 24) {
      // Show time if today
      return messageDate.toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
      })
    } else if (diffInHours < 168) {
      // Show day of week if within last week
      return messageDate.toLocaleDateString('it-IT', { weekday: 'short' })
    } else {
      // Show date
      return messageDate.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
      })
    }
  }, [lastMessage, conversation.started_at])

  // Get channel badge variant
  const channelVariant = useMemo(() => {
    switch (conversation.channel) {
      case 'whatsapp':
        return 'success'
      case 'instagram':
        return 'danger'
      case 'messenger':
        return 'info'
      default:
        return 'info'
    }
  }, [conversation.channel])

  // Truncate message preview
  const messagePreview = useMemo(() => {
    if (!lastMessage?.content_text) return 'Nessun messaggio'
    const maxLength = 50
    return lastMessage.content_text.length > maxLength
      ? lastMessage.content_text.substring(0, maxLength) + '...'
      : lastMessage.content_text
  }, [lastMessage])

  return (
    <Card
      className={`conversation-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick ? () => onClick(conversation) : undefined}
    >
      <div className="content">
        {/* Avatar */}
        <div className="avatar">
          <div className="avatar-circle">
            {contactName.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Main Content */}
        <div className="main">
          <div className="header">
            <h4 className="name">{contactName}</h4>
            <span className="time">{formatTime}</span>
          </div>

          <div className="message-preview">
            <p className="message">{messagePreview}</p>
            <Badge variant={channelVariant}>
              {conversation.channel}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default React.memo(ConversationCard)
