'use client'

// Error boundary cấp gốc — bắt lỗi render/tải dữ liệu phía server (RLS/500/fetch)
// thay vì để người dùng thấy màn hình trắng hoặc stack trace thô.
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Ghi log để tiện gỡ lỗi; không lộ chi tiết nhạy cảm cho người dùng.
    console.error('App error boundary:', error)
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
          Đã xảy ra lỗi
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>
          Không tải được trang. Có thể do kết nối mạng, phiên đăng nhập hết hạn,
          hoặc bạn không có quyền truy cập. Hãy thử lại.
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
        >Về trang đăng nhập</a>
      </div>
    </div>
  )
}
