import { describe, expect, it } from 'vitest'
import type { Loan, Txn } from '@/core/schema'
import { categorize, merchantName } from './categorize'
import { uniqueTransactions } from './dedupe'
import { parseCsvTable, detectHdfcMapping, parseMappedRows, parsePdfLines, parseDate, reconstructPdfLines, statementKind } from './parsers'
import { monthlyTotals, spendByCategory, topMerchants, lastSixMonths } from './aggregates'
import { netWorth } from './networth'

const source = { type: 'account' as const, id: 'a1' }
const txn = (date: string, description: string, amount: number): Txn => ({ id: description, date, description, amount, category: categorize(description, amount), source })

describe('statement parsers', () => {
  it('finds HDFC header after junk and parses quoted amounts', () => {
    const csv = 'HDFC BANK\nAccount statement\nDate, Narration, Value Dat, Debit Amount, Credit Amount, Chq/Ref Number, Closing Balance\n31/01/24,UPI-SWIGGY-sw@okaxis-UTIB0000000-123456-Dinner,31/01/24,"1,234.50",,REF01,"9,000.50"\n01/02/2024,SALARY,01/02/2024,,"50,000.00",REF02,"59,000.50"'
    const table = parseCsvTable(csv)
    expect(table.hdfc).toBe(true)
    expect(table.headerIndex).toBe(2)
    const result = parseMappedRows(table.rows, detectHdfcMapping(table.headers)!)
    expect(result.unparsed).toBe(0)
    expect(result.transactions.map(t => [t.date, t.amount, t.category])).toEqual([['2024-01-31', -1234.5, 'food'], ['2024-02-01', 50000, 'salary']])
    expect(result.transactions[0].balance).toBe(9000.5)
  })
  it('maps generic signed CSV and Dr/Cr', () => {
    const table = parseCsvTable('when,memo,rupees,direction\n02/29/2024,Amazon,100,DR\n03/01/2024,Refund,20,CR')
    expect(table.hdfc).toBe(false)
    const result = parseMappedRows(table.rows, { date: 0, description: 1, amount: 2, drCr: 3, dateFormat: 'mdy' })
    expect(result.transactions.map(t => t.amount)).toEqual([-100, 20])
    expect(result.transactions[0].date).toBe('2024-02-29')
  })
  it('rejects invalid dates and bad rows', () => {
    expect(parseDate('29/02/2023', 'dmy')).toBeNull()
    expect(parseDate('29/02/2024', 'dmy')).toBe('2024-02-29')
    expect(parseDate('31/04/24', 'dmy')).toBeNull()
    expect(parseMappedRows([['oops', 'test', 'x']], { date: 0, description: 1, amount: 2, dateFormat: 'dmy' }).unparsed).toBe(1)
    expect(parseCsvTable('').rows).toEqual([])
  })
  it('parses PDF text lines and counts candidate lines it cannot read', () => {
    const result = parsePdfLines(['05/03/2024 12:30:00 SWIGGY MUMBAI 1,234.56 Dr', '06/03/2024 REFUND 99.00 [Cr]', '07/03/2024 badly formatted', 'Statement total'])
    expect(result.transactions.map(t => t.amount)).toEqual([-1234.56, 99])
    expect(result.unparsed).toBe(1)
    expect(reconstructPdfLines([{ str: '100.00', transform: [1,0,0,1,200,600] },{ str: '01/01/2024', transform: [1,0,0,1,10,600] }])).toEqual(['01/01/2024 100.00'])
  })
  it('classifies account statements and card statements before selecting an import target', () => {
    expect(statementKind(['Date', 'Narration', 'Closing Balance'], null, [])).toBe('account')
    expect(statementKind(['HDFC Bank Savings Account Statement'], null, [])).toBe('account')
    expect(statementKind(['Date', 'Description'], null, [{ date: '2024-02-29', description: 'NEFT CR-HDFC BANK', amount: 100, category: 'transfers' }])).toBe('account')
    expect(statementKind(['Date', 'Card Number', 'Description'], null, [])).toBe('card')
    expect(statementKind([], null, [])).toBe('card')
  })
})

describe('categorization and dedupe', () => {
  it('extracts UPI merchant and handles direction', () => {
    expect(merchantName('UPI-SWIGGY-vpa@okaxis-UTIB0000000-123456-NOTE')).toBe('SWIGGY')
    expect(categorize('SALARY', -100)).toBe('other')
    expect(categorize('NACH MF SIP', -100)).toBe('investments')
    expect(categorize('NEFT TO FRIEND', -100)).toBe('transfers')
    expect(merchantName('NEFT CR-HDFC BANK')).toBe('NEFT CR-HDFC BANK')
    expect(merchantName('IMPS TO FRIEND')).toBe('IMPS TO FRIEND')
    expect(merchantName('RTGS CR-HDFC BANK')).toBe('RTGS CR-HDFC BANK')
    expect(merchantName('ACH D- HDFC BANK LTD-HOME LOAN EMI 123456')).toBe('HDFC Bank home loan EMI')
    expect(merchantName('NACH D- HDFC BANK LTD-HOME LOAN EMI 123456')).toBe('HDFC Bank home loan EMI')
  })
  it('dedupes inside the file and against existing data by source', () => {
    const first = txn('2024-01-01', '  SWIGGY   FOOD ', -100)
    const same = { ...first, description: 'swiggy food' }
    const anotherSource = { ...same, source: { type: 'account' as const, id: 'a2' } }
    expect(uniqueTransactions([same, same, anotherSource], [first])).toMatchObject({ skipped: 2, unique: [anotherSource] })
  })
})

describe('money calculations', () => {
  const rows = [txn('2024-01-31', 'Swiggy', -100), txn('2024-01-15', 'Swiggy', -50), txn('2024-01-01', 'SALARY', 1000)]
  it('aggregates month, categories, merchants and history', () => {
    expect(monthlyTotals(rows, '2024-01')).toEqual({ moneyIn: 1000, moneyOut: 150, net: 850 })
    expect(spendByCategory(rows, '2024-01')).toEqual([{ category: 'food', amount: 150 }])
    expect(topMerchants(rows, '2024-01')).toEqual([{ name: 'Swiggy', amount: 150 }])
    expect(lastSixMonths(rows, '2024-01')).toHaveLength(6)
    expect(monthlyTotals([], '2024-01').net).toBe(0)
  })
  it('calculates deposits and reducing loan with prepayment', () => {
    const loan: Loan = { id: 'l', type: 'home', nickname: 'Home', principal: 1200, ratePct: 0, tenureMonths: 12, startDate: '2024-01-31', prepayments: [{ date: '2024-02-15', amount: 200 }] }
    const result = netWorth([{ id: 'a', type: 'savings', nickname: 'Save', balance: 500 }], [{ id: 'd', type: 'rd', nickname: 'RD', amount: 100, ratePct: 7, startDate: '2024-01-31', tenureMonths: 12, payout: 'cumulative' }], [loan], '2024-02-29')
    expect(result.depositValue).toBe(200)
    expect(result.loanOutstanding).toBe(900)
    expect(result.total).toBe(-200)
    const fd = netWorth([], [{ id: 'f', type: 'fd', nickname: 'FD', amount: 3650, ratePct: 10, startDate: '2024-01-01', tenureMonths: 12, payout: 'cumulative' }], [], '2024-01-11')
    expect(fd.depositValue).toBe(3660)
  })
})
