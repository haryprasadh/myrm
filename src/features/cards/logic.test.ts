import { describe, expect, it } from 'vitest'
import type { Txn } from '@/core/schema'
import type { CatalogCard } from '@/data/types'
import { bestPurchaseDay, cardYearRange, cardYearSpend, feeWaiverProgress, luhnValid, nextDueDate, nextStatementDate, rankCards, validateExpiry } from './logic'

const card = (id: string, rate: number | null): CatalogCard => ({ id, name: id, kind: 'credit', status: 'open', networks: ['Visa'], tier: 'mid', fees: { joining: 0, annual: 500, waiverSpend: 100000 }, rewardUnit: 'Cashback', baseRatePct: rate, categoryRatePct: {}, caps: [], pointValueNote: '', lounge: { domestic: null, international: null }, forexMarkupPct: null, milestones: [], highlights: [], lastVerified: '2026-01-01', source: 'https://example.com', unverified: [] })

describe('card dates', () => {
  it('clamps month ends and handles leap years', () => {
    expect(nextStatementDate(31, '2024-02-01')).toBe('2024-02-29')
    expect(nextDueDate(31, '2023-02-28')).toBe('2023-02-28')
    expect(nextDueDate(31, '2023-03-01')).toBe('2023-03-31')
    expect(bestPurchaseDay('2024-02-29')).toBe('2024-03-01')
  })
  it('uses anniversary or calendar year with exclusive end', () => {
    expect(cardYearRange(4, '2026-03-31')).toEqual({ start: '2025-04-01', end: '2026-04-01' })
    expect(cardYearRange(undefined, '2026-11-27')).toEqual({ start: '2026-01-01', end: '2027-01-01' })
  })
})
it('sums only matching card debits in range', () => {
  const txn = (id: string, date: string, amount: number, type: 'card' | 'account' = 'card'): Txn => ({ id: crypto.randomUUID(), date, amount, source: { type, id }, category: 'shopping', description: '' })
  expect(cardYearSpend([txn('a', '2026-01-01', -100), txn('a', '2027-01-01', -50), txn('a', '2026-06-01', 25), txn('b', '2026-06-01', -30), txn('a', '2026-06-01', -40, 'account')], 'a', { start: '2026-01-01', end: '2027-01-01' })).toBe(100)
})
it('handles waiver thresholds and empty catalog', () => {
  expect(feeWaiverProgress(120, 100)).toMatchObject({ remaining: 0, percent: 100, met: true })
  expect(feeWaiverProgress(0, null)).toBeNull()
  expect(rankCards([], 'fuel', 500)).toEqual([])
})
it('ranks effective category rate, including exclusions', () => {
  const a = card('a', 2); a.categoryRatePct.fuel = 0; a.caps = ['Fuel: monthly cap']
  const b = card('b', 1)
  expect(rankCards([a, b], 'fuel', 1000).map(r => [r.card.id, r.earned])).toEqual([['b', 10], ['a', 0]])
  expect(rankCards([a], 'fuel', 1000)[0].caveats).toContain('Fuel: monthly cap')
  expect(rankCards([a], 'fuel', NaN)).toEqual([])
})
it('validates card numbers and expiry', () => {
  expect(luhnValid('4111 1111 1111 1111')).toBe(true)
  expect(luhnValid('4111 1111 1111 1112')).toBe(false)
  expect(luhnValid('123')).toBe(false)
  expect(validateExpiry('02/28', '2028-02-28')).toBe(true)
  expect(validateExpiry('01/28', '2028-02-01')).toBe(false)
  expect(validateExpiry('13/28', '2026-01-01')).toBe(false)
})
