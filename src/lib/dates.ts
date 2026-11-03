const TIME_ZONE = 'Africa/Lagos'

const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' })
const timeFormat = new Intl.DateTimeFormat('en-NG', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hour12: true })
const dateTimeFormat = new Intl.DateTimeFormat('en-NG', {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
})
const longDate = new Intl.DateTimeFormat('en-NG', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

/** Today's date in the shop (YYYY-MM-DD). */
export function shopToday(): string {
  return dayFormat.format(new Date())
}

export function formatTime(iso: string): string {
  return timeFormat.format(new Date(iso))
}

export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso))
}

/** A calendar date such as an expiry date: "Tue, 3 Nov 2026". */
export function formatDay(date: string): string {
  return longDate.format(new Date(date + 'T00:00:00Z'))
}

/** Whole days from today until a calendar date (negative when it has passed). */
export function daysUntil(date: string, today = shopToday()): number {
  return Math.round((Date.parse(date + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 86_400_000)
}
