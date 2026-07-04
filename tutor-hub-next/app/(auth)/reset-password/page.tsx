'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [ready, setReady] = useState(false)

  useEffect(() => {
    let resolved = false

    // Recovery session có thể tới theo 2 cách:
    //  1. Qua /auth/callback (server đã đổi code → set cookie) → getSession() có ngay.
    //  2. Client tự exchange ?code= / hash → phát sự kiện PASSWORD_RECOVERY (bất đồng bộ).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session || event === 'PASSWORD_RECOVERY') {
        resolved = true
        setReady(true)
        setError('')
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        resolved = true
        setReady(true)
      }
    })

    // Chỉ báo lỗi nếu sau một nhịp vẫn chưa có session nào — tránh false "link hết hạn"
    // do race với việc exchange code.
    const timer = setTimeout(() => {
      if (!resolved) {
        setError('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng gửi lại yêu cầu.')
      }
    }, 2500)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, [supabase])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password.length < 6) {
      setError('Mật khẩu phải chứa ít nhất 6 ký tự.')
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return;
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess('Đặt lại mật khẩu thành công! Đang chuyển hướng về trang đăng nhập...')
      setLoading(false)
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }
  }

  return (
    <div className="bright-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-sans)' }}>
      <div className="glass" style={{ borderRadius: 24, padding: 40, width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{
            width: 56, height: 56, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            borderRadius: 16, display: 'grid', placeItems: 'center', margin: '0 auto 14px',
            color: '#fff', boxShadow: '0 8px 20px rgba(79,70,229,0.32)',
          }} aria-hidden>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h1 style={{ fontSize: 25, fontWeight: 700, color: '#1e2437', margin: 0, letterSpacing: '-0.02em' }}>Đặt lại mật khẩu</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 6 }}>Tạo mật khẩu mới cho tài khoản của bạn.</p>
        </div>

        {error && (
          <div role="alert" style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', color: '#b91c1c', fontSize: 13, marginBottom: 14 }}>{error}</div>
        )}
        {success && (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 10, padding: '10px 14px', color: '#047857', fontSize: 13, marginBottom: 14 }}>{success}</div>
        )}

        <form onSubmit={handleReset}>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="np" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Mật khẩu mới</label>
            <input id="np" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="field" />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label htmlFor="cp" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Xác nhận mật khẩu mới</label>
            <input id="cp" type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="••••••••" className="field" />
          </div>
          <button type="submit" disabled={loading || !ready} style={{
            width: '100%', padding: '13px 0',
            background: (loading || !ready) ? '#a5b4fc' : 'linear-gradient(135deg, #4f46e5, #6d28d9)',
            color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600,
            cursor: (loading || !ready) ? 'not-allowed' : 'pointer', boxShadow: '0 8px 20px rgba(79,70,229,0.28)',
          }}>
            {loading ? 'Đang lưu…' : !ready ? 'Đang xác thực liên kết…' : 'Cập nhật mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  )
}
