const typeStyles = {
  Exam: { color: 'var(--urgent)', background: 'rgba(240,107,107,0.1)' },
  HW: { color: 'var(--accent)', background: 'rgba(139,135,255,0.1)' },
  Lab: { color: 'var(--good)', background: 'rgba(109,214,156,0.1)' },
  Reading: { color: 'var(--warn)', background: 'rgba(240,176,77,0.1)' },
}

export default function TaskRow({ task }) {
  const { course, type, name, due, urgent, highlighted, completed } = task
  const typeStyle = typeStyles[type] || typeStyles.HW

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 20px',
        borderBottom: '1px solid var(--line)',
        background: highlighted
          ? 'linear-gradient(90deg, rgba(139,135,255,0.07) 0%, transparent 100%)'
          : 'transparent',
        borderLeft: highlighted ? '2px solid var(--accent)' : '2px solid transparent',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => {
        if (!highlighted) e.currentTarget.style.background = 'var(--surface-2)'
      }}
      onMouseLeave={e => {
        if (!highlighted)
          e.currentTarget.style.background = 'transparent'
      }}
    >
      {/* Checkbox */}
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: 4,
          border: completed ? 'none' : '1.5px solid var(--line-2)',
          background: completed ? 'var(--good)' : 'transparent',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {completed && (
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5L3.5 6L8 1" stroke="#0e1014" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Course tag */}
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 10.5,
          color: 'var(--dim)',
          background: 'var(--surface-2)',
          border: '1px solid var(--line)',
          borderRadius: 5,
          padding: '2px 7px',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          letterSpacing: '0.2px',
        }}
      >
        {course}
      </span>

      {/* Type chip */}
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 10,
          fontWeight: 500,
          color: typeStyle.color,
          background: typeStyle.background,
          borderRadius: 5,
          padding: '2px 7px',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.4px',
        }}
      >
        {type}
      </span>

      {/* Title */}
      <span
        style={{
          flex: 1,
          fontSize: 13.5,
          color: completed ? 'var(--faint)' : 'var(--text)',
          textDecoration: completed ? 'line-through' : 'none',
          lineHeight: 1.4,
        }}
      >
        {name}
      </span>

      {/* Due date */}
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11,
          color: urgent && !completed ? 'var(--urgent)' : 'var(--dim)',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          letterSpacing: '0.2px',
        }}
      >
        {due}
      </span>
    </div>
  )
}
