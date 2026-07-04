'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import PendingApproval from './pending'

type InitPayload = {
  type: 'TUTOR_HUB_INIT'
  supabaseUrl: string
  supabaseKey: string
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    role: string
    name: string
    avatar: string
    subject: string
    language: string
  }
}

export default function DashboardPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const router = useRouter()
  // 'loading' = đang kiểm tra; 'pending' = chờ admin duyệt; 'ready' = hiện app
  const [gate, setGate] = useState<'loading' | 'pending' | 'ready'>('loading')
  const [userEmail, setUserEmail] = useState('')
  const [payload, setPayload] = useState<InitPayload | null>(null)

  const initApp = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.replace('/login'); return }
    const user = session.user
    setUserEmail(user.email ?? '')

    // Load profile from DB — always fresh, never rely on session claims
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileErr) {
      // Likely RLS recursion (500) — run migration 001_fix_rls_recursion.sql
      console.error('[DashboardPage] profiles fetch failed:', profileErr.message, profileErr.code)
    }

    // Tài khoản chưa được cấp quyền → hiện màn hình chờ duyệt thay vì app.
    const role = profile?.role ?? 'Pending'
    if (role === 'Pending') { setGate('pending'); return }

    setPayload({
      type: 'TUTOR_HUB_INIT',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      user: {
        id: user.id,
        email: user.email ?? '',
        role,
        name: profile?.name
          ?? user.user_metadata?.full_name
          ?? user.user_metadata?.name
          ?? user.email?.split('@')[0]
          ?? 'User',
        avatar: profile?.avatar ?? '',
        subject: profile?.subject ?? '',
        language: profile?.language ?? 'vi',
      },
    })
    setGate('ready')
  }, [router])

  useEffect(() => {
    initApp()

    // Handle messages back from the iframe
    function handleMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return
      if (e.data?.type === 'TUTOR_HUB_LOGOUT') {
        const supabase = createClient()
        supabase.auth.signOut().then(() => {
          router.replace('/login')
        })
      }
      if (e.data?.type === 'TUTOR_HUB_SAVE_PROFILE') {
        const supabase = createClient()
        supabase.from('profiles').upsert(e.data.profile).then(() => {})
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [initApp, router])

  // Gửi payload xuống iframe khi nó bắn sự kiện onLoad (đã tải xong
  // tutor-hub-app.html và đăng ký listener). KHÔNG dựa vào readyState:
  // iframe vừa mount có readyState='complete' cho about:blank ban đầu →
  // nếu post lúc đó message rơi vào trang blank và mất, app hiện màn trắng.
  function handleIframeLoad() {
    if (!payload) return
    iframeRef.current?.contentWindow?.postMessage(payload, window.location.origin)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (gate === 'pending') {
    return <PendingApproval email={userEmail} onRefresh={() => { setGate('loading'); initApp() }} onSignOut={handleSignOut} />
  }

  if (gate === 'loading') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e2a3a, #0f1623)', color: '#94a3b8',
        fontFamily: "'Segoe UI', system-ui, sans-serif", fontSize: 15,
      }}>Đang tải…</div>
    )
  }

  return (
    <iframe
      ref={iframeRef}
      src="/tutor-hub-app.html"
      onLoad={handleIframeLoad}
      style={{ width: '100vw', height: '100vh', border: 'none', display: 'block' }}
      title="Tutor Hub"
    />
  )
}
