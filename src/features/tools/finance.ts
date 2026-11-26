import { addMonths, daysBetween } from '@/core/format'
import type { Loan } from '@/core/schema'
import type { RelationshipProgram } from '@/data/types'

export type Prepayment = Loan['prepayments'][number] & { mode?: 'reduce-tenure' | 'reduce-emi' }
export type ScheduleRow = { date: string; payment: number; interest: number; principal: number; prepayment: number; balance: number }
const finite = (n: number) => Number.isFinite(n) && n >= 0
const validDate = (s: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const [y, m, d] = s.split('-').map(Number)
  const parsed = new Date(y, m - 1, d)
  return parsed.getFullYear() === y && parsed.getMonth() === m - 1 && parsed.getDate() === d
}

export function emi(principal: number, annualRatePct: number, months: number): number {
  if (!finite(principal) || !finite(annualRatePct) || !Number.isInteger(months) || months < 1) return NaN
  const r = annualRatePct / 1200
  return r === 0 ? principal / months : principal * r / -Math.expm1(-months * Math.log1p(r))
}

function dueDate(loan: Loan, index: number): string {
  const base = addMonths(loan.startDate, index)
  if (!loan.emiDay) return base
  const [y, m] = base.split('-').map(Number)
  const last = new Date(y, m, 0).getDate()
  return `${y}-${String(m).padStart(2, '0')}-${String(Math.min(Math.max(loan.emiDay, 1), last)).padStart(2, '0')}`
}

export function amortizationSchedule(loan: Loan, prepayments: Prepayment[] = loan.prepayments as Prepayment[]): ScheduleRow[] {
  if (!finite(loan.principal) || loan.principal <= 0 || !finite(loan.ratePct) || !Number.isInteger(loan.tenureMonths) || loan.tenureMonths < 1 || !validDate(loan.startDate)) return []
  const events = [...prepayments].filter(p => validDate(p.date) && finite(p.amount) && p.amount > 0 && p.date >= loan.startDate).sort((a, b) => a.date.localeCompare(b.date))
  let balance = loan.principal, payment = emi(balance, loan.ratePct, loan.tenureMonths), cursor = 0
  const rows: ScheduleRow[] = []
  // An EMI period uses the monthly rate on the balance after any prepayment in that period.
  for (let i = 1; i <= 1200 && balance > 0.005; i++) {
    const date = dueDate(loan, i)
    let extra = 0
    let reduceEmi = false
    while (cursor < events.length && events[cursor].date <= date) {
      const event = events[cursor++]
      if (event.date < loan.startDate) continue
      const applied = Math.min(balance, event.amount)
      balance -= applied
      extra += applied
      reduceEmi ||= event.mode === 'reduce-emi'
    }
    if (reduceEmi && balance > 0) payment = emi(balance, loan.ratePct, Math.max(1, loan.tenureMonths - i + 1))
    const interest = balance * loan.ratePct / 1200
    const actual = Math.min(balance + interest, payment)
    const principal = Math.max(0, actual - interest)
    balance = Math.max(0, balance - principal)
    rows.push({ date, payment: actual, interest, principal, prepayment: extra, balance })
    if (i >= loan.tenureMonths && balance > 0.005 && events.length === 0) break
  }
  return rows
}

export function outstandingOn(loan: Loan, date: string, prepayments?: Prepayment[]): number {
  if (date < loan.startDate) return loan.principal
  const rows = amortizationSchedule(loan, prepayments)
  let balance = loan.principal
  for (const row of rows) if (row.date <= date) balance = row.balance
  // Reflect a lump sum already made after the latest EMI and before the selected day.
  const lastDue = rows.filter(r => r.date <= date).at(-1)?.date ?? loan.startDate
  const extras = (prepayments ?? loan.prepayments).filter(p => p.date >= lastDue && p.date <= date && (lastDue === loan.startDate || p.date !== lastDue)).reduce((a, p) => a + p.amount, 0)
  return Math.max(0, balance - extras)
}

export function prepaymentImpact(loan: Loan, event: Prepayment) {
  const before = amortizationSchedule(loan)
  const after = amortizationSchedule(loan, [...loan.prepayments, event])
  const sumInterest = (rows: ScheduleRow[]) => rows.reduce((a, r) => a + r.interest, 0)
  return { interestSaved: Math.max(0, sumInterest(before) - sumInterest(after)), monthsSaved: Math.max(0, before.length - after.length), newEmi: after.find(r => r.date >= event.date)?.payment ?? 0, payoffDate: after.at(-1)?.date }
}

export function fdMaturity(principal: number, ratePct: number, months: number): number {
  if (!finite(principal) || !finite(ratePct) || !finite(months)) return NaN
  // Fractional quarters use the same effective quarterly yield to the fractional power.
  return principal * Math.pow(1 + ratePct / 400, months / 3)
}

export function fdPeriodicPayout(principal: number, ratePct: number, period: 'monthly' | 'quarterly'): number {
  if (!finite(principal) || !finite(ratePct)) return NaN
  const quarterly = ratePct / 400
  // Monthly payout is the discounted value of the quarter-end interest Q = P*r/400, paid as three
  // month-end payments that earn simple interest at the MONTHLY rate i = r/1200 until quarter end:
  // M(1+2i) + M(1+i) + M = Q  =>  M = Q / (3(1+i)) = P*(r/1200)/(1 + r/1200)  (standard bank formula).
  const monthly = ratePct / 1200
  return period === 'quarterly' ? principal * quarterly : (principal * monthly) / (1 + monthly)
}

export function rdMaturity(instalment: number, ratePct: number, months: number): number {
  if (!finite(instalment) || !finite(ratePct) || !Number.isInteger(months) || months < 1) return NaN
  // Each monthly instalment earns quarterly-compounded interest for its remaining months.
  let value = 0
  for (let i = 0; i < months; i++) value += fdMaturity(instalment, ratePct, months - i)
  return value
}

export function ladderPlan(total: number, rungs: number, spacingMonths: number, ratePct: number, startDate: string) {
  if (!finite(total) || total <= 0 || !Number.isInteger(rungs) || rungs < 1 || rungs > 60 || !Number.isInteger(spacingMonths) || spacingMonths < 1 || !finite(ratePct) || !validDate(startDate)) return []
  return Array.from({ length: rungs }, (_, i) => {
    const tenureMonths = spacingMonths * (i + 1)
    const amount = i === rungs - 1 ? total - Math.round(total / rungs * 100) / 100 * (rungs - 1) : Math.round(total / rungs * 100) / 100
    return { amount, tenureMonths, maturityDate: addMonths(startDate, tenureMonths), maturityValue: fdMaturity(amount, ratePct, tenureMonths) }
  })
}

type Relationship = { avgMonthlyBalance?: number; totalRelationshipValue?: number; netMonthlySalary?: number }
const KEYS = ['avgMonthlyBalance', 'totalRelationshipValue', 'netMonthlySalary'] as const
export function evaluateTier(values: Relationship, programs: RelationshipProgram[]) {
  const ranked = programs.map((program, index) => ({ program, index })).sort((a, b) => {
    const threshold = (p: RelationshipProgram) => Math.max(0, ...p.eligibility.flatMap(e => KEYS.map(k => e[k] ?? 0)))
    return threshold(a.program) - threshold(b.program)
  })
  const qualifies = (p: RelationshipProgram) => p.eligibility.some(option => KEYS.some(k => option[k] !== undefined && (values[k] ?? 0) >= option[k]!))
  const currentIndex = ranked.findLastIndex(({ program }) => qualifies(program))
  const current = currentIndex < 0 ? null : ranked[currentIndex].program
  const next = ranked[currentIndex + 1]?.program ?? null
  const gaps = next ? KEYS.map(key => ({ key, amount: Math.min(...next.eligibility.filter(o => o[key] !== undefined).map(o => Math.max(0, o[key]! - (values[key] ?? 0)))) })).filter(g => Number.isFinite(g.amount)) : []
  return { current, next, gaps }
}

export function depositDays(startDate: string, months: number) { return daysBetween(startDate, addMonths(startDate, months)) }
