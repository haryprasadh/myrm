import type { Account, Deposit, Loan } from '@/core/schema'
import { addMonths, daysBetween } from '@/core/format'

function loanBalance(loan: Loan, asOf: string): number {
  if (asOf < loan.startDate || loan.principal <= 0) return asOf < loan.startDate ? 0 : Math.max(0, loan.principal)
  const r = loan.ratePct / 1200
  const n = Math.max(1, loan.tenureMonths)
  const emi = r === 0 ? loan.principal / n : loan.principal * r / (1 - (1 + r) ** -n)
  let balance = loan.principal
  const prepayments = [...loan.prepayments].filter(p => p.date >= loan.startDate && p.date <= asOf && p.amount > 0).sort((a, b) => a.date.localeCompare(b.date))
  let index = 0
  for (let m = 1; m <= n && balance > 0; m++) {
    const due = addMonths(loan.startDate, m)
    if (due > asOf) break
    while (index < prepayments.length && prepayments[index].date <= due) {
      balance = Math.max(0, balance - prepayments[index++].amount)
    }
    balance = Math.max(0, balance * (1 + r) - emi)
  }
  while (index < prepayments.length && prepayments[index].date <= asOf) balance = Math.max(0, balance - prepayments[index++].amount)
  return balance
}

export function netWorth(accounts: Account[], deposits: Deposit[], loans: Loan[], asOf: string) {
  const accountBalance = accounts.reduce((n, a) => n + (a.balance ?? 0), 0)
  const depositValue = deposits.reduce((n, d) => {
    if (asOf < d.startDate || d.amount <= 0) return n
    const end = addMonths(d.startDate, d.tenureMonths)
    const date = asOf < end ? asOf : end
    if (d.type === 'fd') return n + d.amount * (1 + d.ratePct / 100 * Math.max(0, daysBetween(d.startDate, date)) / 365)
    let paid = 0
    for (let i = 0; i < d.tenureMonths && addMonths(d.startDate, i) <= date; i++) paid += d.amount
    return n + paid
  }, 0)
  const loanOutstanding = loans.reduce((n, loan) => n + loanBalance(loan, asOf), 0)
  const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100
  return { accountBalance: round(accountBalance), depositValue: round(depositValue), loanOutstanding: round(loanOutstanding), total: round(accountBalance + depositValue - loanOutstanding) }
}
