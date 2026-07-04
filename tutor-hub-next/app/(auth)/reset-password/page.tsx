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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e2a3a, #0f1623)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: '40px',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
            fontSize: 24,
          }}>📚</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1e2a3a', margin: 0 }}>Tutor Hub</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Đặt lại mật khẩu mới</p>
        </div>

        {error && (
          <div style={{
            background: '#fee2e2', border: '1px solid #fca5a5',
            borderRadius: 8, padding: '10px 14px',
            color: '#dc2626', fontSize: 13, marginBottom: 16,
          }}>{error}</div>
        )}

        {success && (
          <div style={{
            background: '#ecfdf5', border: '1px solid #a7f3d0',
            borderRadius: 8, padding: '10px 14px',
            color: '#047857', fontSize: 13, marginBottom: 16,
          }}>{success}</div>
        )}

        <form onSubmit={handleReset}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Mật khẩu mới
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: '100%', padding: '10px 14px',
                border: '1.5px solid #e2e8f0', borderRadius: 10,
                fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 22 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: '100%', padding: '10px 14px',
                border: '1.5px solid #e2e8f0', borderRadius: 10,
                fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !ready}
            style={{
              width: '100%', padding: '12px 0',
              background: (loading || !ready) ? '#93c5fd' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: '#fff', border: 'none', borderRadius: 10,
              fontSize: 15, fontWeight: 700, cursor: (loading || !ready) ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Đang lưu…' : !ready ? 'Đang xác thực liên kết…' : 'Cập nhật mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  )
}
