import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './components/Layout/Sidebar'
import AgentFab from './components/Layout/AgentFab'
import AgentPanel from './components/Layout/AgentPanel'
import TodayPage from './components/Today/TodayPage'
import TasksPage from './components/Tasks/TasksPage'
import TaskModal from './components/Tasks/TaskModal'
import ErrorBoundary from './components/ErrorBoundary'
import { migrateTasks } from './utils/migrationUtils'

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
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </ErrorBoundary>
  )
}

function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  function createConversation(seed = {}) {
    const now = new Date().toISOString()
    return {
      id: seed.id || crypto.randomUUID(),
      title: seed.title || 'New chat',
      messages: Array.isArray(seed.messages) ? seed.messages : [],
      createdAt: seed.createdAt || now,
      updatedAt: seed.updatedAt || now,
    }
  }

  const [tasks, setTasks] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('planner_tasks') || '[]')
      const migrated = migrateTasks(raw)
      if (migrated.some((t, i) => t !== raw[i])) {
        localStorage.setItem('planner_tasks', JSON.stringify(migrated))
      }
      return migrated
    } catch { return [] }
  })
  const [conversationStore, setConversationStore] = useState(() => {
    try {
      const multiRaw = JSON.parse(localStorage.getItem('planner_conversations') || 'null')
      if (multiRaw && Array.isArray(multiRaw.conversations) && multiRaw.conversations.length > 0) {
        const normalized = multiRaw.conversations.map(c => createConversation(c))
        const activeValid = normalized.some(c => c.id === multiRaw.activeConversationId)
        return {
          conversations: normalized,
          activeConversationId: activeValid ? multiRaw.activeConversationId : normalized[0].id,
        }
      }
    } catch { /* ignore */ }

    try {
      const legacy = JSON.parse(localStorage.getItem('planner_conversation') || '[]')
      if (Array.isArray(legacy) && legacy.length > 0) {
        const migrated = createConversation({
          title: 'Previous chat',
          messages: legacy,
        })
        return {
          conversations: [migrated],
          activeConversationId: migrated.id,
        }
      }
    } catch { /* ignore */ }

    const initial = createConversation()
    return {
      conversations: [initial],
      activeConversationId: initial.id,
    }
  })
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  /** When set, saving the modal updates that chat message’s preview only (no new row) unless the task is already in the list. */
  const [previewEditIndex, setPreviewEditIndex] = useState(null)
  const [previewEditConversationId, setPreviewEditConversationId] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [agentOpen, setAgentOpen] = useState(false)
  const [agentMode, setAgentMode] = useState('sidebar')
  const [toast, setToast] = useState(null)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 900)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 900)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    localStorage.setItem('planner_tasks', JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    localStorage.setItem('planner_conversations', JSON.stringify(conversationStore))
  }, [conversationStore])

  const activeConversation = conversationStore.conversations.find(c => c.id === conversationStore.activeConversationId)
    || conversationStore.conversations[0]
    || createConversation()
  const activeMessages = activeConversation?.messages || []

  function updateConversationById(conversationId, updater) {
    setConversationStore(prev => ({
      ...prev,
      conversations: prev.conversations.map(c => (c.id === conversationId ? updater(c) : c)),
    }))
  }

  function setActiveConversationMessages(messagesOrUpdater) {
    setConversationStore(prev => ({
      ...prev,
      conversations: prev.conversations.map(c => {
        if (c.id !== prev.activeConversationId) return c
        const nextMessages = typeof messagesOrUpdater === 'function'
          ? messagesOrUpdater(c.messages)
          : messagesOrUpdater
        return { ...c, messages: nextMessages, updatedAt: new Date().toISOString() }
      }),
    }))
  }

  function createNewConversation() {
    const next = createConversation()
    setConversationStore(prev => ({
      conversations: [next, ...prev.conversations],
      activeConversationId: next.id,
    }))
  }

  function setActiveConversation(conversationId) {
    setConversationStore(prev => ({ ...prev, activeConversationId: conversationId }))
  }

  function renameActiveConversation(nextTitle) {
    setConversationStore(prev => ({
      ...prev,
      conversations: prev.conversations.map(c =>
        c.id === prev.activeConversationId
          ? { ...c, title: nextTitle, updatedAt: new Date().toISOString() }
          : c
      ),
    }))
  }

  function deleteConversation(conversationId) {
    setConversationStore(prev => {
      const remaining = prev.conversations.filter(c => c.id !== conversationId)
      if (remaining.length === 0) {
        const fresh = createConversation()
        return { conversations: [fresh], activeConversationId: fresh.id }
      }
      const sorted = [...remaining].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      const nextActive = prev.activeConversationId === conversationId ? sorted[0].id : prev.activeConversationId
      return { conversations: remaining, activeConversationId: nextActive }
    })
  }

  function addTasks(newTasks) {
    setTasks(prev => [
      ...prev,
      ...newTasks.map(t => ({ ...t, id: t.id || crypto.randomUUID() })),
    ])
  }

  function handleEditTask(task, messageIndex, conversationId) {
    setEditingTask(task)
    setPreviewEditIndex(typeof messageIndex === 'number' ? messageIndex : null)
    setPreviewEditConversationId(conversationId || null)
    setTaskModalOpen(true)
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  function handleNewTask(taskData) {
    if (previewEditIndex != null && previewEditConversationId) {
      updateConversationById(previewEditConversationId, (conversationObj) => {
        const next = conversationObj.messages.map((m, i) => {
          if (i !== previewEditIndex || !m.preview) return m
          const p = m.preview
          return { ...m, preview: { ...taskData, added: p.added } }
        })
        return { ...conversationObj, messages: next, updatedAt: new Date().toISOString() }
      })
      if (tasks.some(t => t.id === taskData.id)) {
        setTasks(prev => prev.map(t => (t.id === taskData.id ? { ...t, ...taskData } : t)))
      }
    } else if (editingTask?.id && tasks.some(t => t.id === editingTask.id)) {
      setTasks(prev => prev.map(t => (t.id === taskData.id ? { ...t, ...taskData } : t)))
    } else {
      addTasks([taskData])
    }
  }

  function handleToggleTask(id) {
    setTasks(prev =>
      prev.map(t =>
        t.id === id
          ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : null }
          : t
      )
    )
  }

  function handleDeleteTask(id) {
    try {
      // Remove task from primary task list.
      setTasks(prev => prev.filter(t => t.id !== id))

      // Clear task references from edit context.
      if (editingTask?.id === id) {
        setEditingTask(null)
        setPreviewEditIndex(null)
        setPreviewEditConversationId(null)
        setTaskModalOpen(false)
      }

      // Remove stale references from conversation messages to avoid rendering stale task objects.
      setConversationStore(prev => ({
        ...prev,
        conversations: prev.conversations.map(conv => {
          const nextMessages = (conv.messages || []).map(msg => {
            let next = msg
            if (msg?.preview?.id === id) {
              next = { ...next, preview: null }
            }
            if (msg?.action?.tasks?.length) {
              const remainingTasks = msg.action.tasks.filter(t => t?.id !== id)
              next = {
                ...next,
                action: {
                  ...msg.action,
                  tasks: remainingTasks,
                  ...(remainingTasks.length === 0 ? { added: true } : {}),
                },
              }
            }
            return next
          })
          return { ...conv, messages: nextMessages, updatedAt: new Date().toISOString() }
        }),
      }))
    } catch (error) {
      console.error('Delete task failed:', error)
      showToast('Could not delete task')
    }
  }

  function handleUpdateTask(id, patch) {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)))
  }

  const mobileNavHeight = 62

  return (
    <>
      <div
        style={{
          display: 'flex',
          height: '100vh',
          overflow: 'hidden',
          background: 'var(--bg)',
        }}
      >
        {!isMobile && (
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(v => !v)}
          />
        )}

        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            position: 'relative',
            background: 'linear-gradient(180deg, #1f1f1f 0%, var(--bg) 60%)',
            paddingBottom: isMobile ? mobileNavHeight + 14 : 0,
          }}
        >
          <Routes>
            <Route
              path="/"
              element={
                <TodayPage
                  tasks={tasks}
                  onOpenAgent={() => setAgentOpen(true)}
                  onNewTask={() => {
                    setEditingTask(null)
                    setPreviewEditIndex(null)
                    setTaskModalOpen(true)
                  }}
                />
              }
            />
            <Route
              path="/tasks"
              element={
                <TasksPage
                  tasks={tasks}
                  onToggleTask={handleToggleTask}
                  onDeleteTask={handleDeleteTask}
                  onEditTask={task => handleEditTask(task)}
                  onNewTask={() => {
                    setEditingTask(null)
                    setPreviewEditIndex(null)
                    setTaskModalOpen(true)
                  }}
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
            conversation={activeMessages}
            conversations={conversationStore.conversations}
            activeConversationId={conversationStore.activeConversationId}
            setConversation={setActiveConversationMessages}
            onSetActiveConversation={setActiveConversation}
            onCreateConversation={createNewConversation}
            onDeleteConversation={deleteConversation}
            onRenameActiveConversation={renameActiveConversation}
            tasks={tasks}
            onAddTasks={addTasks}
            onEditTask={handleEditTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            onUpdateTask={handleUpdateTask}
            showToast={showToast}
          />
        )}

        {!agentOpen && (
          <AgentFab onToggle={() => setAgentOpen(o => !o)} />
        )}

        {isMobile && (
          <nav
            style={{
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              height: mobileNavHeight,
              background: 'rgba(20,20,20,0.95)',
              borderTop: '1px solid var(--line)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              zIndex: 45,
              backdropFilter: 'blur(6px)',
            }}
          >
            <button
              onClick={() => navigate('/')}
              style={{
                border: 'none',
                background: location.pathname === '/' ? 'rgba(255,255,255,0.06)' : 'transparent',
                color: location.pathname === '/' ? 'var(--text)' : 'var(--dim)',
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Today
            </button>
            <button
              onClick={() => navigate('/tasks')}
              style={{
                border: 'none',
                background: location.pathname === '/tasks' ? 'rgba(255,255,255,0.06)' : 'transparent',
                color: location.pathname === '/tasks' ? 'var(--text)' : 'var(--dim)',
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Tasks
            </button>
          </nav>
        )}
      </div>

      <TaskModal
        open={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false)
          setEditingTask(null)
          setPreviewEditIndex(null)
          setPreviewEditConversationId(null)
        }}
        onAdd={handleNewTask}
        initialData={editingTask}
      />

      <Toast message={toast} />
    </>
  )
}
