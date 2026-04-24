import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Layout/Sidebar'
import AgentFab from './components/Layout/AgentFab'
import AgentPanel from './components/Layout/AgentPanel'
import TodayPage from './components/Today/TodayPage'
import TasksPage from './components/Tasks/TasksPage'
import TaskModal from './components/Tasks/TaskModal'

function Toast({ message }) {
  if (!message) return null
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 90,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--surface-2)',
        border: '1px solid rgba(109,214,156,0.4)',
        color: 'var(--good)',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 12,
        padding: '8px 18px',
        borderRadius: 8,
        zIndex: 100,
        whiteSpace: 'nowrap',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        animation: 'toastIn 0.18s ease',
      }}
    >
      <style>{`
        @keyframes toastIn {
          from { transform: translateX(-50%) translateY(8px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
      `}</style>
      {message}
    </div>
  )
}

export default function App() {
  const [tasks, setTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('planner_tasks') || '[]') }
    catch { return [] }
  })
  const [conversation, setConversation] = useState(() => {
    try { return JSON.parse(localStorage.getItem('planner_conversation') || '[]') }
    catch { return [] }
  })
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [agentOpen, setAgentOpen] = useState(false)
  const [agentMode, setAgentMode] = useState('sidebar')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    localStorage.setItem('planner_tasks', JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    localStorage.setItem('planner_conversation', JSON.stringify(conversation))
  }, [conversation])

  function addTasks(newTasks) {
    setTasks(prev => [
      ...prev,
      ...newTasks.map((t, i) => ({ ...t, id: Date.now() + i, completed: false })),
    ])
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  function handleNewTask(taskData) {
    addTasks([taskData])
  }

  return (
    <BrowserRouter>
      <div
        style={{
          display: 'flex',
          height: '100vh',
          overflow: 'hidden',
          background: 'var(--bg)',
        }}
      >
        <Sidebar />

        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            position: 'relative',
          }}
        >
          <Routes>
            <Route
              path="/"
              element={<TodayPage tasks={tasks} onNewTask={() => setTaskModalOpen(true)} />}
            />
            <Route
              path="/tasks"
              element={
                <TasksPage
                  tasks={tasks}
                  onNewTask={() => setTaskModalOpen(true)}
                  onOpenAgent={() => setAgentOpen(true)}
                />
              }
            />
          </Routes>
        </main>

        {agentOpen && (
          <AgentPanel
            mode={agentMode}
            onModeChange={setAgentMode}
            onClose={() => setAgentOpen(false)}
            conversation={conversation}
            setConversation={setConversation}
            tasks={tasks}
            onAddTasks={addTasks}
            showToast={showToast}
          />
        )}

        <AgentFab onToggle={() => setAgentOpen(o => !o)} />
      </div>

      <TaskModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onAdd={handleNewTask}
      />

      <Toast message={toast} />
    </BrowserRouter>
  )
}
