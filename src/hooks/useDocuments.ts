/**
 * Custom Hook: useDocuments
 *
 * Optimized hook for managing user documents with:
 * - Automatic caching
 * - Real-time updates
 * - Optimistic updates
 * - Error handling
 * - Loading states
 *
 * Uses user_documents table (not the vector documents table)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

interface UserDocument {
  id: number
  platform_client_id: number
  user_id: string
  file_name: string
  file_size: number
  mime_type: string
  storage_path: string
  category: string
  description: string | null
  tags: string[] | null
  uploaded_at: string
  updated_at: string
}

interface UseDocumentsReturn {
  documents: UserDocument[]
  isLoading: boolean
  error: Error | null
  uploadDocument: (file: File, metadata?: any) => Promise<UserDocument | null>
  deleteDocument: (id: number, storagePath?: string) => Promise<boolean>
  refreshDocuments: () => Promise<void>
  searchDocuments: (query: string) => Promise<UserDocument[]>
}

export function useDocuments(): UseDocumentsReturn {
  const { clientData, user } = useAuth()
  const [documents, setDocuments] = useState<UserDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Use ref to track if component is mounted
  const isMountedRef = useRef(true)

  // Fetch documents with optimized query
  const fetchDocuments = useCallback(async () => {
    if (!clientData?.id || !user?.id) {
      setIsLoading(false)
      return
    }

    try {
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('user_documents')
        .select('*')
        .eq('platform_client_id', clientData.id)
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false })

      if (fetchError) throw fetchError

      if (isMountedRef.current) {
        setDocuments(data || [])
      }
    } catch (err) {
      console.error('Error fetching documents:', err)
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch documents'))
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [clientData?.id, user?.id])

  // Upload document with optimized flow
  const uploadDocument = useCallback(async (
    file: File,
    metadata: any = {}
  ): Promise<UserDocument | null> => {
    if (!clientData?.id || !user?.id) {
      toast.error('Errore: utente non autenticato. Ricarica la pagina.')
      console.error('Upload failed - clientData:', clientData, 'user:', user)
      return null
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Il file è troppo grande (max 50MB)')
      return null
    }

    const loadingToast = toast.loading('Caricamento documento...')

    try {
      // Generate storage path: {user_id}/{category}/{timestamp}_{filename}
      const timestamp = Date.now()
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const category = metadata.category || 'general'
      const storagePath = `${user.id}/${category}/${timestamp}_${sanitizedName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Create database record in user_documents
      const { data: doc, error: dbError } = await supabase
        .from('user_documents')
        .insert({
          platform_client_id: clientData.id,
          user_id: user.id,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          storage_path: storagePath,
          category: category,
          description: metadata.description || null,
          tags: metadata.tags || null
        })
        .select()
        .single()

      if (dbError) throw dbError

      // Optimistic update
      if (isMountedRef.current && doc) {
        setDocuments(prev => [doc, ...prev])
      }

      toast.success('Documento caricato', { id: loadingToast })
      return doc
    } catch (err) {
      console.error('Error uploading document:', err)
      toast.error('Errore durante il caricamento', { id: loadingToast })
      return null
    }
  }, [clientData?.id, user?.id])

  // Delete document with optimized flow
  const deleteDocument = useCallback(async (
    id: number,
    storagePath?: string
  ): Promise<boolean> => {
    const loadingToast = toast.loading('Eliminazione documento...')

    try {
      // Optimistic update
      if (isMountedRef.current) {
        setDocuments(prev => prev.filter(doc => doc.id !== id))
      }

      // Delete from storage if path exists
      if (storagePath) {
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([storagePath])

        if (storageError) {
          console.warn('Storage delete error:', storageError)
          // Don't fail the entire operation if storage delete fails
        }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('user_documents')
        .delete()
        .eq('id', id)

      if (dbError) throw dbError

      toast.success('Documento eliminato', { id: loadingToast })
      return true
    } catch (err) {
      console.error('Error deleting document:', err)
      toast.error('Errore durante l\'eliminazione', { id: loadingToast })

      // Revert optimistic update
      await fetchDocuments()
      return false
    }
  }, [fetchDocuments])

  // Refresh documents manually
  const refreshDocuments = useCallback(async () => {
    setIsLoading(true)
    await fetchDocuments()
  }, [fetchDocuments])

  // Search documents
  const searchDocuments = useCallback(async (query: string): Promise<UserDocument[]> => {
    if (!query.trim() || !clientData?.id || !user?.id) return documents

    try {
      // Use full-text search on search_vector
      const { data, error: searchError } = await supabase
        .from('user_documents')
        .select('*')
        .eq('platform_client_id', clientData.id)
        .eq('user_id', user.id)
        .textSearch('search_vector', query.trim().replace(/\s+/g, ' & '))
        .order('uploaded_at', { ascending: false })

      if (searchError) throw searchError

      return data || []
    } catch (err) {
      console.error('Error searching documents:', err)

      // Fallback to simple ilike search
      try {
        const { data, error: fallbackError } = await supabase
          .from('user_documents')
          .select('*')
          .eq('platform_client_id', clientData.id)
          .eq('user_id', user.id)
          .ilike('file_name', `%${query}%`)
          .order('uploaded_at', { ascending: false })

        if (fallbackError) throw fallbackError
        return data || []
      } catch (fallbackErr) {
        console.error('Fallback search error:', fallbackErr)
        return documents
      }
    }
  }, [clientData?.id, user?.id, documents])

  // Initial fetch
  useEffect(() => {
    isMountedRef.current = true
    fetchDocuments()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchDocuments])

  // Real-time subscription
  useEffect(() => {
    if (!clientData?.id || !user?.id) return

    const channel = supabase
      .channel('user-documents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_documents',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (!isMountedRef.current) return

          if (payload.eventType === 'INSERT') {
            setDocuments(prev => {
              // Avoid duplicates
              if (prev.some(doc => doc.id === (payload.new as UserDocument).id)) {
                return prev
              }
              return [payload.new as UserDocument, ...prev]
            })
          } else if (payload.eventType === 'DELETE') {
            setDocuments(prev => prev.filter(doc => doc.id !== (payload.old as any).id))
          } else if (payload.eventType === 'UPDATE') {
            setDocuments(prev =>
              prev.map(doc =>
                doc.id === (payload.new as UserDocument).id ? (payload.new as UserDocument) : doc
              )
            )
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [clientData?.id, user?.id])

  return {
    documents,
    isLoading,
    error,
    uploadDocument,
    deleteDocument,
    refreshDocuments,
    searchDocuments
  }
}
