import React, { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import MainSidebar from '../components/MainSidebar'
import { supabase } from '../lib/supabase'
import type { SocialContact } from '../types/database.types'
import toast from 'react-hot-toast'

type SortField = 'display_name' | 'channel' | 'first_contact' | 'last_interaction'
type SortDirection = 'asc' | 'desc'

const ContactsPage: React.FC = () => {
  const { clientData } = useAuth()
  const navigate = useNavigate()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [contacts, setContacts] = useState<SocialContact[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])

  // Sorting
  const [sortField, setSortField] = useState<SortField>('last_interaction')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  const handleChannelSelect = (channel: 'whatsapp' | 'instagram' | 'messenger' | null) => {
    if (channel) {
      navigate('/inbox', { state: { selectedChannel: channel } })
    }
  }

  useEffect(() => {
    if (!clientData?.id) return

    const fetchContacts = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('social_contacts')
          .select('*')
          .eq('platform_client_id', clientData.id)
          .order('last_interaction', { ascending: false })

        if (error) throw error

        setContacts(data || [])
      } catch (error: any) {
        console.error('Error fetching contacts:', error)
        toast.error('Errore caricamento contatti')
      } finally {
        setIsLoading(false)
      }
    }

    fetchContacts()

    // Realtime subscription for contacts
    const channel = supabase
      .channel('contacts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'social_contacts',
          filter: `platform_client_id=eq.${clientData.id}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            setContacts(prev => [payload.new as SocialContact, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setContacts(prev =>
              prev.map(contact =>
                contact.id === payload.new.id ? payload.new as SocialContact : contact
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setContacts(prev => prev.filter(contact => contact.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [clientData?.id])

  const toggleChannel = (channel: string) => {
    setSelectedChannels(prev =>
      prev.includes(channel)
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    )
    setCurrentPage(1)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setCurrentPage(1)
  }

  // Filter and sort contacts
  const filteredAndSortedContacts = useMemo(() => {
    let filtered = contacts.filter((contact) => {
      // Search filter
      const matchesSearch =
        !searchQuery ||
        contact.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.surname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phone?.includes(searchQuery) ||
        contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.company?.toLowerCase().includes(searchQuery.toLowerCase())

      // Channel filter
      const matchesChannel =
        selectedChannels.length === 0 || selectedChannels.includes(contact.platform)

      // Date range filter
      let matchesDate = true
      if (startDate || endDate) {
        const contactDate = new Date(contact.first_contact || '')

        if (startDate) {
          const start = new Date(startDate)
          start.setHours(0, 0, 0, 0)
          if (contactDate < start) {
            matchesDate = false
          }
        }

        if (endDate) {
          const end = new Date(endDate)
          end.setHours(23, 59, 59, 999)
          if (contactDate > end) {
            matchesDate = false
          }
        }
      }

      return matchesSearch && matchesChannel && matchesDate
    })

    // Sort
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'display_name':
          aValue = (a.display_name || a.name || '').toLowerCase()
          bValue = (b.display_name || b.name || '').toLowerCase()
          break
        case 'channel':
          aValue = a.platform?.toLowerCase() || ''
          bValue = b.platform?.toLowerCase() || ''
          break
        case 'first_contact':
          aValue = new Date(a.first_contact || 0).getTime()
          bValue = new Date(b.first_contact || 0).getTime()
          break
        case 'last_interaction':
          aValue = new Date(a.last_interaction || 0).getTime()
          bValue = new Date(b.last_interaction || 0).getTime()
          break
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [contacts, searchQuery, selectedChannels, startDate, endDate, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedContacts.length / itemsPerPage)
  const paginatedContacts = filteredAndSortedContacts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getChannelBadgeClass = (platform: string) => {
    switch (platform) {
      case 'whatsapp':
        return 'bg-green-100 text-green-800'
      case 'instagram':
        return 'bg-pink-100 text-pink-800'
      case 'messenger':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-8">
        <div className="mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Contatti</h2>
          <p className="mt-2 text-sm md:text-base text-gray-600">
            Gestisci tutti i tuoi contatti da WhatsApp, Instagram e Messenger
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtri</h3>

          {/* Search */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ricerca
            </label>
            <input
              type="text"
              placeholder="Cerca per nome, email, telefono, azienda..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Primo Contatto (Da)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setCurrentPage(1)
                }}
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
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Channel Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Canali Social
            </label>
            <div className="flex flex-wrap gap-2">
              {['whatsapp', 'instagram', 'messenger'].map((channel) => (
                <button
                  key={channel}
                  onClick={() => toggleChannel(channel)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedChannels.includes(channel)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {channel.charAt(0).toUpperCase() + channel.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {(searchQuery || startDate || endDate || selectedChannels.length > 0) && (
            <div className="mt-4">
              <button
                onClick={() => {
                  setSearchQuery('')
                  setStartDate('')
                  setEndDate('')
                  setSelectedChannels([])
                  setCurrentPage(1)
                }}
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
              <button
                onClick={() => handleSort('display_name')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  sortField === 'display_name'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Nome {sortField === 'display_name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSort('channel')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  sortField === 'channel'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Canale {sortField === 'channel' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSort('first_contact')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  sortField === 'first_contact'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Primo Contatto {sortField === 'first_contact' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSort('last_interaction')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  sortField === 'last_interaction'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Ultimo Messaggio {sortField === 'last_interaction' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
            </div>

            {/* Items per page */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Elementi per pagina:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={40}>40</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Mostrando {paginatedContacts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredAndSortedContacts.length)} di {filteredAndSortedContacts.length} contatti
          </div>
        </div>

        {/* Contacts Table */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Canale
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contatto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Azienda
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Primo Contatto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ultimo Messaggio
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedContacts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                          Nessun contatto trovato
                        </td>
                      </tr>
                    ) : (
                      paginatedContacts.map((contact) => (
                        <tr key={contact.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {contact.display_name || contact.name || 'N/A'}
                            </div>
                            {contact.email && (
                              <div className="text-sm text-gray-500">{contact.email}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getChannelBadgeClass(contact.platform)}`}>
                              {contact.platform?.charAt(0).toUpperCase() + contact.platform?.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {contact.phone || contact.email || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {contact.company || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(contact.first_contact)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(contact.last_interaction)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {paginatedContacts.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center text-sm text-gray-500">
                  Nessun contatto trovato
                </div>
              ) : (
                paginatedContacts.map((contact) => (
                  <div key={contact.id} className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">
                          {contact.display_name || contact.name || 'N/A'}
                        </h3>
                        {contact.email && (
                          <p className="text-sm text-gray-500 mt-1">{contact.email}</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getChannelBadgeClass(contact.platform)}`}>
                        {contact.platform?.charAt(0).toUpperCase() + contact.platform?.slice(1)}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      {contact.phone && (
                        <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {contact.phone}
                        </div>
                      )}

                      {contact.company && (
                        <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {contact.company}
                        </div>
                      )}

                      <div className="pt-2 mt-2 border-t border-gray-200">
                        <div className="text-xs text-gray-500">
                          <span className="font-medium">Primo contatto:</span> {formatDate(contact.first_contact)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          <span className="font-medium">Ultimo messaggio:</span> {formatDate(contact.last_interaction)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Precedente
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-4 py-2 text-sm font-medium rounded-md ${
                          currentPage === pageNum
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Successiva
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default ContactsPage
