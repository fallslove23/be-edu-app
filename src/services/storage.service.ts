import { supabase } from './supabase'

export class StorageService {
  static async uploadFile(
    bucket: string,
    path: string,
    file: File,
    options?: { cacheControl?: string; upsert?: boolean }
  ) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: options?.cacheControl || '3600',
        upsert: options?.upsert || false
      })

    if (error) throw error
    return data
  }

  static async deleteFile(bucket: string, paths: string[]) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove(paths)

    if (error) throw error
  }

  static getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return data.publicUrl
  }

  static async downloadFile(bucket: string, path: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path)

    if (error) throw error
    return data
  }
}