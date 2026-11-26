import { describe, expect, it } from 'vitest'
import type { HomeEvent } from './upcoming'
import { buildIcs } from './ics'

const due: HomeEvent = { kind: 'card-due', id: 'card 1', date: '2028-02-29', title: '₹,Gold;\\\nDue', repeat: 'monthly', day: 31 }

describe('iCalendar export', () => {
  it('writes RFC headers, stable UID, UTC stamp, all-day recurrence and alarms', () => {
    const ics = buildIcs([due], '2028-02-01T10:20:30.000Z')
    expect(ics).toContain('BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//MyRM//Personal Calendar//EN\r\nCALSCALE:GREGORIAN\r\n')
    expect(ics).toContain('UID:card-due-card%201@myrm.local')
    expect(ics).toContain('DTSTAMP:20280201T102030Z')
    expect(ics).toContain('DTSTART;VALUE=DATE:20280229')
    expect(ics).toContain('RRULE:FREQ=MONTHLY;BYMONTHDAY=-1')
    expect(ics).toContain('TRIGGER:-P2D')
    expect(ics).toContain('TRIGGER:-P1D')
    expect(ics).toContain('SUMMARY:₹\\,Gold\\;\\\\\\nDue')
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
    expect(ics.replaceAll('\r\n', '')).not.toContain('\n')
  })
  it('folds every physical line at 75 UTF-8 octets', () => {
    const ics = buildIcs([{ ...due, title: '₹'.repeat(80) }], new Date('2028-01-01T00:00:00Z'))
    for (const line of ics.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)
    expect(ics).toContain('\r\n ')
  })
  it('clamps February for 29/30 and limits loans', () => {
    const emi: HomeEvent = { kind: 'loan-emi', id: 'loan', date: '2027-01-30', title: 'EMI', repeat: 'monthly', day: 30, until: '2027-03-01' }
    const ics = buildIcs([emi], '2027-01-01T00:00:00Z')
    expect(ics).toContain('RRULE:FREQ=MONTHLY;BYMONTHDAY=30;UNTIL=20270301')
    expect(ics).toContain('RDATE;VALUE=DATE:20270228')
  })
  it('handles empty events and rejects invalid timestamps', () => {
    expect(buildIcs([], '2028-01-01T00:00:00Z')).toContain('END:VCALENDAR')
    expect(() => buildIcs([], 'bad')).toThrow()
  })
})
