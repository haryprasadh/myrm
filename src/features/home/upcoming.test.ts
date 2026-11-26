import { describe, expect, it } from 'vitest'
import { emptyState } from '@/core/schema'
import { calendarEvents, upcomingEvents } from './upcoming'

describe('upcoming events', () => {
  it('handles empty data and invalid windows', () => {
    expect(upcomingEvents(emptyState(), '2028-02-01', 45)).toEqual([])
    expect(upcomingEvents(emptyState(), 'invalid', 45)).toEqual([])
    expect(upcomingEvents(emptyState(), '2028-02-01', -1)).toEqual([])
  })
  it('clamps month ends and includes the 45th day', () => {
    const s = emptyState()
    s.cards = [{ id: 'c', nickname: 'Gold', kind: 'credit', statementDay: 30, dueDay: 31 }]
    const events = upcomingEvents(s, '2028-02-01', 60)
    expect(events.map((e) => [e.kind, e.date])).toEqual([
      ['card-due', '2028-02-29'], ['statement', '2028-02-29'],
      ['statement', '2028-03-30'], ['card-due', '2028-03-31'],
    ])
  })
  it('stops loan EMIs at tenure end and calculates a zero-rate payment', () => {
    const s = emptyState()
    s.loans = [{ id: 'l', nickname: 'Car', type: 'car', principal: 12000, ratePct: 0, startDate: '2028-01-31', tenureMonths: 2, emiDay: 31, prepayments: [] }]
    const events = upcomingEvents(s, '2028-02-01', 65)
    expect(events.map((e) => [e.date, e.amount])).toEqual([['2028-02-29', 6000]])
  })
  it('clamps deposit maturity and recurring reminders on leap day', () => {
    const s = emptyState()
    s.deposits = [{ id: 'd', type: 'fd', nickname: 'FD', amount: 5000, ratePct: 7, startDate: '2027-12-31', tenureMonths: 2, payout: 'cumulative' }]
    s.reminders = [{ id: 'r', title: 'Review', date: '2024-02-29', repeat: 'yearly' }]
    const events = upcomingEvents(s, '2028-02-01', 400)
    expect(events.filter((e) => e.kind === 'deposit').map((e) => e.date)).toEqual(['2028-02-29'])
    expect(events.filter((e) => e.kind === 'reminder').map((e) => e.date)).toEqual(['2028-02-29', '2029-02-28'])
  })
  it('ignores malformed dates and days', () => {
    const s = emptyState()
    s.cards = [{ id: 'c', nickname: 'Card', kind: 'credit', dueDay: 40 }]
    s.reminders = [{ id: 'r', title: 'Bad', date: '2028-02-30', repeat: 'none' }]
    expect(calendarEvents(s, '2028-02-01')).toEqual([])
  })
})
