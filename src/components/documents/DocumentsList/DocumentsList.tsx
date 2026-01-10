import React from 'react'
import { DocumentCard } from '../DocumentCard/DocumentCard'
import './DocumentsList.css'
import type { UserDocument } from '@/core/hooks/useDocuments'

interface DocumentsListProps {
  documents: UserDocument[]
  onViewDocument?: (document: UserDocument) => void
  onDownloadDocument?: (document: UserDocument) => void
  onDeleteDocument?: (document: UserDocument) => void
  selectedIds?: number[]
  onSelectionChange?: (document: UserDocument) => void
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
