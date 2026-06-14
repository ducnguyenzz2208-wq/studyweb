'use client'

import { useRef, useState, useTransition } from 'react'
import { uploadMaterial } from '@/app/dashboard/materials/actions'

const CATEGORIES = ['Math', 'English', 'Physics', 'Chemistry', 'Literature', 'Chinese', 'IT']
const FILE_TYPES = ['PDF', 'DOC', 'PPT', 'XLS', 'Image']

export default function UploadForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await uploadMaterial(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        formRef.current?.reset()
      }
    })
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      style={{
        background: '#f8fafc', border: '1px solid #e2e8f0',
        borderRadius: 12, padding: '1.5rem', maxWidth: 500, marginBottom: '2rem',
      }}
    >
      <h2 style={{ marginTop: 0, fontSize: 18 }}>Upload Material</h2>

      {error && (
        <p style={{ color: '#dc2626', background: '#fee2e2', padding: '10px 14px', borderRadius: 8, fontSize: 14 }}>
          {error}
        </p>
      )}
      {success && (
        <p style={{ color: '#16a34a', background: '#dcfce7', padding: '10px 14px', borderRadius: 8, fontSize: 14 }}>
          Uploaded successfully!
        </p>
      )}

      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Title *</label>
        <input name="title" type="text" required placeholder="Algebra Basics — Chapter 1" style={inputStyle} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Description</label>
        <input name="description" type="text" placeholder="Optional description" style={inputStyle} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Category</label>
          <select name="category" style={selectStyle}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>File Type</label>
          <select name="file_type" style={selectStyle}>
            {FILE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>File *</label>
        <input
          name="file"
          type="file"
          required
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg"
          style={{ width: '100%', fontSize: 14 }}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        style={{
          width: '100%', padding: '10px 0',
          background: isPending ? '#93c5fd' : '#3b82f6',
          color: '#fff', border: 'none', borderRadius: 8,
          fontSize: 15, fontWeight: 700,
          cursor: isPending ? 'not-allowed' : 'pointer',
        }}
      >
        {isPending ? 'Uploading…' : '↑ Upload'}
      </button>
    </form>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600,
  color: '#374151', marginBottom: 4,
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px',
  border: '1.5px solid #e2e8f0', borderRadius: 8,
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
}
const selectStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px',
  border: '1.5px solid #e2e8f0', borderRadius: 8,
  fontSize: 14, background: '#fff',
}
