import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Nhận diện công thức toán trong ẢNH → LaTeX cho tính năng Flashcard.
// Dùng Mathpix (server-side): key nằm ở ENV, KHÔNG lộ ra client (giống pattern
// Google Drive). Client gửi ảnh dạng data URL (đã nén), nhận lại { latex, text }.
//
// ⚠️ CẦN SETUP (tuỳ chọn): thêm biến môi trường trên Vercel rồi redeploy:
//   MATHPIX_APP_ID, MATHPIX_APP_KEY  (lấy ở https://mathpix.com/ocr-api).
// Chưa cấu hình → trả 501 { error: 'not_configured' }; client sẽ báo rõ và
// tạm chèn ảnh thay vì LaTeX (tính năng chèn ảnh/gõ LaTeX vẫn chạy bình thường).

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const appId = process.env.MATHPIX_APP_ID
  const appKey = process.env.MATHPIX_APP_KEY
  if (!appId || !appKey) {
    return NextResponse.json({ error: 'not_configured' }, { status: 501 })
  }

  // Chỉ cho người đã đăng nhập gọi (tránh lạm dụng endpoint tính phí).
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'not authenticated' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const image = body?.image
  if (!image || typeof image !== 'string' || !image.startsWith('data:image/')) {
    return NextResponse.json({ error: 'image (data URL) required' }, { status: 400 })
  }

  try {
    const r = await fetch('https://api.mathpix.com/v3/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', app_id: appId, app_key: appKey },
      body: JSON.stringify({
        src: image,
        formats: ['text', 'latex_styled'],
        data_options: { include_latex: true },
      }),
    })
    const data: any = await r.json().catch(() => ({}))
    if (!r.ok) {
      return NextResponse.json({ error: data?.error || `mathpix ${r.status}` }, { status: 502 })
    }
    const latex = data?.latex_styled || data?.text || ''
    return NextResponse.json({ latex, text: data?.text || '' })
  } catch (e: any) {
    console.error('math-ocr error:', e)
    return NextResponse.json({ error: e?.message || 'ocr failed' }, { status: 500 })
  }
}
