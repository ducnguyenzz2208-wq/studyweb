import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForTokens, siteUrl } from '@/lib/google-drive'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const oauthError = searchParams.get('error')   // vd 'access_denied' nếu người dùng bấm Huỷ

  const base = siteUrl()
  if (oauthError) return NextResponse.redirect(`${base}/dashboard?driveError=${encodeURIComponent(oauthError)}`)
  if (!code) return NextResponse.redirect(`${base}/dashboard?driveError=no_code`)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${base}/login?error=Cần đăng nhập trước`)

  try {
    const tokens = await exchangeCodeForTokens(code)
    if (!tokens.refresh_token) {
      // Không có refresh_token (hiếm khi prompt=consent) -> báo lỗi rõ ràng thay vì lưu nửa vời.
      return NextResponse.redirect(`${base}/dashboard?driveError=no_refresh_token`)
    }
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    await supabase.from('google_drive_tokens').upsert({
      user_id: user.id,
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token,
      access_token_expires_at: expiresAt,
      drive_email: user.email,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
  } catch (e) {
    console.error('drive callback error:', e)
    return NextResponse.redirect(`${base}/dashboard?driveError=exchange_failed`)
  }

  return NextResponse.redirect(`${base}/dashboard?driveConnected=1`)
}
