function pad(n) {
  return String(n).padStart(2, '0')
}

function asDate(value) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function datePart(d) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
}

function dateTimePart(d) {
  return `${datePart(d)}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

export function buildCalendarLink(task) {
  const base = 'https://calendar.google.com/calendar/r/eventedit'
  const title = task?.name || 'Task'
  const details = task?.notes || `Created from Task Agent: ${title}`
  const location = task?.location || ''

  let dates = ''
  if (task?.date && task?.time) {
    const start = asDate(`${task.date}T${task.time}:00`)
    const end = start ? new Date(start.getTime() + 60 * 60 * 1000) : null
    if (start && end) dates = `${dateTimePart(start)}/${dateTimePart(end)}`
  } else if (task?.date) {
    const start = asDate(`${task.date}T00:00:00`)
    const end = start ? new Date(start.getTime() + 24 * 60 * 60 * 1000) : null
    if (start && end) dates = `${datePart(start)}/${datePart(end)}`
  }

  const params = [
    `text=${encodeURIComponent(title)}`,
    `details=${encodeURIComponent(details)}`,
    `location=${encodeURIComponent(location)}`,
    `dates=${encodeURIComponent(dates)}`,
  ]

  return `${base}?${params.join('&')}`
}

export function buildGmailLink({ to, subject, body }) {
  const base = 'https://mail.google.com/mail/?view=cm&fs=1'
  const params = [
    `to=${encodeURIComponent(to || '')}`,
    `su=${encodeURIComponent(subject || '')}`,
    `body=${encodeURIComponent(body || '')}`,
  ]
  return `${base}&${params.join('&')}`
}

export function buildTaskEmailDraft(task = {}) {
  const name = task.name || 'Task'
  const dateText = task.date ? new Date(`${task.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null
  const timeText = task.time
    ? (() => {
        const [h, m] = String(task.time).split(':').map(Number)
        if (Number.isNaN(h) || Number.isNaN(m)) return null
        const ampm = h >= 12 ? 'pm' : 'am'
        const hour12 = h % 12 || 12
        return `${hour12}${m ? `:${pad(m)}` : ''}${ampm}`
      })()
    : null

  if (task.category === 'event') {
    const subject = `Confirming: ${name}`
    const body = `Hi, just confirming our ${name}${dateText ? ` on ${dateText}` : ''}${timeText ? ` at ${timeText}` : ''}.${task.location ? ` ${task.location}.` : ''}`
    return { subject, body }
  }

  if (task.category === 'coursework') {
    const subject = `Question about ${task.course || 'course'} — ${name}`
    const body = `Hi, I'm working on ${name}${task.course ? ` for ${task.course}` : ''}. Could you help me with...`
    return { subject, body }
  }

  return {
    subject: name,
    body: `Reminder: ${name}${dateText ? ` on ${dateText}` : ''}.`,
  }
}
