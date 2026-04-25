import { useRef, useEffect, useMemo, useState } from 'react'
import { X, Maximize2, Minimize2, Send, Mic, Square, Menu, Plus } from 'lucide-react'
import ChatMessage from '../Agent/ChatMessage'
import QuickReplies from '../Agent/QuickReplies'
import { classifyIntent, generateResponse } from '../../utils/agentUtils'
import { fetchOllamaTutorResponse, suggestTaskTitle } from '../../utils/webllmClient'
import { formatDate, parseRelativeDate } from '../../utils/dateUtils'
import { buildCalendarLink, buildGmailLink, buildTaskEmailDraft } from '../../lib/googleLinks'
import Logo from '../Logo'

const EMPTY_CHIPS = ['What do I have today?', 'Help me plan my week', 'Quiz me on a topic']
const NORMAL_CHIPS = ['What do I have today?', "I'm stuck", 'Quiz me']

function isGoodTitle(title) {
  const t = (title || '').trim()
  if (t.length < 3 || t.length > 60) return false
  if (/\?$/.test(t)) return false
  if (/\b(can|could|pls|please)\b/i.test(t)) return false
  if (/\b(add|new)\s+task\b/i.test(t)) return false
  return true
}

function enforceDeepLinkHonesty(text) {
  if (!text || typeof text !== 'string') return text
  let t = text

  // Calendar completion claims -> prepared-link wording
  t = t.replace(
    /\b(i('|’)ve|i have)\s+(added|scheduled|put)\b([^.\n]*\b(calendar|google calendar)\b[^.\n]*)/gi,
    "I've prepared the Google Calendar event$4"
  )
  t = t.replace(
    /\b(added|scheduled)\s+to\s+(your\s+)?(google\s+)?calendar\b/gi,
    'prepared for Google Calendar (click Open Google Calendar to save)'
  )
  t = t.replace(
    /\b(i('|’)ve|i have)\s+scheduled\s+it\b/gi,
    "I've prepared the calendar event"
  )

  // Email completion claims -> draft wording
  t = t.replace(/\bemail sent\b/gi, 'email draft ready')
  t = t.replace(/\b(i('|’)ve|i have)\s+sent(\s+a)?\s+confirmation\b/gi, "I've drafted the confirmation")
  t = t.replace(/\b(i('|’)ve|i have)\s+sent\b([^.\n]*\b(email|gmail)\b[^.\n]*)/gi, "I've drafted$4")

  // Ensure CTA for external actions stays explicit.
  if (/\b(calendar|google calendar)\b/i.test(t) && !/open google calendar/i.test(t)) {
    t = `${t}\n\nClick Open Google Calendar to save it.`
  }
  if (/\b(email|gmail)\b/i.test(t) && /\bdraft\b/i.test(t) && !/open gmail/i.test(t)) {
    t = `${t}\n\nClick Open Gmail to review and send.`
  }

  return t
}

export default function AgentPanel({
  mode,
  onModeChange,
  onClose,
  conversation,
  conversations = [],
  activeConversationId,
  setConversation,
  onSetActiveConversation,
  onCreateConversation,
  onDeleteConversation,
  onRenameActiveConversation,
  tasks,
  onAddTasks,
  onEditTask,
  onToggleTask,
  onDeleteTask,
  onUpdateTask,
  showToast,
}) {
  const messagesRef = useRef(null)
  const recognitionRef = useRef(null)
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [llmStatus, setLlmStatus] = useState('idle')
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [hoveredConversationId, setHoveredConversationId] = useState(null)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 900)
  /** Task just added/confirmed in chat — used so follow-up replies attach to the right task (not a heuristic "latest" row). */
  const lastAgentFollowUpTaskIdRef = useRef(null)
  const lastAgentFollowUpTaskRef = useRef(null)
  /** What we still need for that task (multiple can be open). */
  const pendingFollowUpsRef = useRef(null)

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [conversation, isTyping])

  useEffect(() => {
    if (mode === 'fullscreen') setHistoryOpen(false)
  }, [mode])

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 900)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    setSpeechSupported(true)

    const rec = new SR()
    rec.lang = 'en-US'
    rec.interimResults = true
    rec.continuous = false
    rec.maxAlternatives = 1

    rec.onresult = (event) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setInputValue(transcript.trim())
    }
    rec.onstart = () => setIsListening(true)
    rec.onend = () => setIsListening(false)
    rec.onerror = () => setIsListening(false)

    recognitionRef.current = rec
    return () => {
      try { rec.stop() } catch { /* ignore */ }
      recognitionRef.current = null
    }
  }, [])

  function toggleVoiceInput() {
    if (!speechSupported || !recognitionRef.current) return
    if (isListening) {
      try { recognitionRef.current.stop() } catch { /* ignore */ }
      return
    }
    try {
      recognitionRef.current.start()
    } catch {
      setIsListening(false)
    }
  }

  function normalizeQuery(s) {
    return (s || '')
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  function findTaskByQuery(rawQuery) {
    const query = normalizeQuery(rawQuery)
    if (!query) return null
    const qWords = query.split(' ').filter(w => w.length > 1)
    let best = null
    let bestScore = -1
    for (const t of tasks) {
      const name = normalizeQuery(t.name)
      if (!name) continue
      let score = 0
      if (name.includes(query)) score += 4
      for (const w of qWords) {
        if (name.includes(w)) score += 1
      }
      if (score > bestScore) {
        best = t
        bestScore = score
      }
    }
    return bestScore > 0 ? best : null
  }

  function parseTaskCommand(text) {
    const t = text.trim()
    const lower = t.toLowerCase()

    let m = lower.match(/(?:mark|set)\s+(.+?)\s+(?:as\s+)?(done|complete|completed)$/)
    if (m) return { type: 'done', query: m[1] }

    m = lower.match(/^(?:done|complete|completed)\s+(.+)$/)
    if (m) return { type: 'done', query: m[1] }

    m = lower.match(/^(?:undo|reopen)\s+(.+)$/)
    if (m) return { type: 'undo', query: m[1] }

    m = lower.match(/(?:delete|remove)\s+(?:task\s+)?(.+)$/)
    if (m) return { type: 'delete', query: m[1] }

    m = lower.match(/^edit\s+(?:task\s+)?(.+)$/)
    if (m) return { type: 'edit', query: m[1] }

    m = lower.match(/(?:move|reschedule|change|set)\s+(.+?)\s+(?:to|for)\s+(.+)$/)
    if (m) return { type: 'reschedule', query: m[1], when: m[2] }

    if (/\b(add to calendar|sync to google|put it on my calendar|google calendar)\b/i.test(lower)) {
      return { type: 'calendar' }
    }

    m = lower.match(/(?:email|send email about|send)\s+(.+)$/)
    if (m) return { type: 'email', query: m[1] }

    return null
  }

  function parseTimeFromText(text) {
    const t = (text || '').toLowerCase()
    if (/\bnoon\b/.test(t)) return '12:00'
    if (/\bmidnight\b/.test(t)) return '00:00'
    const m = t.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/)
    if (!m) return null
    let h = parseInt(m[1], 10)
    const min = m[2] ? parseInt(m[2], 10) : 0
    const ap = m[3]
    if (ap === 'pm' && h !== 12) h += 12
    if (ap === 'am' && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
  }

  function formatHumanDateTime(date, time) {
    return formatDate(date, time)
  }

  function buildTaskGmailLink(task) {
    if (!task?.email) return null
    const { subject, body } = buildTaskEmailDraft(task)
    return buildGmailLink({ to: task.email, subject, body })
  }

  const ZOOM_LINK_FOLLOWUP_TEXT = 'Want to save the Zoom link too? Paste the Zoom URL.'

  function buildGmailDraftAssistantMessage(withEmail) {
    return {
      role: 'assistant',
      text: "Here's the draft. Click Open Gmail to review and send.",
      action: {
        type: 'open-link',
        title: 'Gmail Draft',
        body: `Draft a confirmation for "${withEmail.name}"`,
        btn: 'Open Gmail',
        href: buildTaskGmailLink(withEmail),
      },
    }
  }

  /** Gmail draft, then auto Zoom ask in the same turn if we still need a link (no extra user message). */
  function afterEmailSavedAppendMessages(p, withEmail) {
    p.pendingUserBeatAfterEmail = false
    const out = [buildGmailDraftAssistantMessage(withEmail)]
    if (p.zoom) {
      p.zoomPromptSent = true
      out.push({ role: 'assistant', text: ZOOM_LINK_FOLLOWUP_TEXT })
    }
    if (!p.date && !p.email && !p.zoom) pendingFollowUpsRef.current = null
    return out
  }

  function extractEmail(text) {
    const match = (text || '').match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)
    return match ? match[0] : null
  }

  function extractUrl(text) {
    const match = (text || '').match(/https?:\/\/[^\s]+/i)
    return match ? match[0] : null
  }

  function isZoomUrl(url) {
    return /https?:\/\/([a-z0-9-]+\.)?zoom\.us\//i.test(url || '')
  }

  /** Only offer the Zoom link follow-up when the user said "zoom" in the task (title or location). */
  function userMentionedZoomInTask(task) {
    const blob = `${task?.name || ''} ${task?.location || ''}`
    return /\bzoom\b/i.test(blob)
  }

  function findEmailTargetTask() {
    const withEmail = [...tasks].reverse().find(t => t?.email)
    if (withEmail) return withEmail
    return [...tasks].reverse().find(t => t?.category === 'event') || tasks[tasks.length - 1] || null
  }

  function resolveAgentFollowUpTask() {
    const id = lastAgentFollowUpTaskIdRef.current
    if (!id) return null
    return tasks.find(t => t.id === id) || lastAgentFollowUpTaskRef.current
  }

  function setAgentFollowUpContext(task) {
    if (!task?.id) return
    lastAgentFollowUpTaskIdRef.current = task.id
    lastAgentFollowUpTaskRef.current = { ...task }
  }

  function initPendingFollowUpsForTask(task) {
    if (!task?.id) {
      pendingFollowUpsRef.current = null
      return
    }
    const wantsDate = !task.date
    const wantsEmail = task.category === 'event' && !task.email
    const wantsZoom =
      task.category === 'event' && userMentionedZoomInTask(task) && !task.link
    if (!wantsDate && !wantsEmail && !wantsZoom) {
      pendingFollowUpsRef.current = null
      return
    }
    pendingFollowUpsRef.current = {
      // date, email, zoom: still needed for the linked task
      date: wantsDate,
      email: wantsEmail,
      zoom: wantsZoom,
      calendarOffered: false,
      pendingUserBeatAfterCalendar: false,
      pendingUserBeatAfterEmail: false,
      emailPromptSent: false,
      zoomPromptSent: false,
    }
  }

  /** One follow-up at a time on confirm. After calendar or Gmail, Zoom is asked in the same turn as the draft (no extra keystroke). */
  function pushNextFollowUpForLinkedTask() {
    const t = resolveAgentFollowUpTask()
    const p = pendingFollowUpsRef.current
    if (!p || !t?.id) return
    const fromStore = tasks.find(x => x.id === t.id)
    const task = { ...t, ...(fromStore || {}) }

    if (p.date && !task.date) {
      pushAssistantAction(
        'Want me to create the Google Calendar event too? Tell me the date (and time if you have it).',
      )
      return
    }
    if (task.date && !p.calendarOffered) {
      pushAssistantAction('Want me to add this to your Google Calendar?', {
        type: 'open-link',
        title: 'Google Calendar',
        body: `Add "${task.name}" to your calendar.`,
        btn: 'Open Google Calendar',
        href: buildCalendarLink(task),
      })
      p.calendarOffered = true
      p.pendingUserBeatAfterCalendar = !!(p.email && !task.email) || !!p.zoom
      return
    }
    if (p.email && !task.email && !p.emailPromptSent && !p.pendingUserBeatAfterCalendar) {
      pushAssistantAction("Email a confirmation? What's the recipient's email?")
      p.emailPromptSent = true
      return
    }
    if (p.zoom && !task.link && !p.zoomPromptSent && !p.pendingUserBeatAfterCalendar) {
      pushAssistantAction('Want to save the Zoom link too? Paste the Zoom URL.')
      p.zoomPromptSent = true
    }
  }

  function pushAssistantAction(text, action) {
    const response = { role: 'assistant', text, ...(action ? { action } : {}) }
    setConversation(prev => [...prev, response])
  }

  function buildTitleFromMessage(text) {
    return (text || '')
      .trim()
      .replace(/[.!?,;:)\]]+$/g, '')
      .slice(0, 40)
      .trim() || 'New chat'
  }

  function sendMessage(text) {
    const trimmed = text.trim()
    if (!trimmed) return

    const userMsg = { role: 'user', text: trimmed }
    const nextConv = [...conversation, userMsg]
    setConversation(nextConv)
    if (conversation.length === 0) {
      onRenameActiveConversation?.(buildTitleFromMessage(trimmed))
    }
    setInputValue('')
    setIsTyping(true)

    void (async () => {
      try {
        const p = pendingFollowUpsRef.current
        const targetForFollowUp = p ? resolveAgentFollowUpTask() : null
        const providedEmail = extractEmail(trimmed)
        const providedUrl = extractUrl(trimmed)
        const parsedDate = parseRelativeDate(trimmed)
        const parsedTime = parseTimeFromText(trimmed)

        if (p && targetForFollowUp?.id) {
          const id = targetForFollowUp.id
          const fromStore = tasks.find(t => t.id === id)
          const target = { ...targetForFollowUp, ...(fromStore || {}) }

          if (p.pendingUserBeatAfterCalendar) {
            p.pendingUserBeatAfterCalendar = false
            if (p.email && providedEmail) {
              onUpdateTask?.(id, { email: providedEmail })
              const withEmail = { ...target, email: providedEmail }
              lastAgentFollowUpTaskRef.current = withEmail
              p.email = false
              setConversation([...nextConv, ...afterEmailSavedAppendMessages(p, withEmail)])
              return
            }
            if (p.email && !providedEmail && providedUrl && isZoomUrl(providedUrl)) {
              setConversation([...nextConv, {
                role: 'assistant',
                text: 'Please share the recipient email first, then the Zoom link.',
              }])
              return
            }
            if (p.email && !p.emailPromptSent) {
              p.emailPromptSent = true
              setConversation([...nextConv, {
                role: 'assistant',
                text: "Email a confirmation? What's the recipient's email?",
              }])
              return
            }
            if (p.email && p.emailPromptSent && !providedEmail) {
              setConversation([...nextConv, {
                role: 'assistant',
                text: "I still need a recipient email (for example, prof@university.edu).",
              }])
              return
            }
            if (!p.email && p.zoom) {
              if (providedUrl && isZoomUrl(providedUrl)) {
                onUpdateTask?.(id, { link: providedUrl })
                const merged = { ...target, link: providedUrl }
                lastAgentFollowUpTaskRef.current = merged
                p.zoom = false
                if (!p.date && !p.email) pendingFollowUpsRef.current = null
                setConversation([...nextConv, {
                  role: 'assistant',
                  text: `Saved the Zoom link for "${merged.name}".`,
                }])
                return
              }
              if (!p.zoomPromptSent) {
                p.zoomPromptSent = true
                setConversation([...nextConv, {
                  role: 'assistant',
                  text: 'Want to save the Zoom link too? Paste the Zoom URL.',
                }])
                return
              }
            }
          }

          if (p.date && parsedDate) {
            onUpdateTask?.(id, { date: parsedDate, ...(parsedTime ? { time: parsedTime } : {}) })
            const updatedTask = { ...target, date: parsedDate, ...(parsedTime ? { time: parsedTime } : {}) }
            lastAgentFollowUpTaskRef.current = updatedTask
            p.date = false
            p.calendarOffered = true
            p.pendingUserBeatAfterCalendar = !!p.email || !!p.zoom
            if (!p.email && !p.zoom) pendingFollowUpsRef.current = null
            setConversation([...nextConv, {
              role: 'assistant',
              text: "Perfect — I updated the date. Here's the Google Calendar link:",
              action: {
                type: 'open-link',
                title: 'Google Calendar',
                body: `Add "${updatedTask.name}" to Google Calendar.`,
                btn: 'Open Google Calendar',
                href: buildCalendarLink(updatedTask),
              },
            }])
            return
          }
          if (p.email && providedEmail) {
            onUpdateTask?.(id, { email: providedEmail })
            const withEmail = { ...target, email: providedEmail }
            lastAgentFollowUpTaskRef.current = withEmail
            p.email = false
            setConversation([...nextConv, ...afterEmailSavedAppendMessages(p, withEmail)])
            return
          }
          if (p.zoom && providedUrl && isZoomUrl(providedUrl)) {
            onUpdateTask?.(id, { link: providedUrl })
            const merged = { ...target, link: providedUrl }
            lastAgentFollowUpTaskRef.current = merged
            p.zoom = false
            if (!p.date && !p.email) pendingFollowUpsRef.current = null
            setConversation([...nextConv, {
              role: 'assistant',
              text: `Saved the Zoom link for "${merged.name}".`,
            }])
            return
          }
        }

        const lastAssistantText = [...conversation]
          .reverse()
          .find(m => m?.role === 'assistant' && typeof m.text === 'string')
          ?.text || ''
        const awaitingRecipient = /recipient'?s email|what'?s the recipient'?s email/i.test(lastAssistantText)
        if (awaitingRecipient && providedEmail) {
          const target = findEmailTargetTask()
          if (!target) {
            const response = { role: 'assistant', text: "I couldn't find the related task to attach this email to yet." }
            setConversation([...nextConv, response])
            return
          }
          const withEmail = { ...target, email: providedEmail }
          onUpdateTask?.(target.id, { email: providedEmail })
          const p0 = pendingFollowUpsRef.current
          const isLinked = p0 && lastAgentFollowUpTaskIdRef.current === target.id
          if (isLinked) {
            p0.email = false
            setConversation([...nextConv, ...afterEmailSavedAppendMessages(p0, withEmail)])
          } else {
            setConversation([...nextConv, buildGmailDraftAssistantMessage(withEmail)])
          }
          return
        }

        const command = parseTaskCommand(trimmed)
        if (command) {
          const matched = findTaskByQuery(command.query)
          let respText = ''
          if (command.type === 'calendar') {
            const latest = [...tasks].reverse().find(t => !!t.date)
            if (!latest) {
              respText = 'I need a task with a date first so I can open Google Calendar.'
            } else {
              const response = {
                role: 'assistant',
                text: "Here's the calendar event ready to add. Click Open Google Calendar to add it.",
                action: {
                  type: 'open-link',
                  title: 'Google Calendar',
                  body: `Add "${latest.name}" to Google Calendar.`,
                  btn: 'Open Google Calendar',
                  href: buildCalendarLink(latest),
                },
              }
              const withResponse = [...nextConv, response]
              setConversation(withResponse)
              return
            }
          } else if (command.type === 'email') {
            const target = matched || [...tasks].reverse().find(t => !!t.email)
            if (!target) {
              respText = "I couldn't find a matching task to email about yet."
            } else if (!target.email) {
              respText = "I can draft it. What's the recipient's email?"
            } else {
              const response = {
                role: 'assistant',
                text: "Here's the email link — open it to edit and send:",
                action: {
                  type: 'open-link',
                  title: 'Gmail Draft',
                  body: `Draft for "${target.name}"`,
                  btn: 'Open Gmail',
                  href: buildTaskGmailLink(target),
                },
              }
              const withResponse = [...nextConv, response]
              setConversation(withResponse)
              return
            }
          } else if (!matched) {
            respText = `I couldn’t find a task matching "${command.query}". Try a clearer task name.`
          } else if (command.type === 'done') {
            if (matched.completed) {
              respText = `"${matched.name}" is already marked done.`
            } else {
              onToggleTask?.(matched.id)
              showToast?.('Task completed')
              respText = `Done — marked "${matched.name}" as completed.`
            }
          } else if (command.type === 'undo') {
            if (!matched.completed) {
              respText = `"${matched.name}" is already open.`
            } else {
              onToggleTask?.(matched.id)
              showToast?.('Task reopened')
              respText = `Reopened "${matched.name}".`
            }
          } else if (command.type === 'delete') {
            onDeleteTask?.(matched.id)
            showToast?.('Task deleted')
            respText = `Deleted "${matched.name}".`
          } else if (command.type === 'edit') {
            onEditTask?.(matched)
            respText = `Opening edit for "${matched.name}".`
          } else if (command.type === 'reschedule') {
            const date = parseRelativeDate(command.when || '')
            if (!date) {
              respText = `I couldn’t parse the new date in "${command.when}". Try something like "next Friday at 9am".`
            } else {
              const parsedTime = parseTimeFromText(command.when || '')
              onUpdateTask?.(matched.id, { date, ...(parsedTime ? { time: parsedTime } : {}) })
              showToast?.('Task rescheduled')
              respText = `Rescheduled "${matched.name}" to ${formatHumanDateTime(date, parsedTime)}.`
            }
          }
          const response = { role: 'assistant', text: respText }
          const withResponse = [...nextConv, response]
          setConversation(withResponse)
          return
        }

        const intent = classifyIntent(trimmed)
        let { text: respText, preview, action, useOllama } = generateResponse(intent, trimmed, tasks, nextConv)
        if (preview && (intent === 'explicit_add' || intent === 'ambiguous_implied_task')) {
          const aiTitle = await suggestTaskTitle({
            userText: trimmed,
            conversationHistory: nextConv,
            preview,
          })
          if (isGoodTitle(aiTitle)) {
            preview = { ...preview, name: aiTitle }
          }
        }
        if (useOllama) {
          setLlmStatus('loading')
          const llm = await fetchOllamaTutorResponse({
            userText: trimmed,
            conversationHistory: nextConv,
            tasks,
          })
          if (llm) {
            respText = enforceDeepLinkHonesty(llm)
            setLlmStatus('ready')
          } else {
            setLlmStatus('error')
          }
        }
        const response = { role: 'assistant', text: respText, ...(preview ? { preview } : {}), ...(action ? { action } : {}) }
        const withResponse = [...nextConv, response]
        setConversation(withResponse)
      } finally {
        setIsTyping(false)
      }
    })()
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
    const firstTask = msg.action.tasks[0]
    setAgentFollowUpContext(firstTask)
    initPendingFollowUpsForTask(firstTask)
    pushNextFollowUpForLinkedTask()
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
    setAgentFollowUpContext(msg.preview)
    initPendingFollowUpsForTask(msg.preview)
    pushNextFollowUpForLinkedTask()
  }

  function handleEditPreview(msgIndex, task) {
    onEditTask?.(task, msgIndex, activeConversationId)
  }

  function handleCancelPreview(msgIndex) {
    const updated = conversation.map((m, i) =>
      i === msgIndex ? { ...m, preview: null } : m
    )
    setConversation(updated)
  }

  const isSidebar = mode === 'sidebar' && !isMobile
  const isEmpty = conversation.length === 0
  const llmStatusLabel =
    llmStatus === 'loading'
      ? 'WebLLM loading...'
      : llmStatus === 'ready'
        ? 'WebLLM ready'
        : llmStatus === 'error'
          ? 'WebLLM unavailable (fallback)'
          : 'WebLLM idle'
  const llmStatusColor =
    llmStatus === 'loading'
      ? '#facc15'
      : llmStatus === 'ready'
        ? 'var(--good)'
        : llmStatus === 'error'
          ? '#f87171'
          : 'var(--dim)'

  const panelStyle = isSidebar
    ? {
        position: 'relative',
        width: 380,
        minWidth: 380,
        height: '100%',
        background: 'var(--surface)',
        borderLeft: '1px solid #252525',
        boxShadow: 'none',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
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
    ? { display: 'flex', flexDirection: 'column', height: '100%', width: '100%', position: 'relative' }
    : { display: 'flex', height: '100%', width: '100%' }

  const sortedConversations = useMemo(
    () => [...conversations].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    [conversations]
  )

  function formatRelativeTime(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    const diff = Date.now() - d.getTime()
    const m = Math.floor(diff / 60000)
    const h = Math.floor(diff / 3600000)
    const day = Math.floor(diff / 86400000)
    if (m < 1) return 'Just now'
    if (m < 60) return `${m}m ago`
    if (h < 24) return `${h}h ago`
    if (day === 1) return 'Yesterday'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const historyPane = (width) => (
    <div
      style={{
        width,
        minWidth: width,
        borderRight: '1px solid var(--line)',
        background: 'var(--surface-2)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowX: 'hidden',
      }}
    >
      <div style={{ padding: 12, borderBottom: '1px solid var(--line)' }}>
        <button
          onClick={() => {
            onCreateConversation?.()
            setPendingDeleteId(null)
            setHistoryOpen(false)
          }}
          style={{
            width: '100%',
            border: 'none',
            background: 'var(--accent)',
            color: '#fff',
            borderRadius: 8,
            padding: '8px 10px',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Plus size={14} /> New chat
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        {sortedConversations.length === 0 ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              fontSize: 12,
              color: 'var(--dim)',
              padding: 12,
            }}
          >
            No chats yet. Start one below.
          </div>
        ) : (
          sortedConversations.map(conv => {
            const active = conv.id === activeConversationId
            const last = [...(conv.messages || [])].reverse().find(m => typeof m.text === 'string' && m.text.trim())
            const preview = last?.text || 'No messages yet'
            const confirmingDelete = pendingDeleteId === conv.id
            return (
              <div
                key={conv.id}
                style={{
                  marginBottom: 6,
                  borderRadius: 8,
                  border: active ? '1px solid rgba(94,135,245,0.4)' : '1px solid transparent',
                  borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
                  background: active ? 'rgba(94,135,245,0.10)' : 'transparent',
                  padding: 8,
                  overflow: 'hidden',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={e => {
                  if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                }}
                onMouseLeave={e => {
                  if (!active) e.currentTarget.style.background = 'transparent'
                }}
              >
                {confirmingDelete ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--dim)' }}>Delete this chat?</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => {
                          onDeleteConversation?.(conv.id)
                          setPendingDeleteId(null)
                        }}
                        style={{
                          border: '1px solid rgba(212,82,82,0.45)',
                          background: 'rgba(212,82,82,0.12)',
                          color: '#ffb0b0',
                          borderRadius: 6,
                          padding: '4px 8px',
                          fontSize: 11,
                          cursor: 'pointer',
                        }}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setPendingDeleteId(null)}
                        style={{
                          border: '1px solid var(--line)',
                          background: 'transparent',
                          color: 'var(--dim)',
                          borderRadius: 6,
                          padding: '4px 8px',
                          fontSize: 11,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 3,
                      cursor: 'pointer',
                      minWidth: 0,
                      maxWidth: '100%',
                      overflow: 'hidden',
                    }}
                    onClick={() => {
                      onSetActiveConversation?.(conv.id)
                      setHistoryOpen(false)
                    }}
                    onMouseEnter={() => setHoveredConversationId(conv.id)}
                    onMouseLeave={() => setHoveredConversationId(null)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          fontSize: 12.5,
                          color: 'var(--text)',
                          fontWeight: 500,
                          flex: 1,
                          minWidth: 0,
                          maxWidth: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {conv.title || 'New chat'}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setPendingDeleteId(conv.id)
                        }}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--faint)',
                          fontSize: 14,
                          cursor: 'pointer',
                          lineHeight: 1,
                          opacity: hoveredConversationId === conv.id ? 1 : 0,
                          transition: 'opacity 0.15s',
                        }}
                        title="Delete chat"
                      >
                        ×
                      </button>
                    </div>
                    <div
                      style={{
                        display: 'block',
                        width: '100%',
                        minWidth: 0,
                        maxWidth: '100%',
                        fontSize: 11,
                        color: 'var(--dim)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.35,
                      }}
                    >
                      {preview}
                    </div>
                    <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: 'var(--faint)' }}>
                      {formatRelativeTime(conv.updatedAt)}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )

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
          {!isSidebar && !isMobile && historyPane(260)}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', position: 'relative' }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: isMobile ? '12px' : '16px 18px',
              borderBottom: '1px solid var(--line)',
              gap: 10,
              flexShrink: 0,
            }}
          >
            {isSidebar && (
              <button
                onClick={() => setHistoryOpen(v => !v)}
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
                }}
                title="Chat history"
              >
                <Menu size={16} strokeWidth={1.9} />
              </button>
            )}
            <div
              style={{
                width: 28,
                height: 28,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Logo variant="mark" size={28} />
            </div>
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
                Task Copilot
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: llmStatusColor,
                    animation: llmStatus === 'loading' ? 'pulse 2s infinite' : 'none',
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
                  Local · {llmStatusLabel}
                </span>
              </div>
            </div>

            {/* Mode toggle */}
            {!isMobile && (
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
            )}

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

          {isSidebar && historyOpen && (
            <>
              <div
                onClick={() => setHistoryOpen(false)}
                style={{ position: 'absolute', inset: 0, background: 'transparent', zIndex: 2 }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 61,
                  bottom: 0,
                  width: 200,
                  zIndex: 3,
                  boxShadow: '8px 0 20px rgba(0,0,0,0.28)',
                }}
              >
                {historyPane(200)}
              </div>
            </>
          )}

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
                padding: isMobile ? '0 14px 18px' : '0 24px 40px',
                gap: 14,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Logo variant="mark" size={40} />
              </div>
              <div
                style={{
                  fontFamily: 'Fraunces, serif',
                  fontSize: isMobile ? 18 : 20,
                  fontWeight: 500,
                  color: 'var(--text)',
                  letterSpacing: '-0.3px',
                }}
              >
                Hi, I'm Task Copilot.
              </div>
              <div
                style={{
                  fontSize: 13.5,
                  color: 'var(--dim)',
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: 1.6,
                  maxWidth: isMobile ? 320 : 280,
                }}
              >
                I can help you study or add tasks to your schedule. I can also sync tasks to Google Calendar or draft emails — just ask.
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
                padding: isMobile ? '10px 0' : '16px 0',
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
                  onEdit={msg.preview ? (task) => handleEditPreview(i, task) : undefined}
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
                paddingBottom: isMobile ? 12 : 16,
              }}
            >
              <input
                type="text"
                placeholder="Ask anything..."
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
                onClick={toggleVoiceInput}
                disabled={!speechSupported}
                title={
                  !speechSupported
                    ? 'Voice input not supported in this browser'
                    : isListening
                      ? 'Stop listening'
                      : 'Start voice input'
                }
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 9,
                  background: isListening ? 'rgba(240,107,107,0.18)' : 'var(--surface-2)',
                  border: `1px solid ${isListening ? 'rgba(240,107,107,0.5)' : 'var(--line)'}`,
                  cursor: speechSupported ? 'pointer' : 'not-allowed',
                  opacity: speechSupported ? 1 : 0.45,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                }}
              >
                {isListening
                  ? <Square size={14} color="var(--urgent)" strokeWidth={2.2} />
                  : <Mic size={15} color="var(--dim)" strokeWidth={2} />}
              </button>
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
      </div>
    </>
  )
}
