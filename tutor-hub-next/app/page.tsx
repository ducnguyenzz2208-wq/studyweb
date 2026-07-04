import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

// Trang giới thiệu công khai (tông sáng, đậm chất giáo dục).
// Người đã đăng nhập được đưa thẳng vào ứng dụng.
export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  const ic = (d: string) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden dangerouslySetInnerHTML={{ __html: d }} />
  )

  const features = [
    { color: '#4f46e5', bg: '#eef2ff', title: 'Quản lý học sinh & lớp', desc: 'Hồ sơ, lớp học, thành viên và điểm trung bình tự tính.', d: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' },
    { color: '#0891b2', bg: '#ecfeff', title: 'Bài tập & chấm điểm', desc: 'Giao bài, nhận bài nộp, chấm và nhận xét — điểm đồng bộ tự động.', d: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="m9 15 2 2 4-4"/>' },
    { color: '#059669', bg: '#ecfdf5', title: 'Lịch & điểm danh', desc: 'Lịch tuần trực quan, điểm danh theo từng buổi học.', d: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="m9 16 2 2 4-4"/>' },
    { color: '#d97706', bg: '#fffbeb', title: 'Học phí & hóa đơn', desc: 'Theo dõi thanh toán, in hóa đơn/PDF và nhắc đóng học phí.', d: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>' },
    { color: '#7c3aed', bg: '#f5f3ff', title: 'Tài liệu & flashcard', desc: 'Kho tài liệu dùng chung và bộ thẻ học cho học sinh ôn tập.', d: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>' },
    { color: '#db2777', bg: '#fdf2f8', title: 'Cổng phụ huynh & học sinh', desc: 'Phụ huynh theo dõi tiến độ, học sinh xem bài và lịch của mình.', d: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>' },
  ]

  return (
    <div className="bright-bg" style={{ fontFamily: 'var(--font-sans)', color: '#1e2437' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'grid', placeItems: 'center', color: '#fff' }} aria-hidden>
              {ic('<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>')}
            </div>
            <strong style={{ fontSize: 18 }}>Tutor Hub</strong>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/login" style={{ padding: '9px 18px', borderRadius: 10, textDecoration: 'none', color: '#334155', border: '1px solid #dbe2f0', fontWeight: 600, fontSize: 14, background: 'rgba(255,255,255,0.6)' }}>Đăng nhập</Link>
            <Link href="/signup" style={{ padding: '9px 18px', borderRadius: 10, textDecoration: 'none', color: '#fff', background: 'linear-gradient(135deg, #4f46e5, #6d28d9)', fontWeight: 600, fontSize: 14, boxShadow: '0 6px 16px rgba(79,70,229,0.28)' }}>Đăng ký</Link>
          </div>
        </header>

        {/* Hero */}
        <section style={{ textAlign: 'center', padding: '52px 0 40px', position: 'relative' }}>
          <div className="floaty auth-chip" style={{ position: 'absolute', left: 8, top: 70, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'center', textAlign: 'left' }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, background: '#eef2ff', color: '#4f46e5', display: 'grid', placeItems: 'center' }} aria-hidden>{ic('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>')}</span>
            <div><div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1 }}>1.200+</div><div style={{ fontSize: 12, color: '#64748b' }}>học sinh</div></div>
          </div>
          <div className="floaty auth-chip" style={{ position: 'absolute', right: 8, top: 130, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'center', textAlign: 'left' }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, background: '#ecfdf5', color: '#059669', display: 'grid', placeItems: 'center' }} aria-hidden>{ic('<path d="M22 12A10 10 0 1 1 12 2"/><path d="m9 11 3 3L22 4"/>')}</span>
            <div><div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1 }}>98%</div><div style={{ fontSize: 12, color: '#64748b' }}>chuyên cần</div></div>
          </div>

          <div style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 999, background: 'rgba(79,70,229,0.1)', color: '#4338ca', fontSize: 13, fontWeight: 600, marginBottom: 20 }}>Nền tảng quản lý trung tâm gia sư</div>
          <h1 style={{ fontSize: 46, lineHeight: 1.12, margin: '0 0 16px', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Dạy &amp; học gọn gàng,<br />
            <span style={{ background: 'linear-gradient(120deg,#4f46e5,#9333ea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>tất cả ở một nơi</span>
          </h1>
          <p style={{ fontSize: 17, color: '#546074', maxWidth: 560, margin: '0 auto 28px', lineHeight: 1.6 }}>
            Tutor Hub giúp giáo viên và trung tâm quản lý học sinh, lớp học, bài tập, điểm số, lịch học và học phí — dành cho cả phụ huynh và học sinh.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{ padding: '13px 28px', borderRadius: 12, textDecoration: 'none', color: '#fff', background: 'linear-gradient(135deg, #4f46e5, #6d28d9)', fontWeight: 600, fontSize: 15, boxShadow: '0 10px 24px rgba(79,70,229,0.3)' }}>Bắt đầu miễn phí</Link>
            <Link href="/login" style={{ padding: '13px 28px', borderRadius: 12, textDecoration: 'none', color: '#334155', border: '1px solid #dbe2f0', fontWeight: 600, fontSize: 15, background: 'rgba(255,255,255,0.7)' }}>Tôi đã có tài khoản</Link>
          </div>
        </section>

        {/* Preview dashboard (glass, 1 thẻ nên nhẹ) */}
        <section className="glass" style={{ borderRadius: 20, padding: 18, marginBottom: 56 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            {[
              { k: 'Học sinh', v: '128', c: '#4f46e5' },
              { k: 'Lớp đang mở', v: '12', c: '#0891b2' },
              { k: 'Điểm TB', v: '8.1', c: '#059669' },
              { k: 'Học phí tháng', v: '96%', c: '#d97706' },
            ].map(s => (
              <div key={s.k} style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', border: '1px solid #eef1f7' }}>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>{s.k}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: s.c }}>{s.v}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, paddingBottom: 56 }}>
          {features.map(f => (
            <div key={f.title} className="floaty" style={{ padding: '22px 20px' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: f.bg, color: f.color, display: 'grid', placeItems: 'center', marginBottom: 14 }}>{ic(f.d)}</div>
              <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600 }}>{f.title}</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: 14, lineHeight: 1.55 }}>{f.desc}</p>
            </div>
          ))}
        </section>

        {/* 3 bước */}
        <section className="glass" style={{ borderRadius: 20, padding: '28px 24px', marginBottom: 56 }}>
          <h2 style={{ fontSize: 22, margin: '0 0 20px', textAlign: 'center', fontWeight: 700 }}>Bắt đầu trong 3 bước</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {[
              { n: '1', t: 'Đăng ký', d: 'Tạo tài khoản và chọn vai trò: Học sinh, Giáo viên hoặc Phụ huynh.' },
              { n: '2', t: 'Xác nhận & chờ duyệt', d: 'Xác nhận email, sau đó quản trị viên cấp quyền cho bạn.' },
              { n: '3', t: 'Bắt đầu dùng', d: 'Đăng nhập và quản lý lớp học, bài tập, điểm số của bạn.' },
            ].map(s => (
              <div key={s.n} style={{ display: 'flex', gap: 12 }}>
                <div style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 999, background: 'linear-gradient(135deg,#4f46e5,#6d28d9)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700 }}>{s.n}</div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{s.t}</div>
                  <div style={{ color: '#64748b', fontSize: 14, lineHeight: 1.55 }}>{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer style={{ textAlign: 'center', padding: '8px 0 40px', color: '#94a3b8', fontSize: 13 }}>
          © {new Date().getFullYear()} Tutor Hub
        </footer>
      </div>
    </div>
  )
}
