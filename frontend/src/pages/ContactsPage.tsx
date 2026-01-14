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
import { useContacts } from '@/core/hooks/useContacts'
import type { SortField } from '@/core/hooks/useContacts'
import type { SocialContact } from '@/core/types/database.types'
import './ContactsPage.css'
import MenuIcon from '@/img/menu-icon.svg?react'

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
        className={isActive ? 'active' : 'inactive'}
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
    <div className="contacts-layout">
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileSidebarOpen(true)}
        className="mobile-sidebar-toggle"
      >
        <MenuIcon />
      </button>

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

      {/* Main Content */}
      <main className="contacts-content">
        {/* Header */}
        <div className="page-header">
          <h2>Contatti</h2>
          <p>
            Gestisci tutti i tuoi contatti da WhatsApp, Instagram e Messenger
          </p>
        </div>

        {/* Filters Section */}
        <div className="filter-section">
          <h3>Filtri</h3>

          {/* Search */}
          <div className="filter-group">
            <label>
              Ricerca
            </label>
            <SearchBar
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Cerca per nome, email, telefono, azienda..."
            />
          </div>

          {/* Date Range */}
          <div className="date-range-grid">
            <div>
              <label>
                Data Primo Contatto (Da)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleDateChange('start', e.target.value)}
              />
            </div>
            <div>
              <label>
                Data Primo Contatto (A)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleDateChange('end', e.target.value)}
              />
            </div>
          </div>

          {/* Channel Filters */}
          <div className="filter-group">
            <label>
              Canali Social
            </label>
            <div className="channels-toggle">
              {channelOptions.map((channel) => (
                <button
                  key={channel.value}
                  onClick={() => handleChannelToggle(channel.value)}
                  className={selectedChannels.includes(channel.value) ? 'active' : 'inactive'}
                >
                  {channel.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="clear-filters">
              <button
                onClick={handleClearFilters}
              >
                Cancella tutti i filtri
              </button>
            </div>
          )}
        </div>

        {/* Sorting and Pagination Controls */}
        <div className="controls-section">
          <div className="controls-header">
            {/* Sort Options */}
            <div className="sort-options">
              <span>Ordina per:</span>
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

          <div className="showing-text">
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
          <div className="loading-container">
            <div className="spinner"></div>
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
              <div className="pagination-wrapper">
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
