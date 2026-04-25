export function getTodayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function addDays(isoDate, n) {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + n)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function computeGroup(isoDate) {
  if (!isoDate) return 'future'
  const today = getTodayISO()
  if (isoDate < today) return 'overdue'
  if (isoDate === today) return 'today'

  // Find nearest upcoming Saturday
  const [ty, tm, td] = today.split('-').map(Number)
  const todayDate = new Date(ty, tm - 1, td)
  const dow = todayDate.getDay() // 0=Sun ... 6=Sat
  const daysToSat = dow === 6 ? 7 : (6 - dow)
  const sat = addDays(today, daysToSat)
  const sun = addDays(today, daysToSat + 1)
  if (isoDate === sat || isoDate === sun) return 'weekend'

  const startOfNextWeek = addDays(sun, 1)
  const endOfNextWeek = addDays(sun, 7)
  if (isoDate >= startOfNextWeek && isoDate <= endOfNextWeek) return 'next-week'

  return 'future'
}

export function formatTime(time24) {
  if (!time24) return ''
  const [hStr, mStr] = time24.split(':')
  let h = parseInt(hStr)
  const m = mStr || '00'
  const ampm = h >= 12 ? 'PM' : 'AM'
  if (h > 12) h -= 12
  if (h === 0) h = 12
  return m === '00' ? `${h} ${ampm}` : `${h}:${m} ${ampm}`
}

export function formatDate(isoDate, time) {
  if (!isoDate) return ''
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const label = `${dayNames[date.getDay()]} ${monthNames[m - 1]} ${d}`
  return time ? `${label} · ${formatTime(time)}` : label
}

export function parseRelativeDate(text) {
  const t = text.toLowerCase()
  const today = getTodayISO()

  if (/\btoday\b|\btonight\b/.test(t)) return today
  if (/\btomorrow\b/.test(t)) return addDays(today, 1)

  const [ty, tm, td] = today.split('-').map(Number)
  const todayDow = new Date(ty, tm - 1, td).getDay()

  const dayMap = { sunday: 0, sun: 0, monday: 1, mon: 1, tuesday: 2, tue: 2, wednesday: 3, wed: 3, thursday: 4, thu: 4, friday: 5, fri: 5, saturday: 6, sat: 6 }

  // "next <day>" — find that weekday in the following week
  const nextMatch = t.match(/\bnext\s+(sunday|sun|monday|mon|tuesday|tue|wednesday|wed|thursday|thu|friday|fri|saturday|sat)\b/)
  if (nextMatch) {
    const targetDow = dayMap[nextMatch[1]]
    // Start from next Monday (7 days ahead if needed) and find the target day
    let diff = targetDow - todayDow
    if (diff <= 0) diff += 7
    diff += 7 // push to following week
    return addDays(today, diff)
  }

  // bare "<day>" — nearest future occurrence
  for (const [key, dow] of Object.entries(dayMap)) {
    if (new RegExp(`\\b${key}\\b`).test(t)) {
      let diff = dow - todayDow
      if (diff <= 0) diff += 7
      return addDays(today, diff)
    }
  }

  // explicit date patterns: "25th April", "April 25", "4/25"
  const dmy = t.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\b/)
  const mdy = t.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})\b/)
  const months = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 }
  if (dmy) {
    const year = new Date().getFullYear()
    return `${year}-${String(months[dmy[2]]).padStart(2, '0')}-${String(parseInt(dmy[1])).padStart(2, '0')}`
  }
  if (mdy) {
    const year = new Date().getFullYear()
    return `${year}-${String(months[mdy[1]]).padStart(2, '0')}-${String(parseInt(mdy[2])).padStart(2, '0')}`
  }
  const slash = t.match(/\b(\d{1,2})\/(\d{1,2})\b/)
  if (slash) {
    const year = new Date().getFullYear()
    return `${year}-${String(parseInt(slash[1])).padStart(2, '0')}-${String(parseInt(slash[2])).padStart(2, '0')}`
  }

  return null
}
