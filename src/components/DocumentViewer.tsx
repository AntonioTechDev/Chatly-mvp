/**
 * DocumentViewer Component
 *
 * Read-only preview for various document types:
 * - PDF files (native preview)
 * - Office documents (Google Docs Viewer)
 * - Text files (text display)
 * - Drive files (direct link)
 */

import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface DocumentViewerProps {
  document: {
    id: number
    file_name: string
    mime_type: string
    storage_path: string
    drive_file_id?: string | null
    drive_web_view_link?: string | null
  }
  onClose: () => void
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ document, onClose }) => {
  const { file_name, mime_type, storage_path, drive_file_id, drive_web_view_link } = document
  const [documentUrl, setDocumentUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Get signed URL for private storage
  useEffect(() => {
    async function getSignedUrl() {
      setIsLoading(true)

      // If it's a Drive file, use the web view link
      if (drive_file_id && drive_web_view_link) {
        setDocumentUrl(drive_web_view_link)
        setIsLoading(false)
        return
      }

      // Otherwise get signed URL from storage (valid for 1 hour)
      if (storage_path) {
        try {
          const { data, error } = await supabase.storage
            .from('documents')
            .createSignedUrl(storage_path, 3600) // 1 hour expiry

          if (error) {
            console.error('Error creating signed URL:', error)
            setDocumentUrl(null)
          } else {
            setDocumentUrl(data.signedUrl)
          }
        } catch (err) {
          console.error('Error:', err)
          setDocumentUrl(null)
        }
      }

      setIsLoading(false)
    }

    getSignedUrl()
  }, [storage_path, drive_file_id, drive_web_view_link])

  // Render content based on mime type
  const renderContent = () => {
    // Loading state
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Caricamento documento...</p>
          </div>
        </div>
      )
    }

    if (!documentUrl) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Impossibile caricare il documento</p>
        </div>
      )
    }

    // PDF files - native preview
    if (mime_type === 'application/pdf') {
      return (
        <iframe
          src={`${documentUrl}#view=FitH&toolbar=0&navpanes=0`}
          className="w-full h-full border-0"
          title={file_name}
        />
      )
    }

    // Office documents (Word, Excel, PowerPoint)
    // Note: Cannot use Google Docs Viewer with signed URLs (private files)
    // Offer download instead
    if (
      mime_type === 'application/msword' ||
      mime_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mime_type === 'application/vnd.ms-excel' ||
      mime_type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mime_type === 'application/vnd.ms-powerpoint' ||
      mime_type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ) {
      const fileTypeLabel = mime_type.includes('word') ? 'Word' :
                           mime_type.includes('excel') ? 'Excel' :
                           mime_type.includes('powerpoint') ? 'PowerPoint' : 'Office'

      return (
        <div className="flex flex-col items-center justify-center h-full space-y-4 p-6">
          <svg className="w-16 h-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div className="text-center">
            <p className="text-gray-700 font-medium text-lg">{file_name}</p>
            <p className="text-sm text-gray-500 mt-1">Documento {fileTypeLabel}</p>
            <p className="text-sm text-gray-500 mt-2">
              L'anteprima in-browser non è disponibile per i documenti Office.
            </p>
          </div>
          <a
            href={documentUrl}
            download={file_name}
            className="mt-4 inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Scarica documento
          </a>
        </div>
      )
    }

    // Text files
    if (mime_type === 'text/plain') {
      return (
        <div className="w-full h-full overflow-auto bg-white p-6">
          <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
            <TextFileContent url={documentUrl} />
          </pre>
        </div>
      )
    }

    // Drive files
    if (drive_file_id) {
      return (
        <iframe
          src={documentUrl}
          className="w-full h-full border-0"
          title={file_name}
        />
      )
    }

    // Fallback for unsupported types
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <div className="text-center">
          <p className="text-gray-700 font-medium">Anteprima non disponibile</p>
          <p className="text-sm text-gray-500 mt-1">Tipo di file: {mime_type}</p>
          <a
            href={documentUrl}
            download={file_name}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Scarica documento
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate" title={file_name}>
              {file_name}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Solo lettura
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

// Helper component for text files
const TextFileContent: React.FC<{ url: string }> = ({ url }) => {
  const [content, setContent] = React.useState<string>('Caricamento...')

  React.useEffect(() => {
    fetch(url)
      .then(res => res.text())
      .then(text => setContent(text))
      .catch(err => {
        console.error('Error loading text file:', err)
        setContent('Errore nel caricamento del file')
      })
  }, [url])

  return <>{content}</>
}

export default React.memo(DocumentViewer)
