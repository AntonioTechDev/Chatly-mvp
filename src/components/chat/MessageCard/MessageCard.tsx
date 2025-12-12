/**
 * MessageCard Component (Composition)
 *
 * Displays a single message with:
 * - Message content
 * - Timestamp
 * - Sender label
 * - Message status (if outgoing)
 */

import React, { useMemo } from 'react'
import './MessageCard.css'
import type { Message } from '../../../types/database.types'

interface MessageCardProps {
  message: Message
  isOutgoing?: boolean
}

export const MessageCard: React.FC<MessageCardProps> = ({
  message,
  isOutgoing = false,
}) => {
  // Format timestamp
  const formattedTime = useMemo(() => {
    if (!message.created_at) return ''
    return new Date(message.created_at).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [message.created_at])

  // Get sender label and color
  const senderInfo = useMemo(() => {
    const senderType = message.sender_type || 'user'
    switch (senderType) {
      case 'user':
        return { label: 'Cliente', color: 'blue' }
      case 'human_agent':
        return { label: 'Agente', color: 'blue' }
      case 'bot':
        return { label: 'Bot', color: 'green' }
      case 'ai':
        return { label: 'AI', color: 'purple' }
      case 'system':
        return { label: 'Sistema', color: 'yellow' }
      default:
        return { label: 'Sconosciuto', color: 'gray' }
    }
  }, [message.sender_type])

  return (
    <div className={`message-card ${isOutgoing ? 'outgoing' : 'incoming'}`}>
      <div className="bubble">
        <span className={`sender sender-${senderInfo.color}`}>{senderInfo.label}</span>
        <p className="content">{message.content_text || '[Media]'}</p>
        <div className="metadata">
          <span className="time">{formattedTime}</span>
          {isOutgoing && message.status && (
            <span className="status">
              {message.status === 'sent' && '✓'}
              {message.status === 'delivered' && '✓✓'}
              {message.status === 'read' && '✓✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default React.memo(MessageCard)
