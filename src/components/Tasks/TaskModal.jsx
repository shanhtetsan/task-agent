import { useState, useEffect } from 'react'
import { X, ChevronDown, ChevronUp } from 'lucide-react'

const CATEGORY_TYPES = {
  coursework: ['HW', 'Lab', 'Exam', 'Reading', 'Project'],
  event: ['Meeting', 'Office hours', 'Class', 'Other'],
  personal: ['Study', 'Errand', 'Other'],
}

const CATEGORIES = ['coursework', 'event', 'personal']
const CATEGORY_LABELS = { coursework: 'Coursework', event: 'Event', personal: 'Personal' }

const inputStyle = {
  width: '100%',
  background: 'var(--surface-2)',
  border: '1px solid var(--line-2)',
  borderRadius: 8,
  padding: '10px 13px',
  fontSize: 13.5,
  color: 'var(--text)',
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
}

export default function TaskModal({ open, onClose, onAdd, initialData }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('coursework')
  const [type, setType] = useState('HW')
  const [course, setCourse] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [link, setLink] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [showMore, setShowMore] = useState(false)

  useEffect(() => {
    if (!open) {
      setName('')
      setCategory('coursework')
      setType('HW')
      setCourse('')
      setDate('')
      setTime('')
      setLocation('')
      setLink('')
      setEmail('')
      setNotes('')
      setShowMore(false)
    } else if (initialData) {
      setName(initialData.name || '')
      const initialCategory = initialData.category || 'coursework'
      setCategory(initialCategory)
      setType(initialData.type || CATEGORY_TYPES[initialCategory]?.[0] || 'HW')
      setCourse(initialData.course || '')
      setDate(initialData.date || '')
      setTime(initialData.time || '')
      setLocation(initialData.location || '')
      setLink(initialData.link || '')
      setEmail(initialData.email || '')
      setNotes(initialData.notes || '')
      setShowMore(!!(initialData.location || initialData.link || initialData.email || initialData.notes))
    }
  }, [open, initialData])

  useEffect(() => {
    const validTypes = CATEGORY_TYPES[category]
    if (!validTypes.includes(type)) setType(validTypes[0])
  }, [category])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !date) return
    onAdd({
      id: initialData?.id || crypto.randomUUID(),
      name: name.trim(),
      category,
      type,
      course: category === 'coursework' ? (course.trim() || null) : null,
      date,
      time: time || null,
      location: location.trim() || null,
      link: link.trim() || null,
      email: email.trim() || null,
      notes: notes.trim() || null,
      completed: initialData?.completed ?? false,
      completedAt: initialData?.completedAt ?? null,
      source: initialData?.source ?? 'manual',
    })
    onClose()
  }

  const types = CATEGORY_TYPES[category]
  const isEditing = !!initialData?.id

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 14,
          width: 440,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px 28px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          boxShadow: '0 14px 38px rgba(0,0,0,0.32)',
          animation: 'modalIn 0.18s ease',
        }}
      >
        <style>{`
          @keyframes modalIn {
            from { transform: translateY(10px) scale(0.98); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
          }
        `}</style>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              fontFamily: 'Fraunces, serif',
              fontSize: 18,
              fontWeight: 500,
              color: 'var(--text)',
              letterSpacing: '-0.2px',
            }}
          >
            {isEditing ? 'Edit task' : 'New task'}
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--dim)',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--dim)')}
          >
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Task name */}
          <Field label="Task name">
            <input
              autoFocus
              type="text"
              placeholder="e.g. Physics lab 11"
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--line-2)')}
            />
          </Field>

          {/* Category */}
          <Field label="Category">
            <div style={{ display: 'flex', gap: 6 }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  style={{
                    flex: 1,
                    background: category === cat ? 'var(--accent-soft)' : 'var(--surface-2)',
                    border: category === cat ? '1px solid rgba(94,135,245,0.35)' : '1px solid var(--line-2)',
                    borderRadius: 7,
                    padding: '7px 0',
                    fontSize: 11.5,
                    color: category === cat ? 'var(--accent)' : 'var(--dim)',
                    cursor: 'pointer',
                    fontFamily: '"JetBrains Mono", monospace',
                    transition: 'all 0.15s',
                  }}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </Field>

          {/* Type — only show when there are multiple options */}
          {types.length > 1 && (
            <Field label="Type">
              <div style={{ display: 'flex', gap: 8 }}>
                {types.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    style={{
                      flex: 1,
                      background: type === t ? 'var(--accent-soft)' : 'var(--surface-2)',
                      border: type === t ? '1px solid rgba(94,135,245,0.35)' : '1px solid var(--line-2)',
                      borderRadius: 7,
                      padding: '7px 0',
                      fontSize: 12,
                      color: type === t ? 'var(--accent)' : 'var(--dim)',
                      cursor: 'pointer',
                      fontFamily: '"JetBrains Mono", monospace',
                      transition: 'all 0.15s',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Field>
          )}

          {/* Course — coursework only */}
          {category === 'coursework' && (
            <Field label="Course">
              <input
                type="text"
                placeholder="e.g. PHY 215"
                value={course}
                onChange={e => setCourse(e.target.value)}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--line-2)')}
              />
            </Field>
          )}

          {/* Date + Time row */}
          <div style={{ display: 'flex', gap: 10 }}>
            <Field label="Date" style={{ flex: 1 }}>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                style={{ ...inputStyle, colorScheme: 'dark' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--line-2)')}
              />
            </Field>
            <Field label="Time (opt.)" style={{ flex: 1 }}>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                style={{ ...inputStyle, colorScheme: 'dark' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--line-2)')}
              />
            </Field>
          </div>

          {/* More options toggle */}
          <button
            type="button"
            onClick={() => setShowMore(v => !v)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--dim)',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10.5,
              letterSpacing: '0.3px',
              padding: '2px 0',
              textTransform: 'uppercase',
              transition: 'color 0.15s',
              alignSelf: 'flex-start',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--dim)')}
          >
            {showMore ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showMore ? 'Fewer options' : 'More options'}
          </button>

          {showMore && (
            <>
              <Field label="Location (opt.)">
                <input
                  type="text"
                  placeholder="e.g. Room 402, Zoom, Prof's office"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--line-2)')}
                />
              </Field>
              <Field label="Link (opt.)">
                <input
                  type="url"
                  placeholder="https://zoom.us/j/..."
                  value={link}
                  onChange={e => setLink(e.target.value)}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--line-2)')}
                />
              </Field>
              <Field label="Email (opt.)">
                <input
                  type="email"
                  placeholder="professor@cuny.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--line-2)')}
                />
              </Field>
              <Field label="Notes (opt.)">
                <textarea
                  placeholder="Any additional context..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--line-2)')}
                />
              </Field>
            </>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid var(--line-2)',
                borderRadius: 8,
                padding: '8px 20px',
                fontSize: 13,
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
              Cancel
            </button>
            <button
              type="submit"
              style={{
                background: (name.trim() && date) ? 'var(--accent)' : 'var(--surface-2)',
                color: (name.trim() && date) ? '#0e0e1a' : 'var(--faint)',
                border: 'none',
                borderRadius: 8,
                padding: '8px 20px',
                fontSize: 13,
                fontWeight: 600,
                cursor: (name.trim() && date) ? 'pointer' : 'default',
                fontFamily: 'Inter, sans-serif',
                transition: 'all 0.15s',
              }}
            >
              {isEditing ? 'Save task' : 'Add task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      <label
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 10.5,
          color: 'var(--dim)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}
