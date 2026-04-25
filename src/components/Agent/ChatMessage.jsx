import ActionCard from './ActionCard'
import PreviewCard from './PreviewCard'

export default function ChatMessage({ role, text, action, preview, onAdd, onEdit, onCancel }) {
  const isUser = role === 'user'

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '5px 16px' }}>
        <div
          style={{
            background: 'var(--accent)',
            color: '#ffffff',
            borderRadius: '12px 12px 4px 12px',
            padding: '9px 12px',
            maxWidth: '80%',
            fontSize: 13,
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            lineHeight: 1.5,
            boxShadow: '0 1px 0 rgba(0,0,0,0.04)',
          }}
        >
          {text}
        </div>
      </div>
    )
  }

  const formattedText = typeof text === 'string'
    ? text.split('\n').map((line, i) => {
        const bold = line.replace(/\*\*(.*?)\*\*/g, (_, m) => `<strong>${m}</strong>`)
        return <div key={i} style={{ minHeight: line === '' ? '0.6em' : undefined }} dangerouslySetInnerHTML={{ __html: bold || '&nbsp;' }} />
      })
    : text

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '5px 16px' }}>
      <div style={{ maxWidth: '86%', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--line)',
            borderRadius: '12px 12px 12px 4px',
            padding: '10px 12px',
            fontSize: 13.5,
            fontFamily: 'Inter, sans-serif',
            fontWeight: 430,
            lineHeight: 1.58,
            color: 'var(--text)',
          }}
        >
          {formattedText}
        </div>
        {action && <ActionCard action={action} onAdd={onAdd} />}
        {preview && (
          <PreviewCard
            preview={preview}
            onAdd={onAdd}
            onEdit={onEdit}
            onCancel={onCancel}
          />
        )}
      </div>
    </div>
  )
}
