'use client'

import { useTransition } from 'react'
import { deleteMaterial } from '@/app/dashboard/materials/actions'

type Props = { id: string; filePath: string }

export default function DeleteButton({ id, filePath }: Props) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      disabled={isPending}
      onClick={() => {
        if (!confirm('Delete this material?')) return
        startTransition(async () => { await deleteMaterial(id, filePath) })
      }}
      style={{
        padding: '8px 14px',
        background: '#fee2e2', color: '#dc2626',
        border: 'none', borderRadius: 8,
        cursor: isPending ? 'not-allowed' : 'pointer',
        fontSize: 14, fontWeight: 600,
      }}
    >
      {isPending ? '…' : '🗑'}
    </button>
  )
}
