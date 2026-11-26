import type { CatalogCard } from './types'

// Filled from research; see each card's source + lastVerified. Placeholder until data lands.
export const CARD_CATALOG_AS_OF = '2026-11-27'
export const CARD_CATALOG: CatalogCard[] = []

export function catalogCard(id: string | undefined): CatalogCard | undefined {
  return id ? CARD_CATALOG.find((c) => c.id === id) : undefined
}
