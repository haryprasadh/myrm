import { describe, expect, it } from 'vitest'
import { HDFC } from '@/data/hdfc'
import type { Loan } from '@/core/schema'
import { amortizationSchedule, emi, evaluateTier, fdMaturity, fdPeriodicPayout, ladderPlan, outstandingOn, prepaymentImpact, rdMaturity } from './finance'

const loan: Loan = { id: 'one', type: 'home', nickname: 'Home', principal: 1_000_000, ratePct: 8.5, tenureMonths: 240, startDate: '2024-01-31', emiDay: 31, prepayments: [] }

describe('loan calculations', () => {
  it('matches a known EMI and zero-rate case', () => { expect(emi(1_000_000, 8.5, 240)).toBeCloseTo(8678.23, 2); expect(emi(1200, 0, 12)).toBe(100) })
  it('rejects bad inputs', () => { expect(emi(-1, 8, 12)).toBeNaN(); expect(emi(100, 8, 0)).toBeNaN(); expect(amortizationSchedule({ ...loan, tenureMonths: 0 })).toEqual([]) })
  it('clamps EMI day at month ends, including leap February', () => { const rows = amortizationSchedule({ ...loan, principal: 30000, tenureMonths: 3 }); expect(rows.map(r => r.date)).toEqual(['2024-02-29', '2024-03-31', '2024-04-30']); expect(rows.at(-1)!.balance).toBeCloseTo(0, 2) })
  it('reduces balance and interest after lump-sum prepayment', () => { const base = amortizationSchedule(loan); const extra = { date: '2025-01-15', amount: 100_000, mode: 'reduce-tenure' as const }; const adjusted = amortizationSchedule(loan, [extra]); expect(adjusted.length).toBeLessThan(base.length); expect(adjusted.reduce((a, r) => a + r.interest, 0)).toBeLessThan(base.reduce((a, r) => a + r.interest, 0)); expect(outstandingOn(loan, '2025-01-15', [extra])).toBeLessThan(outstandingOn(loan, '2025-01-15')); expect(prepaymentImpact(loan, extra).interestSaved).toBeGreaterThan(0) })
  it('reduces EMI while preserving payoff month', () => { const extra = { date: '2025-01-15', amount: 100_000, mode: 'reduce-emi' as const }; const rows = amortizationSchedule(loan, [extra]); expect(rows.at(-1)!.date).toBe(amortizationSchedule(loan).at(-1)!.date); expect(prepaymentImpact(loan, extra).newEmi).toBeLessThan(emi(loan.principal, loan.ratePct, loan.tenureMonths)) })
  it('does not overpay a loan', () => { const rows = amortizationSchedule(loan, [{ date: '2024-02-01', amount: 2_000_000 }]); expect(rows).toHaveLength(1); expect(rows[0].balance).toBe(0) })
})

describe('deposits and ladder', () => {
  it('compounds FD quarterly including fractional quarters', () => { // 12% annual = 3% per quarter; one quarter on ₹1000 = ₹1030.
    expect(fdMaturity(1000, 12, 3)).toBeCloseTo(1030, 8)
    expect(fdMaturity(1000, 12, 1.5)).toBeCloseTo(1000 * Math.sqrt(1.03), 8)
  })
  it('discounts monthly payout and computes quarterly payout', () => { // ₹1000 × 3% = ₹30/quarter; discounted monthly = 30/(3×1.03).
    expect(fdPeriodicPayout(1000, 12, 'quarterly')).toBeCloseTo(30, 8)
    expect(fdPeriodicPayout(1000, 12, 'monthly')).toBeCloseTo(10 / 1.01, 8) // ₹9.90 per ₹1,000 at 12%
  })
  it('compounds every RD instalment', () => { // Three ₹1000 instalments earn 3, 2 and 1 months at 12% annual.
    expect(rdMaturity(1000, 12, 3)).toBeCloseTo(1000 * (1.03 + 1.03 ** (2 / 3) + 1.03 ** (1 / 3)), 8)
  })
  it('plans equal rungs across leap day', () => { const rows = ladderPlan(100000, 2, 1, 6, '2024-01-31'); expect(rows.map(r => r.maturityDate)).toEqual(['2024-02-29', '2024-03-31']); expect(rows.reduce((a, r) => a + r.amount, 0)).toBe(100000) })
  it('handles invalid input', () => { expect(fdMaturity(-1, 8, 12)).toBeNaN(); expect(rdMaturity(100, 8, 0)).toBeNaN(); expect(ladderPlan(100, 0, 1, 8, '2024-01-01')).toEqual([]) })
})

describe('relationship tiers', () => {
  it('uses real HDFC data with any-one-of eligibility', () => { const programs = HDFC.relationshipPrograms; expect(evaluateTier({ avgMonthlyBalance: 450000 }, programs).current?.name).toBe('Preferred'); expect(evaluateTier({ avgMonthlyBalance: 50000, totalRelationshipValue: 1200000 }, programs).current?.name).toBe('Classic'); const none = evaluateTier({}, programs); expect(none.current).toBeNull(); expect(none.next?.name).toBe('Classic'); expect(none.gaps.find(g => g.key === 'avgMonthlyBalance')?.amount).toBe(100000) })
  it('handles empty programme data', () => { expect(evaluateTier({}, [])).toEqual({ current: null, next: null, gaps: [] }) })
})
