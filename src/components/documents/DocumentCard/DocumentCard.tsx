import React from 'react'
import { Card } from '../../ui/Card/Card'
import { Badge } from '../../ui/Badge/Badge'
import { FileIcon } from '../../ui/Icon/FileIcon'
import './DocumentCard.css'
import type { UserDocument } from '@/core/hooks/useDocuments'

interface DocumentCardProps {
  document: UserDocument
  onView?: (document: UserDocument) => void
  onDownload?: (document: UserDocument) => void
  onDelete?: (document: UserDocument) => void
  isSelected?: boolean
  onSelect?: (document: UserDocument) => void
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onView,
  onDownload,
  onDelete,
  isSelected,
  onSelect,
}) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('it-IT')
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <Card className={`document - card ${isSelected ? 'selected' : ''} `}>
      <div className="content">
        {onSelect && (
          <div className="checkbox-section">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(document)}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
          </div>
        )}
        <div className="icon-section">
          <FileIcon mimeType={document.mime_type} />
        </div>
        <div className="info">
          <h3 className="name">{document.file_name}</h3>
          <div className="meta">
            <span>{formatSize(document.file_size)}</span>
            <span>{formatDate(document.uploaded_at)}</span>
          </div>
          <div className="actions">
            {onView && (
              <button onClick={(e) => { e.stopPropagation(); onView(document); }} title="Visualizza documento">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            )}
            {onDownload && (
              <button onClick={(e) => { e.stopPropagation(); onDownload(document); }} title="Scarica documento">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(document); }} title="Elimina documento">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

export default React.memo(DocumentCard)
