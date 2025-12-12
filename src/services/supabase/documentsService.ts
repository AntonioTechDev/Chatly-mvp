/**
 * Documents Service
 *
 * Handles all document-related database operations
 */

import { supabase } from '../../lib/supabase'

export interface Document {
  id: number
  file_name: string
  file_size: number
  mime_type: string
  storage_path: string
  uploaded_at: string
  drive_file_id?: string | null
  drive_web_view_link?: string | null
  platform_client_id?: number
}

/**
 * Fetch all documents for a client
 */
export async function fetchDocuments(platformClientId: number): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('platform_client_id', platformClientId)
    .order('uploaded_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Delete a document by ID
 */
export async function deleteDocument(documentId: number): Promise<void> {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId)

  if (error) throw error
}

/**
 * Upload document metadata to database
 */
export async function createDocument(document: Omit<Document, 'id' | 'uploaded_at'>): Promise<Document> {
  const { data, error } = await supabase
    .from('documents')
    .insert(document)
    .select()
    .single()

  if (error) throw error
  return data
}
