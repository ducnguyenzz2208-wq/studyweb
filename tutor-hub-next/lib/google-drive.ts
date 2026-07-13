// Google Drive OAuth helper — dùng quota Drive CỦA TỪNG NGƯỜI DÙNG (GV), không
// phải service account (Gmail cá nhân không có storage quota cho service
// account — đã kiểm chứng: lỗi "Service Accounts do not have storage quota").
import { createClient } from '@/lib/supabase/server'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files'

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'

export function driveOAuthClientId() {
  return process.env.GOOGLE_CLIENT_ID
}
export function driveOAuthClientSecret() {
  return process.env.GOOGLE_CLIENT_SECRET
}

export function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}

export function driveRedirectUri() {
  return `${siteUrl()}/api/google-drive/callback`
}

export async function exchangeCodeForTokens(code: string) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: driveOAuthClientId()!,
      client_secret: driveOAuthClientSecret()!,
      redirect_uri: driveRedirectUri(),
      grant_type: 'authorization_code',
    }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error('token exchange failed: ' + JSON.stringify(json))
  return json as { access_token: string; refresh_token?: string; expires_in: number }
}

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: driveOAuthClientId()!,
      client_secret: driveOAuthClientSecret()!,
      grant_type: 'refresh_token',
    }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error('refresh failed: ' + JSON.stringify(json))
  return json as { access_token: string; expires_in: number }
}

// Đọc token đã lưu của user hiện tại (theo session cookie — RLS tự giới hạn
// đúng dòng của họ); làm mới access_token nếu sắp hết hạn (<2 phút).
export async function getValidAccessToken(userId: string) {
  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from('google_drive_tokens')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (!row) return null

  const expiresAt = row.access_token_expires_at ? new Date(row.access_token_expires_at).getTime() : 0
  const soon = Date.now() + 2 * 60 * 1000
  if (row.access_token && expiresAt > soon) {
    return { accessToken: row.access_token as string, folderId: row.drive_folder_id as string | null }
  }

  const refreshed = await refreshAccessToken(row.refresh_token)
  const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
  await supabase.from('google_drive_tokens').update({
    access_token: refreshed.access_token,
    access_token_expires_at: newExpiry,
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId)

  return { accessToken: refreshed.access_token, folderId: row.drive_folder_id as string | null }
}

// Tìm (hoặc tạo mới) thư mục "TutorHub Uploads" trong Drive của user — chỗ
// chứa mọi tài liệu tải lên, tránh rải file lung tung ở thư mục gốc của họ.
export async function ensureUploadsFolder(accessToken: string, userId: string, existingFolderId: string | null) {
  if (existingFolderId) return existingFolderId

  const q = encodeURIComponent("name='TutorHub Uploads' and mimeType='application/vnd.google-apps.folder' and trashed=false")
  const searchRes = await fetch(`${DRIVE_API}/files?q=${q}&fields=files(id)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const searchJson = await searchRes.json()
  let folderId: string | undefined = searchJson?.files?.[0]?.id

  if (!folderId) {
    const createRes = await fetch(`${DRIVE_API}/files?fields=id`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'TutorHub Uploads', mimeType: 'application/vnd.google-apps.folder' }),
    })
    const createJson = await createRes.json()
    if (!createRes.ok) throw new Error('create folder failed: ' + JSON.stringify(createJson))
    folderId = createJson.id
  }

  const supabase = await createClient()
  await supabase.from('google_drive_tokens').update({ drive_folder_id: folderId }).eq('user_id', userId)
  return folderId!
}

// Mở 1 phiên "resumable upload" trên Drive — trả về URL Google để CLIENT tự
// PUT file thẳng lên (không đi qua server của mình), tránh giới hạn kích
// thước request-body của serverless function (quan trọng với file "nặng").
export async function createResumableSession(accessToken: string, folderId: string, fileName: string, mimeType: string, fileSize: number, origin?: string) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json; charset=UTF-8',
    'X-Upload-Content-Type': mimeType || 'application/octet-stream',
    'X-Upload-Content-Length': String(fileSize),
  }
  // BẮT BUỘC cho upload TỪ TRÌNH DUYỆT: gửi Origin của client khi MỞ phiên để
  // Google trả về session URI có CORS cho đúng domain này. Thiếu header này thì
  // lệnh PUT file thẳng lên Google (cross-origin) bị CORS chặn -> "Lỗi mạng".
  if (origin) headers['Origin'] = origin
  const res = await fetch(`${DRIVE_UPLOAD_API}?uploadType=resumable&fields=id,name,webViewLink,mimeType,size`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: fileName, parents: [folderId] }),
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error('resumable session failed: ' + JSON.stringify(json))
  }
  const uploadUrl = res.headers.get('Location')
  if (!uploadUrl) throw new Error('no resumable session URL returned')
  return uploadUrl
}

// Cho phép "ai có link đều xem được" — để học sinh bấm vào tài liệu là mở
// được ngay, giống cách bucket Supabase 'materials' đang công khai sẵn.
export async function makeFilePublic(accessToken: string, fileId: string) {
  const res = await fetch(`${DRIVE_API}/files/${fileId}/permissions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error('set permission failed: ' + JSON.stringify(json))
  }
}

export async function deleteDriveFile(accessToken: string, fileId: string) {
  const res = await fetch(`${DRIVE_API}/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  // 404 = đã bị xoá từ trước (không phải lỗi thật) → coi như thành công.
  if (!res.ok && res.status !== 404) {
    const json = await res.json().catch(() => ({}))
    throw new Error('delete file failed: ' + JSON.stringify(json))
  }
}
