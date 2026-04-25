import TaskRow from './TaskRow'

export default function TaskGroup({ label, tasks, onToggleTask, onEditTask, onDeleteTask }) {
  return (
    <div style={{ marginBottom: 20 }}>
      {/* Group header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2px 8px',
          borderBottom: '1px solid var(--line)',
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--faint)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
        <span
          style={{
            color: 'var(--faint)',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11,
            letterSpacing: '0.02em',
          }}
        >
          {tasks.length} {tasks.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Task rows */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {tasks.map(task => (
          <TaskRow
            key={task.id}
            task={task}
            onToggleTask={onToggleTask}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
          />
        ))}
      </div>
    </div>
  )
}
