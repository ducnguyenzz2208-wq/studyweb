'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const BUCKET = 'materials'

export async function uploadMaterial(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const file = formData.get('file') as File
  const title = (formData.get('title') as string).trim()
  const description = (formData.get('description') as string | null)?.trim() || null
  const category = formData.get('category') as string
  const fileType = formData.get('file_type') as string

  if (!file?.size) return { error: 'No file selected' }
  if (!title) return { error: 'Title is required' }

  // Sanitise filename and build storage path under the owner's folder
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filePath = `${user.id}/${Date.now()}_${safeName}`

  // 1 — Upload to Storage
  const { error: storageErr } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { upsert: false })

  if (storageErr) return { error: storageErr.message }

  // 2 — Get permanent public URL
  const { data: { publicUrl: fileUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath)

  // 3 — Persist metadata to DB
  const { error: dbErr } = await supabase.from('materials').insert({
    owner_id: user.id,
    title,
    description,
    file_path: filePath,
    file_url: fileUrl,
    category,
    file_type: fileType,
  })

  if (dbErr) {
    // Roll back the storage upload so we don't leave orphaned files
    await supabase.storage.from(BUCKET).remove([filePath])
    return { error: dbErr.message }
  }

  revalidatePath('/dashboard/materials')
  return { success: true }
}

export async function deleteMaterial(id: string, filePath: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Remove from DB first (RLS will reject if not owner / admin)
  const { error: dbErr } = await supabase
    .from('materials')
    .delete()
    .eq('id', id)

  if (dbErr) return { error: dbErr.message }

  // Remove file from Storage (best-effort; DB row is already gone)
  if (filePath) {
    await supabase.storage.from(BUCKET).remove([filePath])
  }

  revalidatePath('/dashboard/materials')
  return { success: true }
}
