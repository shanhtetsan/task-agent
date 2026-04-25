import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import TaskGroup from './TaskGroup'
import { computeGroup, getTodayISO } from '../../utils/dateUtils'
import Logo from '../Logo'

const groups = [
  { key: 'today', label: 'Today' },
  { key: 'weekend', label: 'This week' },
  { key: 'next-week', label: 'Next week' },
  { key: 'future', label: 'Later' },
]

const CATEGORY_OPTIONS = ['all', 'coursework', 'event', 'personal']

function toISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function monthName(d) {
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' })
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function shiftMonth(d, diff) {
  return new Date(d.getFullYear(), d.getMonth() + diff, 1)
}

function buildCalendarCells(monthDate) {
  const y = monthDate.getFullYear()
  const m = monthDate.getMonth()
  const first = new Date(y, m, 1)
  const startOffset = first.getDay() // Sun=0
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export default function TasksPage({ tasks = [], onNewTask, onOpenAgent, onToggleTask, onEditTask, onDeleteTask }) {
  const [viewMode, setViewMode] = useState('week')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()))
  const [selectedDate, setSelectedDate] = useState(null)

  const dateTaskCount = useMemo(() => {
    const map = new Map()
    for (const t of tasks) {
      if (!t.date) continue
      map.set(t.date, (map.get(t.date) || 0) + 1)
    }
    return map
  }, [tasks])

  const filteredTasks = useMemo(() => {
    const today = getTodayISO()
    const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`
    return tasks.filter(t => {
      if (statusFilter === 'open' && t.completed) return false
      if (statusFilter === 'done' && !t.completed) return false
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false
      if (selectedDate && t.date !== selectedDate) return false

      if (viewMode === 'week') {
        const g = computeGroup(t.date)
        return g === 'today' || g === 'weekend' || g === 'next-week' || g === 'future'
      }
      if (viewMode === 'month') {
        if (!t.date) return false
        return t.date.startsWith(monthKey)
      }
      if (viewMode === 'all') {
        if (!t.date) return true
        return t.date >= today
      }
      return true
    })
  }, [tasks, statusFilter, categoryFilter, selectedDate, viewMode, monthDate])

  const calendarCells = useMemo(() => buildCalendarCells(monthDate), [monthDate])

  const hasVisibleTasks = filteredTasks.length > 0

  if (tasks.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 52px',
          gap: 16,
          paddingBottom: 80,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'var(--accent-soft)',
            border: '1px solid rgba(94,135,245,0.28)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Logo variant="large" size={48} />
        </div>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            style={{
              fontFamily: 'Fraunces, serif',
              fontSize: 26,
              fontWeight: 400,
              color: 'var(--text)',
              letterSpacing: '-0.4px',
            }}
          >
            Your week is clear.
          </div>
          <div
            style={{
              fontSize: 14,
              color: 'var(--dim)',
              fontFamily: 'Inter, sans-serif',
              lineHeight: 1.55,
              maxWidth: 320,
            }}
          >
            Add your first task or ask the agent to add one for you.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button
            onClick={onNewTask}
            style={{
              background: 'var(--accent)',
              color: '#0e0e1a',
              border: 'none',
              borderRadius: 8,
              padding: '9px 22px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            New task
          </button>
          <button
            onClick={onOpenAgent}
            style={{
              background: 'transparent',
              color: 'var(--dim)',
              border: '1px solid var(--line-2)',
              borderRadius: 8,
              padding: '9px 22px',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
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
            <Sparkles size={14} strokeWidth={1.8} />
            Open agent
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        padding: 'clamp(28px, 3.6vw, 42px) clamp(20px, 4vw, 46px) clamp(34px, 5vw, 52px)',
        maxWidth: 1160,
        width: '100%',
        margin: '0 auto',
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 30,
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 14,
          padding: '18px 20px',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              color: 'var(--dim)',
              letterSpacing: '0.4px',
              marginBottom: 8,
              textTransform: 'uppercase',
            }}
          >
            Workspace
          </div>
          <h1
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 31,
              fontWeight: 650,
              color: 'var(--text)',
              letterSpacing: '-0.5px',
              lineHeight: 1.18,
            }}
          >
            Your tasks
          </h1>
        </div>

        {/* View controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 2 }}>
          <div
            style={{
              display: 'flex',
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              borderRadius: 8,
              padding: 2,
              gap: 2,
            }}
          >
            {['week', 'month', 'all'].map(key => (
              <button
                key={key}
                onClick={() => setViewMode(key)}
                style={{
                  background: viewMode === key ? 'var(--surface)' : 'transparent',
                  border: viewMode === key ? '1px solid var(--line)' : '1px solid transparent',
                  borderRadius: 6,
                  padding: '5px 12px',
                  fontSize: 11.5,
                  color: viewMode === key ? 'var(--text)' : 'var(--dim)',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  transition: 'all 0.15s',
                }}
              >
                {key[0].toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={onNewTask}
            style={{
              background: 'var(--accent)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '7px 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            + New task
          </button>
        </div>
      </div>

      {/* Filters + content */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 290px', gap: 20, alignItems: 'start' }}>
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 16,
            }}
          >
            {['open', 'done', 'all'].map(key => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                style={{
                  border: '1px solid var(--line)',
                  background: statusFilter === key ? 'var(--surface)' : 'var(--surface-2)',
                  color: statusFilter === key ? 'var(--text)' : 'var(--dim)',
                  borderRadius: 8,
                  padding: '5px 10px',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                {key === 'open' ? 'Open' : key === 'done' ? 'Done' : 'All status'}
              </button>
            ))}

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              style={{
                border: '1px solid var(--line)',
                background: 'var(--surface)',
                color: 'var(--text)',
                borderRadius: 8,
                padding: '6px 10px',
                fontSize: 12,
                outline: 'none',
              }}
            >
              {CATEGORY_OPTIONS.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All categories' : cat[0].toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>

            {selectedDate && (
              <button
                onClick={() => setSelectedDate(null)}
                style={{
                  border: '1px solid var(--line)',
                  background: 'var(--surface)',
                  color: 'var(--dim)',
                  borderRadius: 8,
                  padding: '5px 10px',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Clear date filter
              </button>
            )}
          </div>

          {hasVisibleTasks ? (
            groups.map(({ key, label }) => {
              const groupTasks = filteredTasks
                .filter(t => computeGroup(t.date) === key)
                .sort((a, b) => {
                  if (a.completed === b.completed) return 0
                  return a.completed ? 1 : -1
                })
              if (groupTasks.length === 0) return null
              return (
                <TaskGroup
                  key={key}
                  label={label}
                  tasks={groupTasks}
                  onToggleTask={onToggleTask}
                  onEditTask={onEditTask}
                  onDeleteTask={onDeleteTask}
                />
              )
            })
          ) : (
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 12,
                padding: '24px 20px',
                color: 'var(--dim)',
                fontSize: 14,
              }}
            >
              No tasks match your current filters.
            </div>
          )}
        </div>

        {/* Mini calendar */}
        <aside
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            padding: '12px 12px 14px',
            position: 'sticky',
            top: 18,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <button
              onClick={() => setMonthDate(prev => shiftMonth(prev, -1))}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--dim)' }}
            >
              <ChevronLeft size={15} />
            </button>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>{monthName(monthDate)}</div>
            <button
              onClick={() => setMonthDate(prev => shiftMonth(prev, 1))}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--dim)' }}
            >
              <ChevronRight size={15} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 6 }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'var(--faint)' }}>
                {d}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
            {calendarCells.map((cell, idx) => {
              if (!cell) return <div key={`empty-${idx}`} style={{ height: 30 }} />
              const iso = toISO(cell)
              const isSelected = selectedDate === iso
              const isToday = iso === getTodayISO()
              const hasTasks = dateTaskCount.get(iso)
              return (
                <button
                  key={iso}
                  onClick={() => setSelectedDate(prev => (prev === iso ? null : iso))}
                  style={{
                    height: 30,
                    borderRadius: 7,
                    border: isSelected ? '1px solid var(--accent)' : '1px solid transparent',
                    background: isSelected ? 'rgba(79,124,255,0.12)' : isToday ? 'var(--surface-2)' : 'transparent',
                    color: isSelected ? 'var(--accent)' : 'var(--text)',
                    fontSize: 12,
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  {cell.getDate()}
                  {hasTasks ? (
                    <span
                      style={{
                        position: 'absolute',
                        right: 4,
                        bottom: 4,
                        width: 4,
                        height: 4,
                        borderRadius: 999,
                        background: 'var(--accent)',
                      }}
                    />
                  ) : null}
                </button>
              )
            })}
          </div>
        </aside>
      </div>
    </div>
  )
}
