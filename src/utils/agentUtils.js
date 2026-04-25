import { parseRelativeDate, computeGroup, formatDate, getTodayISO, addDays } from './dateUtils'

// ─── Intent Classification ────────────────────────────────────────────────────

export function classifyIntent(text, conversationHistory = []) {
  const t = text.toLowerCase().trim()

  // 1. Schedule query
  if (
    /what\s+(do\s+i\s+have|have\s+i\s+got|is\s+on|are\s+on|do\s+i\s+have\s+on)\s*(today|tomorrow|this\s+week|my\s+schedule|on\s+my\s+schedule)?/i.test(t) ||
    /what.{0,25}(schedule|due\s+today|today.{0,10}due|on\s+for|coming\s+up)/i.test(t) ||
    /show\s+(me\s+)?(today|my\s+tasks|what.{0,15}have)/i.test(t) ||
    /what.{0,10}(do\s+i\s+have|have\s+today)/i.test(t)
  ) {
    return 'schedule_query'
  }

  // 2. Explicit add
  if (/\b(add|remind\s+me(\s+to)?|schedule|create\s+(a\s+)?task|new\s+task)\b/i.test(t)) {
    return 'explicit_add'
  }

  // 3. Study help
  if (/\b(help\s+me\s+with|explain|quiz\s+me|i\s+don.{0,2}t\s+understand|how\s+do\s+i|what\s+is\s+a?\s+\w|what\s+are\s+\w|can\s+you\s+explain|i.{0,3}m\s+stuck|stuck\s+on|teach\s+me|walk\s+me\s+through)\b/i.test(t)) {
    return 'study_help'
  }

  // 4. Planning
  if (/\b(prepare\s+for|plan\s+my|help\s+me\s+study\s+for|build\s+(a\s+)?study\s+plan|make\s+(a\s+)?plan|get\s+ready\s+for|how\s+should\s+i\s+study)\b/i.test(t)) {
    return 'planning'
  }

  // 5. Ambiguous implied task — temporal + activity, but no "add"/"remind"/"schedule"
  const hasTimeRef = /\b(tomorrow|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\s+week|at\s+\d|[0-9]\s?(am|pm)|noon|this\s+(sat|sun|week))\b/i.test(t)
  const hasActivity = /\b(meeting|call|exam|hw|homework|lab|reading|study|review|office\s+hours|class|lecture|quiz|midterm|final|project|assignment|appointment|session)\b/i.test(t)
  if (hasTimeRef && hasActivity) return 'ambiguous_implied_task'

  // 6. Follow-up — last assistant msg ended with '?'
  const lastMsg = conversationHistory[conversationHistory.length - 1]
  if (lastMsg && lastMsg.role === 'assistant' && typeof lastMsg.text === 'string' && lastMsg.text.trim().endsWith('?')) {
    return 'follow_up'
  }

  // 7. Fallback
  return 'general_chat'
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
    category = 'meeting'
  } else if (/\b(study|review|practice|prep|preparation|revision)\b/i.test(text)) {
    category = 'study'
  } else if (course || /\b(exam|hw|homework|lab|reading|lecture|assignment|problem\s+set|midterm|final|quiz)\b/i.test(text)) {
    category = 'academic'
  }

  // --- Type ---
  const typeDefaults = { academic: 'HW', meeting: 'Meeting', study: 'Study', personal: 'Other' }
  let type = typeDefaults[category]
  if (category === 'academic') {
    if (/\b(exam|midterm|final)\b/i.test(text)) type = 'Exam'
    else if (/\blab\b/i.test(text)) type = 'Lab'
    else if (/\b(reading|read)\b/i.test(text)) type = 'Reading'
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

  return { name, category, type, course, date, time, location, link, notes: null }
}

// ─── Response Generator ───────────────────────────────────────────────────────

export function generateResponse(intent, text, tasks, conversationHistory) {
  switch (intent) {
    case 'explicit_add':
    case 'ambiguous_implied_task': {
      const parsed = parseTaskFromText(text)
      const hasDate = !!parsed.date
      const responseText = intent === 'explicit_add'
        ? (hasDate ? "Got it — here's what I'll add:" : "I can add that. The date wasn't clear so I've left it for you to confirm:")
        : "Sounds like something for your schedule — want me to add it?"
      return { text: responseText, preview: { ...parsed, id: crypto.randomUUID(), completed: false, completedAt: null, source: 'agent' } }
    }

    case 'study_help': {
      const t = text.toLowerCase()
      if (/quiz\s*me/i.test(t)) {
        return { text: "Sure — here's one: If a function f(n) is defined as f(1) = 1 and f(n) = f(n−1) + n for n > 1, what is f(5)? Walk me through each step." }
      }
      if (/explain|what\s+is|what\s+are/i.test(t)) {
        const topic = text.replace(/^(explain|what\s+is\s+a?\s*|what\s+are\s*|can\s+you\s+explain\s*)/i, '').replace(/[?\.]+$/, '').trim()
        return { text: `Happy to help with${topic ? ` "${topic}"` : ' that'}. Break it down for me — what's the context? (e.g. which course, what level, and where you're stuck.)` }
      }
      if (/stuck|don.t\s+understand|struggling/i.test(t)) {
        return { text: "No worries — let's work through it together. What step are you stuck on? Share what you've tried so far and I'll help from there." }
      }
      return { text: "Happy to help. What specifically are you working on? Share the topic or the problem and I'll walk you through it." }
    }

    case 'planning': {
      const today = getTodayISO()
      const courseMatch = text.match(/\b([A-Z]{2,4}\s?\d{3}[A-Z]?)\b/i)
      let courseName = courseMatch ? courseMatch[0].toUpperCase() : null
      if (!courseName) {
        for (const c of NAMED_COURSES) {
          if (text.toLowerCase().includes(c.toLowerCase())) { courseName = c; break }
        }
      }
      const label = courseName || 'your exam'
      const studyTasks = [
        {
          id: crypto.randomUUID(), name: `Review notes — ${label}`, category: 'study',
          type: 'Study', course: courseName, date: today,
          time: null, location: null, link: null, notes: null,
          completed: false, completedAt: null, source: 'agent',
        },
        {
          id: crypto.randomUUID(), name: `Practice problems — ${label}`, category: 'study',
          type: 'Study', course: courseName, date: addDays(today, 1),
          time: null, location: null, link: null, notes: null,
          completed: false, completedAt: null, source: 'agent',
        },
        {
          id: crypto.randomUUID(), name: `Light review + rest — ${label}`, category: 'study',
          type: 'Study', course: courseName, date: addDays(today, 2),
          time: null, location: null, link: null, notes: null,
          completed: false, completedAt: null, source: 'agent',
        },
      ]
      return {
        text: `Here's a 3-day plan for ${label}:\n\n• **Today** — Review your notes, flag anything unclear\n• **Tomorrow** — Practice problems, timed\n• **Day 3** — Light review, rest up`,
        action: {
          type: 'add-tasks',
          title: 'Suggested study plan',
          body: `Add these 3 study sessions for ${label}?`,
          btn: 'Add all 3 as tasks',
          tasks: studyTasks,
        },
      }
    }

    case 'schedule_query': {
      if (!tasks || tasks.length === 0) {
        return { text: "Your schedule is clear — no tasks yet. Add one with the button above, or just tell me what you're working on." }
      }
      const t = text.toLowerCase()
      let targetGroup = 'today'
      if (/tomorrow/i.test(t)) targetGroup = 'tomorrow'
      else if (/this\s+week|next\s+week/i.test(t)) targetGroup = 'week'

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

    case 'follow_up': {
      const lastMsg = conversationHistory[conversationHistory.length - 1]
      return { text: `Got it — ${lastMsg?.text?.includes('date') ? "I'll note that." : "thanks for the context."} Anything else you'd like to add or ask about?` }
    }

    default:
      return { text: "I'm here to help with tasks, scheduling, and studying. What are you working on?" }
  }
}
