import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getValidAccessToken, deleteDriveFile } from '@/lib/google-drive'

// Dùng khi GV xoá 1 tài liệu (Materials) mà file gốc đang nằm trên Drive của họ.
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'not authenticated' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const fileId = body?.fileId
  if (!fileId) return NextResponse.json({ error: 'fileId required' }, { status: 400 })

  try {
    const tok = await getValidAccessToken(user.id)
    if (!tok) return NextResponse.json({ ok: true })   // đã ngắt kết nối Drive -> không còn gì để xoá
    await deleteDriveFile(tok.accessToken, fileId)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('delete-file error:', e)
    return NextResponse.json({ error: e?.message || 'delete-file failed' }, { status: 500 })
  }
}
