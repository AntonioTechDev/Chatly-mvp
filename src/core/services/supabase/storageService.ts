/**
 * Storage Service
 *
 * Handles Supabase storage operations (upload/download files)
 */

import { supabase } from '../../lib/supabase'

/**
 * Download file from Supabase storage
 */
export async function downloadFile(storagePath: string): Promise<Blob> {
  const { data, error } = await supabase.storage
    .from('documents')
    .download(storagePath)

  if (error) throw error
  return data
}

/**
 * Delete file from Supabase storage
 */
export async function deleteStorageFile(storagePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('documents')
    .remove([storagePath])

  if (error) throw error
}

/**
 * Upload file to Supabase storage
 */
export async function uploadFile(
  file: File,
  path: string
): Promise<{ path: string }> {
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(path, file)

  if (error) throw error
  return data
}
