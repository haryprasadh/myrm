import { describe, expect, it } from 'vitest'
import { CARD_CATALOG, CARD_CATALOG_AS_OF, CARD_RULE_CHANGES, catalogCard } from './cards'
import type { SpendCategory } from './types'

const categories: SpendCategory[] = [
  'general', 'online', 'dining', 'groceries', 'fuel', 'travel', 'utilities',
  'rent', 'insurance', 'education', 'wallet', 'government', 'smartbuy',
  'swiggy', 'tataneu', 'amazon', 'flipkart', 'international',
]

describe('card catalog', () => {
  it('contains every researched card with unique safe IDs', () => {
    expect(CARD_CATALOG_AS_OF).toBe('2026-11-27')
    expect(CARD_CATALOG).toHaveLength(32)
    const ids = CARD_CATALOG.map((card) => card.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(?:[_-][a-z0-9]+)*$/)
    expect(CARD_CATALOG.filter((card) => card.kind === 'debit')).toHaveLength(5)
  })

  it('has valid provenance, rates and category keys', () => {
    for (const card of CARD_CATALOG) {
      expect(card.name.trim()).not.toBe('')
      expect(['credit', 'debit']).toContain(card.kind)
      expect(Array.isArray(card.networks)).toBe(true)
      if (card.networks.length === 0) expect(card.unverified).toContain('networks')
      expect(card.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(card.source).toMatch(/^https:\/\//)
      for (const rate of [card.baseRatePct, ...Object.values(card.categoryRatePct)]) {
        if (rate !== null) {
          expect(rate).toBeGreaterThanOrEqual(0)
          expect(rate).toBeLessThanOrEqual(40)
        }
      }
      for (const key of Object.keys(card.categoryRatePct)) expect(categories).toContain(key)
      for (const [key, value] of Object.entries(card.fees)) {
        if (value === null) expect(card.unverified).toContain(`fees.${key}`)
      }
      if (card.baseRatePct === null) expect(card.unverified).toContain('baseRatePct')
      if (card.forexMarkupPct === null) expect(card.unverified).toContain('forexMarkupPct')
      expect(JSON.stringify(card)).not.toMatch(/TODO/i)
    }
  })

  it('uses the verified Infinia SmartBuy value', () => {
    expect(catalogCard('infinia_metal')?.baseRatePct).toBeCloseTo(3.33, 2)
    expect(catalogCard('infinia_metal')?.categoryRatePct.smartbuy).toBeCloseTo(16.67, 2)
    expect(catalogCard(undefined)).toBeUndefined()
  })

  it('links every dated rule change to known cards and an official source', () => {
    const ids = new Set(CARD_CATALOG.map((card) => card.id))
    for (const change of CARD_RULE_CHANGES) {
      expect(change.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(change.cards.length).toBeGreaterThan(0)
      for (const id of change.cards) expect(ids.has(id)).toBe(true)
      expect(change.source).toMatch(/^https:\/\//)
      expect(JSON.stringify(change)).not.toMatch(/TODO/i)
    }
  })
})
