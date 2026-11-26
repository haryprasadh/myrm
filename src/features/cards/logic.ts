import type { Txn } from '@/core/schema'
import type { CardRuleChange, CatalogCard, SpendCategory } from '@/data/types'

export function recentRuleChanges(changes: CardRuleChange[], catalogId?: string): CardRuleChange[] {
  if (!catalogId) return []
  return changes.filter(change => change.cards.includes(catalogId)).sort((a, b) => b.date.localeCompare(a.date))
}

export interface CardYearRange { start: string; end: string }

function iso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
function monthDate(year: number, month: number, day: number): string {
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return iso(year, month, Math.min(day, last))
}
function nextMonthly(day: number, from: string): string {
  if (!Number.isInteger(day) || day < 1 || day > 31) throw new RangeError('Day must be 1–31')
  const [year, month] = from.split('-').map(Number)
  const current = monthDate(year, month, day)
  if (current >= from) return current
  const next = new Date(Date.UTC(year, month, 1))
  return monthDate(next.getUTCFullYear(), next.getUTCMonth() + 1, day)
}
export function nextStatementDate(statementDay: number, fromISO: string): string {
  return nextMonthly(statementDay, fromISO)
}
export function nextDueDate(dueDay: number, fromISO: string): string {
  return nextMonthly(dueDay, fromISO)
}
export function bestPurchaseDay(statementDate: string): string {
  const [y, m, d] = statementDate.split('-').map(Number)
  const next = new Date(Date.UTC(y, m - 1, d + 1))
  return iso(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate())
}
/** End is exclusive. A missing fee month uses January. */
export function cardYearRange(feeMonth: number | undefined, todayISO: string): CardYearRange {
  const month = feeMonth == null ? 1 : feeMonth
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new RangeError('Month must be 1–12')
  const year = Number(todayISO.slice(0, 4))
  const startYear = todayISO < iso(year, month, 1) ? year - 1 : year
  return { start: iso(startYear, month, 1), end: iso(startYear + 1, month, 1) }
}
export function cardYearSpend(txns: Txn[], cardId: string, range: CardYearRange): number {
  return txns.reduce((sum, txn) => sum + (txn.source.type === 'card' && txn.source.id === cardId && txn.date >= range.start && txn.date < range.end && Number.isFinite(txn.amount) && txn.amount < 0 ? -txn.amount : 0), 0)
}
export function feeWaiverProgress(spend: number, threshold: number | null | undefined) {
  if (threshold == null || !Number.isFinite(threshold) || threshold <= 0) return null
  const safeSpend = Number.isFinite(spend) ? Math.max(0, spend) : 0
  return { spend: safeSpend, threshold, remaining: Math.max(0, threshold - safeSpend), percent: Math.min(100, safeSpend / threshold * 100), met: safeSpend >= threshold }
}
export interface RankedCard { card: CatalogCard; ratePct: number; earned: number; caveats: string[] }
export function rankCards(catalog: CatalogCard[], category: SpendCategory, amount: number): RankedCard[] {
  if (!Number.isFinite(amount) || amount <= 0) return []
  return catalog.flatMap(card => {
    const rate = card.categoryRatePct[category] ?? card.baseRatePct
    if (rate == null || !Number.isFinite(rate) || rate < 0) return []
    const caveats = [
      ...card.caps.filter(c => c.toLowerCase().includes(category.toLowerCase())),
      ...(rate === 0 ? ['No rewards for this spend'] : []),
      ...(card.unverified ?? []).map(item => `Unverified: ${item}`),
    ]
    return [{ card, ratePct: rate, earned: amount * rate / 100, caveats }]
  }).sort((a, b) => b.earned - a.earned || a.card.name.localeCompare(b.card.name))
}
export function luhnValid(value: string): boolean {
  const digits = value.replace(/[ -]/g, '')
  if (!/^\d{12,19}$/.test(digits)) return false
  let sum = 0
  for (let i = digits.length - 1, double = false; i >= 0; i--, double = !double) {
    let digit = Number(digits[i])
    if (double) { digit *= 2; if (digit > 9) digit -= 9 }
    sum += digit
  }
  return sum % 10 === 0
}
export function validateExpiry(value: string, todayISO: string): boolean {
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(value)
  if (!match) return false
  const year = 2000 + Number(match[2])
  const month = Number(match[1])
  return iso(year, month, 1) >= todayISO.slice(0, 7) + '-01'
}
