import type { Txn, TxnCategory } from '@/core/schema'
import { merchantName } from './categorize'

export function monthlyTotals(txns: Txn[], month: string) {
  const rows = txns.filter(t => t.date.startsWith(month))
  const moneyIn = rows.reduce((n, t) => n + Math.max(0, t.amount), 0)
  const moneyOut = rows.reduce((n, t) => n + Math.max(0, -t.amount), 0)
  return { moneyIn, moneyOut, net: moneyIn - moneyOut }
}

export function spendByCategory(txns: Txn[], month: string): { category: TxnCategory; amount: number }[] {
  const sums = new Map<TxnCategory, number>()
  for (const t of txns) if (t.date.startsWith(month) && t.amount < 0) sums.set(t.category, (sums.get(t.category) ?? 0) - t.amount)
  return [...sums].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount)
}

export function topMerchants(txns: Txn[], month: string, count = 5) {
  const sums = new Map<string, number>()
  for (const t of txns) if (t.date.startsWith(month) && t.amount < 0) {
    const name = merchantName(t.description) || 'Unknown'
    sums.set(name, (sums.get(name) ?? 0) - t.amount)
  }
  return [...sums].map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount).slice(0, count)
}

export function lastSixMonths(txns: Txn[], month: string) {
  const [year, mm] = month.split('-').map(Number)
  return Array.from({ length: 6 }, (_, i) => {
    const date = new Date(year, mm - 6 + i, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    return { month: key, spend: monthlyTotals(txns, key).moneyOut }
  })
}
