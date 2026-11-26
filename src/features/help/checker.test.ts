import { describe, expect, it } from 'vitest'
import { HDFC } from '@/data/hdfc'
import { checkMessage } from './checker'

const data = { officialDomains: ['hdfc.bank.in'], legacyDomains: ['hdfcbank.com'], groupDomains: ['hdfclife.com'], smsSenderIds: ['HDFCBK', 'HDFCBN'] }
const one = (text: string) => checkMessage(text, data)

describe('checkMessage', () => {
  it.each([
    ['https://netbanking.hdfcbank.com/', 'legacy', 'safe'],
    ['https://hdfc.bank.in/x', 'official', 'safe'],
    ['HTTPS://WWW.HDFC.BANK.IN./x', 'official', 'safe'],
    ['https://www.hdfcbank.com.verify-kyc.xyz', 'phishing', 'phishing'],
    ['hdfcbank-secure.com', 'phishing', 'phishing'],
    ['http://hdfcbank.co', 'phishing', 'phishing'],
    ['xn--hdfcbnk-9za.com', 'phishing', 'phishing'],
    ['https://bit.ly/abc', 'warning', 'suspicious'],
    ['192.168.1.10/login', 'warning', 'suspicious'],
    ['https://hdfcbank.com@evil.com', 'phishing', 'phishing'],
    ['https://www.hdfclife.com', 'group', 'safe'],
    ['https://hdfc.bank.in/file.apk', 'official', 'phishing'],
  ] as const)('%s → %s', (message, kind, verdict) => {
    const result = one(message)
    expect(result.sites[0]?.kind).toBe(kind)
    expect(result.verdict).toBe(verdict)
  })
  it('flags a fake KYC threat', () => {
    const result = one('Your HDFC account will be blocked today, update KYC: hdfc-kyc.in')
    expect(result.verdict).toBe('phishing')
    expect(result.flags).toContain('Asks for KYC or PAN update')
  })
  it('treats an ordinary transaction alert with no link as safe-looking', () => {
    expect(one('Rs 500 debited from A/c XX1234 at shop on 27 Nov. Balance Rs 1200.').verdict).toBe('safe')
  })
  it('recognises genuine-looking sender headers without trusting message content', () => {
    const result = one('VM-HDFCBK-S: update KYC at hdfc-kyc.in now')
    expect(result.sender).toMatch(/spoofed/)
    expect(result.verdict).toBe('phishing')
  })
  it('flags imitated sender IDs and mobile calls', () => {
    const result = one('JD-HDFCBNK-T: Call 9876543210 to unblock your HDFC account')
    expect(result.flags).toContain('Sender ID imitates HDFC Bank')
    expect(result.verdict).toBe('phishing')
  })
  it('uses the real bank domain data', () => {
    expect(checkMessage('https://mycards.hdfc.bank.in/', HDFC).sites[0]?.kind).toBe('official')
    expect(checkMessage('https://payzapp.in/', HDFC).sites[0]?.kind).toBe('legacy')
  })
  it('handles empty data and bad input', () => {
    expect(checkMessage('', { officialDomains: [], groupDomains: [] }).verdict).toBe('safe')
    expect(checkMessage('not a link', { officialDomains: [], groupDomains: [] }).sites).toEqual([])
  })
})

describe('genuine HDFC alerts are not flagged as phishing (regression)', () => {
  const data = { officialDomains: ['hdfc.bank.in'], legacyDomains: ['hdfcbank.com'], groupDomains: [], smsSenderIds: ['HDFCBK', 'HDFCBN'] }
  it('UPI debit alert with toll-free + SMS-banking numbers', () => {
    const sms = 'JD-HDFCBK-S: Sent Rs.232.00\nFrom HDFC Bank A/C *1234\nTo SHOP NAME\nOn 05/10/26\nRef 612345678901\nNot You?\nCall 18002586161/SMS BLOCK UPI to 7308080808'
    const r = checkMessage(sms, data)
    expect(r.verdict).toBe('safe')
    expect(r.flags).toEqual([])
  })
  it('UPI credit alert', () => {
    const r = checkMessage('Credit Alert!\nRs.3500.00 credited to HDFC Bank A/c XX1234 on 13-10-26 from VPA someone@okaxis (UPI 612345678901)', data)
    expect(r.verdict).not.toBe('phishing')
  })
  it('still flags a real personal number and mobile-number senders', () => {
    expect(checkMessage('HDFC: your card is blocked. Call 9876543210 now', data).flags).toContain('Asks you to call a personal mobile number')
    expect(checkMessage('+91 9876543210: HDFC Bank KYC pending, account will be blocked', data).verdict).toBe('phishing')
  })
})
