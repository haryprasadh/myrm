// Formatting and date helpers shared by all features. Dates are local calendar dates (YYYY-MM-DD).

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const inr2 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
const compact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 })

export function formatINR(n: number, opts: { paise?: boolean } = {}): string {
  if (!Number.isFinite(n)) return '–'
  return (opts.paise ? inr2 : inr).format(n)
}

/** ₹1.2L / ₹3.4Cr style. */
export function formatINRCompact(n: number): string {
  if (!Number.isFinite(n)) return '–'
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(abs >= 1e8 ? 0 : 2)}Cr`
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(abs >= 1e6 ? 1 : 2)}L`
  return `${sign}₹${compact.format(abs)}`
}

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function today(): string {
  return toISODate(new Date())
}

export function daysBetween(fromISO: string, toISO: string): number {
  const a = parseISODate(fromISO)
  const b = parseISODate(toISO)
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

export function addMonths(iso: string, months: number): string {
  const d = parseISODate(iso)
  const day = d.getDate()
  const target = new Date(d.getFullYear(), d.getMonth() + months, 1)
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(day, last))
  return toISODate(target)
}

/** Next date (>= from) whose day-of-month is `day`, clamped to month length (31 -> 30/28). */
export function nextDayOfMonth(day: number, fromISO: string = today()): string {
  const from = parseISODate(fromISO)
  for (let i = 0; i < 2; i++) {
    const y = from.getFullYear()
    const m = from.getMonth() + i
    const last = new Date(y, m + 1, 0).getDate()
    const cand = new Date(y, m, Math.min(day, last))
    if (cand >= from) return toISODate(cand)
  }
  return fromISO
}

export function formatDate(iso: string, style: 'short' | 'long' = 'short'): string {
  const d = parseISODate(iso)
  return d.toLocaleDateString('en-IN', style === 'short' ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' })
}

export function relativeDays(iso: string, fromISO: string = today()): string {
  const n = daysBetween(fromISO, iso)
  if (n === 0) return 'today'
  if (n === 1) return 'tomorrow'
  if (n === -1) return 'yesterday'
  return n > 0 ? `in ${n} days` : `${-n} days ago`
}
