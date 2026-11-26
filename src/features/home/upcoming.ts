import { addMonths, daysBetween, nextDayOfMonth } from '@/core/format'
import type { AppState, ISODate, Reminder } from '@/core/schema'

export type EventKind = 'statement' | 'card-due' | 'loan-emi' | 'deposit' | 'reminder'
export interface HomeEvent {
  kind: EventKind
  id: string
  date: ISODate
  title: string
  amount?: number
  href?: string
  notes?: string
  repeat: 'none' | 'monthly' | 'yearly'
  /** Original day of month, before short-month clamping. */
  day?: number
  /** Last included calendar date for a finite recurrence. */
  until?: ISODate
}

const validDate = (s: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const [y, m, d] = s.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
}
const validDay = (n: number | undefined): n is number => Number.isInteger(n) && n! >= 1 && n! <= 31
const shiftDays = (iso: ISODate, days: number): ISODate => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}
const lastDay = (iso: ISODate): number => {
  const [y, m] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}
const monthlyDate = (day: number, monthISO: ISODate): ISODate => `${monthISO.slice(0, 8)}${String(Math.min(day, lastDay(monthISO))).padStart(2, '0')}`
const yearlyDate = (date: ISODate, year: number, day = Number(date.slice(8))): ISODate => {
  const month = date.slice(5, 7)
  return monthlyDate(day, `${year}-${month}-01`)
}

/** Templates for calendar export. Personal dates and amounts come only from the vault. */
export function calendarEvents(state: AppState, fromISO: ISODate): HomeEvent[] {
  if (!validDate(fromISO)) return []
  const events: HomeEvent[] = []
  for (const card of state.cards) {
    if (validDay(card.statementDay)) events.push({ kind: 'statement', id: card.id, date: nextDayOfMonth(card.statementDay, fromISO), title: `${card.nickname || 'Card'} statement`, href: `#/cards/${encodeURIComponent(card.id)}`, repeat: 'monthly', day: card.statementDay })
    if (validDay(card.dueDay)) events.push({ kind: 'card-due', id: card.id, date: nextDayOfMonth(card.dueDay, fromISO), title: `${card.nickname || 'Card'} payment due`, href: `#/cards/${encodeURIComponent(card.id)}`, repeat: 'monthly', day: card.dueDay })
  }
  for (const loan of state.loans) {
    if (!validDate(loan.startDate) || !Number.isInteger(loan.tenureMonths) || loan.tenureMonths <= 0 || !validDay(loan.emiDay)) continue
    const end = addMonths(loan.startDate, loan.tenureMonths)
    const first = nextDayOfMonth(loan.emiDay, fromISO > loan.startDate ? fromISO : loan.startDate)
    if (first >= end) continue
    const monthlyRate = loan.ratePct / 1200
    const payment = Number.isFinite(loan.principal) && loan.principal >= 0 && Number.isFinite(monthlyRate)
      ? monthlyRate === 0 ? loan.principal / loan.tenureMonths : loan.principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -loan.tenureMonths))
      : undefined
    events.push({ kind: 'loan-emi', id: loan.id, date: first, title: `${loan.nickname || 'Loan'} EMI`, amount: Number.isFinite(payment) ? payment : undefined, href: `#/tools/loans/${encodeURIComponent(loan.id)}`, repeat: 'monthly', day: loan.emiDay, until: shiftDays(end, -1) })
  }
  for (const deposit of state.deposits) {
    if (!validDate(deposit.startDate) || !Number.isInteger(deposit.tenureMonths) || deposit.tenureMonths < 0) continue
    const date = addMonths(deposit.startDate, deposit.tenureMonths)
    if (date >= fromISO) events.push({ kind: 'deposit', id: deposit.id, date, title: `${deposit.nickname || deposit.type.toUpperCase()} matures`, href: '#/tools/deposits', repeat: 'none' })
  }
  for (const reminder of state.reminders) {
    if (!validDate(reminder.date)) continue
    const date = reminderDate(reminder, fromISO)
    if (date) events.push({ kind: 'reminder', id: reminder.id, date, title: reminder.title, notes: reminder.notes, repeat: reminder.repeat, day: Number(reminder.date.slice(8)) })
  }
  return events
}

function reminderDate(reminder: Reminder, fromISO: ISODate): ISODate | null {
  if (reminder.repeat === 'none') return reminder.date >= fromISO ? reminder.date : null
  if (reminder.repeat === 'monthly') {
    return nextDayOfMonth(Number(reminder.date.slice(8)), fromISO > reminder.date ? fromISO : reminder.date)
  }
  let year = Math.max(Number(reminder.date.slice(0, 4)), Number(fromISO.slice(0, 4)))
  let date = yearlyDate(reminder.date, year)
  if (date < fromISO || date < reminder.date) date = yearlyDate(reminder.date, ++year)
  return date
}

/** Events from `fromISO` through the next `days` calendar days, inclusive. */
export function upcomingEvents(state: AppState, fromISO: ISODate, days: number): HomeEvent[] {
  if (!validDate(fromISO) || !Number.isInteger(days) || days < 0) return []
  const end = shiftDays(fromISO, days)
  const out: HomeEvent[] = []
  for (const template of calendarEvents(state, fromISO)) {
    if (template.repeat === 'none') {
      if (template.date <= end) out.push(template)
      continue
    }
    let date = template.date
    while (date <= end && (!template.until || date <= template.until)) {
      out.push({ ...template, date })
      if (template.repeat === 'monthly') date = monthlyDate(template.day!, addMonths(`${date.slice(0, 7)}-01`, 1))
      else date = yearlyDate(template.date, Number(date.slice(0, 4)) + 1, template.day)
    }
  }
  return out.sort((a, b) => daysBetween(fromISO, a.date) - daysBetween(fromISO, b.date) || a.title.localeCompare(b.title))
}
