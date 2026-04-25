import { Sparkles } from 'lucide-react'
import TaskGroup from './TaskGroup'
import { computeGroup } from '../../utils/dateUtils'

const groups = [
  { key: 'today', label: 'Today' },
  { key: 'weekend', label: 'This weekend' },
  { key: 'next-week', label: 'Next week' },
]

export default function TasksPage({ tasks = [], onNewTask, onOpenAgent }) {
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
            background: 'rgba(139,135,255,0.12)',
            border: '1px solid rgba(139,135,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Sparkles size={22} color="var(--accent)" strokeWidth={1.8} />
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
    <div style={{ padding: '48px 52px', maxWidth: 860, width: '100%' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40 }}>
        <div>
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
              color: 'var(--dim)',
              letterSpacing: '0.4px',
              marginBottom: 10,
              textTransform: 'uppercase',
            }}
          >
            Overview
          </div>
          <h1
            style={{
              fontFamily: 'Fraunces, serif',
              fontSize: 38,
              fontWeight: 400,
              color: 'var(--text)',
              letterSpacing: '-0.8px',
              lineHeight: 1.15,
            }}
          >
            Your <em style={{ fontStyle: 'italic' }}>week</em>
          </h1>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 8 }}>
          <div
            style={{
              display: 'flex',
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 8,
              padding: 3,
              gap: 2,
            }}
          >
            {['Week', 'Month', 'All'].map((label, i) => (
              <button
                key={label}
                style={{
                  background: i === 0 ? 'var(--surface-2)' : 'transparent',
                  border: i === 0 ? '1px solid var(--line-2)' : '1px solid transparent',
                  borderRadius: 6,
                  padding: '5px 13px',
                  fontSize: 12,
                  color: i === 0 ? 'var(--text)' : 'var(--dim)',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 450,
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={onNewTask}
            style={{
              background: 'var(--accent)',
              color: '#0e0e1a',
              border: 'none',
              borderRadius: 8,
              padding: '6px 16px',
              fontSize: 12.5,
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

      {/* Task groups */}
      {groups.map(({ key, label }) => {
        const groupTasks = tasks.filter(t => computeGroup(t.date) === key)
        if (groupTasks.length === 0) return null
        return <TaskGroup key={key} label={label} tasks={groupTasks} />
      })}
    </div>
  )
}
