import TaskRow from './TaskRow'

export default function TaskGroup({ label, tasks }) {
  return (
    <div style={{ marginBottom: 32 }}>
      {/* Group header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 20px 10px',
        }}
      >
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 10,
            fontWeight: 500,
            color: 'var(--faint)',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
          }}
        >
          {label}
        </span>
        <span
          style={{
            background: 'rgba(139,135,255,0.15)',
            color: 'var(--accent)',
            borderRadius: 999,
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 10,
            fontWeight: 500,
            padding: '1px 7px',
            letterSpacing: '0.3px',
          }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Task rows */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        {tasks.map(task => (
          <TaskRow key={task.id} task={task} />
        ))}
      </div>
    </div>
  )
}
