import { describe, expect, it } from 'vitest'
import { HDFC } from '@/data/hdfc'
import { fillSmsBody, lostCardContacts, thirdWorkingDay } from './helpers'

describe('lost card helpers', () => {
  it('picks block channels from bank data', () => {
    const result = lostCardContacts(HDFC.helplines, HDFC.officialLinks)
    expect(result.sms.map(x => x.id)).toContain('block-cc-sms')
    expect(result.web.map(x => x.id)).toContain('mycards')
    expect(result.phones.map(x => x.id)).toContain('report-fraud')
  })
  it('handles empty reference data', () => {
    expect(lostCardContacts([], [])).toEqual({ phones: [], sms: [], web: [] })
  })
  it('fills only four digits', () => {
    expect(fillSmsBody('BLOCK CC <last 4 digits>', '1234')).toBe('BLOCK CC 1234')
    expect(fillSmsBody('BLOCK CC <last 4 digits>', '12345')).toBeNull()
    expect(fillSmsBody('BLOCK CC <last 4 digits>', '12ab')).toBeNull()
  })
  it.each([
    ['2026-11-23', '2026-11-26'],
    ['2026-11-27', '2026-12-02'],
    ['2024-02-28', '2024-03-04'],
    ['2024-12-31', '2025-01-03'],
  ])('counts three weekdays after %s', (start, deadline) => {
    const result = thirdWorkingDay(new Date(`${start}T12:00:00`))
    const y = result.getFullYear(), m = String(result.getMonth() + 1).padStart(2, '0'), d = String(result.getDate()).padStart(2, '0')
    expect(`${y}-${m}-${d}`).toBe(deadline)
  })
})
