import { useRef, useEffect, useState } from 'react'
import { X, Maximize2, Minimize2, Send } from 'lucide-react'
import ChatMessage from '../Agent/ChatMessage'
import QuickReplies from '../Agent/QuickReplies'
import { classifyIntent, generateResponse } from '../../utils/agentUtils'

const EMPTY_CHIPS = ['What do I have today?', 'Help me plan my week', 'Quiz me on a topic']
const NORMAL_CHIPS = ['What do I have today?', "I'm stuck", 'Quiz me']

export default function AgentPanel({ mode, onModeChange, onClose, conversation, setConversation, tasks, onAddTasks, onEditTask, showToast }) {
  const messagesRef = useRef(null)
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [conversation, isTyping])

  function sendMessage(text) {
    const trimmed = text.trim()
    if (!trimmed) return

    const userMsg = { role: 'user', text: trimmed }
    const nextConv = [...conversation, userMsg]
    setConversation(nextConv)
    localStorage.setItem('planner_conversation', JSON.stringify(nextConv))
    setInputValue('')
    setIsTyping(true)

    setTimeout(() => {
      const intent = classifyIntent(trimmed, nextConv)
      const { text: respText, preview, action } = generateResponse(intent, trimmed, tasks, nextConv)
      const response = { role: 'assistant', text: respText, ...(preview ? { preview } : {}), ...(action ? { action } : {}) }
      const withResponse = [...nextConv, response]
      setConversation(withResponse)
      localStorage.setItem('planner_conversation', JSON.stringify(withResponse))
      setIsTyping(false)
    }, 800)
  }

  function handleAddFromAction(msgIndex) {
    const msg = conversation[msgIndex]
    if (!msg?.action?.tasks) return
    onAddTasks(msg.action.tasks)
    showToast(`${msg.action.tasks.length} task${msg.action.tasks.length > 1 ? 's' : ''} added`)
    const updated = conversation.map((m, i) =>
      i === msgIndex ? { ...m, action: { ...m.action, added: true } } : m
    )
    setConversation(updated)
    localStorage.setItem('planner_conversation', JSON.stringify(updated))
  }

  function handleAddPreview(msgIndex) {
    const msg = conversation[msgIndex]
    if (!msg?.preview) return
    onAddTasks([msg.preview])
    showToast('Task added')
    const updated = conversation.map((m, i) =>
      i === msgIndex ? { ...m, preview: { ...m.preview, added: true } } : m
    )
    setConversation(updated)
    localStorage.setItem('planner_conversation', JSON.stringify(updated))
  }

  function handleEditPreview(task) {
    onEditTask?.(task)
  }

  function handleCancelPreview(msgIndex) {
    const updated = conversation.map((m, i) =>
      i === msgIndex ? { ...m, preview: null } : m
    )
    setConversation(updated)
    localStorage.setItem('planner_conversation', JSON.stringify(updated))
  }

  const isSidebar = mode === 'sidebar'
  const isEmpty = conversation.length === 0

  const panelStyle = isSidebar
    ? {
        position: 'fixed',
        top: 0,
        right: 0,
        width: 400,
        height: '100vh',
        background: 'var(--surface)',
        borderLeft: '1px solid var(--accent)',
        boxShadow: '-4px 0 32px rgba(139,135,255,0.12)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 40,
        animation: 'slideInRight 0.22s ease',
      }
    : {
        position: 'fixed',
        inset: 0,
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 40,
        animation: 'fadeIn 0.18s ease',
      }

  const innerStyle = isSidebar
    ? { display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }
    : { display: 'flex', flexDirection: 'column', height: '100%', width: '100%', maxWidth: 720 }

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(30px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes blink {
          0%, 80%, 100% { opacity: 0.2; }
          40% { opacity: 1; }
        }
        .typing-dot {
          display: inline-block;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--dim);
          animation: blink 1.4s infinite ease-in-out;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
      `}</style>

      <div style={panelStyle}>
        <div style={innerStyle}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 18px',
              borderBottom: '1px solid var(--line)',
              gap: 10,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'linear-gradient(135deg, var(--accent), #6361d1)',
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: 'Fraunces, serif',
                  fontSize: 15,
                  fontWeight: 500,
                  color: 'var(--text)',
                  letterSpacing: '-0.2px',
                }}
              >
                Tutor
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--good)',
                    animation: 'pulse 2s infinite',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 10,
                    color: 'var(--dim)',
                    letterSpacing: '0.2px',
                  }}
                >
                  Local · Llama 3.2
                </span>
              </div>
            </div>

            {/* Mode toggle */}
            <div
              style={{
                display: 'flex',
                background: 'var(--surface-2)',
                border: '1px solid var(--line)',
                borderRadius: 7,
                padding: 2,
                gap: 1,
                marginRight: 4,
              }}
            >
              {['sidebar', 'fullscreen'].map(m => (
                <button
                  key={m}
                  onClick={() => onModeChange(m)}
                  style={{
                    background: mode === m ? 'var(--surface)' : 'transparent',
                    border: mode === m ? '1px solid var(--line-2)' : '1px solid transparent',
                    borderRadius: 5,
                    padding: '4px 10px',
                    fontSize: 11,
                    color: mode === m ? 'var(--text)' : 'var(--dim)',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 450,
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {m === 'sidebar' ? (
                    <Minimize2 size={12} strokeWidth={1.8} />
                  ) : (
                    <Maximize2 size={12} strokeWidth={1.8} />
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--dim)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4,
                borderRadius: 6,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--dim)')}
            >
              <X size={16} strokeWidth={1.8} />
            </button>
          </div>

          {/* Body */}
          {isEmpty ? (
            /* Welcome / empty state */
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 24px 40px',
                gap: 14,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, var(--accent), #6361d1)',
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  fontFamily: 'Fraunces, serif',
                  fontSize: 20,
                  fontWeight: 500,
                  color: 'var(--text)',
                  letterSpacing: '-0.3px',
                }}
              >
                Hi, I'm your Tutor.
              </div>
              <div
                style={{
                  fontSize: 13.5,
                  color: 'var(--dim)',
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: 1.6,
                  maxWidth: 280,
                }}
              >
                I can help you study or add tasks to your schedule. Ask me anything.
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
                {EMPTY_CHIPS.map(chip => (
                  <button
                    key={chip}
                    onClick={() => sendMessage(chip)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--line-2)',
                      borderRadius: 999,
                      padding: '6px 14px',
                      fontSize: 12,
                      color: 'var(--dim)',
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      transition: 'border-color 0.15s, color 0.15s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--accent)'
                      e.currentTarget.style.color = 'var(--text)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--line-2)'
                      e.currentTarget.style.color = 'var(--dim)'
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Conversation */
            <div
              ref={messagesRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {conversation.map((msg, i) => (
                <ChatMessage
                  key={i}
                  {...msg}
                  onAdd={
                    msg.action ? () => handleAddFromAction(i) :
                    msg.preview ? () => handleAddPreview(i) :
                    undefined
                  }
                  onEdit={msg.preview ? (task) => handleEditPreview(task) : undefined}
                  onCancel={msg.preview ? () => handleCancelPreview(i) : undefined}
                />
              ))}
              {isTyping && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '4px 16px' }}>
                  <div
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--line)',
                      borderRadius: '14px 14px 14px 4px',
                      padding: '12px 16px',
                      display: 'flex',
                      gap: 4,
                      alignItems: 'center',
                    }}
                  >
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Input area */}
          <div
            style={{
              flexShrink: 0,
              borderTop: isEmpty ? 'none' : '1px solid var(--line)',
              paddingTop: isEmpty ? 0 : 12,
            }}
          >
            {!isEmpty && (
              <QuickReplies chips={NORMAL_CHIPS} onSelect={sendMessage} />
            )}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 16px 16px',
              }}
            >
              <input
                type="text"
                placeholder="Ask anything…"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage(inputValue)
                  }
                }}
                style={{
                  flex: 1,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--line-2)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: 13.5,
                  color: 'var(--text)',
                  fontFamily: 'Inter, sans-serif',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--line-2)')}
              />
              <button
                onClick={() => sendMessage(inputValue)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 9,
                  background: inputValue.trim() ? 'var(--accent)' : 'var(--surface-2)',
                  border: inputValue.trim() ? 'none' : '1px solid var(--line)',
                  cursor: inputValue.trim() ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                }}
              >
                <Send size={15} color={inputValue.trim() ? '#0e0e1a' : 'var(--faint)'} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
