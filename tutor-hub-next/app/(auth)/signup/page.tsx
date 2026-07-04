'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { viError } from '@/lib/auth-messages'

const ROLES = [
  { value: 'Student', label: 'Học sinh' },
  { value: 'Teacher', label: 'Giáo viên' },
  { value: 'Parent', label: 'Phụ huynh' },
] as const

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<typeof ROLES[number]['value']>('Student')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          // role is intentionally NOT passed — the DB trigger assigns Pending for all
          // new users; admins promote roles via the User Management panel.
          requested_role: role,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(viError(error.message))
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  async function handleGoogleSignup() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e2a3a, #0f1623)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-sans)',
      }}>
        <div style={{
          background: '#fff', borderRadius: 20, padding: '40px',
          width: '100%', maxWidth: 420, textAlign: 'center',
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
          <h2 style={{ color: '#1e2a3a', marginBottom: 8 }}>Kiểm tra email của bạn</h2>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>
            Chúng tôi đã gửi liên kết xác nhận tới <strong>{email}</strong> (xem cả mục Spam).
          </p>

          <div style={{
            textAlign: 'left', background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: 12, padding: '16px 18px', fontSize: 13, color: '#475569',
          }}>
            <div style={{ fontWeight: 700, color: '#1e2a3a', marginBottom: 10 }}>Các bước tiếp theo</div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <span>1️⃣</span><span>Bấm liên kết trong email để <strong>xác nhận tài khoản</strong>.</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <span>2️⃣</span><span><strong>Chờ quản trị viên cấp quyền</strong> (Học sinh / Giáo viên / Phụ huynh). Trước khi được duyệt, bạn đăng nhập được nhưng chỉ thấy trang chờ.</span>
            </div>
          </div>

          <Link href="/login" style={{
            display: 'inline-block', marginTop: 24,
            color: '#3b82f6', fontWeight: 600, textDecoration: 'none',
          }}>← Quay lại đăng nhập</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e2a3a, #0f1623)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '40px',
        width: '100%', maxWidth: 420,
        boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', fontSize: 24,
          }}>📚</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1e2a3a', margin: 0 }}>Tạo tài khoản</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Tham gia Tutor Hub ngay hôm nay</p>
        </div>

        <button onClick={handleGoogleSignup} style={{
          width: '100%', padding: '11px 0',
          border: '1.5px solid #e2e8f0', borderRadius: 10,
          background: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          fontSize: 14, fontWeight: 600, color: '#374151',
          marginBottom: 20,
        }}
          onMouseOver={e => (e.currentTarget.style.borderColor = '#3b82f6')}
          onMouseOut={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Đăng ký với Google
        </button>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
          color: '#94a3b8', fontSize: 13,
        }}>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          hoặc bằng email
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
        </div>

        <form onSubmit={handleSignup}>
          {error && (
            <div style={{
              background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8,
              padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16,
            }}>{error}</div>
          )}

          {[
            { label: 'Họ và tên', value: name, setter: setName, type: 'text', placeholder: 'Nguyễn Văn A' },
            { label: 'Địa chỉ email', value: email, setter: setEmail, type: 'email', placeholder: 'ban@example.com' },
            { label: 'Mật khẩu', value: password, setter: setPassword, type: 'password', placeholder: '••••••••' },
          ].map(({ label, value, setter, type, placeholder }) => (
            <div key={label} style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                {label}
              </label>
              <input
                type={type}
                value={value}
                onChange={e => setter(e.target.value)}
                required
                placeholder={placeholder}
                style={{
                  width: '100%', padding: '10px 14px',
                  border: '1.5px solid #e2e8f0', borderRadius: 10,
                  fontSize: 14, outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#3b82f6')}
                onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
              />
            </div>
          ))}

          <div style={{ marginBottom: 22 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Tôi muốn tham gia với vai trò… <span style={{ fontWeight: 400, color: '#94a3b8' }}>(quản trị viên sẽ duyệt)</span>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {ROLES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  style={{
                    flex: 1, padding: '9px 4px',
                    border: `1.5px solid ${role === r.value ? '#3b82f6' : '#e2e8f0'}`,
                    borderRadius: 8, background: role === r.value ? '#eff6ff' : '#fff',
                    color: role === r.value ? '#1d4ed8' : '#374151',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >{r.label}</button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px 0',
              background: loading ? '#93c5fd' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: '#fff', border: 'none', borderRadius: 10,
              fontSize: 15, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >{loading ? 'Đang tạo tài khoản…' : 'Tạo tài khoản'}</button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' }}>
          Đã có tài khoản?{' '}
          <Link href="/login" style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  )
}
