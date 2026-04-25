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
    const normalizeCategory = category => {
      if (category === 'academic' || category === 'study' || category === 'coursework') return 'coursework'
      if (category === 'meeting' || category === 'event') return 'event'
      return 'personal'
    }

    const normalizeType = (category, type) => {
      if (category === 'coursework') {
        if (/lab/i.test(type || '')) return 'Lab'
        if (/exam|midterm|final/i.test(type || '')) return 'Exam'
        if (/read/i.test(type || '')) return 'Reading'
        if (/project/i.test(type || '')) return 'Project'
        return 'HW'
      }
      if (category === 'event') {
        if (/office\s*hours/i.test(type || '')) return 'Office hours'
        if (/class|lecture/i.test(type || '')) return 'Class'
        return 'Meeting'
      }
      if (/errand/i.test(type || '')) return 'Errand'
      if (/study/i.test(type || '')) return 'Study'
      return 'Other'
    }

    // Already on schema with date, but still normalize category/type vocabulary.
    if (task.date !== undefined) {
      const category = normalizeCategory(task.category)
      return { ...task, category, type: normalizeType(category, task.type), email: task.email || null }
    }

    const category = normalizeCategory(task.course && task.course !== 'General' ? 'academic' : 'personal')
    return {
      id: crypto.randomUUID(),
      name: task.name || '',
      category,
      type: normalizeType(category, task.type),
      course: task.course && task.course !== 'General' ? task.course : null,
      date: migrateOldDue(task.due),
      time: null,
      location: null,
      link: null,
      email: null,
      notes: null,
      completed: task.completed ?? false,
      completedAt: null,
      source: 'manual',
    }
  })
}
