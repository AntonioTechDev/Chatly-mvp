import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import MainSidebar from '../components/MainSidebar'
import ConversationsSidebar from '../components/ConversationsSidebar'
import ChatArea from '../components/ChatArea'
import LeadDetailsPanel from '../components/LeadDetailsPanel'
import type { ConversationWithRelations } from '../types/database.types'

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
    <div className="flex h-screen overflow-hidden">
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary-600 text-white rounded-md shadow-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Main Sidebar - Hidden on mobile, overlay on tablet, fixed on desktop */}
      <div className={`${isMobileSidebarOpen ? 'block' : 'hidden'} lg:block fixed lg:relative inset-0 lg:inset-auto z-40`}>
        {isMobileSidebarOpen && (
          <div
            className="lg:hidden absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}
        <div className="relative">
          <MainSidebar onChannelSelect={handleChannelSelect} />
        </div>
      </div>

      {/* Mobile: Show based on mobileView state */}
      {/* Desktop/Tablet: Show as columns */}

      {/* Conversations Sidebar */}
      {selectedChannel && (
        <div className={`${mobileView === 'conversations' ? 'block' : 'hidden'} lg:block w-full lg:w-96`}>
          {/* Mobile Back Button */}
          <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center space-x-3">
            <button onClick={handleBackToChannels} className="p-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold">Conversazioni</h2>
          </div>
          <ConversationsSidebar
            channel={selectedChannel}
            selectedConversationId={selectedConversation?.id || null}
            onSelectConversation={handleSelectConversation}
          />
        </div>
      )}

      {/* Chat Area */}
      {selectedConversation ? (
        <div className={`${mobileView === 'chat' ? 'block' : 'hidden'} lg:block flex-1 relative`}>
          {/* Mobile Back Button in Chat */}
          <div className="lg:hidden absolute top-4 left-4 z-10">
            <button
              onClick={handleBackToConversations}
              className="p-2 bg-white rounded-full shadow-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
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
        <div className={`${mobileView === 'conversations' ? 'hidden' : 'hidden'} lg:flex flex-1 items-center justify-center bg-gray-50`}>
          <div className="text-center">
            <svg className="w-24 h-24 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="mt-4 text-gray-500">Seleziona una conversazione per iniziare</p>
          </div>
        </div>
      ) : (
        <div className={`${mobileView === 'channels' ? 'hidden' : 'hidden'} lg:flex flex-1 items-center justify-center bg-gray-50`}>
          <div className="text-center max-w-md px-4">
            <svg className="w-24 h-24 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Benvenuto nella tua inbox</h3>
            <p className="mt-2 text-sm text-gray-500">
              Seleziona un canale dalla sidebar per visualizzare le conversazioni
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default InboxPage
