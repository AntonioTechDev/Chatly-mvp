import React from 'react'
import { Card } from '../../ui/Card/Card'
import { Badge } from '../../ui/Badge/Badge'

import { FileIcon } from '../../ui/Icon/FileIcon'
import './DocumentCard.css'
import type { UserDocument } from '@/core/hooks/useDocuments'
import EyeIcon from '@/img/eye-icon.svg?react'
import DownloadIcon from '@/img/download-icon.svg?react'
import TrashIcon from '@/img/trash-icon.svg?react'

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

              className="checkbox"
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
                <EyeIcon />
              </button>
            )}
            {onDownload && (
              <button onClick={(e) => { e.stopPropagation(); onDownload(document); }} title="Scarica documento">
                <DownloadIcon />
              </button>
            )}
            {onDelete && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(document); }} title="Elimina documento">
                <TrashIcon />
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

export default React.memo(DocumentCard)
