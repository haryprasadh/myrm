import { describe, expect, it } from 'vitest'
import { addMonths, daysBetween, formatINRCompact, nextDayOfMonth } from './format'

describe('format', () => {
  it('nextDayOfMonth clamps and rolls over', () => {
    expect(nextDayOfMonth(5, '2026-11-03')).toBe('2026-11-05')
    expect(nextDayOfMonth(5, '2026-11-06')).toBe('2026-12-05')
    expect(nextDayOfMonth(31, '2026-02-10')).toBe('2026-02-28')
    expect(nextDayOfMonth(15, '2026-11-15')).toBe('2026-11-15')
  })
  it('addMonths clamps to month end', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2026-11-15', 14)).toBe('2028-01-15')
  })
  it('daysBetween', () => {
    expect(daysBetween('2026-11-01', '2026-11-27')).toBe(26)
  })
  it('compact INR', () => {
    expect(formatINRCompact(150000)).toBe('₹1.50L')
    expect(formatINRCompact(25000000)).toBe('₹2.50Cr')
  })
})
