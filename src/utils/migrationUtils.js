import { getTodayISO, addDays } from './dateUtils'

function migrateOldDue(due) {
  if (!due) return getTodayISO()
  const d = due.toLowerCase()
  const today = getTodayISO()

  if (d.includes('today') || d.includes('tonight')) return today
  if (d.includes('tomorrow')) return addDays(today, 1)

  const [ty, tm, td] = today.split('-').map(Number)
  const todayDow = new Date(ty, tm - 1, td).getDay()

  const dayMap = { sunday: 0, sun: 0, monday: 1, mon: 1, tuesday: 2, tue: 2, wednesday: 3, wed: 3, thursday: 4, thu: 4, friday: 5, fri: 5, saturday: 6, sat: 6 }
  for (const [key, dow] of Object.entries(dayMap)) {
    if (d.includes(key)) {
      let diff = dow - todayDow
      if (diff <= 0) diff += 7
      return addDays(today, diff)
    }
  }

  return today
}

export function migrateTasks(tasks) {
  if (!Array.isArray(tasks)) return []
  return tasks.map(task => {
    // Already on new schema
    if (task.date !== undefined) return task

    return {
      id: crypto.randomUUID(),
      name: task.name || '',
      category: task.course && task.course !== 'General' ? 'academic' : 'personal',
      type: task.type || 'HW',
      course: task.course && task.course !== 'General' ? task.course : null,
      date: migrateOldDue(task.due),
      time: null,
      location: null,
      link: null,
      notes: null,
      completed: task.completed ?? false,
      completedAt: null,
      source: 'manual',
    }
  })
}
