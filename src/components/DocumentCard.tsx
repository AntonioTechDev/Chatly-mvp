/**
 * DocumentCard Component
 *
 * Optimized document card with:
 * - Lazy loading
 * - Memoization
 * - File type icons
 * - Actions menu
 */

import React, { useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'

interface DocumentCardProps {
  document: {
    id: number
    file_name: string
    file_size: number
    mime_type: string
    storage_path: string
    uploaded_at: string
    drive_file_id?: string | null
    drive_web_view_link?: string | null
  }
  onDelete: (id: number, storagePath?: string) => Promise<boolean>
  onView?: (document: any) => void
  isSelected?: boolean
  onSelect?: (id: number, selected: boolean) => void
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document, onDelete, onView, isSelected, onSelect }) => {
  const fileName = document.file_name || 'Senza nome'
  const fileSize = document.file_size || 0
  const mimeType = document.mime_type || ''
  const storagePath = document.storage_path
  const uploadedAt = document.uploaded_at
  const isDriveFile = !!document.drive_file_id

  // Format file size
  const formattedSize = useMemo(() => {
    if (fileSize < 1024) return `${fileSize} B`
    if (fileSize < 1024 * 1024) return `${(fileSize / 1024).toFixed(1)} KB`
    return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`
  }, [fileSize])

  // Format date
  const formattedDate = useMemo(() => {
    if (!uploadedAt) return 'Data sconosciuta'
    return new Date(uploadedAt).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [uploadedAt])

  // Get file icon
  const fileIcon = useMemo(() => {
    if (mimeType.startsWith('image/')) {
      return (
        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    }
    if (mimeType === 'application/pdf') {
      return (
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    }
    if (mimeType.includes('word') || mimeType.includes('document')) {
      return (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      return (
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    }
    return (
      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  }, [mimeType])

  // Download document
  const handleDownload = useCallback(async () => {
    if (!storagePath) return

    try {
      // If it's a Drive file, open in new tab
      if (isDriveFile && document.drive_web_view_link) {
        window.open(document.drive_web_view_link, '_blank')
        return
      }

      // Otherwise download from storage
      const { data, error } = await supabase.storage
        .from('documents')
        .download(storagePath)

      if (error) throw error

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
    }
  }, [storagePath, fileName, isDriveFile, document.drive_web_view_link])

  // View document
  const handleView = useCallback(() => {
    if (onView) {
      onView(document)
    }
  }, [onView, document])

  // Delete document
  const handleDelete = useCallback(async () => {
    if (window.confirm('Sei sicuro di voler eliminare questo documento?')) {
      await onDelete(document.id, storagePath)
    }
  }, [onDelete, document.id, storagePath])

  return (
    <div className={`bg-white border rounded-lg p-4 hover:shadow-md transition-all ${isSelected ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200'}`}>
      <div className="flex items-start space-x-4">
        {/* Checkbox */}
        {onSelect && (
          <div className="flex-shrink-0 pt-1">
            <input
              type="checkbox"
              checked={isSelected || false}
              onChange={(e) => onSelect(document.id, e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
          </div>
        )}

        {/* File Icon */}
        <div className="flex-shrink-0">
          {fileIcon}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-gray-900 truncate" title={fileName}>
              {fileName}
            </h3>
            {isDriveFile && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.01 1.485c-.205 0-.407.053-.584.16l-8.18 4.966a1.375 1.375 0 00-.642 1.17v9.938c0 .486.249.936.642 1.17l8.18 4.966c.177.107.379.16.584.16.205 0 .407-.053.584-.16l8.18-4.966c.393-.234.642-.684.642-1.17V7.781c0-.486-.249-.936-.642-1.17l-8.18-4.966a1.155 1.155 0 00-.584-.16z"/>
                </svg>
                Drive
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center space-x-3 text-xs text-gray-500">
            <span>{formattedSize}</span>
            <span>•</span>
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center space-x-2">
          {/* View Button - Available for all documents */}
          {onView && (
            <button
              onClick={handleView}
              className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
              title="Visualizza"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          )}

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
            title="Scarica"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            title="Elimina"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default React.memo(DocumentCard)
