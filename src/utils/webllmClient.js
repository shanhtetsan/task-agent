import { CreateMLCEngine } from '@mlc-ai/web-llm'

/**
 * Browser-side WebLLM for open-ended Task Copilot chat. Task add / schedule / plan cards
 * stay in agentUtils (rules). This file owns the “professional” system prompt.
 */

function formatTasksForPrompt(tasks) {
  if (!tasks?.length) return '(No tasks in the list yet.)'
  return tasks
    .slice(0, 35)
    .map(t => `- ${t.name} — ${t.date || 'no date'}${t.completed ? ' [done]' : ''}`)
    .join('\n')
}

const TUTOR_SYSTEM_PROMPT = `You are **Task Copilot**, the in-app study coach for a CUNY student using Task Agent. You are helpful, direct, and encouraging—not corporate, not a generic chatbot.

## What you do well
- **Teaching:** Explain concepts (discrete math, CS, writing, etc.) in plain language. Use a short structure: intuition → key definition or steps → one concrete example. If they’re lost, take one step back, then build up.
- **Follow-ups:** Use the prior messages. Answer the actual question; don’t reset with “What are you working on?” unless the user is vague and you need one clarifying question.
- **Studying & habits:** Suggest how to break down topics, time-box, or practice—without shaming.
- **Quizzes & practice:** When they ask to be quizzed, give a focused question (or 2) and, if you want, a hint. Don’t only answer your own questions—let them try.
- **Task context:** A snapshot of their tasks is included below. Reference it when relevant (e.g. “before your exam on …”) but you **cannot** add, edit, or save tasks in the app yourself. If they need to add something, say they can use “Add to tasks” or the New task flow in the app.

## Boundaries
- No invented grades, school policies, or legal/medical advice. No claiming you changed their schedule in the app.
- Stay roughly **under 280 words** unless they explicitly ask to go deep.
- Use **markdown** lightly: **bold** for key terms, short lists when it helps. No wall of text.

## Tone
Warm, peer-tutor energy—clear, not fluffy.`

function buildMessages({ userText, conversationHistory, tasks }) {
  const taskBlock = formatTasksForPrompt(tasks)
  const system = `${TUTOR_SYSTEM_PROMPT}

**Today’s context — tasks in the app (read-only for you):**
${taskBlock}`

  const messages = [{ role: 'system', content: system }]
  const recent = conversationHistory.slice(-14)
  for (const msg of recent) {
    if (msg.role === 'user' && typeof msg.text === 'string') {
      messages.push({ role: 'user', content: msg.text })
    } else if (msg.role === 'assistant' && typeof msg.text === 'string' && msg.text.trim()) {
      messages.push({ role: 'assistant', content: msg.text })
    }
  }
  if (!recent.length || recent[recent.length - 1]?.role !== 'user') {
    messages.push({ role: 'user', content: userText })
  }
  return messages
}

function buildTitleMessages({ userText, conversationHistory, preview }) {
  const recentUser = [...conversationHistory]
    .reverse()
    .filter(m => m?.role === 'user' && typeof m.text === 'string')
    .slice(0, 5)
    .map(m => `- ${m.text}`)
    .reverse()
    .join('\n')

  const system = `You generate concise task titles for the Task Agent app.
Return ONLY the title text, nothing else.
Rules:
- 2 to 7 words.
- No punctuation at the end.
- No filler like "can you", "add this", "task", "new task", "for tomorrow".
- Keep key topic nouns (e.g. "AI Innovation Challenge", "Induction Proof", "Meeting with Professor Azhar").
- Preserve important acronyms in uppercase (AI, CS, CUNY).
- If this is a meeting, prefer a format like "Meeting with X".
- If unsure, output the cleanest short noun phrase from context.`

  const user = `Current message:
${userText}

Preview fields:
- category: ${preview?.category || 'unknown'}
- parsed name: ${preview?.name || ''}
- date: ${preview?.date || 'unknown'}
- time: ${preview?.time || 'unknown'}

Recent user context:
${recentUser || '(none)'}`

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}

let enginePromise = null
let activeModelId = null

function getCandidateModels() {
  const fromEnv = import.meta.env.VITE_WEBLLM_MODEL
  const defaults = [
    'Llama-3.2-1B-Instruct-q4f32_1-MLC',
    'Llama-3.2-3B-Instruct-q4f32_1-MLC',
    'Qwen2.5-1.5B-Instruct-q4f32_1-MLC',
  ]
  return fromEnv ? [fromEnv, ...defaults.filter(m => m !== fromEnv)] : defaults
}

async function getEngine() {
  if (enginePromise) return enginePromise

  enginePromise = (async () => {
    let lastError = null
    for (const modelId of getCandidateModels()) {
      try {
        const engine = await CreateMLCEngine(modelId)
        activeModelId = modelId
        return engine
      } catch (err) {
        lastError = err
      }
    }
    throw lastError || new Error('No WebLLM model could be initialized.')
  })()

  try {
    return await enginePromise
  } catch (err) {
    enginePromise = null
    throw err
  }
}

/**
 * @returns {Promise<string|null>} assistant text, or null if WebLLM is unavailable
 */
export async function fetchOllamaTutorResponse({ userText, conversationHistory, tasks }) {
  const messages = buildMessages({ userText, conversationHistory, tasks })
  const chatMessages = messages.map(m => ({ role: m.role, content: m.content }))

  try {
    const engine = await getEngine()
    const completion = await engine.chat.completions.create({
      messages: chatMessages,
      temperature: 0.45,
      max_tokens: 260,
    })
    const text = completion?.choices?.[0]?.message?.content?.trim()
    return text || null
  } catch {
    // Reset engine if the loaded model became unstable, so next message can re-init.
    if (activeModelId) {
      enginePromise = null
      activeModelId = null
    }
    return null
  }
}

/**
 * AI title proposal for add-task previews. Returns null on failure.
 */
export async function suggestTaskTitle({ userText, conversationHistory, preview }) {
  try {
    const engine = await getEngine()
    const completion = await engine.chat.completions.create({
      messages: buildTitleMessages({ userText, conversationHistory, preview }),
      temperature: 0.2,
      max_tokens: 24,
    })
    const text = completion?.choices?.[0]?.message?.content?.trim()
    if (!text) return null
    return text.replace(/^["'`]+|["'`]+$/g, '').trim()
  } catch {
    return null
  }
}
