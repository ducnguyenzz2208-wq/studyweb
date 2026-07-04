'use client'

// Màn hình cho tài khoản mới đã đăng nhập nhưng chưa được admin cấp quyền (role = Pending).
// Trước đây các tài khoản này chỉ thấy mỗi mục Settings mà không có lời giải thích → tưởng app hỏng.
export default function PendingApproval({
  email,
  onRefresh,
  onSignOut,
}: {
  email: string
  onRefresh: () => void
  onSignOut: () => void
}) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e2a3a, #0f1623)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Segoe UI', system-ui, sans-serif", padding: 24,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '40px 36px',
        width: '100%', maxWidth: 460, textAlign: 'center',
        boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e2a3a', margin: '0 0 8px' }}>
          Tài khoản đang chờ duyệt
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: '0 0 4px' }}>
          Bạn đã đăng nhập thành công{email ? ' với ' : ''}
          {email && <strong style={{ color: '#334155' }}>{email}</strong>}.
        </p>
        <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>
          Quản trị viên cần cấp quyền (Học sinh / Giáo viên / Phụ huynh) trước khi bạn sử dụng được ứng dụng.
        </p>

        <div style={{
          textAlign: 'left', background: '#f8fafc', border: '1px solid #e2e8f0',
          borderRadius: 12, padding: '16px 18px', fontSize: 13, color: '#475569', marginBottom: 24,
        }}>
          <div style={{ fontWeight: 700, color: '#1e2a3a', marginBottom: 10 }}>Trong lúc chờ</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            <span>📧</span><span>Liên hệ quản trị viên trung tâm để được duyệt nhanh hơn.</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <span>🔄</span><span>Sau khi được duyệt, bấm <strong>“Kiểm tra lại”</strong> hoặc tải lại trang.</span>
          </div>
        </div>

        <button
          onClick={onRefresh}
          style={{
            width: '100%', padding: '12px 0', marginBottom: 12,
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: '#fff', border: 'none', borderRadius: 10,
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}
        >Kiểm tra lại</button>

        <button
          onClick={onSignOut}
          style={{
            width: '100%', padding: '11px 0',
            background: '#fff', color: '#64748b', border: '1.5px solid #e2e8f0',
            borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >Đăng xuất</button>
      </div>
    </div>
  )
}
