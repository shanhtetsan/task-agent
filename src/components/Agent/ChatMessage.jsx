import ActionCard from './ActionCard'
import PreviewCard from './PreviewCard'

/** One URL in the line — plain or with a short label (e.g. "Zoom: https://..."). */
function shouldShowLinkLabelLine(label) {
  if (!label) return false
  const s = label.trim()
  if (/^zoom:?\s*$/i.test(s)) return false
  if (/^(link|url|meeting|teams?|join):?\s*$/i.test(s)) return false
  return true
}

function extractUserMessageLink(text) {
  const t = (text || '').trim()
  if (t.length < 10) return null
  if (/\n/.test(t)) return null
  const allUrls = t.match(/https?:\/\/\S+/gi) || []
  if (allUrls.length !== 1) return null
  const url = allUrls[0]
  if (url.length < 12) return null
  if (!t.endsWith(url)) return null
  const withoutUrl = t.slice(0, t.length - url.length).replace(/\s+$/g, '').trim()
  if (withoutUrl.length > 0) {
    if (withoutUrl.length > 56) return null
    if (/https?:/i.test(withoutUrl)) return null
  }
  return { url, label: withoutUrl || null }
}

function urlCardTitle(url) {
  if (/zoom\.us\//i.test(url)) return 'ZOOM'
  if (/teams\.microsoft\.com\//i.test(url)) return 'TEAMS'
  if (/meet\.google\.com\//i.test(url)) return 'GOOGLE MEET'
  return 'LINK'
}

export default function ChatMessage({ role, text, action, preview, onAdd, onEdit, onCancel }) {
  const isUser = role === 'user'

  if (isUser) {
    const linkPayload = extractUserMessageLink(text)
    if (linkPayload) {
      const { url, label } = linkPayload
      const cardTitle = label
        ? (/^zoom\b/i.test(label) ? 'ZOOM' : urlCardTitle(url))
        : urlCardTitle(url)
      return (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '5px 16px' }}>
          <div
            style={{
              border: '1px solid rgba(94,135,245,0.7)',
              background: 'var(--accent-soft)',
              borderRadius: 10,
              padding: '12px 14px',
              maxWidth: '86%',
              minWidth: 0,
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
                letterSpacing: '0.5px',
              }}
            >
              {cardTitle}
            </div>
            {label && shouldShowLinkLabelLine(label) ? (
              <div style={{ fontSize: 12, color: 'var(--dim)', lineHeight: 1.4 }}>{label}</div>
            ) : null}
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: 12,
                lineHeight: 1.5,
                color: 'var(--text)',
                wordBreak: 'break-all',
                overflowWrap: 'anywhere',
                textDecoration: 'none',
                fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
              }}
            >
              {url}
            </a>
            <button
              type="button"
              onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
              style={{
                alignSelf: 'flex-start',
                background: 'var(--accent)',
                color: '#0e0e1a',
                border: 'none',
                borderRadius: 7,
                padding: '6px 14px',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Open link
            </button>
          </div>
        </div>
      )
    }
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
            wordBreak: 'break-all',
            overflowWrap: 'anywhere',
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
