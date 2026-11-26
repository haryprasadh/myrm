import Papa from 'papaparse'
import type { Txn } from '@/core/schema'
import { categorize } from './categorize'

export type ParsedTxn = Pick<Txn, 'date' | 'description' | 'amount' | 'category' | 'refNo' | 'balance'>
export type DateFormat = 'dmy' | 'mdy' | 'ymd'
export interface ColumnMapping { date: number; description: number; debit?: number; credit?: number; amount?: number; drCr?: number; refNo?: number; balance?: number; dateFormat: DateFormat }
export interface CsvTable { headers: string[]; rows: string[][]; headerIndex: number; hdfc: boolean }

export function statementKind(headers: string[], mapping: ColumnMapping | null, transactions: ParsedTxn[]): 'account' | 'card' {
  if (mapping?.balance !== undefined || headers.some(h => /(?:closing|running|available)?\s*balance|account\s*(?:no|number|statement)/i.test(h))) return 'account'
  if (headers.some(h => /card\s*(?:no|number)|credit\s*card/i.test(h))) return 'card'
  if (headers.some(h => /withdrawal|deposit\s*amount/i.test(h))) return 'account'
  if (transactions.some(t => t.balance !== undefined || /^(?:NEFT|IMPS|RTGS|UPI|ACH|NACH)[\s\-/]/i.test(t.description))) return 'account'
  return 'card'
}

function normalize(s: string) { return s.toLowerCase().replace(/[^a-z0-9]/g, '') }
function find(headers: string[], patterns: RegExp[]) { return headers.findIndex(h => patterns.some(p => p.test(normalize(h)))) }

export function detectHdfcMapping(headers: string[]): ColumnMapping | null {
  const date = find(headers, [/^date$/, /^transactiondate$/, /^txndate$/])
  const description = find(headers, [/narration/, /description/, /particulars/])
  const debit = find(headers, [/debit/, /withdrawal/])
  const credit = find(headers, [/credit/, /depositamt/, /depositamount/])
  if (date < 0 || description < 0 || debit < 0 || credit < 0) return null
  const refNo = find(headers, [/refno/, /referenceno/, /chq/, /cheque/])
  const balance = find(headers, [/closingbalance/, /^balance$/])
  return { date, description, debit, credit, ...(refNo >= 0 ? { refNo } : {}), ...(balance >= 0 ? { balance } : {}), dateFormat: 'dmy' }
}

export function parseCsvTable(text: string): CsvTable {
  const raw = Papa.parse<string[]>(text.replace(/^\uFEFF/, ''), { skipEmptyLines: 'greedy' })
  const rows = raw.data.map(r => r.map(c => c.trim()))
  const headerIndex = rows.findIndex(r => detectHdfcMapping(r) !== null)
  const index = headerIndex >= 0 ? headerIndex : rows.findIndex(r => r.length >= 2)
  if (index < 0) return { headers: [], rows: [], headerIndex: -1, hdfc: false }
  const headers = rows[index]
  return { headers, rows: rows.slice(index + 1).filter(r => r.some(Boolean)), headerIndex: index, hdfc: headerIndex >= 0 }
}

export function parseDate(value: string, format: DateFormat): string | null {
  const match = value.trim().match(/^(\d{1,4})[\-/](\d{1,2})[\-/](\d{1,4})(?:\s|$)/)
  if (!match) return null
  const parts = match.slice(1).map(Number)
  let [y, m, d] = format === 'ymd' ? parts : format === 'mdy' ? [parts[2], parts[0], parts[1]] : [parts[2], parts[1], parts[0]]
  if (y < 100) y += y >= 70 ? 1900 : 2000
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null
  const dt = new Date(y, m - 1, d)
  if (dt.getFullYear() !== y || dt.getMonth() + 1 !== m || dt.getDate() !== d) return null
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function number(value: string): number | null {
  const clean = value.replace(/[₹,\s]/g, '').replace(/^\((.*)\)$/, '-$1')
  if (!clean) return null
  const n = Number(clean)
  return Number.isFinite(n) ? n : null
}

export function parseMappedRows(rows: string[][], map: ColumnMapping): { transactions: ParsedTxn[]; unparsed: number } {
  const transactions: ParsedTxn[] = []
  let unparsed = 0
  for (const row of rows) {
    const date = parseDate(row[map.date] ?? '', map.dateFormat)
    const description = (row[map.description] ?? '').trim()
    const debit = map.debit === undefined ? null : number(row[map.debit] ?? '')
    const credit = map.credit === undefined ? null : number(row[map.credit] ?? '')
    const signed = map.amount === undefined ? null : number(row[map.amount] ?? '')
    let amount = signed
    if (map.amount === undefined) amount = debit !== null || credit !== null ? (credit ?? 0) - (debit ?? 0) : null
    if (amount !== null && map.drCr !== undefined) {
      const direction = (row[map.drCr] ?? '').trim().toLowerCase()
      if (/^(dr|debit|d)$/.test(direction)) amount = -Math.abs(amount)
      if (/^(cr|credit|c)$/.test(direction)) amount = Math.abs(amount)
    }
    if (!date || !description || amount === null || !Number.isFinite(amount) || amount === 0) { unparsed++; continue }
    const refNo = map.refNo === undefined ? undefined : row[map.refNo]?.trim() || undefined
    const balance = map.balance === undefined ? null : number(row[map.balance] ?? '')
    transactions.push({ date, description, amount, category: categorize(description, amount), ...(refNo ? { refNo } : {}), ...(balance !== null ? { balance } : {}) })
  }
  return { transactions, unparsed }
}

export function parsePdfLines(lines: string[]): { transactions: ParsedTxn[]; unparsed: number } {
  const transactions: ParsedTxn[] = []
  let unparsed = 0
  for (const line of lines) {
    const match = line.trim().match(/^(\d{1,2}[\-/]\d{1,2}[\-/]\d{2,4})(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?\s+(.+?)\s+([\d,]+\.\d{2})(?:\s*\[?(Cr|Dr)\]?)?(?:\s+[\d,]+\.\d{2})?$/i)
    if (!match) { if (/^\d{1,2}[\-/]\d{1,2}[\-/]\d{2,4}/.test(line.trim())) unparsed++; continue }
    const date = parseDate(match[1], 'dmy')
    const value = number(match[3])
    if (!date || value === null || value === 0) { unparsed++; continue }
    const description = match[2].trim()
    const amount = /^cr$/i.test(match[4] ?? '') ? value : -value
    transactions.push({ date, description, amount, category: categorize(description, amount) })
  }
  return { transactions, unparsed }
}

export function reconstructPdfLines(items: { str: string; transform: number[] }[]): string[] {
  const groups: { y: number; texts: { x: number; text: string }[] }[] = []
  for (const item of items) {
    const x = item.transform[4], y = item.transform[5]
    let group = groups.find(g => Math.abs(g.y - y) < 2)
    if (!group) { group = { y, texts: [] }; groups.push(group) }
    group.texts.push({ x, text: item.str })
  }
  return groups.sort((a, b) => b.y - a.y).map(g => g.texts.sort((a, b) => a.x - b.x).map(t => t.text).join(' ').replace(/\s+/g, ' ').trim()).filter(Boolean)
}
