import { computeGroup, formatDate, getTodayISO } from '../../utils/dateUtils'
import Logo from '../Logo'
import { useNavigate } from 'react-router-dom'

function formatTodayHeader() {
  const [y, m, d] = getTodayISO().split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export default function TodayPage({ tasks = [], onNewTask, onOpenAgent }) {
  const navigate = useNavigate()
  const todayTasks = tasks.filter(t => computeGroup(t.date) === 'today')
  const focusTask = todayTasks.find(t => !t.completed)
  const alsoToday = focusTask ? todayTasks.filter(t => t.id !== focusTask.id) : []
  const todayDoneOnly = !focusTask && todayTasks.length > 0 ? todayTasks : []
  const weekendTasks = tasks.filter(t => computeGroup(t.date) === 'weekend').slice(0, 2)
  const activeCount = todayTasks.filter(t => !t.completed).length
  const oneThingToday = activeCount === 1 && !!focusTask

  if (todayTasks.length === 0) {
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
            Nothing to focus on yet.
          </div>
          <div
            style={{
              fontSize: 14,
              color: 'var(--dim)',
              fontFamily: 'Inter, sans-serif',
              lineHeight: 1.55,
            }}
          >
            Add a task to see your focus for today.
          </div>
        </div>
        <button
          onClick={onNewTask}
          style={{
            background: 'var(--accent)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 8,
            padding: '9px 22px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            marginTop: 4,
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
            padding: '9px 18px',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            marginTop: 2,
          }}
        >
          Ask Task Copilot to plan
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: 'clamp(28px, 4vw, 48px) clamp(20px, 4.6vw, 52px)', maxWidth: 860, width: '100%', margin: '0 auto' }}>
      {/* Eyebrow */}
      <div
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11,
          color: 'var(--dim)',
          letterSpacing: '0.4px',
          marginBottom: 12,
          textTransform: 'uppercase',
        }}
      >
        {formatTodayHeader()}
      </div>

      {/* H1 */}
      <h1
        style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 34,
          fontWeight: 400,
          color: 'var(--text)',
          letterSpacing: '-0.6px',
          lineHeight: 1.2,
          marginBottom: 40,
        }}
      >
        {activeCount === 0 && todayTasks.length > 0 ? (
          <>
            You&apos;re all set — <em style={{ fontStyle: 'italic' }}>nothing</em> left that needs you today.
          </>
        ) : oneThingToday ? (
          <>
            <em style={{ fontStyle: 'italic' }}>This</em> is the thing that matters today.
          </>
        ) : (
          <>
            Good morning. You have {activeCount}{' '}
            {activeCount === 1 ? 'thing' : 'things'} that{' '}
            <em style={{ fontStyle: 'italic' }}>{activeCount === 1 ? 'matters' : 'matter'}</em> today.
          </>
        )}
      </h1>

      {/* Focus section — single open task = what matters; several = first focus + “also” */}
      {focusTask && (
        <Section label={oneThingToday ? 'What matters today' : 'Focus'}>
          <div
            onClick={() => navigate('/tasks')}
            style={{
              background: 'var(--surface)',
              borderLeft: '3px solid var(--accent)',
              borderRadius: '0 10px 10px 0',
              border: '1px solid var(--line)',
              borderLeftWidth: 3,
              borderLeftColor: 'var(--accent)',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 10.5,
                  color: 'var(--accent)',
                  background: 'var(--accent-soft)',
                  border: '1px solid rgba(94,135,245,0.28)',
                  borderRadius: 5,
                  padding: '2px 8px',
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                }}
              >
                {focusTask.course || focusTask.category}
              </span>
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 10.5,
                  color: 'var(--urgent)',
                  background: 'rgba(240,107,107,0.1)',
                  borderRadius: 5,
                  padding: '2px 8px',
                  letterSpacing: '0.4px',
                }}
              >
                {formatDate(focusTask.date, focusTask.time)}
              </span>
            </div>
            <div
              style={{
                fontFamily: 'Fraunces, serif',
                fontSize: 22,
                fontWeight: 400,
                color: 'var(--text)',
                letterSpacing: '-0.3px',
                lineHeight: 1.3,
              }}
            >
              {focusTask.name}
            </div>
            <div
              style={{
                fontFamily: 'Fraunces, serif',
                fontStyle: 'italic',
                fontSize: 14,
                color: 'var(--dim)',
                lineHeight: 1.55,
              }}
            >
              {oneThingToday
              ? "Give it your best attention when you're ready."
              : "Due at 6 PM. Don't leave it for tonight."}
            </div>
          </div>
        </Section>
      )}

      {/* Also today / done-only list */}
      {todayDoneOnly.length > 0 && (
        <Section label="Today">
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            {todayDoneOnly.map((task, i) => (
              <SimpleRow key={task.id} task={task} isLast={i === todayDoneOnly.length - 1} onClick={() => navigate('/tasks')} />
            ))}
          </div>
        </Section>
      )}

      {alsoToday.length > 0 && (
        <Section label="Also today">
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            {alsoToday.map((task, i) => (
              <SimpleRow key={task.id} task={task} isLast={i === alsoToday.length - 1} onClick={() => navigate('/tasks')} />
            ))}
          </div>
        </Section>
      )}

      {/* Tomorrow / weekend preview */}
      {weekendTasks.length > 0 && (
        <Section label="Coming up">
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            {weekendTasks.map((task, i) => (
              <SimpleRow key={task.id} task={task} isLast={i === weekendTasks.length - 1} onClick={() => navigate('/tasks')} />
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 10,
          fontWeight: 500,
          color: 'var(--faint)',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          marginBottom: 12,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  )
}

function SimpleRow({ task, isLast, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 18px',
        borderBottom: isLast ? 'none' : '1px solid var(--line)',
        gap: 16,
        cursor: 'pointer',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--line-2)',
            flexShrink: 0,
          }}
        />
        {(task.course || task.category) && (
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
            }}
          >
            {task.course || task.category}
          </span>
        )}
        <span style={{ fontSize: 13.5, color: 'var(--text)' }}>{task.name}</span>
      </div>
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11,
          color: 'var(--dim)',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {formatDate(task.date, task.time)}
      </span>
    </div>
  )
}
