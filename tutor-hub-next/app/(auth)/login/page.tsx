'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { viError } from '@/lib/auth-messages'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [isForgot, setIsForgot] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(viError(error.message))
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setLoading(true)
    // Đi qua /auth/callback để đổi ?code= lấy session (PKCE) trước.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })
    if (error) {
      setError(viError(error.message))
      setLoading(false)
    } else {
      setSuccessMsg('Đã gửi liên kết đặt lại mật khẩu tới email của bạn. Vui lòng kiểm tra hộp thư (cả mục Spam).')
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const primaryBtn: React.CSSProperties = {
    width: '100%', padding: '13px 0',
    background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #4f46e5, #6d28d9)',
    color: '#fff', border: 'none', borderRadius: 12,
    fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
    boxShadow: '0 8px 20px rgba(79,70,229,0.28)',
    transition: 'transform .12s, box-shadow .12s',
  }

  return (
    <div className="bright-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-sans)' }}>
      {/* Thẻ nổi trang trí — chỉ hiện desktop, nền đặc nên rất nhẹ */}
      <div className="floaty auth-chip" style={{ position: 'absolute', left: '14%', top: '24%', padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ width: 34, height: 34, borderRadius: 10, background: '#eef2ff', display: 'grid', placeItems: 'center', color: '#4f46e5' }} aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
        </span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1e2437', lineHeight: 1 }}>1.200+</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>học sinh đang học</div>
        </div>
      </div>
      <div className="floaty auth-chip" style={{ position: 'absolute', right: '13%', bottom: '22%', padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ width: 34, height: 34, borderRadius: 10, background: '#ecfdf5', display: 'grid', placeItems: 'center', color: '#059669' }} aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        </span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1e2437', lineHeight: 1 }}>Điểm danh</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>tự động mỗi buổi</div>
        </div>
      </div>

      <div className="glass" style={{ position: 'relative', borderRadius: 24, padding: 40, width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{
            width: 56, height: 56, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            borderRadius: 16, display: 'grid', placeItems: 'center', margin: '0 auto 14px',
            color: '#fff', boxShadow: '0 8px 20px rgba(79,70,229,0.32)',
          }} aria-hidden>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          </div>
          <h1 style={{ fontSize: 25, fontWeight: 700, color: '#1e2437', margin: 0, letterSpacing: '-0.02em' }}>
            {isForgot ? 'Đặt lại mật khẩu' : 'Chào mừng trở lại'}
          </h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 6, lineHeight: 1.5 }}>
            {isForgot ? 'Nhập email để nhận liên kết đặt lại.' : 'Đăng nhập để tiếp tục việc dạy và học.'}
          </p>
        </div>

        {!isForgot && (
          <>
            <button onClick={handleGoogleLogin} style={{
              width: '100%', padding: '11px 0', border: '1.5px solid #e2e8f0', borderRadius: 12,
              background: 'rgba(255,255,255,0.85)', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 14, fontWeight: 600,
              color: '#374151', marginBottom: 18,
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              Tiếp tục với Google
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, color: '#94a3b8', fontSize: 13 }}>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              hoặc bằng email
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            </div>
          </>
        )}

        {error && (
          <div role="alert" style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', color: '#b91c1c', fontSize: 13, marginBottom: 14 }}>{error}</div>
        )}
        {successMsg && (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 10, padding: '10px 14px', color: '#047857', fontSize: 13, marginBottom: 14 }}>{successMsg}</div>
        )}

        <form onSubmit={isForgot ? handleResetPassword : handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="email" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Địa chỉ email</label>
            <input id="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="ban@example.com" className="field" />
          </div>

          {!isForgot && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label htmlFor="pw" style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: 0 }}>Mật khẩu</label>
                <button type="button" onClick={() => { setIsForgot(true); setError(''); setSuccessMsg('') }} style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>Quên mật khẩu?</button>
              </div>
              <div style={{ position: 'relative' }}>
                <input id="pw" type={showPw ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="field" style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPw(s => !s)} aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 6, display: 'grid', placeItems: 'center' }}>
                  {showPw
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19M6.61 6.61A18.5 18.5 0 0 0 2 12s3 8 10 8a9.12 9.12 0 0 0 5.39-1.61"/><path d="m1 1 22 22"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                </button>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} style={primaryBtn}>
            {loading ? (isForgot ? 'Đang gửi…' : 'Đang đăng nhập…') : (isForgot ? 'Gửi liên kết đặt lại' : 'Đăng nhập')}
          </button>

          {isForgot && (
            <div style={{ textAlign: 'center', marginTop: 18 }}>
              <button type="button" onClick={() => { setIsForgot(false); setError(''); setSuccessMsg('') }} style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>← Quay lại đăng nhập</button>
            </div>
          )}
        </form>

        {!isForgot && (
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' }}>
            Chưa có tài khoản?{' '}
            <Link href="/signup" style={{ color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}>Đăng ký ngay</Link>
          </p>
        )}
        <p style={{ textAlign: 'center', marginTop: 10, fontSize: 13 }}>
          <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>← Về trang giới thiệu</Link>
        </p>
      </div>
    </div>
  )
}
