import { useState } from 'react'
import { Video } from 'lucide-react'
import { formatDate } from '../../utils/dateUtils'

const CATEGORY_LABEL = { academic: 'ACADEMIC', meeting: 'MEETING', study: 'STUDY', personal: 'OTHER' }

export default function PreviewCard({ preview, onAdd, onEdit, onCancel }) {
  const [added, setAdded] = useState(preview?.added ?? false)

  if (!preview) return null

  function handleAdd() {
    setAdded(true)
    onAdd?.()
  }

  const dateLabel = formatDate(preview.date, preview.time)
  const isZoom = preview.location && /zoom/i.test(preview.location)

  return (
    <div
      style={{
        marginTop: 10,
        border: '1px solid var(--accent)',
        borderRadius: 10,
        padding: '14px 16px',
        background: 'rgba(139,135,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Header */}
      <div
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 9.5,
          color: 'var(--accent)',
          letterSpacing: '0.8px',
          textTransform: 'uppercase',
        }}
      >
        PREVIEW · {CATEGORY_LABEL[preview.category] || preview.category?.toUpperCase()}
      </div>

      {/* Name */}
      <div style={{ fontSize: 14, color: 'var(--text)', fontFamily: 'Inter, sans-serif', lineHeight: 1.4 }}>
        {preview.name}
      </div>

      {/* Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {dateLabel && (
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
              color: 'var(--dim)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ opacity: 0.6 }}>📅</span> {dateLabel}
          </div>
        )}
        {preview.course && (
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
              color: 'var(--dim)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ opacity: 0.6 }}>📚</span> {preview.course}
          </div>
        )}
        {preview.location && (
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
              color: isZoom ? '#7dd3fc' : 'var(--dim)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {isZoom ? <Video size={11} strokeWidth={2} /> : <span style={{ opacity: 0.6 }}>📍</span>}
            {preview.link && isZoom ? (
              <a href={preview.link} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
                {preview.location}
              </a>
            ) : (
              preview.location
            )}
          </div>
        )}
      </div>

      {/* Buttons */}
      {added ? (
        <div
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11.5,
            color: 'var(--good)',
            letterSpacing: '0.2px',
          }}
        >
          ✓ Added
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
          <button
            onClick={handleAdd}
            style={{
              background: 'var(--accent)',
              color: '#0e0e1a',
              border: 'none',
              borderRadius: 7,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Add to tasks
          </button>
          <button
            onClick={() => onEdit?.(preview)}
            style={{
              background: 'transparent',
              border: '1px solid var(--line-2)',
              borderRadius: 7,
              padding: '6px 14px',
              fontSize: 12,
              color: 'var(--dim)',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--faint)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--dim)'; e.currentTarget.style.borderColor = 'var(--line-2)' }}
          >
            Edit
          </button>
          <button
            onClick={() => onCancel?.()}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '6px 10px',
              fontSize: 12,
              color: 'var(--faint)',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--dim)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--faint)')}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
