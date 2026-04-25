import { useState } from 'react'

export default function ActionCard({ action, onAdd }) {
  const [added, setAdded] = useState(action.added || false)

  function handleAdd() {
    if (action.href) {
      window.open(action.href, '_blank', 'noopener,noreferrer')
      return
    }
    setAdded(true)
    onAdd?.()
  }

  return (
    <div
      style={{
        border: '1px solid rgba(94,135,245,0.7)',
        background: 'var(--accent-soft)',
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
        disabled={action.href ? false : added}
        onClick={handleAdd}
        style={{
          alignSelf: 'flex-start',
          background: added && !action.href ? 'rgba(109,214,156,0.15)' : 'var(--accent)',
          color: added && !action.href ? 'var(--good)' : '#0e0e1a',
          border: added && !action.href ? '1px solid rgba(109,214,156,0.4)' : 'none',
          borderRadius: 7,
          padding: '6px 14px',
          fontSize: 12.5,
          fontWeight: 600,
          cursor: added && !action.href ? 'default' : 'pointer',
          fontFamily: 'Inter, sans-serif',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { if (!added || action.href) e.currentTarget.style.opacity = '0.85' }}
        onMouseLeave={e => { if (!added || action.href) e.currentTarget.style.opacity = '1' }}
      >
        {added && !action.href ? 'Added ✓' : action.btn}
      </button>
    </div>
  )
}
