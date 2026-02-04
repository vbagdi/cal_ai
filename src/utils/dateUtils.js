/**
 * Date utilities - all dates use America/Los_Angeles (Pacific Time)
 * This ensures consistent date handling regardless of the device's system timezone.
 */

const TZ = 'America/Los_Angeles'

/**
 * Get today's date as YYYY-MM-DD in Pacific Time
 */
export function getTodayPST() {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ })
}

/**
 * Get the current time as HH:MM in Pacific Time (24-hour)
 */
export function getNowTimePST() {
  return new Date().toLocaleTimeString('en-US', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

/**
 * Get full PST debug string: "2026-02-04 14:30:05 PST"
 */
export function getPSTDebugString() {
  const now = new Date()
  const date = now.toLocaleDateString('en-CA', { timeZone: TZ })
  const time = now.toLocaleTimeString('en-US', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  const tzAbbr = now.toLocaleTimeString('en-US', {
    timeZone: TZ,
    timeZoneName: 'short'
  }).split(' ').pop()
  return `${date} ${time} ${tzAbbr}`
}

/**
 * Format a YYYY-MM-DD date string for display
 * - If today: "Today - Tue, Feb 4"
 * - Otherwise: "Tue, Feb 3"
 */
export function formatDateDisplay(dateStr) {
  const today = getTodayPST()
  // Parse as local date to avoid timezone shift
  const parts = dateStr.split('-')
  const date = new Date(parts[0], parts[1] - 1, parts[2])

  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' })
  const month = date.toLocaleDateString('en-US', { month: 'short' })
  const day = date.getDate()

  if (dateStr === today) {
    return `Today - ${weekday}, ${month} ${day}`
  }
  return `${weekday}, ${month} ${day}`
}

/**
 * Get short day name for a YYYY-MM-DD date (e.g., "Mon", "Tue")
 */
export function getShortDayName(dateStr) {
  const parts = dateStr.split('-')
  const date = new Date(parts[0], parts[1] - 1, parts[2])
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

/**
 * Get day number from a YYYY-MM-DD date string
 */
export function getDayNumber(dateStr) {
  return parseInt(dateStr.split('-')[2], 10)
}

/**
 * Add (or subtract) days from a YYYY-MM-DD date string
 * Returns a new YYYY-MM-DD string
 */
export function addDays(dateStr, n) {
  const parts = dateStr.split('-')
  const date = new Date(parts[0], parts[1] - 1, parts[2])
  date.setDate(date.getDate() + n)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Get an array of the last `n` days as YYYY-MM-DD strings in PST
 * Returns [today, yesterday, dayBefore, ...]
 */
export function getRecentDatesPST(n = 7) {
  const today = getTodayPST()
  const dates = [today]
  for (let i = 1; i < n; i++) {
    dates.push(addDays(today, -i))
  }
  return dates
}
