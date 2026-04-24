import { Sparkles } from 'lucide-react'

export default function TodayPage({ tasks = [], onNewTask }) {
  const todayTasks = tasks.filter(t => t.group === 'today')
  const focusTask = todayTasks.find(t => t.urgent && !t.completed)
  const alsoToday = todayTasks.filter(t => !t.urgent)
  const weekendTasks = tasks.filter(t => t.group === 'weekend').slice(0, 2)
  const activeCount = todayTasks.filter(t => !t.completed).length

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
            color: '#0e0e1a',
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
      </div>
    )
  }

  return (
    <div style={{ padding: '48px 52px', maxWidth: 820, width: '100%' }}>
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
        Friday, April 24
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
        Good morning. You have {activeCount}{' '}
        {activeCount === 1 ? 'thing' : 'things'} that{' '}
        <em style={{ fontStyle: 'italic' }}>matter</em> today.
      </h1>

      {/* Focus section */}
      {focusTask && (
        <Section label="Focus">
          <div
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
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 10.5,
                  color: 'var(--accent)',
                  background: 'rgba(139,135,255,0.12)',
                  border: '1px solid rgba(139,135,255,0.25)',
                  borderRadius: 5,
                  padding: '2px 8px',
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                }}
              >
                {focusTask.course}
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
                {focusTask.due}
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
              "Due at 6 PM. Don't leave it for tonight."
            </div>
          </div>
        </Section>
      )}

      {/* Also today section */}
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
              <SimpleRow key={task.id} task={task} isLast={i === alsoToday.length - 1} />
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
              <SimpleRow key={task.id} task={task} isLast={i === weekendTasks.length - 1} />
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

function SimpleRow({ task, isLast }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 18px',
        borderBottom: isLast ? 'none' : '1px solid var(--line)',
        gap: 16,
      }}
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
          {task.course}
        </span>
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
        {task.due}
      </span>
    </div>
  )
}
