/**
 * ChatArea
 *
 * Refactored following best practices:
 * - Uses useMessages hook for all business logic
 * - Uses composition components (MessagesList)
 * - Uses basic components (SearchBar)
 * - Component only handles layout and orchestration
 */

import React from 'react'
import type { ConversationWithRelations } from '../../types/database.types'
import { useMessages } from '../../hooks/useMessages'
import { SearchBar } from '../ui/SearchBar/SearchBar'
import { MessagesList } from './MessagesList/MessagesList'

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

  const getLeadName = () => {
    return (
      conversation.social_contact?.display_name ||
      conversation.social_contact?.name ||
      conversation.social_contact?.phone ||
      'Sconosciuto'
    )
  }

  // Loading state
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

        {/* Filters */}
        <div className="mt-4 space-y-2">
          {/* Search Input */}
          <SearchBar
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Cerca nei messaggi..."
          />

          {/* Date Range */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
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
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <span className="text-gray-500 text-sm">→</span>
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
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
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
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
    </div>
  )
}

export default ChatArea
