import type { HomeEvent } from './upcoming'

const encoder = new TextEncoder()
const compact = (date: string) => date.replaceAll('-', '')
const textValue = (value: string) => value.replaceAll('\\', '\\\\').replace(/\r\n|\r|\n/g, '\\n').replaceAll(';', '\\;').replaceAll(',', '\\,')

/** RFC 5545: fold physical lines at 75 UTF-8 octets, counting the continuation space. */
function fold(line: string): string {
  const parts: string[] = []
  let current = ''
  let bytes = 0
  for (const char of line) {
    const size = encoder.encode(char).length
    if (bytes + size > 75) {
      parts.push(current)
      current = ' '
      bytes = 1
    }
    current += char
    bytes += size
  }
  parts.push(current)
  return parts.join('\r\n')
}

function stamp(nowUtc: Date | string): string {
  const date = typeof nowUtc === 'string' ? new Date(nowUtc) : nowUtc
  if (Number.isNaN(date.getTime())) throw new Error('Invalid calendar timestamp')
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

function linesFor(event: HomeEvent, dtstamp: string): string[] {
  const uid = `${event.kind}-${encodeURIComponent(event.id)}@myrm.local`
  const lines = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${compact(event.date)}`,
    `SUMMARY:${textValue(event.title)}`,
  ]
  if (event.notes) lines.push(`DESCRIPTION:${textValue(event.notes)}`)
  if (event.repeat === 'monthly' && event.day) {
    // 31 means "last day of month". 29/30 keep their literal day; RDATE below
    // supplies February's last day when the literal day is missing.
    const day = event.day === 31 ? -1 : event.day
    lines.push(`RRULE:FREQ=MONTHLY;BYMONTHDAY=${day}${event.until ? `;UNTIL=${compact(event.until)}` : ''}`)
    if (day === 29 || day === 30) {
      const extras: string[] = []
      const firstYear = Number(event.date.slice(0, 4))
      // Calendar standards cannot express a clamped 29/30 indefinitely in one
      // RRULE. Add short-February dates for 20 years from export.
      for (let year = firstYear; year < firstYear + 20; year++) {
        const lastFeb = new Date(Date.UTC(year, 2, 0)).getUTCDate()
        if (lastFeb >= day) continue
        const date = `${year}-02-${lastFeb}`
        if (date >= event.date && (!event.until || date <= event.until)) extras.push(compact(date))
      }
      if (extras.length) lines.push(`RDATE;VALUE=DATE:${extras.join(',')}`)
    }
  } else if (event.repeat === 'yearly') {
    const month = Number(event.date.slice(5, 7))
    const day = event.day ?? Number(event.date.slice(8))
    // Feb 29 becomes the last day of February in non-leap years too.
    lines.push(month === 2 && day === 29 ? 'RRULE:FREQ=YEARLY;BYMONTH=2;BYMONTHDAY=-1' : `RRULE:FREQ=YEARLY;BYMONTH=${month};BYMONTHDAY=${day}`)
  }
  const alarms = event.kind === 'card-due' ? [2, 1] : [2]
  for (const days of alarms) lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${textValue(event.title)}`, `TRIGGER:-P${days}D`, 'END:VALARM')
  lines.push('END:VEVENT')
  return lines
}

/** All-day local dates; calendar imports can alert without opening MyRM. */
export function buildIcs(events: HomeEvent[], nowUtc: Date | string): string {
  const dtstamp = stamp(nowUtc)
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MyRM//Personal Calendar//EN', 'CALSCALE:GREGORIAN']
  for (const event of events) lines.push(...linesFor(event, dtstamp))
  lines.push('END:VCALENDAR')
  return lines.map(fold).join('\r\n') + '\r\n'
}
