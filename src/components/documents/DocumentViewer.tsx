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
import { supabase } from '@/core/lib/supabase'
import DocumentTextIcon from '@/img/document-text-icon.svg?react'
import DownloadIcon from '@/img/download-icon.svg?react'
import CloseIcon from '@/img/close-icon.svg?react'
import './DocumentViewer.css'

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
        <div className="document-viewer-loading">
          <div className="document-viewer-spinner"></div>
          <p className="document-viewer-message">Caricamento documento...</p>
        </div>
      )
    }

    if (!documentUrl) {
      return (
        <div className="document-viewer-error">
          <p className="document-viewer-message">Impossibile caricare il documento</p>
        </div>
      )
    }

    // PDF files - native preview
    if (mime_type === 'application/pdf') {
      return (
        <iframe
          src={`${documentUrl}#view=FitH&toolbar=0&navpanes=0`}
          className="document-viewer-iframe"
          title={file_name}
        />
      )
    }

    // Office documents (Word, Excel, PowerPoint)
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
        <div className="document-viewer-preview-container">
          <DocumentTextIcon className="document-viewer-preview-icon" />
          <div className="document-viewer-preview-text-wrapper">
            <p className="document-viewer-preview-text">{file_name}</p>
            <p className="document-viewer-preview-subtext">Documento {fileTypeLabel}</p>
            <p className="document-viewer-preview-smalltext">
              L'anteprima in-browser non è disponibile per i documenti Office.
            </p>
          </div>
          <a
            href={documentUrl}
            download={file_name}
            className="document-viewer-download-btn document-viewer-download-btn--large"
          >
            <DownloadIcon className="document-viewer-btn-icon" />
            Scarica documento
          </a>
        </div>
      )
    }

    // Text files
    if (mime_type === 'text/plain') {
      return (
        <div className="document-viewer-text-content">
          <pre className="document-viewer-pre">
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
          className="document-viewer-iframe"
          title={file_name}
        />
      )
    }

    // Fallback for unsupported types
    return (
      <div className="document-viewer-preview-container">
        <DocumentTextIcon className="document-viewer-preview-icon document-viewer-preview-icon--gray" />
        <div className="document-viewer-preview-text-wrapper">
          <p className="document-viewer-preview-text">Anteprima non disponibile</p>
          <p className="document-viewer-preview-subtext">Tipo di file: {mime_type}</p>
          <a
            href={documentUrl}
            download={file_name}
            className="document-viewer-download-btn"
          >
            <DownloadIcon className="document-viewer-btn-icon" />
            Scarica documento
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="document-viewer-overlay">
      <div className="document-viewer-modal">
        {/* Header */}
        <div className="document-viewer-header">
          <div className="document-viewer-title-wrapper">
            <h2 className="document-viewer-title" title={file_name}>
              {file_name}
            </h2>
            <p className="document-viewer-subtitle">
              Solo lettura
            </p>
          </div>
          <button
            onClick={onClose}
            className="document-viewer-close-btn"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="document-viewer-content">
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
