import { createClient } from '@/lib/supabase/server'
import UploadForm from '@/components/materials/UploadForm'
import DeleteButton from '@/components/materials/DeleteButton'

type Material = {
  id: string
  title: string
  description: string | null
  file_path: string
  file_url: string
  category: string | null
  file_type: string | null
  created_at: string
  owner_id: string | null
}

const TYPE_COLORS: Record<string, string> = {
  PDF: '#fee2e2', DOC: '#dbeafe', PPT: '#fef3c7',
  XLS: '#dcfce7', Image: '#f3e8ff',
}
const TYPE_TEXT: Record<string, string> = {
  PDF: '#dc2626', DOC: '#2563eb', PPT: '#d97706',
  XLS: '#16a34a', Image: '#7c3aed',
}

export default async function MaterialsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Fetch profile to determine role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id ?? '')
    .single()

  const canUpload = profile?.role === 'Admin' || profile?.role === 'Teacher'

  // Fetch all materials — RLS ensures only authenticated users see this
  const { data: materials, error } = await supabase
    .from('materials')
    .select('id, title, description, file_path, file_url, category, file_type, created_at, owner_id')
    .order('created_at', { ascending: false })

  return (
    <main style={{ padding: '2rem', fontFamily: 'var(--font-sans)', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Lecture Materials</h1>
        <p style={{ color: '#64748b', marginTop: 4 }}>Browse and download lecture resources and files.</p>
      </div>

      {canUpload && <UploadForm />}

      {error && (
        <p style={{ color: '#dc2626', background: '#fee2e2', padding: '12px 16px', borderRadius: 8 }}>
          Error loading materials: {error.message}
        </p>
      )}

      {!materials?.length ? (
        <p style={{ color: '#94a3b8', marginTop: '2rem' }}>No materials yet.</p>
      ) : (
        <div style={{
          display: 'grid', gap: '1rem', marginTop: '2rem',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        }}>
          {materials.map((m: Material) => {
            const ft = m.file_type ?? 'FILE'
            const bg = TYPE_COLORS[ft] ?? '#f1f5f9'
            const fg = TYPE_TEXT[ft] ?? '#475569'
            const isOwner = m.owner_id === user?.id

            return (
              <div key={m.id} style={{
                border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ background: bg, color: fg, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
                    {ft}
                  </span>
                  {m.category && (
                    <span style={{ background: '#eff6ff', color: '#3b82f6', fontSize: 11, padding: '2px 8px', borderRadius: 4 }}>
                      {m.category}
                    </span>
                  )}
                </div>

                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{m.title}</h3>
                {m.description && (
                  <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{m.description}</p>
                )}
                <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
                  {new Date(m.created_at).toLocaleDateString('vi-VN')}
                </p>

                <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
                  <a
                    href={m.file_url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1, textAlign: 'center', padding: '8px 0',
                      background: '#3b82f6', color: '#fff', borderRadius: 8,
                      textDecoration: 'none', fontSize: 14, fontWeight: 600,
                    }}
                  >
                    ↓ Download
                  </a>

                  {(canUpload || isOwner) && (
                    <DeleteButton id={m.id} filePath={m.file_path} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
