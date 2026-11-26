// Minimal IndexedDB wrapper. Only the encrypted Envelope is ever written to disk.
// Writes are compare-and-swap on `rev` inside one readwrite transaction, so a stale tab or a
// stale in-memory copy can never overwrite newer data (or resurrect an old passphrase/passkey).

import type { Envelope } from './envelope'

const DB_NAME = 'myrm'
const STORE = 'kv'
const KEY = 'envelope'

export class StaleVaultError extends Error {
  constructor() {
    super('MyRM was changed in another tab or window.')
    this.name = 'StaleVaultError'
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** Run `fn` in one transaction; resolves with fn's result after the transaction commits. */
async function withStore<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore, done: (v: T) => void, fail: (e: unknown) => void) => void): Promise<T> {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE, mode)
    let result: T
    let failure: unknown
    t.oncomplete = () => {
      db.close()
      if (failure) reject(failure)
      else resolve(result)
    }
    t.onerror = () => {
      db.close()
      reject(failure ?? t.error)
    }
    t.onabort = () => {
      db.close()
      reject(failure ?? t.error ?? new Error('Storage transaction aborted'))
    }
    fn(
      t.objectStore(STORE),
      (v) => (result = v),
      (e) => {
        failure = e
        t.abort()
      },
    )
  })
}

/** Resolves undefined only when the store was read successfully and has no vault. Rejects on read errors. */
export function loadEnvelope(): Promise<Envelope | undefined> {
  return withStore<Envelope | undefined>('readonly', (s, done) => {
    const req = s.get(KEY)
    req.onsuccess = () => done(req.result as Envelope | undefined)
  })
}

export const revOf = (e: Envelope | undefined | null): number => (e ? (e.rev ?? 0) : -1)

/**
 * Write `next` only if the stored envelope's rev equals `expectRev` (-1 = must not exist).
 * `next.rev` must be expectRev + 1. Throws StaleVaultError otherwise.
 */
export function saveEnvelope(next: Envelope, expectRev: number): Promise<void> {
  return withStore<void>('readwrite', (s, done, fail) => {
    const req = s.get(KEY)
    req.onsuccess = () => {
      if (revOf(req.result as Envelope | undefined) !== expectRev) return fail(new StaleVaultError())
      s.put(next, KEY).onsuccess = () => done(undefined)
    }
  })
}

/** Unconditional replace (restore from backup). Returns the stored copy with a fresh, higher rev. */
export function replaceEnvelope(env: Envelope): Promise<Envelope> {
  return withStore<Envelope>('readwrite', (s, done) => {
    const req = s.get(KEY)
    req.onsuccess = () => {
      const stored = { ...env, rev: Math.max(revOf(req.result as Envelope | undefined), env.rev ?? 0) + 1 }
      s.put(stored, KEY).onsuccess = () => done(stored)
    }
  })
}

export function deleteEnvelope(): Promise<void> {
  return withStore<void>('readwrite', (s, done) => {
    s.delete(KEY).onsuccess = () => done(undefined)
  })
}

/** Ask the browser not to evict our data (matters on iOS Safari). Best effort. */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (navigator.storage?.persisted && (await navigator.storage.persisted())) return true
    return (await navigator.storage?.persist?.()) ?? false
  } catch {
    return false
  }
}
