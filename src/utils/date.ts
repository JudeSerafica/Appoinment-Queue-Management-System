// Format a Date as YYYY-MM-DD using the browser's LOCAL timezone.
// Do not use toISOString() for this: it converts to UTC, which shifts
// the date back one day in UTC+8 (Philippines) before 8:00 AM.
export function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// "2026-11-19" -> "Nov 19, 2026" (parsed as a local date, not UTC)
export function formatDisplayDate(value: string): string {
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return value
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

// "09:30:00" -> "9:30 AM"
export function formatDisplayTime(value: string): string {
  const [h, m] = value.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return value
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`
}

// 75 -> "1 hr 15 min"
export function formatMinutes(total: number): string {
  if (total <= 0) return 'Any moment now'
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `~${m} min`
  return m === 0 ? `~${h} hr` : `~${h} hr ${m} min`
}
