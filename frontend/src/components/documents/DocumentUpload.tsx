/**
 * DocumentUpload Component
 *
 * Optimized file upload with:
 * - Drag and drop
 * - File validation
 * - Progress indication
 * - Multiple file types support
 */

import React, { useCallback, useState, useRef } from 'react'
import toast from 'react-hot-toast'
import CloudUploadIcon from '@/img/cloud-upload-icon.svg?react'
import './DocumentUpload.css'

interface DocumentUploadProps {
  onUpload: (file: File, metadata?: any) => Promise<any>
  disabled?: boolean
  acceptedTypes?: string[]
  maxSizeMB?: number
}

const DEFAULT_ACCEPTED_TYPES = [
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
]

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUpload,
  disabled = false,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxSizeMB = 50
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)

  // Validate file
  const validateFile = useCallback((file: File): boolean => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      toast.error(`Tipo di file non supportato: ${file.type}`)
      return false
    }

    // Check file size
    const maxSize = maxSizeMB * 1024 * 1024
    if (file.size > maxSize) {
      toast.error(`File troppo grande (max ${maxSizeMB}MB)`)
      return false
    }

    return true
  }, [acceptedTypes, maxSizeMB])

  // Handle multiple files upload
  const handleFilesUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)

    // Validate all files first
    const validFiles = fileArray.filter(file => validateFile(file))

    if (validFiles.length === 0) {
      return
    }

    if (validFiles.length < fileArray.length) {
      toast.error(`${fileArray.length - validFiles.length} file non validi sono stati ignorati`)
    }

    setIsUploading(true)
    setUploadProgress({ current: 0, total: validFiles.length })

    let successCount = 0
    let failCount = 0

    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i]
        setUploadProgress({ current: i + 1, total: validFiles.length })

        try {
          const result = await onUpload(file, {
            category: 'general',
            uploaded_by: 'user'
          })

          if (result) {
            successCount++
          } else {
            failCount++
          }
        } catch (error) {
          console.error('Upload error:', error)
          failCount++
        }
      }
    } finally {
      // Always reset state even if there's an error
      setIsUploading(false)
      setUploadProgress(null)
    }

    // Show summary toast only if multiple files
    if (validFiles.length > 1) {
      if (successCount > 0 && failCount === 0) {
        toast.success(`${successCount} documenti caricati con successo`)
      } else if (successCount > 0 && failCount > 0) {
        toast.error(`${successCount} caricati, ${failCount} falliti`)
      } else if (failCount > 0) {
        toast.error(`Errore: ${failCount} documenti non caricati`)
      }
    }
  }, [onUpload, validateFile])

  // Handle file input change
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFilesUpload(files)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFilesUpload])

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounterRef.current = 0

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFilesUpload(files)
    }
  }, [handleFilesUpload])

  // Handle click to browse
  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click()
    }
  }, [disabled, isUploading])

  return (
    <div
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`document-upload ${isDragging ? 'document-upload--dragging' : ''} ${disabled || isUploading ? 'document-upload--disabled' : ''
        }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        accept={acceptedTypes.join(',')}
        disabled={disabled || isUploading}
        className="hidden"
      />



      {isUploading ? (
        <div className="document-upload__content">
          <div className="document-upload__spinner"></div>
          <p className="document-upload__status-text">
            {uploadProgress
              ? `Caricamento ${uploadProgress.current} di ${uploadProgress.total}...`
              : 'Caricamento in corso...'}
          </p>
          {uploadProgress && uploadProgress.total > 1 && (
            <div className="document-upload__progress-track">
              <div
                className="document-upload__progress-fill"
                style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
              ></div>
            </div>
          )}
        </div>
      ) : (
        <>
          <CloudUploadIcon className="document-upload__icon" />
          <div className="document-upload__info">
            <p className="document-upload__title">
              {isDragging ? 'Rilascia i file qui' : 'Clicca o trascina i file'}
            </p>
            <p className="document-upload__subtitle">
              Caricamento multiplo supportato • PDF, Word, Excel, PowerPoint, Testo (max {maxSizeMB}MB per file)
            </p>
          </div>
        </>
      )}
    </div>
  )
}

export default React.memo(DocumentUpload)
