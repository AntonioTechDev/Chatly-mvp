import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import MainSidebar from '../components/layout/MainSidebar'
import ConversationsSidebar from '../components/chat/ConversationsSidebar'
import ChatArea from '../components/chat/ChatArea'
import LeadDetailsPanel from '../components/layout/LeadDetailsPanel'
import type { ConversationWithRelations } from '@/core/types/database.types'
import './InboxPage.css'
import MenuIcon from '@/img/menu-icon.svg?react'
import ChevronLeftIcon from '@/img/chevron-left-icon.svg?react'
import ChatBubbleIcon from '@/img/chat-bubble-icon.svg?react'
import EnvelopeIcon from '@/img/envelope-icon.svg?react'

const InboxPage: React.FC = () => {
  const location = useLocation()
  const [selectedChannel, setSelectedChannel] = useState<'whatsapp' | 'instagram' | 'messenger' | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithRelations | null>(null)
  const [isLeadDetailsPanelOpen, setIsLeadDetailsPanelOpen] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [mobileView, setMobileView] = useState<'channels' | 'conversations' | 'chat'>('channels')

  // Set channel from navigation state if provided
  useEffect(() => {
    const state = location.state as { selectedChannel?: 'whatsapp' | 'instagram' | 'messenger' }
    if (state?.selectedChannel) {
      setSelectedChannel(state.selectedChannel)
      setMobileView('conversations')
    }
  }, [location.state])

  const handleChannelSelect = (channel: 'whatsapp' | 'instagram' | 'messenger' | null) => {
    setSelectedChannel(channel)
    setSelectedConversation(null)
    setIsLeadDetailsPanelOpen(false)
    setMobileView('conversations')
    setIsMobileSidebarOpen(false)
  }

  const handleSelectConversation = (conversation: ConversationWithRelations) => {
    setSelectedConversation(conversation)
    setIsLeadDetailsPanelOpen(false)
    setMobileView('chat')
  }

  const handleBackToConversations = () => {
    setSelectedConversation(null)
    setMobileView('conversations')
  }

  const handleBackToChannels = () => {
    setSelectedChannel(null)
    setMobileView('channels')
  }

  const handleToggleLeadDetails = () => {
    setIsLeadDetailsPanelOpen(!isLeadDetailsPanelOpen)
  }

  return (
    <div className="inbox-layout">
      {/* Mobile Hamburger Button - Show only when not in chat view */}
      {mobileView !== 'chat' && (
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="mobile-nav-toggle"
        >
          <MenuIcon />
        </button>
      )}

      {/* Main Sidebar */}
      <div className={`sidebar-wrapper ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
        {isMobileSidebarOpen && (
          <div
            className="mobile-overlay"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}
        <div className="sidebar-container">
          <MainSidebar onChannelSelect={handleChannelSelect} />
        </div>
      </div>

      {/* Conversations Sidebar */}
      <div className={`conversations-sidebar-wrapper ${selectedChannel ? (mobileView === 'conversations' ? 'mobile-visible' : '') : ''}`}>
        {selectedChannel && (
          <>
            {/* Mobile Back Button */}
            <div className="mobile-back-header">
              <button onClick={handleBackToChannels}>
                <ChevronLeftIcon />
              </button>
              <h2>Conversazioni</h2>
            </div>
            <ConversationsSidebar
              channel={selectedChannel}
              selectedConversationId={selectedConversation?.id || null}
              onSelectConversation={handleSelectConversation}
            />
          </>
        )}
      </div>

      {/* Chat Area */}
      {selectedConversation ? (
        <div className={`chat-area-wrapper ${mobileView === 'chat' ? 'mobile-visible' : ''}`}>
          {/* Mobile Navigation Buttons in Chat */}
          <div className="mobile-chat-nav">
            <button
              onClick={handleBackToConversations}
              className="back-btn"
              title="Torna alle conversazioni"
            >
              <ChevronLeftIcon />
            </button>
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="menu-btn"
              title="Menu"
            >
              <MenuIcon />
            </button>

          </div>

          <ChatArea
            conversation={selectedConversation}
            onToggleLeadDetails={handleToggleLeadDetails}
            isLeadDetailsPanelOpen={isLeadDetailsPanelOpen}
          />

          {/* Lead Details Panel */}
          {selectedConversation.social_contact && (
            <LeadDetailsPanel
              lead={selectedConversation.social_contact}
              isOpen={isLeadDetailsPanelOpen}
              onClose={() => setIsLeadDetailsPanelOpen(false)}
            />
          )}
        </div>
      ) : selectedChannel ? (
        <div className={`empty-state-container ${mobileView === 'conversations' ? 'hidden' : ''}`}>
          <div className="content">
            <ChatBubbleIcon className="icon" />
            <p className="mt-4 text-gray-500">Seleziona una conversazione per iniziare</p>
          </div>
        </div>
      ) : (
        <div className={`empty-state-container ${mobileView === 'channels' ? 'hidden' : ''}`}>
          <div className="content">
            <EnvelopeIcon className="icon" />
            <h3>Benvenuto nella tua inbox</h3>
            <p>
              Seleziona un canale dalla sidebar per visualizzare le conversazioni
            </p>
          </div>
        </div>
      )
      }
    </div >
  )
}

export default InboxPage
