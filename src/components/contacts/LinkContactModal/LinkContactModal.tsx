import React, { useState, useEffect } from 'react'
import type { SocialContact } from '../../../types/database.types'
import { searchContactsForLinking } from '../../../services/contactService'

interface LinkContactModalProps {
  isOpen: boolean
  onClose: () => void
  onLink: (targetContactId: number) => void
  currentContactId: number
  platformClientId: string
}

export const LinkContactModal: React.FC<LinkContactModalProps> = ({
  isOpen,
  onClose,
  onLink,
  currentContactId,
  platformClientId,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SocialContact[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
      setSearchResults([])
      setSelectedContactId(null)
    }
  }, [isOpen])

  useEffect(() => {
    const searchContacts = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([])
        return
      }

      try {
        setIsSearching(true)
        const results = await searchContactsForLinking(
          platformClientId,
          searchQuery,
          currentContactId
        )
        setSearchResults(results)
      } catch (error) {
        console.error('Error searching contacts:', error)
      } finally {
        setIsSearching(false)
      }
    }

    const debounceTimer = setTimeout(searchContacts, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery, platformClientId, currentContactId])

  const handleLink = () => {
    if (selectedContactId) {
      onLink(selectedContactId)
      onClose()
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'whatsapp':
        return '📱'
      case 'instagram':
        return '📸'
      case 'messenger':
        return '💬'
      default:
        return '👤'
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Collega Contatto</h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Search Bar */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cerca contatto da collegare
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cerca per nome..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
                  autoFocus
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Digita almeno 2 caratteri per cercare
              </p>
            </div>

            {/* Search Results */}
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
              {searchQuery.trim().length < 2 ? (
                <div className="p-8 text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p>Inizia a digitare per cercare contatti</p>
                </div>
              ) : searchResults.length === 0 && !isSearching ? (
                <div className="p-8 text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>Nessun contatto trovato</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {searchResults.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => setSelectedContactId(contact.id)}
                      className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                        selectedContactId === contact.id ? 'bg-primary-50 border-l-4 border-primary-600' : ''
                      }`}
                    >
                      {/* Platform Icon Avatar */}
                      <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-3xl">
                          {getPlatformIcon(contact.platform)}
                        </span>
                      </div>

                      {/* Contact Info */}
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            {contact.display_name || contact.name || 'Nome non disponibile'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {contact.email || contact.phone || `ID: ${contact.platform_user_id}`}
                        </div>
                        {contact.company && (
                          <div className="text-xs text-gray-500 mt-1">
                            🏢 {contact.company}
                          </div>
                        )}
                      </div>

                      {/* Selection Indicator */}
                      {selectedContactId === contact.id && (
                        <div className="text-primary-600">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleLink}
              disabled={!selectedContactId}
              className="px-4 py-2 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Collega Contatto
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
