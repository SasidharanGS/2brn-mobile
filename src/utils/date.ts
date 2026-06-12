// Local-day date helpers. The daemon buckets journals/blogs/insights/chat by the
// user's *local* day and expects `date=YYYY-MM-DD`, so all date math here is local
// (never UTC) to stay consistent with it.

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayISODate(): string {
  return toISODate(new Date())
}

/** Parse a `YYYY-MM-DD` string into a local Date at midnight. */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(iso: string, delta: number): string {
  const dt = parseISODate(iso)
  dt.setDate(dt.getDate() + delta)
  return toISODate(dt)
}

export function isToday(iso: string): boolean {
  return iso === todayISODate()
}

export function isFuture(iso: string): boolean {
  return iso > todayISODate()
}

/** "Mon, Jun 8" — a compact, locale-aware label for a `YYYY-MM-DD` string. */
export function prettyDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

/** Relative label: "Today" / "Yesterday" / otherwise the pretty date. */
export function relativeDay(iso: string): string {
  if (isToday(iso)) return 'Today'
  if (iso === addDays(todayISODate(), -1)) return 'Yesterday'
  return prettyDate(iso)
}

/**
 * "2:47 PM" — a locale-aware local time from a daemon timestamp. The daemon stores
 * UTC and strips the offset, so a naive value (no Z / no ±hh:mm) is treated as UTC
 * before converting to the device's local time. Values that already carry an offset
 * are parsed as-is.
 */
export function prettyTime(isoTimestamp: string): string {
  let s = isoTimestamp.trim()
  if (s.includes('T') || s.includes(' ')) {
    s = s.replace(' ', 'T')
    if (!/(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(s)) s += 'Z' // naive → UTC
  }
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

/** "3h 12m" / "45m" / "<1m" — compact duration for block-time displays. */
export function fmtDur(seconds: number): string {
  const m = Math.round(seconds / 60)
  if (m < 1) return '<1m'
  const h = Math.floor(m / 60)
  const rem = m % 60
  if (h === 0) return `${m}m`
  return rem === 0 ? `${h}h` : `${h}h ${rem}m`
}
