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
      className={`
        relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        transition-all duration-200
        ${isDragging
          ? 'border-primary-500 bg-primary-50'
          : 'border-gray-300 hover:border-primary-400 bg-gray-50 hover:bg-gray-100'
        }
        ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
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
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-sm text-gray-600">
            {uploadProgress
              ? `Caricamento ${uploadProgress.current} di ${uploadProgress.total}...`
              : 'Caricamento in corso...'}
          </p>
          {uploadProgress && uploadProgress.total > 1 && (
            <div className="w-full max-w-xs bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
              ></div>
            </div>
          )}
        </div>
      ) : (
        <>
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700">
              {isDragging ? 'Rilascia i file qui' : 'Clicca o trascina i file'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Caricamento multiplo supportato • PDF, Word, Excel, PowerPoint, Testo (max {maxSizeMB}MB per file)
            </p>
          </div>
        </>
      )}
    </div>
  )
}

export default React.memo(DocumentUpload)
