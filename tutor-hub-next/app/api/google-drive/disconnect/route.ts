import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'not authenticated' }, { status: 401 })

  const { data: row } = await supabase
    .from('google_drive_tokens').select('refresh_token').eq('user_id', user.id).maybeSingle()

  if (row?.refresh_token) {
    try {
      await fetch('https://oauth2.googleapis.com/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token: row.refresh_token }),
      })
    } catch {
      // Revoke thất bại (token đã hết hạn/đã bị thu hồi sẵn) không sao — vẫn xoá dòng DB bên dưới.
    }
  }

  await supabase.from('google_drive_tokens').delete().eq('user_id', user.id)
  return NextResponse.json({ ok: true })
}
