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
import { useAuth } from '@/core/contexts/AuthContext'

import { toast } from 'react-hot-toast'
import type { Database } from '@/core/types/database.types'
import { LayoutList, Search, Upload, FileText, Trash2, Calendar, File, Loader2 } from 'lucide-react'
import MainSidebar from '../components/layout/MainSidebar'
import DocumentUpload from '../components/documents/DocumentUpload'
import DocumentViewer from '../components/documents/DocumentViewer'
import { useDocuments } from '@/core/hooks/useDocuments'
import { SearchBar } from '../components/ui/SearchBar/SearchBar'
import { FilterButtons, type FilterOption } from '../components/ui/FilterButtons/FilterButtons'
import { Pagination } from '../components/ui/Pagination/Pagination'
import { PageSizeSelector } from '../components/ui/PageSizeSelector/PageSizeSelector'
import { ViewModeToggle } from '../components/ui/ViewModeToggle/ViewModeToggle'
import { DocumentsList } from '../components/documents/DocumentsList/DocumentsList'
import './DocumentsPage.css'
import MenuIcon from '@/img/menu-icon.svg?react'
import DownloadIcon from '@/img/download-icon.svg?react'
import TrashIcon from '@/img/trash-icon.svg?react'
import FileDocumentIcon from '@/img/file-document-icon.svg?react'

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
      await downloadDocument(doc.storage_path, doc.file_name)
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }, [selectedDocuments, documents, downloadDocument])

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
    <div className="documents-layout">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="mobile-sidebar-overlay">
          <div
            className="backdrop"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="sidebar-container">
            <MainSidebar onChannelSelect={handleChannelSelect} />
          </div>
        </div>
      )}

      {/* Sidebar - Desktop */}
      <div className="sidebar-wrapper-desktop">
        <MainSidebar onChannelSelect={handleChannelSelect} />
      </div>

      {/* Main Content */}
      <div className="documents-main-content">
        {/* Header */}
        <header className="documents-header">
          <div className="header-top">
            <div className="title-section">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="mobile-menu-btn"
              >
                <MenuIcon />
              </button>

              <div className="title-info">
                <h1>Documenti</h1>
                <p>
                  {clientData?.business_name || 'Gestisci i tuoi documenti'}
                </p>
              </div>
            </div>
          </div>

          {/* Stats - Dynamic based on uploaded documents */}
          <div className="stats-grid">
            <div className="stat-card gray">
              <p className="label">Totale</p>
              <p className="value">{stats.total}</p>
            </div>
            <div className="stat-card gray">
              <p className="label">Spazio</p>
              <p className="value">{formattedTotalSize}</p>
            </div>
            {stats.pdfCount > 0 && (
              <div className="stat-card red">
                <p className="label">PDF</p>
                <p className="value">{stats.pdfCount}</p>
              </div>
            )}
            {stats.wordCount > 0 && (
              <div className="stat-card blue">
                <p className="label">Word</p>
                <p className="value">{stats.wordCount}</p>
              </div>
            )}
            {stats.excelCount > 0 && (
              <div className="stat-card green">
                <p className="label">Excel</p>
                <p className="value">{stats.excelCount}</p>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="documents-content-area">
          {/* Upload Area */}
          <div className="space-y-4">
            <DocumentUpload onUpload={uploadDocument} />
          </div>

          {/* Filters */}
          <div className="filters-panel">
            <div className="filters-container">
              {/* Search and View Toggle */}
              <div className="search-row">
                {/* Search */}
                <div className="search-wrapper">
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
            <div className="bulk-actions-panel">
              <div className="actions-container">
                {/* Bulk Actions Row */}
                <div className="actions-row">
                  {/* Select All */}
                  <div className="selection-checkbox">
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedDocuments.size === filteredDocuments.length && filteredDocuments.length > 0}
                        onChange={handleSelectAll}
                      />
                      <span>
                        Seleziona tutti {filteredDocuments.length > 0 && `(${filteredDocuments.length})`}
                      </span>
                    </label>
                    {selectedDocuments.size > 0 && (
                      <span className="selection-count">
                        {selectedDocuments.size} selezionati
                      </span>
                    )}
                  </div>

                  {/* Bulk Actions */}
                  {selectedDocuments.size > 0 && (
                    <div className="action-buttons">
                      <button
                        onClick={handleDownloadMultiple}
                        className="download-btn"
                      >
                        <DownloadIcon />
                        <span>Scarica</span>
                      </button>
                      <button
                        onClick={handleDeleteMultiple}
                        className="delete-btn"
                      >
                        <TrashIcon />
                        <span>Elimina</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Page Size Selector Row */}
                <div className="pagination-row">
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
            <div className="loading-state">
              <div className="spinner"></div>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>Errore: {error.message}</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="empty-state">
              <FileDocumentIcon />
              <p>
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
                onDownloadDocument={(doc) => downloadDocument(doc.storage_path, doc.file_name)}
                onDeleteDocument={(doc) => deleteDocument(doc.id, doc.storage_path)}
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
                <div className="pagination-wrapper">
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
