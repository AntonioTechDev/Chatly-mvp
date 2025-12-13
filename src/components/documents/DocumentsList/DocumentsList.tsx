import React from 'react'
import { DocumentCard } from '../DocumentCard/DocumentCard'
import './DocumentsList.css'
import type { Document } from '../../types/database.types'

interface DocumentsListProps {
  documents: Document[]
  onViewDocument?: (document: Document) => void
  onDownloadDocument?: (document: Document) => void
  onDeleteDocument?: (document: Document) => void
  selectedIds?: number[]
  onSelectionChange?: (document: Document) => void
  emptyMessage?: string
  enableSelection?: boolean
  viewMode?: 'grid' | 'list'
}

export const DocumentsList: React.FC<DocumentsListProps> = ({
  documents,
  onViewDocument,
  onDownloadDocument,
  onDeleteDocument,
  selectedIds = [],
  onSelectionChange,
  emptyMessage = 'Nessun documento trovato',
  enableSelection = false,
  viewMode = 'grid',
}) => {
  if (documents.length === 0) {
    return (
      <div className="documents-list empty">
        <p className="message">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={`documents-list ${viewMode}`}>
      <div className={viewMode === 'grid' ? 'grid' : 'list'}>
        {documents.map((document) => (
          <DocumentCard
            key={document.id}
            document={document}
            onView={onViewDocument}
            onDownload={onDownloadDocument}
            onDelete={onDeleteDocument}
            isSelected={enableSelection && selectedIds.includes(document.id)}
            onSelect={enableSelection ? onSelectionChange : undefined}
          />
        ))}
      </div>
    </div>
  )
}

export default DocumentsList
