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

/** "2:47 PM" — a locale-aware time from an ISO timestamp (UTC or local). */
export function prettyTime(isoTimestamp: string): string {
  const d = new Date(isoTimestamp.includes('T') ? isoTimestamp : isoTimestamp.replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}
