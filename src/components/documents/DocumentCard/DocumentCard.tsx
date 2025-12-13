import React from 'react'
import { Card } from '../../ui/Card/Card'
import { Badge } from '../../ui/Badge/Badge'
import { FileIcon } from '../../ui/Icon/FileIcon'
import './DocumentCard.css'
import type { Document } from '../../types/database.types'

interface DocumentCardProps {
  document: Document
  onView?: (document: Document) => void
  onDownload?: (document: Document) => void
  onDelete?: (document: Document) => void
  isSelected?: boolean
  onSelect?: (document: Document) => void
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
    <Card className={`document-card ${isSelected ? 'selected' : ''}`}>
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
          {onView && <button onClick={(e) => { e.stopPropagation(); onView(document); }}>View</button>}
          {onDownload && <button onClick={(e) => { e.stopPropagation(); onDownload(document); }}>Download</button>}
          {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(document); }}>Delete</button>}
        </div>
        </div>
      </div>
    </Card>
  )
}

export default React.memo(DocumentCard)
