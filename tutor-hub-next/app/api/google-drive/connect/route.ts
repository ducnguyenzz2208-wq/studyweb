import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DRIVE_SCOPE, driveOAuthClientId, driveRedirectUri, siteUrl } from '@/lib/google-drive'

// Bắt đầu luồng "Kết nối Google Drive": phải là điều hướng CẢ TRANG (không phải
// trong iframe) vì accounts.google.com chặn hiển thị trong iframe. Client-side
// gọi window.top.location = '/api/google-drive/connect' để thoát khỏi iframe.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${siteUrl()}/login?error=Cần đăng nhập trước`)

  const clientId = driveOAuthClientId()
  if (!clientId) {
    return NextResponse.redirect(`${siteUrl()}/dashboard?driveError=missing_config`)
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: driveRedirectUri(),
    response_type: 'code',
    scope: DRIVE_SCOPE,
    access_type: 'offline',   // bắt buộc để nhận refresh_token
    prompt: 'consent',        // luôn hỏi lại quyền -> luôn có refresh_token mới (kể cả kết nối lại)
    include_granted_scopes: 'true',
  })
  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
}
