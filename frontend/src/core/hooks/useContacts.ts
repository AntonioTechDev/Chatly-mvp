/**
 * useContacts Hook
 *
 * Manages all business logic for contacts:
 * - Fetching contacts from Supabase
 * - Search and filtering
 * - Sorting
 * - Pagination
 * - Realtime subscriptions
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getContacts, subscribeToContacts } from '../services/contactService'
import type { SocialContact } from '../types/database.types'
import toast from 'react-hot-toast'

export type SortField = 'display_name' | 'channel' | 'first_contact' | 'last_interaction'
export type SortDirection = 'asc' | 'desc'

export const useContacts = () => {
  const { clientData } = useAuth()

  // State - Data
  const [contacts, setContacts] = useState<SocialContact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State - Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])

  // State - Sorting
  const [sortField, setSortField] = useState<SortField>('last_interaction')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // State - Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  // Fetch contacts
  const fetchContacts = useCallback(async () => {
    if (!clientData?.id) return

    setIsLoading(true)
    setError(null)

    try {
      const data = await getContacts({
        platformClientId: clientData.id,
        channels: selectedChannels.length > 0 ? selectedChannels : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })

      setContacts(data)
    } catch (err: any) {
      console.error('Error fetching contacts:', err)
      setError(err.message || 'Errore caricamento contatti')
      toast.error('Errore caricamento contatti')
    } finally {
      setIsLoading(false)
    }
  }, [clientData?.id, selectedChannels, startDate, endDate])

  // Initial fetch
  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  // Realtime subscription
  useEffect(() => {
    if (!clientData?.id) return

    const channel = subscribeToContacts(clientData.id, {
      onInsert: (newContact) => {
        setContacts((prev) => [newContact, ...prev])
      },
      onUpdate: (updatedContact) => {
        setContacts((prev) =>
          prev.map((contact) =>
            contact.id === updatedContact.id ? updatedContact : contact
          )
        )
      },
      onDelete: (contactId) => {
        setContacts((prev) => prev.filter((contact) => contact.id !== contactId))
      },
    })

    return () => {
      channel.unsubscribe()
    }
  }, [clientData?.id])

  // Filter contacts by search query
  const filteredContacts = useMemo(() => {
    if (!searchQuery) return contacts

    const query = searchQuery.toLowerCase()

    return contacts.filter((contact) => {
      return (
        contact.display_name?.toLowerCase().includes(query) ||
        contact.name?.toLowerCase().includes(query) ||
        contact.surname?.toLowerCase().includes(query) ||
        contact.phone?.includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.company?.toLowerCase().includes(query)
      )
    })
  }, [contacts, searchQuery])

  // Sort contacts
  const sortedContacts = useMemo(() => {
    const sorted = [...filteredContacts]

    sorted.sort((a, b) => {
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

    return sorted
  }, [filteredContacts, sortField, sortDirection])

  // Paginate contacts
  const totalPages = Math.ceil(sortedContacts.length / itemsPerPage)
  const paginatedContacts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return sortedContacts.slice(startIndex, endIndex)
  }, [sortedContacts, currentPage, itemsPerPage])

  // Handlers - Search
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }, [])

  // Handlers - Filters
  const handleChannelToggle = useCallback((channel: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    )
    setCurrentPage(1)
  }, [])

  const handleDateChange = useCallback(
    (type: 'start' | 'end', value: string) => {
      if (type === 'start') {
        setStartDate(value)
      } else {
        setEndDate(value)
      }
      setCurrentPage(1)
    },
    []
  )

  const handleClearFilters = useCallback(() => {
    setSearchQuery('')
    setStartDate('')
    setEndDate('')
    setSelectedChannels([])
    setCurrentPage(1)
  }, [])

  // Handlers - Sorting
  const handleSort = useCallback((field: SortField) => {
    setSortField((prevField) => {
      if (prevField === field) {
        setSortDirection((prevDir) => (prevDir === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortDirection('asc')
      }
      return field
    })
    setCurrentPage(1)
  }, [])

  // Handlers - Pagination
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handleItemsPerPageChange = useCallback((value: number) => {
    setItemsPerPage(value)
    setCurrentPage(1)
  }, [])

  // Return everything
  return {
    // Data
    contacts: paginatedContacts,
    allContacts: contacts,
    isLoading,
    error,

    // Stats
    totalContacts: sortedContacts.length,
    totalPages,
    currentPage,
    itemsPerPage,

    // Filter state
    searchQuery,
    startDate,
    endDate,
    selectedChannels,

    // Sort state
    sortField,
    sortDirection,

    // Actions
    handleSearchChange,
    handleChannelToggle,
    handleDateChange,
    handleClearFilters,
    handleSort,
    handlePageChange,
    handleItemsPerPageChange,
    refetch: fetchContacts,
  }
}
