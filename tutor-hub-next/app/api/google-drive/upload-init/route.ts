import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getValidAccessToken, ensureUploadsFolder, createResumableSession, siteUrl } from '@/lib/google-drive'

// Mở phiên upload trên Drive rồi trả cho CLIENT một URL để tự PUT file trực
// tiếp lên Google — file KHÔNG đi qua serverless function của mình, nên
// không bị giới hạn kích thước request-body (quan trọng cho PDF/Word nặng).
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'not authenticated' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const fileName = body?.fileName
  const mimeType = body?.mimeType || 'application/octet-stream'
  const fileSize = Number(body?.fileSize)
  if (!fileName || !fileSize) return NextResponse.json({ error: 'fileName/fileSize required' }, { status: 400 })

  try {
    const tok = await getValidAccessToken(user.id)
    if (!tok) return NextResponse.json({ error: 'not_connected' }, { status: 409 })

    const folderId = await ensureUploadsFolder(tok.accessToken, user.id, tok.folderId)
    // Origin của client (browser) — cần để phiên resumable có CORS cho domain này.
    const origin = request.headers.get('origin') || siteUrl()
    const uploadUrl = await createResumableSession(tok.accessToken, folderId, fileName, mimeType, fileSize, origin)

    // Access token đi kèm để client PUT thẳng lên Google — token này chỉ có
    // scope drive.file (không đọc được Drive nói chung) và hết hạn trong ~1h.
    return NextResponse.json({ uploadUrl, accessToken: tok.accessToken })
  } catch (e: any) {
    console.error('upload-init error:', e);
    return NextResponse.json({ error: e?.message || 'upload-init failed' }, { status: 500 })
  }
}
