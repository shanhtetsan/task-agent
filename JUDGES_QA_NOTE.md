# Task Agent — Judge Q&A Note

Use this as a quick script during demo and Q&A.

## 1) One-line pitch

Task Agent is a local-first productivity assistant: it helps students plan tasks, manage schedules, and draft actions (calendar/email) directly inside the app, with private on-device AI support.

## 2) How the AI interacts with the website

The agent is not a separate chatbot window. It is connected to app state and can:

- read current tasks and conversation context
- generate task previews from natural language
- add/edit/delete/complete tasks through app handlers
- create multi-day study plans and offer **Add all tasks**
- open prepared external actions via deep links (Google Calendar / Gmail)

In short: the AI is a UI copilot that drives the same task system users edit manually.

## 3) What happens when a user chats

High-level flow:

1. User message enters the agent panel.
2. Intent is classified (task add, planning, schedule query, command, or tutor chat).
3. For deterministic actions (task CRUD/reschedule), rule logic runs immediately.
4. For open-ended tutoring/help, local WebLLM generates text.
5. Agent returns:
   - plain response text, and/or
   - task preview card, and/or
   - action card (Add all tasks / Open Google Calendar / Open Gmail).

This hybrid design gives both reliability (for actions) and natural conversation (for tutoring).

## 4) Why local AI matters here

- **Privacy by default:** study context stays on-device/in-browser.
- **Low dependency risk:** core interaction still works without cloud APIs.
- **Hackathon practicality:** no OAuth complexity required for core demo value.
- **Fast iteration:** prompt and intent logic are easy to tune for UX quality.

## 5) Important trust model (say this clearly)

For Google Calendar/Gmail, we use **deep links**, not account APIs.

- The app prepares a draft link.
- The user clicks **Open Google Calendar** or **Open Gmail**.
- User confirms/sends on Google side.

So the agent says **“prepared/drafted”**, not “sent/added automatically.”

## 6) What is fully automated vs user-confirmed

### Fully automated in-app
- add/edit/delete tasks
- mark done/undo
- reschedule tasks
- save/switch/delete chat sessions
- persist data in localStorage

### User-confirmed externally
- calendar event save in Google Calendar
- email send in Gmail compose

## 7) Why this architecture is robust

- Deterministic operations do not depend on model quality.
- AI language output is constrained by intent + UI action cards.
- Error boundary prevents full white-screen crash.
- Conversation and task states are persisted and recoverable.

## 8) Likely judge questions + strong answers

### Q: “Is it actually sending emails / creating calendar events?”
A: Not directly. We intentionally use deep links for speed and reliability in hackathon scope. We prepare accurate drafts and let users confirm in Gmail/Google Calendar.

### Q: “Why not full OAuth/API integration?”
A: We prioritized a local-first core experience and trustful workflow. OAuth is a clear next step, but this version proves high-value interaction with minimal friction.

### Q: “What makes this more than a chatbot?”
A: The agent is connected to the product’s state and UI actions. It doesn’t just answer text — it updates tasks, produces structured plans, and drives actionable cards users can execute instantly.

### Q: “How do you avoid hallucination risk?”
A: Critical actions are deterministic and bounded. We separate model-generated tutoring from rule-driven task operations, and we enforce honest language for external actions (draft/prepared, not completed).

## 9) Demo talking points (60-second version)

1. “I can type natural language like ‘schedule a Zoom meeting tomorrow at 8pm’.”
2. “The agent proposes a structured task card, then adds it to the app state.”
3. “From there, I can one-click prepare Calendar/Gmail drafts.”
4. “For study help, it generates a multi-day plan and I can add all tasks at once.”
5. “All of this runs local-first with persistent chat/task memory.”

## 10) Future roadmap (if asked)

- OAuth + true Google write APIs (optional mode)
- stronger plan-to-task parser with richer date extraction
- reminders/notifications
- analytics for study consistency
- team/shared workspaces

