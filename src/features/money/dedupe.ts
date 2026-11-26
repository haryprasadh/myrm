import type { Txn } from '@/core/schema'

export function transactionKey(txn: Pick<Txn, 'source' | 'date' | 'amount' | 'description' | 'refNo'>): string {
  return [txn.source.type, txn.source.id, txn.date, txn.amount.toFixed(2), txn.description.trim().toUpperCase().replace(/\s+/g, ' '), txn.refNo?.trim().toUpperCase() ?? ''].join('|')
}

export function uniqueTransactions<T extends Pick<Txn, 'source' | 'date' | 'amount' | 'description' | 'refNo'>>(incoming: T[], existing: T[]): { unique: T[]; skipped: number } {
  const seen = new Set(existing.map(transactionKey))
  const unique: T[] = []
  for (const txn of incoming) {
    const key = transactionKey(txn)
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(txn)
  }
  return { unique, skipped: incoming.length - unique.length }
}
