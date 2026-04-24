const DEFAULT_CHIPS = ['Show me a worked example', "I'm stuck", 'Quiz me']

export default function QuickReplies({ chips = DEFAULT_CHIPS, onSelect }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '0 16px 10px' }}>
      {chips.map(chip => (
        <button
          key={chip}
          onClick={() => onSelect?.(chip)}
          style={{
            background: 'transparent',
            border: '1px solid var(--line-2)',
            borderRadius: 999,
            padding: '5px 13px',
            fontSize: 12,
            color: 'var(--dim)',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--faint)'
            e.currentTarget.style.color = 'var(--text)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--line-2)'
            e.currentTarget.style.color = 'var(--dim)'
          }}
        >
          {chip}
        </button>
      ))}
    </div>
  )
}
