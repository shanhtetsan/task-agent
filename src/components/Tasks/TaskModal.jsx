import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const COURSE_SUGGESTIONS = ['CSC 211', 'PHY 215', 'Discrete Math', 'ENG 201']
const TYPES = ['HW', 'Lab', 'Reading', 'Exam']

function inferGroup(due) {
  const d = due.toLowerCase()
  if (d.includes('today') || d.includes('tonight')) return 'today'
  if (d.includes('sat') || d.includes('sun')) return 'weekend'
  return 'next-week'
}

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
}

export default function TaskModal({ open, onClose, onAdd }) {
  const [name, setName] = useState('')
  const [course, setCourse] = useState('')
  const [type, setType] = useState('HW')
  const [due, setDue] = useState('')

  useEffect(() => {
    if (!open) {
      setName('')
      setCourse('')
      setType('HW')
      setDue('')
    }
  }, [open])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({
      course: course.trim() || 'General',
      type,
      name: name.trim(),
      due: due.trim() || 'TBD',
      group: inferGroup(due),
      urgent: false,
    })
    onClose()
  }

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
          width: 420,
          padding: '28px 28px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
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
            New task
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
              placeholder="e.g. Problem set 3 — kinematics"
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--line-2)')}
            />
          </Field>

          {/* Course */}
          <Field label="Course">
            <input
              type="text"
              placeholder="e.g. CSC 211"
              list="course-suggestions"
              value={course}
              onChange={e => setCourse(e.target.value)}
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--line-2)')}
            />
            <datalist id="course-suggestions">
              {COURSE_SUGGESTIONS.map(c => <option key={c} value={c} />)}
            </datalist>
          </Field>

          {/* Type */}
          <Field label="Type">
            <div style={{ display: 'flex', gap: 8 }}>
              {TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  style={{
                    flex: 1,
                    background: type === t ? 'rgba(139,135,255,0.15)' : 'var(--surface-2)',
                    border: type === t ? '1px solid rgba(139,135,255,0.4)' : '1px solid var(--line-2)',
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

          {/* Due date */}
          <Field label="Due date">
            <input
              type="text"
              placeholder="e.g. Tuesday 2pm, Saturday, today"
              value={due}
              onChange={e => setDue(e.target.value)}
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--line-2)')}
            />
          </Field>

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
                background: name.trim() ? 'var(--accent)' : 'var(--surface-2)',
                color: name.trim() ? '#0e0e1a' : 'var(--faint)',
                border: 'none',
                borderRadius: 8,
                padding: '8px 20px',
                fontSize: 13,
                fontWeight: 600,
                cursor: name.trim() ? 'pointer' : 'default',
                fontFamily: 'Inter, sans-serif',
                transition: 'all 0.15s',
              }}
            >
              Add task
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
