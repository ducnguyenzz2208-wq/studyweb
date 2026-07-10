import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getValidAccessToken, makeFilePublic } from '@/lib/google-drive'

// Sau khi client PUT xong file thẳng lên Google, gọi route này để cấp quyền
// "ai có link đều xem được" — để học sinh bấm vào tài liệu là mở được ngay
// (giống bucket Supabase 'materials' đang công khai sẵn).
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'not authenticated' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const fileId = body?.fileId
  if (!fileId) return NextResponse.json({ error: 'fileId required' }, { status: 400 })

  try {
    const tok = await getValidAccessToken(user.id)
    if (!tok) return NextResponse.json({ error: 'not_connected' }, { status: 409 })
    await makeFilePublic(tok.accessToken, fileId)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('publish-file error:', e)
    return NextResponse.json({ error: e?.message || 'publish-file failed' }, { status: 500 })
  }
}
