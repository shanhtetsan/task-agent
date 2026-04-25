import { useMemo, useState } from 'react'
import { CalendarPlus, Check, Mail, MapPin, Pencil, Trash2, Video } from 'lucide-react'
import { buildCalendarLink, buildGmailLink, buildTaskEmailDraft } from '../../lib/googleLinks'

const CATEGORY_STYLES = {
  coursework: { color: 'var(--accent)', dot: 'var(--accent)', bg: 'var(--accent-soft)' },
  event: { color: '#f0b04d', dot: '#f0b04d', bg: 'rgba(240,176,77,0.16)' },
  personal: { color: '#8a8f98', dot: '#8a8f98', bg: 'rgba(138,143,152,0.16)' },
}

function formatDateShort(date, time) {
  if (!date) return ''
  const d = new Date(`${date}T00:00:00`)
  if (Number.isNaN(d.getTime())) return ''
  const day = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  if (!time) return day
  const [h, m] = time.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return day
  const ampm = h >= 12 ? 'pm' : 'am'
  const hour12 = h % 12 || 12
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' })
  return `${weekday} ${hour12}${m ? `:${String(m).padStart(2, '0')}` : ''}${ampm}`
}

function formatTimeOnly(time) {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return ''
  const ampm = h >= 12 ? 'pm' : 'am'
  const hour12 = h % 12 || 12
  return `${hour12}${m ? `:${String(m).padStart(2, '0')}` : ''}${ampm}`
}

function isNextThirtyMinutes(task) {
  if (task.category !== 'event' || !task.date || !task.time) return false
  const [hours, mins] = task.time.split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(mins)) return false
  const eventDate = new Date(`${task.date}T00:00:00`)
  if (Number.isNaN(eventDate.getTime())) return false
  eventDate.setHours(hours, mins, 0, 0)
  const delta = eventDate.getTime() - Date.now()
  return delta >= 0 && delta <= 30 * 60 * 1000
}

function ActionIcon({ onClick, title, tone = 'default', children }) {
  const tones = {
    default: { color: 'var(--dim)', border: 'var(--line)' },
    danger: { color: '#d97575', border: 'rgba(217,117,117,0.35)' },
  }
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 24,
        height: 24,
        borderRadius: 6,
        border: `1px solid ${tones[tone].border}`,
        background: 'var(--surface-2)',
        color: tones[tone].color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

export default function TaskRow({ task, onToggleTask, onEditTask, onDeleteTask }) {
  const [hovered, setHovered] = useState(false)
  const { category, type, name, date, time, course, location, link, email, completed } = task
  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.personal
  const isZoom = /zoom/i.test(location || '') || /zoom/i.test(link || '')
  const showJoin = hovered && isZoom && !!link && isNextThirtyMinutes(task)
  const calendarLink = date ? buildCalendarLink(task) : null
  const gmailLink = useMemo(() => {
    if (!email) return null
    const { subject, body } = buildTaskEmailDraft(task)
    return buildGmailLink({ to: email, subject, body })
  }, [email, task])

  const rightMeta = useMemo(() => {
    if (completed) return null
    if (category === 'event') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
          {time ? (
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: 'var(--dim)' }}>
              {formatTimeOnly(time)}
            </span>
          ) : null}
          {location ? (
            isZoom && link ? (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#9ec4ff', display: 'inline-flex', alignItems: 'center' }}
                title="Open Zoom link"
                onClick={e => e.stopPropagation()}
              >
                <Video size={12} />
              </a>
            ) : (
              <span style={{ color: 'var(--faint)', display: 'inline-flex', alignItems: 'center' }} title={location}>
                <MapPin size={12} />
              </span>
            )
          ) : null}
        </div>
      )
    }
    return (
      <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: 'var(--dim)' }}>
        {formatDateShort(date, category === 'coursework' ? time : null)}
      </span>
    )
  }, [category, completed, date, time, location, isZoom, link])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minHeight: 52,
        padding: '8px 12px',
        borderBottom: '1px solid #232323',
        background: hovered ? 'rgba(255,255,255,0.02)' : 'transparent',
        opacity: completed ? 0.5 : 1,
        transition: 'background 0.15s ease, opacity 0.15s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ width: 8, height: 8, borderRadius: 99, background: style.dot, flexShrink: 0 }} />
      <button
        onClick={e => {
          e.stopPropagation()
          onToggleTask?.(task.id)
        }}
        style={{
          width: 16,
          height: 16,
          borderRadius: 5,
          border: completed ? '1px solid rgba(72,180,112,0.5)' : '1px solid var(--line-2)',
          background: completed ? 'rgba(72,180,112,0.95)' : 'transparent',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
        }}
        title={completed ? 'Mark open' : 'Mark done'}
      >
        {completed ? <Check size={11} color="#fff" /> : null}
      </button>

      <div style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
        {category === 'coursework' && course ? (
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--dim)',
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              borderRadius: 4,
              padding: '1px 6px',
              whiteSpace: 'nowrap',
            }}
          >
            {course}
          </span>
        ) : null}

        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: style.color,
            background: style.bg,
            borderRadius: 4,
            padding: '1px 6px',
            whiteSpace: 'nowrap',
          }}
        >
          {type || 'Other'}
        </span>

        <span
          style={{
            minWidth: 0,
            fontFamily: 'Inter, sans-serif',
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--text)',
            textDecoration: completed ? 'line-through' : 'none',
            lineHeight: 1.25,
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {name}
        </span>
      </div>

      <div
        style={{
          width: 84,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 4,
          opacity: hovered ? 1 : 0,
          pointerEvents: hovered ? 'auto' : 'none',
          transition: 'opacity 150ms ease',
        }}
      >
        <ActionIcon onClick={() => onToggleTask?.(task.id)} title={completed ? 'Undo' : 'Done'}>
          <Check size={12} />
        </ActionIcon>
        <ActionIcon onClick={() => onEditTask?.(task)} title="Edit task">
          <Pencil size={12} />
        </ActionIcon>
        <ActionIcon onClick={() => onDeleteTask?.(task.id)} title="Delete task" tone="danger">
          <Trash2 size={12} />
        </ActionIcon>
      </div>

      <div
        style={{
          width: 140,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 8,
          flexShrink: 0,
        }}
      >
        {completed ? (
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              letterSpacing: '0.05em',
              color: '#6dd69c',
              background: 'rgba(109,214,156,0.12)',
              border: '1px solid rgba(109,214,156,0.35)',
              borderRadius: 4,
              padding: '1px 6px',
              textTransform: 'uppercase',
            }}
          >
            Done
          </span>
        ) : (
          rightMeta
        )}
        {calendarLink ? (
          <a
            href={calendarLink}
            target="_blank"
            rel="noopener noreferrer"
            title="Add to Google Calendar"
            onClick={e => e.stopPropagation()}
            style={{
              color: 'var(--faint)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 16,
              height: 16,
              textDecoration: 'none',
            }}
          >
            <CalendarPlus size={12} />
          </a>
        ) : null}
        {gmailLink ? (
          <a
            href={gmailLink}
            target="_blank"
            rel="noopener noreferrer"
            title="Email confirmation"
            onClick={e => e.stopPropagation()}
            style={{
              color: 'var(--faint)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 16,
              height: 16,
              textDecoration: 'none',
            }}
          >
            <Mail size={12} />
          </a>
        ) : null}
        {showJoin ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              color: '#9ec4ff',
              border: '1px solid rgba(158,196,255,0.4)',
              borderRadius: 4,
              padding: '1px 6px',
              textDecoration: 'none',
            }}
            onClick={e => e.stopPropagation()}
            title="Join Zoom meeting"
          >
            Join
          </a>
        ) : null}
      </div>
    </div>
  )
}
