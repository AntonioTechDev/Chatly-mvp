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
import MainSidebar from '../components/layout/MainSidebar'
import DocumentUpload from '../components/documents/DocumentUpload'
import DocumentViewer from '../components/documents/DocumentViewer'
import { useDocuments } from '../hooks/useDocuments'
import { SearchBar } from '../components/ui/SearchBar/SearchBar'
import { FilterButtons, type FilterOption } from '../components/ui/FilterButtons/FilterButtons'
import { Pagination } from '../components/ui/Pagination/Pagination'
import { PageSizeSelector } from '../components/ui/PageSizeSelector/PageSizeSelector'
import { ViewModeToggle } from '../components/ui/ViewModeToggle/ViewModeToggle'
import { DocumentsList } from '../components/documents/DocumentsList/DocumentsList'

const DocumentsPage: React.FC = () => {
  const { clientData } = useAuth()
  const navigate = useNavigate()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [selectedDocuments, setSelectedDocuments] = useState<Set<number>>(new Set())

  const {
    documents,
    isLoading,
    error,
    uploadDocument,
    deleteDocument,
    downloadDocument,
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
    const startIndex = (currentPage - 1) * pageSize
    return filteredDocuments.slice(startIndex, startIndex + pageSize)
  }, [filteredDocuments, currentPage, pageSize])

  const totalPages = Math.ceil(filteredDocuments.length / pageSize)

  // Reset to page 1 when filters or page size change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedFilter, pageSize])

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentPage])

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
  const handleSelectDocument = useCallback((document: any) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(document.id)) {
        newSet.delete(document.id)
      } else {
        newSet.add(document.id)
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
  const filterOptions = useMemo<FilterOption[]>(() => {
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

    // Convert to array of FilterOption
    return Object.entries(filterCounts).map(([value, { label, count }]) => ({
      value,
      label,
      count
    }))
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
                  <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Cerca documenti..."
                  />
                </div>

                {/* View Mode Toggle */}
                <ViewModeToggle
                  value={viewMode}
                  onChange={setViewMode}
                />
              </div>

              {/* Filter Buttons - Dynamic based on uploaded documents */}
              <FilterButtons
                options={filterOptions}
                selected={selectedFilter}
                onSelect={setSelectedFilter}
              />
            </div>
          </div>

          {/* Bulk Actions Bar and Page Size Selector */}
          {filteredDocuments.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex flex-col gap-4">
                {/* Bulk Actions Row */}
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

                {/* Page Size Selector Row */}
                <div className="flex justify-end border-t border-gray-200 pt-4">
                  <PageSizeSelector
                    value={pageSize}
                    options={[5, 10, 20, 50]}
                    onChange={setPageSize}
                    totalItems={filteredDocuments.length}
                  />
                </div>
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
              <DocumentsList
                documents={paginatedDocuments}
                onViewDocument={handleViewDocument}
                onDownloadDocument={downloadDocument}
                onDeleteDocument={deleteDocument}
                enableSelection={true}
                selectedIds={Array.from(selectedDocuments)}
                onSelectionChange={handleSelectDocument}
                viewMode={viewMode}
                emptyMessage={
                  searchQuery || selectedFilter !== 'all'
                    ? 'Nessun documento trovato con i filtri applicati'
                    : 'Nessun documento caricato. Carica il tuo primo documento!'
                }
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
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
