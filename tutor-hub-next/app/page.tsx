import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

// Trang giới thiệu công khai. Người đã đăng nhập được đưa thẳng vào ứng dụng.
export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  const features = [
    { icon: '👨‍🎓', title: 'Quản lý học sinh & lớp', desc: 'Hồ sơ học sinh, lớp học, thành viên và điểm trung bình tự tính.' },
    { icon: '📋', title: 'Bài tập & chấm điểm', desc: 'Giao bài, nhận bài nộp, chấm và nhận xét — điểm đồng bộ tự động.' },
    { icon: '📅', title: 'Lịch & điểm danh', desc: 'Lịch tuần trực quan, điểm danh theo từng buổi học.' },
    { icon: '💳', title: 'Học phí & hóa đơn', desc: 'Theo dõi thanh toán, in hóa đơn/PDF và nhắc đóng học phí.' },
    { icon: '📂', title: 'Tài liệu & flashcard', desc: 'Kho tài liệu dùng chung và bộ thẻ học cho học sinh ôn tập.' },
    { icon: '👨‍👩‍👧', title: 'Cổng phụ huynh & học sinh', desc: 'Phụ huynh theo dõi tiến độ, học sinh xem bài và lịch của mình.' },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e2a3a, #0f1623)',
      color: '#e2e8f0',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, fontSize: 20,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>📚</div>
            <strong style={{ fontSize: 18, color: '#fff' }}>Tutor Hub</strong>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/login" style={{
              padding: '9px 18px', borderRadius: 10, textDecoration: 'none',
              color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 600, fontSize: 14,
            }}>Đăng nhập</Link>
            <Link href="/signup" style={{
              padding: '9px 18px', borderRadius: 10, textDecoration: 'none',
              color: '#fff', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', fontWeight: 700, fontSize: 14,
            }}>Đăng ký</Link>
          </div>
        </header>

        {/* Hero */}
        <section style={{ textAlign: 'center', padding: '60px 0 48px' }}>
          <div style={{
            display: 'inline-block', padding: '6px 14px', borderRadius: 999,
            background: 'rgba(59,130,246,0.15)', color: '#93c5fd', fontSize: 13, fontWeight: 600, marginBottom: 20,
          }}>Nền tảng quản lý trung tâm gia sư</div>
          <h1 style={{ fontSize: 42, lineHeight: 1.15, color: '#fff', margin: '0 0 16px', fontWeight: 800 }}>
            Quản lý dạy & học<br />gọn gàng ở một nơi
          </h1>
          <p style={{ fontSize: 17, color: '#94a3b8', maxWidth: 560, margin: '0 auto 28px' }}>
            Tutor Hub giúp giáo viên và trung tâm quản lý học sinh, lớp học, bài tập, điểm số,
            lịch học và học phí — dành cho cả phụ huynh và học sinh.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{
              padding: '13px 28px', borderRadius: 12, textDecoration: 'none',
              color: '#fff', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', fontWeight: 700, fontSize: 15,
            }}>Bắt đầu miễn phí</Link>
            <Link href="/login" style={{
              padding: '13px 28px', borderRadius: 12, textDecoration: 'none',
              color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 600, fontSize: 15,
            }}>Tôi đã có tài khoản</Link>
          </div>
        </section>

        {/* Features */}
        <section style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16, paddingBottom: 56,
        }}>
          {features.map(f => (
            <div key={f.title} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16, padding: '22px 20px',
            }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ margin: '0 0 6px', color: '#fff', fontSize: 16 }}>{f.title}</h3>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: 14, lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </section>

        {/* Cách bắt đầu */}
        <section style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, padding: '28px 24px', marginBottom: 56,
        }}>
          <h2 style={{ color: '#fff', fontSize: 20, margin: '0 0 18px', textAlign: 'center' }}>Bắt đầu trong 3 bước</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
            {[
              { n: '1', t: 'Đăng ký', d: 'Tạo tài khoản và chọn vai trò: Học sinh, Giáo viên hoặc Phụ huynh.' },
              { n: '2', t: 'Xác nhận & chờ duyệt', d: 'Xác nhận email, sau đó quản trị viên cấp quyền cho bạn.' },
              { n: '3', t: 'Bắt đầu dùng', d: 'Đăng nhập và quản lý lớp học, bài tập, điểm số của bạn.' },
            ].map(s => (
              <div key={s.n} style={{ display: 'flex', gap: 12 }}>
                <div style={{
                  flexShrink: 0, width: 32, height: 32, borderRadius: 999,
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                }}>{s.n}</div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 600, marginBottom: 4 }}>{s.t}</div>
                  <div style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.5 }}>{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer style={{ textAlign: 'center', padding: '24px 0 40px', color: '#64748b', fontSize: 13 }}>
          © {new Date().getFullYear()} Tutor Hub
        </footer>
      </div>
    </div>
  )
}
