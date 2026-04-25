import ActionCard from './ActionCard'
import PreviewCard from './PreviewCard'

export default function ChatMessage({ role, text, action, preview, onAdd, onEdit, onCancel }) {
  const isUser = role === 'user'

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 16px' }}>
        <div
          style={{
            background: 'var(--accent)',
            color: '#0e0e1a',
            borderRadius: '14px 14px 4px 14px',
            padding: '10px 14px',
            maxWidth: '78%',
            fontSize: 13.5,
            fontFamily: 'Inter, sans-serif',
            fontWeight: 450,
            lineHeight: 1.55,
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
    <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '4px 16px' }}>
      <div style={{ maxWidth: '86%', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--line)',
            borderRadius: '14px 14px 14px 4px',
            padding: '10px 14px',
            fontSize: 14,
            fontFamily: 'Fraunces, serif',
            fontStyle: 'italic',
            fontWeight: 350,
            lineHeight: 1.65,
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
