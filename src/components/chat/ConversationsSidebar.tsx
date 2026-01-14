/**
 * ConversationsSidebar
 *
 * Refactored following best practices:
 * - Uses useConversations hook for all business logic
 * - Uses composition components (ConversationsList)
 * - Uses basic components (SearchBar)
 * - Component only handles layout and orchestration
 */

import React from 'react'
import type { ConversationWithRelations } from '@/core/types/database.types'
import { useConversations } from '@/core/hooks/useConversations'
import { SearchBar } from '../ui/SearchBar/SearchBar'
import { ConversationsList } from './ConversationsList/ConversationsList'
import './ConversationsSidebar.css'
import WhatsappIcon from '@/img/whatsapp-icon.svg?react'
import InstagramIcon from '@/img/instagram-icon.svg?react'
import MessengerIcon from '@/img/messenger-icon.svg?react'
import CalendarIcon from '@/img/calendar-icon.svg?react'
import CloseIcon from '@/img/close-icon.svg?react'

interface ConversationsSidebarProps {
  channel: 'whatsapp' | 'instagram' | 'messenger'
  selectedConversationId: number | null
  onSelectConversation: (conversation: ConversationWithRelations) => void
}

const ConversationsSidebar: React.FC<ConversationsSidebarProps> = ({
  channel,
  selectedConversationId,
  onSelectConversation,
}) => {
  // Get all data and actions from hook
  const {
    conversations,
    isLoading,
    searchQuery,
    startDate,
    endDate,
    handleSearchChange,
    handleDateChange,
    handleClearFilters,
  } = useConversations(channel)

  // Get channel icon
  const getChannelIcon = () => {
    const iconClass = `channel-icon ${channel}`

    switch (channel) {
      case 'whatsapp':
        return <WhatsappIcon className={iconClass} />
      case 'instagram':
        return <InstagramIcon className={iconClass} />
      case 'messenger':
        return <MessengerIcon className={iconClass} />
    }
  }

  // Has active filters
  const hasActiveFilters = searchQuery || startDate || endDate

  // Loading state
  if (isLoading) {
    return (
      <div className="conversations-sidebar">
        <div className="loading">
          <div className="loading-content">
            <div className="spinner"></div>
            <p className="loading-text">Caricamento...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="conversations-sidebar">
      {/* Header */}
      <div className="header">
        <div className="title-row">
          {getChannelIcon()}
          <h2 className="title">{channel}</h2>
          <span className="count">{conversations.length}</span>
        </div>

        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Cerca conversazioni..."
        />

        {/* Date Range Filter */}
        <div className="filters">
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
          <div className="date-range-row">
            <div className="date-range-input">
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
                className="clear-btn"
                title="Cancella filtri"
              >
                <CloseIcon className="clear-icon" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="list">
        <ConversationsList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onConversationClick={onSelectConversation}
          emptyMessage={
            hasActiveFilters
              ? 'Nessuna conversazione corrisponde ai filtri'
              : 'Nessuna conversazione trovata'
          }
        />
      </div>
    </div>
  )
}

export default ConversationsSidebar
