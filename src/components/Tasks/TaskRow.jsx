import { Video } from 'lucide-react'
import { formatDate } from '../../utils/dateUtils'

const typeStyles = {
  Exam:    { color: 'var(--urgent)', background: 'rgba(240,107,107,0.1)' },
  HW:      { color: 'var(--accent)', background: 'rgba(139,135,255,0.1)' },
  Lab:     { color: 'var(--good)',   background: 'rgba(109,214,156,0.1)' },
  Reading: { color: 'var(--warn)',   background: 'rgba(240,176,77,0.1)' },
  Meeting: { color: '#7dd3fc',       background: 'rgba(125,211,252,0.1)' },
  Study:   { color: 'var(--accent)', background: 'rgba(139,135,255,0.1)' },
  Other:   { color: 'var(--faint)',  background: 'rgba(255,255,255,0.05)' },
}

const categoryChipStyles = {
  meeting: { label: 'MEETING', color: '#7dd3fc',       bg: 'rgba(125,211,252,0.1)' },
  study:   { label: 'STUDY',   color: 'var(--accent)', bg: 'rgba(139,135,255,0.1)' },
  personal:{ label: 'OTHER',   color: 'var(--faint)',  bg: 'rgba(255,255,255,0.05)' },
}

function Checkbox({ completed }) {
  return (
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
  )
}

function Chip({ label, color, bg }) {
  return (
    <span
      style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 10,
        fontWeight: 500,
        color,
        background: bg,
        borderRadius: 5,
        padding: '2px 7px',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        textTransform: 'uppercase',
        letterSpacing: '0.4px',
      }}
    >
      {label}
    </span>
  )
}

function CourseTag({ course }) {
  if (!course) return null
  return (
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
  )
}

function RowShell({ task, children }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 20px',
        borderBottom: '1px solid var(--line)',
        background: 'transparent',
        borderLeft: '2px solid transparent',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <Checkbox completed={task.completed} />
      {children}
    </div>
  )
}

function Title({ name, completed }) {
  return (
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
  )
}

function DateLabel({ date, time }) {
  const label = formatDate(date, time)
  if (!label) return null
  return (
    <span
      style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 11,
        color: 'var(--dim)',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        letterSpacing: '0.2px',
      }}
    >
      {label}
    </span>
  )
}

function LocationChip({ location, link }) {
  if (!location) return null
  const isZoom = /zoom/i.test(location)
  const inner = (
    <span
      style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 10.5,
        color: isZoom ? '#7dd3fc' : 'var(--dim)',
        background: isZoom ? 'rgba(125,211,252,0.08)' : 'var(--surface-2)',
        border: `1px solid ${isZoom ? 'rgba(125,211,252,0.25)' : 'var(--line)'}`,
        borderRadius: 5,
        padding: '2px 7px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {isZoom && <Video size={10} strokeWidth={2} />}
      {location}
    </span>
  )
  if (link && isZoom) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
        {inner}
      </a>
    )
  }
  return inner
}

export default function TaskRow({ task }) {
  const { category, type, name, date, time, course, location, link, completed } = task

  if (category === 'academic') {
    const typeStyle = typeStyles[type] || typeStyles.HW
    return (
      <RowShell task={task}>
        <CourseTag course={course} />
        <Chip label={type} color={typeStyle.color} bg={typeStyle.background} />
        <Title name={name} completed={completed} />
        <DateLabel date={date} time={time} />
      </RowShell>
    )
  }

  if (category === 'meeting') {
    const chip = categoryChipStyles.meeting
    return (
      <RowShell task={task}>
        <Chip label={chip.label} color={chip.color} bg={chip.bg} />
        <Title name={name} completed={completed} />
        <LocationChip location={location} link={link} />
        <DateLabel date={date} time={time} />
      </RowShell>
    )
  }

  if (category === 'study') {
    const chip = categoryChipStyles.study
    return (
      <RowShell task={task}>
        <Chip label={chip.label} color={chip.color} bg={chip.bg} />
        <Title name={name} completed={completed} />
        <CourseTag course={course} />
        <DateLabel date={date} time={time} />
      </RowShell>
    )
  }

  // personal
  const chip = categoryChipStyles.personal
  return (
    <RowShell task={task}>
      <Chip label={chip.label} color={chip.color} bg={chip.bg} />
      <Title name={name} completed={completed} />
      <LocationChip location={location} link={link} />
      <DateLabel date={date} time={time} />
    </RowShell>
  )
}
