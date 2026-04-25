import { parseRelativeDate, computeGroup, formatDate, getTodayISO, addDays } from './dateUtils'
import { buildCalendarLink, buildGmailLink, buildTaskEmailDraft } from '../lib/googleLinks'

// ─── Intent Classification ────────────────────────────────────────────────────

export function classifyIntent(text) {
  const t = text.toLowerCase().trim()

  // 1. Schedule query
  if (
    /what\s+(do\s+i\s+have|have\s+i\s+got|is\s+on|are\s+on|do\s+i\s+have\s+on)\s*(today|tomorrow|this\s+week|my\s+schedule|on\s+my\s+schedule)?/i.test(t) ||
    /what(\s+do)?\s+i\s+have(\s+to)?\s+do\s+tomorrow/i.test(t) ||
    /what.{0,25}(schedule|due\s+today|today.{0,10}due|on\s+for|coming\s+up)/i.test(t) ||
    /show\s+(me\s+)?(today|my\s+tasks|what.{0,15}have)/i.test(t) ||
    /what.{0,10}(do\s+i\s+have|have\s+today)/i.test(t) ||
    // Short follow-up after a schedule question (“show me”, “list it”, “again”)
    /^(show(\s+me)?|list(\s+it|them)?|more|again|which\s+ones|repeat)\s*!*\.?$/i.test(t)
  ) {
    return 'schedule_query'
  }

  // 2. Explicit add
  if (/\b(add|remind\s+me(\s+to)?|schedule|create\s+(a\s+)?task|new\s+task)\b/i.test(t)) {
    return 'explicit_add'
  }

  // 3. Planning
  if (/\b(prepare\s+for|plan\s+my|help\s+me\s+study\s+for|build\s+(a\s+)?study\s+plan|make\s+(a\s+)?plan|get\s+ready\s+for|how\s+should\s+i\s+study|\d+\s*-\s*day\s+plan|\d+\s+day\s+plan|week\s+plan|weekly\s+plan|next\s+week\s+plan)\b/i.test(t)) {
    return 'planning'
  }

  if (/\b(add\s+to\s+calendar|sync\s+to\s+google|put\s+it\s+on\s+my\s+calendar|google\s+calendar)\b/i.test(t)) {
    return 'calendar_link'
  }

  if (/\b(email\s+\w+|send\s+email|email\s+about|confirmation\s+email)\b/i.test(t)) {
    return 'email_link'
  }

  // 4. Ambiguous implied task — temporal + activity, but no "add"/"remind"/"schedule"
  const hasTimeRef = /\b(tomorrow|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\s+week|at\s+\d|[0-9]\s?(am|pm)|noon|this\s+(sat|sun|week))\b/i.test(t)
  const hasActivity = /\b(meeting|call|exam|hw|homework|lab|reading|study|review|office\s+hours|class|lecture|quiz|midterm|final|project|assignment|appointment|session)\b/i.test(t)
  if (hasTimeRef && hasActivity) return 'ambiguous_implied_task'

  // 5. Natural language: local LLM (Ollama) + system prompt — study help, follow-ups, explanations, etc.
  return 'tutor_conversation'
}

// ─── Task Parser ──────────────────────────────────────────────────────────────

const NAMED_COURSES = [
  'Discrete Math', 'Calculus', 'Linear Algebra', 'Physics', 'Chemistry',
  'English', 'Biology', 'Statistics', 'Data Structures', 'Algorithms',
  'Computer Science', 'Literature', 'History', 'Economics', 'Sociology',
]

export function parseTaskFromText(text) {
  // --- Course ---
  let course = null
  const codeMatch = text.match(/\b([A-Z]{2,4}\s?\d{3}[A-Z]?)\b/i)
  if (codeMatch) {
    course = codeMatch[0].replace(/\s+/, ' ').toUpperCase()
  } else {
    for (const c of NAMED_COURSES) {
      if (text.toLowerCase().includes(c.toLowerCase())) { course = c; break }
    }
  }

  // --- Category ---
  let category = 'personal'
  if (/\b(meeting|call|office\s+hours|zoom|teams|webex|appointment)\b/i.test(text)) {
    category = 'event'
  } else if (/\b(study|review|practice|prep|preparation|revision)\b/i.test(text)) {
    category = 'coursework'
  } else if (course || /\b(exam|hw|homework|lab|reading|lecture|assignment|problem\s+set|midterm|final|quiz)\b/i.test(text)) {
    category = 'coursework'
  }

  // --- Type ---
  const typeDefaults = { coursework: 'HW', event: 'Meeting', personal: 'Other' }
  let type = typeDefaults[category]
  if (category === 'coursework') {
    if (/\b(exam|midterm|final)\b/i.test(text)) type = 'Exam'
    else if (/\blab\b/i.test(text)) type = 'Lab'
    else if (/\b(reading|read)\b/i.test(text)) type = 'Reading'
    else if (/\bproject\b/i.test(text)) type = 'Project'
  } else if (category === 'event') {
    if (/\boffice\s+hours\b/i.test(text)) type = 'Office hours'
    else if (/\bclass|lecture\b/i.test(text)) type = 'Class'
  } else if (category === 'personal') {
    if (/\berrand\b/i.test(text)) type = 'Errand'
    else if (/\bstudy|practice|review\b/i.test(text)) type = 'Study'
  }

  // --- Time ---
  let time = null
  const timeMatch = text.match(/\bat?\s?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i)
  if (timeMatch) {
    let h = parseInt(timeMatch[1])
    const min = timeMatch[2] ? parseInt(timeMatch[2]) : 0
    const ampm = timeMatch[3].toLowerCase()
    if (ampm === 'pm' && h !== 12) h += 12
    if (ampm === 'am' && h === 12) h = 0
    time = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
  } else if (/\bnoon\b/i.test(text)) {
    time = '12:00'
  } else if (/\bmidnight\b/i.test(text)) {
    time = '00:00'
  }

  // --- Date ---
  const date = parseRelativeDate(text)

  // --- Location ---
  let location = null
  const roomMatch = text.match(/\bin\s+(room|rm\.?|building|hall)\s+([A-Z0-9\-]+)/i)
  if (roomMatch) {
    location = `${roomMatch[1].charAt(0).toUpperCase() + roomMatch[1].slice(1).toLowerCase()} ${roomMatch[2]}`
  } else if (/\b(on\s+zoom|zoom\s+(call|meeting)?|zoom\.us)\b/i.test(text)) {
    location = 'Zoom'
  } else if (/\bon\s+teams\b|\bteams\s+(call|meeting)\b/i.test(text)) {
    location = 'Teams'
  }

  // --- Link ---
  const linkMatch = text.match(/(https?:\/\/[^\s]+)/i)
  const link = linkMatch ? linkMatch[1] : null
  const emailMatch = text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)
  const email = emailMatch ? emailMatch[0] : null

  // --- Name: strip extracted tokens ---
  let name = text
  name = name.replace(/^(add|remind\s+me\s+to?|schedule|create\s+(a\s+)?task\s+(for)?|new\s+task:?)\s*/i, '')
  if (course) name = name.replace(new RegExp(course.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '')
  // strip time phrases
  name = name.replace(/\bat?\s?\d{1,2}(?::\d{2})?\s*(am|pm)\b/gi, '')
  name = name.replace(/\b(at\s+)?(noon|midnight|tonight)\b/gi, '')
  // strip date phrases
  name = name.replace(/\b(next\s+)?(today|tomorrow|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday|this\s+week|next\s+week)\b/gi, '')
  name = name.replace(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+\d{4})?\b/gi, '')
  name = name.replace(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:\s+\d{4})?\b/gi, '')
  name = name.replace(/\b\d{1,2}\/\d{1,2}\b/g, '')
  // strip location phrases
  name = name.replace(/\b(on|in|at)\s+(zoom|teams|room|rm\.?|building|hall)\s*[A-Z0-9\-]*/gi, '')
  if (link) name = name.replace(/(https?:\/\/[^\s]+)/g, '')
  if (email) name = name.replace(new RegExp(email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '')
  // strip filler conjunctions
  name = name.replace(/\b(for|my|a|an|the|to|and|due|by|on|,|\.)\b/gi, ' ')
  name = name.replace(/[,\.]+/g, ' ')
  name = name.replace(/\s+/g, ' ').trim()
  // title-case
  name = name.replace(/\b\w/g, c => c.toUpperCase())
  // fallback
  if (name.length < 3) {
    name = text.replace(/^(add|remind\s+me\s+to?|schedule)\s*/i, '').trim()
    name = name.split(' ').slice(0, 6).join(' ')
    name = name.replace(/\b\w/g, c => c.toUpperCase())
  }

  return { name, category, type, course, date, time, location, link, email, notes: null }
}

// ─── Response Generator ───────────────────────────────────────────────────────

function toTitleCase(s) {
  return s
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function isGenericTaskTitle(name) {
  const n = (name || '').toLowerCase().trim()
  if (!n) return true
  return (
    /^(task|new task|add task|this|that|it)$/.test(n) ||
    /^add\s+(this|that|it)(\s+task)?/.test(n) ||
    /\bthis\s+task\b/.test(n) ||
    /(can|could|pls|please)\s+(u|you)\s+add\s+(this|that|it)/.test(n) ||
    /(as\s+)?new\s+task/.test(n) ||
    /^add.*\b(today|tomorrow|tonight|next\s+\w+)\b/.test(n)
  )
}

function stripAddPhrasing(text) {
  let s = (text || '').trim()
  s = s.replace(/^(can|could|pls|please)\s+(u|you)\s+/i, '')
  s = s.replace(/^(add|create|schedule|set)\s+(this|that|it)?\s*(as\s+)?(a\s+)?new\s+task\s*(for)?\s*/i, '')
  s = s.replace(/^(add|create|schedule|set)\s+(a\s+)?task\s*(for)?\s*/i, '')
  s = s.replace(/^add\s+this\s+task(\s+for)?\s*/i, '')
  s = s.replace(/\b(as\s+)?(a\s+)?new\s+task\b/gi, '')
  s = s.replace(/\b(this|that|it)\s+task\b/gi, '')
  s = s.replace(/\b(for\s+)?(today|tomorrow|tonight|next\s+week|this\s+week)\b/gi, '')
  s = s.replace(/[?!.]+$/g, '')
  s = s.replace(/\s+/g, ' ').trim()
  return s
}

function normalizeTopicPhrase(text) {
  let s = (text || '').trim()
  s = s.replace(/^(i\s+have\s+to|i\s+need\s+to|i\s+gotta|i\s+want\s+to)\s+/i, '')
  s = s.replace(/^(go\s+to|attend|do|work\s+on|study)\s+/i, '')
  s = s.replace(/\b(at\s+)?\d{1,2}(:\d{2})?\s*(am|pm)\b/gi, '')
  s = s.replace(/\b(today|tomorrow|tonight|next\s+week|this\s+week)\b/gi, '')
  s = s.replace(/\b(with|for|on|in)\s+$/i, '')
  s = s.replace(/[?!.]+$/g, '')
  s = s.replace(/\s+/g, ' ').trim()
  return s
}

function findContextTopic(conversationHistory, currentText) {
  for (let i = conversationHistory.length - 1; i >= 0; i--) {
    const m = conversationHistory[i]
    if (m?.role !== 'user' || !m.text) continue
    const raw = m.text.trim()
    if (!raw || raw === currentText) continue
    const lower = raw.toLowerCase()
    // Skip other command-like lines.
    if (/\b(add|remind|schedule|create\s+(a\s+)?task|new\s+task|what\s+do\s+i\s+have|show\s+me)\b/.test(lower)) continue
    const topic = stripAddPhrasing(raw)
    if (topic.length >= 5) return topic
  }
  return null
}

function buildBetterTaskTitle(rawText, parsedName, conversationHistory) {
  if (!isGenericTaskTitle(parsedName)) return parsedName
  const fromCurrent = normalizeTopicPhrase(stripAddPhrasing(rawText))
  if (fromCurrent.length >= 5 && !isGenericTaskTitle(fromCurrent)) {
    return toTitleCase(fromCurrent)
  }
  const fromContext = findContextTopic(conversationHistory, rawText)
  const normalizedContext = normalizeTopicPhrase(fromContext || '')
  if (normalizedContext.length >= 5) return toTitleCase(normalizedContext)
  return parsedName
}

function lastAssistantMessage(conversationHistory) {
  for (let i = conversationHistory.length - 1; i >= 0; i--) {
    if (conversationHistory[i].role === 'assistant') return conversationHistory[i]
  }
  return null
}

/** When the user says only “show me” / “list it”, infer today / tomorrow / week from recent chat. */
function inferScheduleQueryKind(userText, conversationHistory) {
  const t = (userText || '').toLowerCase().trim()
  if (/this\s+week|next\s+week|my\s+week|rest\s+of\s+(the\s+)?week/.test(t)) return 'week'
  if (/tomorrow|next\s+day/.test(t)) return 'tomorrow'
  if (/\b(today|tonight)\b/.test(t) && !/tomorrow/.test(t)) return 'today'

  if (/^(show(\s+me)?|list(\s+it|them)?|more|again|which\s+ones|repeat)\b/i.test(t)) {
    for (let i = conversationHistory.length - 1; i >= 0; i--) {
      const m = conversationHistory[i]
      if (m?.role !== 'user' || !m.text) continue
      const u = m.text.toLowerCase()
      if (/this\s+week|next\s+week|my\s+week/.test(u)) return 'week'
      if (/tomorrow|next\s+day|what do i have to do tomorrow|due tomorrow/.test(u)) return 'tomorrow'
      if (/(^|\b)(today|tonight)\b.*(have|due|schedule)|what do i have to do today/.test(u)) return 'today'
    }
    const a = lastAssistantMessage(conversationHistory)
    if (a?.text) {
      const at = a.text.toLowerCase()
      if (/this\s+week|next\s+week|your week|coming up/.test(at)) return 'week'
      if (/tomorrow|next day/.test(at)) return 'tomorrow'
    }
  }
  return 'today'
}

function extractDayCountForPlan(text) {
  const t = (text || '').toLowerCase()
  const m = t.match(/\b(\d{1,2})\s*-\s*day\b|\b(\d{1,2})\s+day\b/)
  const raw = m ? Number(m[1] || m[2]) : null
  if (raw && raw >= 2 && raw <= 14) return raw
  if (/\b(week|weekly|next\s+week)\b/.test(t)) return 5
  return 3
}

function extractPlanTime(text) {
  const t = (text || '').toLowerCase()
  if (/\bnoon\b/.test(t)) return '12:00'
  if (/\bmidnight\b/.test(t)) return '00:00'
  const m = t.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/)
  if (!m) return null
  let h = Number(m[1])
  const min = m[2] ? Number(m[2]) : 0
  const ap = m[3]
  if (ap === 'pm' && h !== 12) h += 12
  if (ap === 'am' && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

export function generateResponse(intent, text, tasks, conversationHistory) {
  const latestTask = (tasks || []).length ? tasks[tasks.length - 1] : null
  switch (intent) {
    case 'explicit_add':
    case 'ambiguous_implied_task': {
      const parsed = parseTaskFromText(text)
      const improvedName = buildBetterTaskTitle(text, parsed.name, conversationHistory)
      const hasDate = !!parsed.date
      const responseText = intent === 'explicit_add'
        ? (hasDate ? "Got it — here's what I'll add:" : "I can add that. The date wasn't clear so I've left it for you to confirm:")
        : "Sounds like something for your schedule — want me to add it?"
      return { text: responseText, preview: { ...parsed, name: improvedName, id: crypto.randomUUID(), completed: false, completedAt: null, source: 'agent' } }
    }

    case 'calendar_link': {
      if (!latestTask || !latestTask.date) {
        return { text: 'I need a task with a date first. Add or pick one, then I can open Google Calendar.' }
      }
      return {
        text: "Here's the calendar link — click to add:",
        action: {
          type: 'open-link',
          title: 'Google Calendar',
          body: `Add "${latestTask.name}" to Google Calendar.`,
          btn: 'Open Google Calendar',
          href: buildCalendarLink(latestTask),
        },
      }
    }

    case 'email_link': {
      if (!latestTask) {
        return { text: 'I need a task first. Add one, then I can draft the email link.' }
      }
      if (!latestTask.email) {
        return { text: "I can draft it, but I need the recipient email first. What's the email address?" }
      }
      const { subject, body } = buildTaskEmailDraft(latestTask)
      return {
        text: "Here's the email link — open it to edit and send:",
        action: {
          type: 'open-link',
          title: 'Gmail Draft',
          body: `Draft for "${latestTask.name}"`,
          btn: 'Open Gmail',
          href: buildGmailLink({ to: latestTask.email, subject, body }),
        },
      }
    }

    case 'tutor_conversation': {
      return {
        text: "I'm here to help with tasks, scheduling, and studying. I can also sync tasks to Google Calendar or draft emails — just ask.",
        useOllama: true,
      }
    }

    case 'planning': {
      const today = getTodayISO()
      const dayCount = extractDayCountForPlan(text)
      const parsedTime = extractPlanTime(text)
      const courseMatch = text.match(/\b([A-Z]{2,4}\s?\d{3}[A-Z]?)\b/i)
      let courseName = courseMatch ? courseMatch[0].toUpperCase() : null
      if (!courseName) {
        for (const c of NAMED_COURSES) {
          if (text.toLowerCase().includes(c.toLowerCase())) { courseName = c; break }
        }
      }
      const label = courseName || 'your topic'
      const startDate = parseRelativeDate(text) || today
      const stageNames = ['Review fundamentals', 'Practice key problems', 'Mixed drills + recap', 'Timed practice', 'Light review + confidence pass']
      const studyTasks = Array.from({ length: dayCount }, (_, i) => {
        const phase = stageNames[i] || `Study session ${i + 1}`
        return {
          id: crypto.randomUUID(),
          name: `${phase} — ${label}`,
          category: 'coursework',
          type: 'Study',
          course: courseName,
          date: addDays(startDate, i),
          time: parsedTime,
          location: null,
          link: null,
          notes: null,
          completed: false,
          completedAt: null,
          source: 'agent',
        }
      })
      const previewLines = studyTasks
        .slice(0, Math.min(4, studyTasks.length))
        .map((t, i) => `• **Day ${i + 1} (${formatDate(t.date, t.time)})** — ${t.name}`)
        .join('\n')
      const startLabel = formatDate(startDate, parsedTime)
      return {
        text: `Here's a ${dayCount}-day plan for ${label}, starting **${startLabel}**:\n\n${previewLines}${dayCount > 4 ? `\n• ...and ${dayCount - 4} more day${dayCount - 4 > 1 ? 's' : ''}` : ''}`,
        action: {
          type: 'add-tasks',
          title: `Suggested ${dayCount}-day plan`,
          body: `Add these ${dayCount} study sessions for ${label}, starting ${startLabel}?`,
          btn: `Add all ${dayCount} as tasks`,
          tasks: studyTasks,
        },
      }
    }

    case 'schedule_query': {
      if (!tasks || tasks.length === 0) {
        return { text: "Your schedule is clear — no tasks yet. Add one with the button above, or just tell me what you're working on." }
      }
      const targetGroup = inferScheduleQueryKind(text, conversationHistory)

      if (targetGroup === 'tomorrow') {
        const tomorrow = addDays(getTodayISO(), 1)
        const items = tasks.filter(t => t.date === tomorrow && !t.completed)
        if (items.length === 0) return { text: "Nothing scheduled for tomorrow — looks like a free day." }
        const list = items.map(t => `• ${t.name}${t.time ? ` at ${formatDate(t.date, t.time).split('·')[1]?.trim() || ''}` : ''}`).join('\n')
        return { text: `You have ${items.length} thing${items.length > 1 ? 's' : ''} tomorrow:\n\n${list}` }
      }

      if (targetGroup === 'week') {
        const upcoming = tasks.filter(t => ['today', 'weekend', 'next-week'].includes(computeGroup(t.date)) && !t.completed)
        if (upcoming.length === 0) return { text: "Your week looks clear — nothing scheduled yet." }
        const list = upcoming.map(t => `• ${t.name} — ${formatDate(t.date, t.time)}`).join('\n')
        return { text: `Here's what's on your schedule:\n\n${list}` }
      }

      // today
      const todayItems = tasks.filter(t => computeGroup(t.date) === 'today' && !t.completed)
      if (todayItems.length === 0) return { text: "Nothing due today — you're all clear." }
      const list = todayItems.map(t => `• ${t.name}${t.time ? ` · ${formatDate(t.date, t.time).split('·')[1]?.trim() || ''}` : ''}`).join('\n')
      return { text: `You have ${todayItems.length} thing${todayItems.length > 1 ? 's' : ''} today:\n\n${list}` }
    }

    default: {
      return {
        text: "I'm here to help with tasks, scheduling, and studying. I can also sync tasks to Google Calendar or draft emails — just ask.",
        useOllama: true,
      }
    }
  }
}
