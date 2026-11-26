import { describe, expect, it } from 'vitest'
import type { Credential, UserCard, Account } from '@/core/schema'
import { ageBadge, clipboardSeconds, defaultLabel, groupCredentials, kindMeta, validateSecret } from './logic'

const credential = (id: string, linkedTo?: Credential['linkedTo']): Credential => ({ id, linkedTo, kind: 'card_pin', label: id, mode: 'hint', hint: 'Memory clue', createdAt: '', updatedAt: '' })
describe('secret validation', () => {
  it.each(['card_pin', 'mpin'] as const)('%s accepts 4–6 ASCII digits including leading zeroes', kind => {
    for (const value of ['0000', '12345', '123456']) expect(validateSecret(kind, value)).toBeNull()
    for (const value of ['', '123', '1234567', ' 1234', '1234\n', '１２３４', '12.4', '-1234']) expect(validateSecret(kind, value)).not.toBeNull()
  })
  it('UPI allows exactly 4 or 6 digits', () => {
    expect(validateSecret('upi_pin', '0000')).toBeNull()
    expect(validateSecret('upi_pin', '123456')).toBeNull()
    expect(validateSecret('upi_pin', '12345')).not.toBeNull()
  })
  it('TPIN requires digits; passwords require non-whitespace', () => {
    expect(validateSecret('tpin', '0')).toBeNull()
    for (const value of ['', '123x', ' 123']) expect(validateSecret('tpin', value)).not.toBeNull()
    for (const kind of ['netbanking', 'other'] as const) {
      expect(validateSecret(kind, '  ')).not.toBeNull()
      expect(validateSecret(kind, ' a b ')).toBeNull()
    }
  })
})
it('builds labels without requiring catalog data', () => {
  expect(defaultLabel('card_pin', 'Regalia Gold')).toBe('Regalia Gold card PIN')
  expect(defaultLabel('upi_pin', 'Salary', 'GPay')).toBe('Salary GPay UPI PIN')
  expect(defaultLabel('upi_pin', '', 'PhonePe')).toBe('PhonePe UPI PIN')
  for (const kind of Object.keys(kindMeta) as (keyof typeof kindMeta)[]) expect(defaultLabel(kind)).toBe(kindMeta[kind].label)
})
it('groups by typed identity, preserves duplicate names, puts orphan links in Other without mutation', () => {
  const cards: UserCard[] = [{ id: '1', nickname: 'Same', kind: 'credit' }]
  const accounts: Account[] = [{ id: '1', nickname: 'Same', type: 'savings' }]
  const input = [credential('orphan', { type: 'card', id: 'gone' }), credential('card', { type: 'card', id: '1' }), credential('account', { type: 'account', id: '1' }), credential('unlinked')]
  const groups = groupCredentials(input, cards, accounts)
  expect(groups.map(g => g.key)).toEqual(['card:1', 'account:1', 'other'])
  expect(groups[2].credentials.map(c => c.id)).toEqual(['orphan', 'unlinked'])
  expect(input[0].id).toBe('orphan')
  expect(groupCredentials([], [], [])).toEqual([])
  expect(groupCredentials(input, [], [])).toHaveLength(1)
})
describe('calendar age', () => {
  it('handles leap days and month ends', () => {
    expect(ageBadge('2024-02-28T23:00:00', new Date('2024-03-01T01:00:00')).label).toBe('Changed 2 days ago')
    expect(ageBadge('2025-01-31T12:00:00', new Date('2025-02-01T12:00:00')).label).toBe('Changed 1 day ago')
  })
  it('warns only after 365 days', () => {
    expect(ageBadge('2025-01-01', new Date('2026-01-01')).tone).toBe('neutral')
    expect(ageBadge('2025-01-01', new Date('2026-01-02')).tone).toBe('warn')
  })
  it('handles future and invalid dates', () => {
    expect(ageBadge('2030-01-01', new Date('2026-01-01')).label).toBe('Changed today')
    expect(ageBadge('bad').label).toBe('Change date unknown')
    expect(ageBadge('', new Date(NaN)).tone).toBe('neutral')
  })
})
it('bounds clipboard delays and handles bad settings', () => {
  for (const value of [NaN, Infinity, 0, -1]) expect(clipboardSeconds(value)).toBe(20)
  expect(clipboardSeconds(2.9)).toBe(2)
  expect(clipboardSeconds(0.1)).toBe(1)
  expect(clipboardSeconds(1e20)).toBe(2147483)
})
