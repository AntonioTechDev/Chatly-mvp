/**
 * ContactsPage
 *
 * Refactored following best practices:
 * - Uses useContacts hook for all business logic
 * - Uses composition components (ContactsList, ContactCard)
 * - Uses basic components (SearchBar, FilterButtons, Pagination, etc.)
 * - Page only handles layout and orchestration
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainSidebar from '../components/layout/MainSidebar'
import { SearchBar } from '../components/ui/SearchBar/SearchBar'
import { FilterButtons } from '../components/ui/FilterButtons/FilterButtons'
import { Pagination } from '../components/ui/Pagination/Pagination'
import { PageSizeSelector } from '../components/ui/PageSizeSelector/PageSizeSelector'
import { ContactsList } from '../components/contacts/ContactsList/ContactsList'
import LeadDetailsPanel from '../components/layout/LeadDetailsPanel'
import { useContacts } from '../hooks/useContacts'
import type { SortField } from '../hooks/useContacts'
import type { SocialContact } from '../types/database.types'

const ContactsPage: React.FC = () => {
  const navigate = useNavigate()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<SocialContact | null>(null)
  const [isLeadDetailsPanelOpen, setIsLeadDetailsPanelOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Get all data and actions from hook
  const {
    contacts,
    isLoading,
    totalContacts,
    totalPages,
    currentPage,
    itemsPerPage,
    searchQuery,
    startDate,
    endDate,
    selectedChannels,
    sortField,
    sortDirection,
    handleSearchChange,
    handleChannelToggle,
    handleDateChange,
    handleClearFilters,
    handleSort,
    handlePageChange,
    handleItemsPerPageChange,
    refetch,
  } = useContacts()

  const handleChannelSelect = (channel: 'whatsapp' | 'instagram' | 'messenger' | null) => {
    if (channel) {
      navigate('/inbox', { state: { selectedChannel: channel } })
    }
  }

  const handleContactClick = (contact: SocialContact) => {
    setSelectedContact(contact)
    setIsLeadDetailsPanelOpen(true)
  }

  const handleCloseLeadDetails = () => {
    setIsLeadDetailsPanelOpen(false)
  }

  const handleLeadUpdate = (updatedLead: SocialContact) => {
    // Update selected contact
    setSelectedContact(updatedLead)
    // Refetch all contacts to get updated master contacts list
    refetch()
    // Trigger refresh of linked contacts in ContactsList
    setRefreshTrigger(prev => prev + 1)
  }

  // Channel filter options
  const channelOptions = [
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'messenger', label: 'Messenger' },
  ]

  // Sort button helper
  const getSortButton = (field: SortField, label: string) => {
    const isActive = sortField === field
    const arrow = isActive ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''

    return (
      <button
        onClick={() => handleSort(field)}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          isActive
            ? 'bg-primary-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        {label}
        {arrow}
      </button>
    )
  }

  // Has active filters
  const hasActiveFilters =
    searchQuery || startDate || endDate || selectedChannels.length > 0

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary-600 text-white rounded-md shadow-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Main Sidebar */}
      <div
        className={`${
          isMobileSidebarOpen ? 'block' : 'hidden'
        } lg:block fixed lg:relative inset-0 lg:inset-auto z-40`}
      >
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Contatti</h2>
          <p className="mt-2 text-sm md:text-base text-gray-600">
            Gestisci tutti i tuoi contatti da WhatsApp, Instagram e Messenger
          </p>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtri</h3>

          {/* Search */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ricerca
            </label>
            <SearchBar
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Cerca per nome, email, telefono, azienda..."
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Primo Contatto (Da)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleDateChange('start', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Primo Contatto (A)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleDateChange('end', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Channel Filters */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Canali Social
            </label>
            <div className="flex flex-wrap gap-2">
              {channelOptions.map((channel) => (
                <button
                  key={channel.value}
                  onClick={() => handleChannelToggle(channel.value)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedChannels.includes(channel.value)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {channel.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="mt-4">
              <button
                onClick={handleClearFilters}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Cancella tutti i filtri
              </button>
            </div>
          )}
        </div>

        {/* Sorting and Pagination Controls */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Sort Options */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-700">Ordina per:</span>
              {getSortButton('display_name', 'Nome')}
              {getSortButton('channel', 'Canale')}
              {getSortButton('first_contact', 'Primo Contatto')}
              {getSortButton('last_interaction', 'Ultimo Messaggio')}
            </div>

            {/* Items per page */}
            <PageSizeSelector
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              options={[10, 20, 30, 40, 50]}
              totalItems={totalContacts}
            />
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Mostrando{' '}
            {contacts.length === 0
              ? 0
              : (currentPage - 1) * itemsPerPage + 1}{' '}
            -{' '}
            {Math.min(currentPage * itemsPerPage, totalContacts)} di{' '}
            {totalContacts} contatti
          </div>
        </div>

        {/* Contacts List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            <ContactsList
              contacts={contacts}
              viewMode="table"
              onContactClick={handleContactClick}
              refreshTrigger={refreshTrigger}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Lead Details Panel */}
      {selectedContact && (
        <LeadDetailsPanel
          lead={selectedContact}
          isOpen={isLeadDetailsPanelOpen}
          onClose={handleCloseLeadDetails}
          onUpdate={handleLeadUpdate}
        />
      )}
    </div>
  )
}

export default ContactsPage
