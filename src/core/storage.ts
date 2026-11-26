// Minimal IndexedDB wrapper. Only the encrypted Envelope is ever written to disk.

import type { Envelope } from './envelope'

const DB_NAME = 'myrm'
const STORE = 'kv'
const KEY = 'envelope'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode)
        const req = fn(t.objectStore(STORE))
        t.oncomplete = () => {
          db.close()
          resolve(req.result as T)
        }
        t.onerror = () => {
          db.close()
          reject(t.error)
        }
        t.onabort = () => {
          db.close()
          reject(t.error)
        }
      }),
  )
}

export function loadEnvelope(): Promise<Envelope | undefined> {
  return tx<Envelope | undefined>('readonly', (s) => s.get(KEY))
}

export function saveEnvelope(env: Envelope): Promise<void> {
  return tx<IDBValidKey>('readwrite', (s) => s.put(env, KEY)).then(() => undefined)
}

export function deleteEnvelope(): Promise<void> {
  return tx<undefined>('readwrite', (s) => s.delete(KEY))
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
