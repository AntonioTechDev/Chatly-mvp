/**
 * DocumentsPage
 *
 * Complete document management page with:
 * - Upload functionality
 * - Document listing with pagination
 * - Search and filtering
 * - Real-time updates
 * - Optimized performance
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import MainSidebar from '../components/MainSidebar'
import DocumentUpload from '../components/DocumentUpload'
import DocumentCard from '../components/DocumentCard'
import DocumentViewer from '../components/DocumentViewer'
import { useDocuments } from '../hooks/useDocuments'

const DocumentsPage: React.FC = () => {
  const { clientData } = useAuth()
  const navigate = useNavigate()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [selectedDocuments, setSelectedDocuments] = useState<Set<number>>(new Set())
  const itemsPerPage = 12

  const {
    documents,
    isLoading,
    error,
    uploadDocument,
    deleteDocument,
    refreshDocuments
  } = useDocuments()

  // Document type helper - must be defined before use
  const getDocumentType = useCallback((mimeType: string) => {
    if (mimeType === 'application/pdf') return 'pdf'
    if (mimeType.includes('word') || mimeType.includes('wordprocessingml')) return 'word'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheetml')) return 'excel'
    if (mimeType.includes('powerpoint') || mimeType.includes('presentationml')) return 'powerpoint'
    if (mimeType === 'text/plain') return 'text'
    return 'other'
  }, [])

  // Debounced search - only filter locally for performance
  const filteredDocuments = useMemo(() => {
    let filtered = documents

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(doc => {
        const fileName = doc.file_name?.toLowerCase() || ''
        const description = doc.description?.toLowerCase() || ''
        return fileName.includes(query) || description.includes(query)
      })
    }

    // Apply type filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(doc => {
        const type = getDocumentType(doc.mime_type || '')
        return type === selectedFilter
      })
    }

    return filtered
  }, [documents, searchQuery, selectedFilter, getDocumentType])

  // Pagination
  const paginatedDocuments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredDocuments.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredDocuments, currentPage])

  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedFilter])

  // Handle channel select - Navigate to inbox with selected channel
  const handleChannelSelect = useCallback((channel: 'whatsapp' | 'instagram' | 'messenger' | null) => {
    if (channel) {
      navigate('/inbox', { state: { selectedChannel: channel } })
    }
  }, [navigate])

  // Handle view document
  const handleViewDocument = useCallback((document: any) => {
    setSelectedDocument(document)
  }, [])

  // Close document viewer
  const handleCloseViewer = useCallback(() => {
    setSelectedDocument(null)
  }, [])

  // Handle document selection
  const handleSelectDocument = useCallback((id: number, selected: boolean) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      return newSet
    })
  }, [])

  // Select all filtered documents
  const handleSelectAll = useCallback(() => {
    if (selectedDocuments.size === filteredDocuments.length) {
      setSelectedDocuments(new Set())
    } else {
      setSelectedDocuments(new Set(filteredDocuments.map(doc => doc.id)))
    }
  }, [filteredDocuments, selectedDocuments.size])

  // Delete multiple documents
  const handleDeleteMultiple = useCallback(async () => {
    if (selectedDocuments.size === 0) return

    if (window.confirm(`Sei sicuro di voler eliminare ${selectedDocuments.size} documenti?`)) {
      const docsToDelete = documents.filter(doc => selectedDocuments.has(doc.id))

      for (const doc of docsToDelete) {
        await deleteDocument(doc.id, doc.storage_path)
      }

      setSelectedDocuments(new Set())
    }
  }, [selectedDocuments, documents, deleteDocument])

  // Download multiple documents
  const handleDownloadMultiple = useCallback(async () => {
    if (selectedDocuments.size === 0) return

    const docsToDownload = documents.filter(doc => selectedDocuments.has(doc.id))

    for (const doc of docsToDownload) {
      try {
        const { data, error } = await supabase.storage
          .from('documents')
          .download(doc.storage_path)

        if (error) throw error

        const url = URL.createObjectURL(data)
        const a = document.createElement('a')
        a.href = url
        a.download = doc.file_name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error('Download error for', doc.file_name, error)
      }
    }
  }, [selectedDocuments, documents])

  // Dynamic filters based on actual document types
  const availableFilters = useMemo(() => {
    const filterCounts: { [key: string]: { label: string; count: number } } = {
      all: { label: 'Tutti', count: documents.length }
    }

    documents.forEach(doc => {
      const type = getDocumentType(doc.mime_type || '')
      if (!filterCounts[type]) {
        let label = ''
        switch (type) {
          case 'pdf': label = 'PDF'; break
          case 'word': label = 'Word'; break
          case 'excel': label = 'Excel'; break
          case 'powerpoint': label = 'PowerPoint'; break
          case 'text': label = 'Testo'; break
          default: label = 'Altro'; break
        }
        filterCounts[type] = { label, count: 0 }
      }
      filterCounts[type].count++
    })

    return filterCounts
  }, [documents, getDocumentType])

  // Stats
  const stats = useMemo(() => {
    const totalSize = documents.reduce((sum, doc) =>
      sum + (doc.file_size || 0), 0
    )
    const pdfCount = documents.filter(doc =>
      doc.mime_type === 'application/pdf'
    ).length
    const wordCount = documents.filter(doc =>
      doc.mime_type?.includes('word') || doc.mime_type?.includes('wordprocessingml')
    ).length
    const excelCount = documents.filter(doc =>
      doc.mime_type?.includes('excel') || doc.mime_type?.includes('spreadsheetml')
    ).length

    return {
      total: documents.length,
      totalSize,
      pdfCount,
      wordCount,
      excelCount
    }
  }, [documents])

  const formattedTotalSize = useMemo(() => {
    const size = stats.totalSize
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }, [stats.totalSize])

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative h-full w-64">
            <MainSidebar onChannelSelect={handleChannelSelect} />
          </div>
        </div>
      )}

      {/* Sidebar - Desktop */}
      <div className="hidden md:block">
        <MainSidebar onChannelSelect={handleChannelSelect} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 md:space-x-4 flex-1 min-w-0">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 shrink-0"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="min-w-0 flex-1">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">Documenti</h1>
                <p className="text-xs md:text-sm text-gray-500 mt-1 truncate">
                  {clientData?.business_name || 'Gestisci i tuoi documenti'}
                </p>
              </div>
            </div>
          </div>

          {/* Stats - Dynamic based on uploaded documents */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Totale</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Spazio</p>
              <p className="text-2xl font-bold text-gray-900">{formattedTotalSize}</p>
            </div>
            {stats.pdfCount > 0 && (
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-xs text-red-600">PDF</p>
                <p className="text-2xl font-bold text-red-700">{stats.pdfCount}</p>
              </div>
            )}
            {stats.wordCount > 0 && (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-600">Word</p>
                <p className="text-2xl font-bold text-blue-700">{stats.wordCount}</p>
              </div>
            )}
            {stats.excelCount > 0 && (
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs text-green-600">Excel</p>
                <p className="text-2xl font-bold text-green-700">{stats.excelCount}</p>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Upload Area */}
          <div className="space-y-4">
            <DocumentUpload onUpload={uploadDocument} />
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex flex-col space-y-4">
              {/* Search and View Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Cerca documenti..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center space-x-2 border border-gray-300 rounded-md shrink-0">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
                    title="Griglia"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
                    title="Lista"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Filter Buttons - Dynamic based on uploaded documents */}
              <div className="flex items-center flex-wrap gap-2">
                {Object.entries(availableFilters).map(([value, { label, count }]) => (
                  <button
                    key={value}
                    onClick={() => setSelectedFilter(value)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      selectedFilter === value
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label} {value !== 'all' && `(${count})`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {filteredDocuments.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                {/* Select All */}
                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.size === filteredDocuments.length && filteredDocuments.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Seleziona tutti {filteredDocuments.length > 0 && `(${filteredDocuments.length})`}
                    </span>
                  </label>
                  {selectedDocuments.size > 0 && (
                    <span className="text-sm text-gray-500">
                      {selectedDocuments.size} selezionati
                    </span>
                  )}
                </div>

                {/* Bulk Actions */}
                {selectedDocuments.size > 0 && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleDownloadMultiple}
                      className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span className="text-sm font-medium">Scarica</span>
                    </button>
                    <button
                      onClick={handleDeleteMultiple}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span className="text-sm font-medium">Elimina</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents Grid/List */}
          {isLoading && documents.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-600">Errore: {error.message}</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-gray-600">
                {searchQuery || selectedFilter !== 'all'
                  ? 'Nessun documento trovato'
                  : 'Nessun documento caricato. Carica il tuo primo documento!'
                }
              </p>
            </div>
          ) : (
            <>
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-3'
              }>
                {paginatedDocuments.map(doc => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    onDelete={deleteDocument}
                    onView={handleViewDocument}
                    isSelected={selectedDocuments.has(doc.id)}
                    onSelect={handleSelectDocument}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Precedente
                  </button>
                  <span className="text-sm text-gray-600 whitespace-nowrap">
                    Pagina {currentPage} di {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Successiva
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onClose={handleCloseViewer}
        />
      )}
    </div>
  )
}

export default DocumentsPage
