// The shop runs on Lagos time. Timestamps are stored as UTC ISO strings,
// calendar dates (expiry dates, report days) as plain YYYY-MM-DD.

export const SHOP_TIME_ZONE = 'Africa/Lagos'

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: SHOP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Calendar date (YYYY-MM-DD) of an instant, as seen in the shop. */
export function shopDate(instant: Date = new Date()): string {
  return dateFormatter.format(instant)
}

/** Minutes the shop's clock is ahead of UTC at the given instant. */
function shopOffsetMinutes(instant: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SHOP_TIME_ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).formatToParts(instant)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'))
  return Math.round((asUtc - Math.floor(instant.getTime() / 60000) * 60000) / 60000)
}

/** UTC instant at which a shop calendar day starts. */
export function shopDayStart(date: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  const guess = new Date(Date.UTC(y, m - 1, d))
  return new Date(guess.getTime() - shopOffsetMinutes(guess) * 60000)
}

/** [start, end) of a shop calendar day as UTC ISO strings, for querying stored timestamps. */
export function shopDayRange(date: string): [string, string] {
  const start = shopDayStart(date)
  const end = shopDayStart(addDays(date, 1))
  return [start.toISOString(), end.toISOString()]
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(value + 'T00:00:00Z')
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}
