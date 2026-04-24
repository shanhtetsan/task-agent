import { useState } from 'react'

export default function ActionCard({ action, onAdd }) {
  const [added, setAdded] = useState(action.added || false)

  function handleAdd() {
    setAdded(true)
    onAdd?.()
  }

  return (
    <div
      style={{
        border: '1px solid var(--accent)',
        background: 'rgba(139,135,255,0.05)',
        borderRadius: 10,
        padding: '12px 14px',
        marginTop: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--accent)',
          fontFamily: '"JetBrains Mono", monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {action.title}
      </div>
      <div style={{ fontSize: 13.5, color: 'var(--dim)', lineHeight: 1.5 }}>
        {action.body}
      </div>
      <button
        disabled={added}
        onClick={handleAdd}
        style={{
          alignSelf: 'flex-start',
          background: added ? 'rgba(109,214,156,0.15)' : 'var(--accent)',
          color: added ? 'var(--good)' : '#0e0e1a',
          border: added ? '1px solid rgba(109,214,156,0.4)' : 'none',
          borderRadius: 7,
          padding: '6px 14px',
          fontSize: 12.5,
          fontWeight: 600,
          cursor: added ? 'default' : 'pointer',
          fontFamily: 'Inter, sans-serif',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { if (!added) e.currentTarget.style.opacity = '0.85' }}
        onMouseLeave={e => { if (!added) e.currentTarget.style.opacity = '1' }}
      >
        {added ? 'Added ✓' : action.btn}
      </button>
    </div>
  )
}
