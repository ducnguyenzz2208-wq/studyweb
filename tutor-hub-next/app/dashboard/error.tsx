'use client'

// Error boundary riêng cho /dashboard — bắt lỗi khi tải hồ sơ/role hoặc render
// khung dashboard (thường là RLS/500 từ Supabase), cho người dùng nút thử lại.
import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error boundary:', error)
  }, [error])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e2a3a, #0f1623)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-sans)', padding: 24,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '40px 36px',
        width: '100%', maxWidth: 460, textAlign: 'center',
        boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e2a3a', margin: '0 0 8px' }}>
          Không tải được bảng điều khiển
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>
          Có thể phiên đăng nhập đã hết hạn hoặc máy chủ tạm thời không phản hồi.
          Bấm “Thử lại”, hoặc đăng nhập lại nếu vẫn lỗi.
        </p>

        <button
          onClick={() => reset()}
          style={{
            width: '100%', padding: '12px 0', marginBottom: 12,
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: '#fff', border: 'none', borderRadius: 10,
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}
        >Thử lại</button>

        <a
          href="/login"
          style={{
            display: 'block', width: '100%', padding: '11px 0',
            background: '#fff', color: '#64748b', border: '1.5px solid #e2e8f0',
            borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            textDecoration: 'none',
          }}
        >Đăng nhập lại</a>
      </div>
    </div>
  )
}
