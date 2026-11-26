// The on-disk / backup format. Pure functions over WebCrypto; no DOM or React here (unit-tested).

import {
  AAD,
  type Box,
  type KdfParams,
  WrongPasswordError,
  decryptJson,
  isValidKdf,
  seal,
  unseal,
  derivePasswordKek,
  derivePrfKek,
  encryptJson,
  generateDek,
  newKdfParams,
  unwrapDek,
  wrapDek,
} from './crypto'
import { type AppState, type Sealed, normalizeState } from './schema'

export interface PasskeyWrap {
  /** WebAuthn credential id, base64url. */
  credId: string
  /** PRF input salt, base64. */
  prfSalt: string
  label: string
  createdAt: string
  box: Box
}

export interface Envelope {
  app: 'myrm'
  format: 1
  kdf: KdfParams
  keys: { password: Box; passkeys: PasskeyWrap[] }
  data: Box
  updatedAt: string
  /** Monotonic write counter used for compare-and-swap saves (see storage.ts). Missing = 0. */
  rev?: number
}

const isBox = (b: unknown): b is Box => !!b && typeof (b as Box).iv === 'string' && typeof (b as Box).ct === 'string'

export function isEnvelope(x: unknown): x is Envelope {
  const e = x as Envelope
  return (
    !!e &&
    e.app === 'myrm' &&
    e.format === 1 &&
    isValidKdf(e.kdf) &&
    isBox(e.keys?.password) &&
    Array.isArray(e.keys?.passkeys) &&
    e.keys.passkeys.length <= 20 &&
    e.keys.passkeys.every((p) => typeof p?.credId === 'string' && typeof p.prfSalt === 'string' && isBox(p.box)) &&
    isBox(e.data) &&
    (e.rev === undefined || (Number.isInteger(e.rev) && e.rev >= 0))
  )
}

const next = (env: Envelope): Pick<Envelope, 'rev' | 'updatedAt'> => ({ rev: (env.rev ?? 0) + 1, updatedAt: new Date().toISOString() })

export interface Opened {
  dek: CryptoKey
  state: AppState
}

/** Create a new vault. `kdf` is overridable only so tests can run fast. */
export async function createEnvelope(
  passphrase: string,
  state: AppState,
  kdf: KdfParams = newKdfParams(),
): Promise<{ env: Envelope; dek: CryptoKey }> {
  const extractableDek = await generateDek()
  const kek = await derivePasswordKek(passphrase, kdf)
  const password = await wrapDek(extractableDek, kek, AAD.dekPassword)
  // Session copy is non-extractable.
  const dek = await unwrapDek(password, kek, AAD.dekPassword, false)
  const data = await encryptJson(dek, state)
  return {
    env: { app: 'myrm', format: 1, kdf, keys: { password, passkeys: [] }, data, updatedAt: new Date().toISOString(), rev: 0 },
    dek,
  }
}

export async function openWithPassphrase(env: Envelope, passphrase: string): Promise<Opened> {
  const kek = await derivePasswordKek(passphrase, env.kdf)
  const dek = await unwrapDek(env.keys.password, kek, AAD.dekPassword)
  return { dek, state: normalizeState(await decryptJson(dek, env.data)) }
}

export async function openWithPrf(env: Envelope, credId: string, prfOutput: ArrayBuffer): Promise<Opened> {
  const wrap = env.keys.passkeys.find((p) => p.credId === credId)
  if (!wrap) throw new Error('This passkey is not registered for this vault.')
  const kek = await derivePrfKek(prfOutput)
  const dek = await unwrapDek(wrap.box, kek, AAD.dekPasskey)
  return { dek, state: normalizeState(await decryptJson(dek, env.data)) }
}

export async function writeState(env: Envelope, dek: CryptoKey, state: AppState): Promise<Envelope> {
  return { ...env, data: await encryptJson(dek, state), ...next(env) }
}

/** Re-auth with the passphrase, then add a passkey-wrapped copy of the DEK. */
export async function addPasskeyWrap(
  env: Envelope,
  passphrase: string,
  p: { credId: string; prfSalt: string; prfOutput: ArrayBuffer; label: string },
): Promise<Envelope> {
  const kek = await derivePasswordKek(passphrase, env.kdf)
  const dekX = await unwrapDek(env.keys.password, kek, AAD.dekPassword, true)
  const box = await wrapDek(dekX, await derivePrfKek(p.prfOutput), AAD.dekPasskey)
  const wrap: PasskeyWrap = {
    credId: p.credId,
    prfSalt: p.prfSalt,
    label: p.label,
    createdAt: new Date().toISOString(),
    box,
  }
  return {
    ...env,
    keys: { ...env.keys, passkeys: [...env.keys.passkeys.filter((w) => w.credId !== p.credId), wrap] },
    ...next(env),
  }
}

export function removePasskeyWrap(env: Envelope, credId: string): Envelope {
  return {
    ...env,
    keys: { ...env.keys, passkeys: env.keys.passkeys.filter((w) => w.credId !== credId) },
    ...next(env),
  }
}

function isSealed(v: unknown): v is Sealed {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false
  const keys = Object.keys(v)
  return keys.length === 2 && isBox(v)
}

/** Re-encrypt every Sealed field (any {iv, ct} object anywhere in the state) from one DEK to another. */
export async function resealState<T>(value: T, from: CryptoKey, to: CryptoKey): Promise<T> {
  if (isSealed(value)) return (await seal(to, await unseal(from, value))) as T
  if (Array.isArray(value)) return (await Promise.all(value.map((v) => resealState(v, from, to)))) as T
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) out[k] = await resealState(v, from, to)
    return out as T
  }
  return value
}

/**
 * Change the passphrase AND rotate the data key: old copies of the envelope (and their wrappers)
 * can't decrypt anything written afterwards. Passkey wrappers are dropped (they wrap the old key);
 * the user re-adds Face ID / fingerprint unlock.
 */
export async function changePassphraseRotate(
  env: Envelope,
  state: AppState,
  oldPass: string,
  newPass: string,
  kdf: KdfParams = newKdfParams(),
): Promise<{ env: Envelope; dek: CryptoKey; state: AppState }> {
  const oldDek = await unwrapDek(env.keys.password, await derivePasswordKek(oldPass, env.kdf), AAD.dekPassword)
  const newKek = await derivePasswordKek(newPass, kdf)
  return rotateWith(env, state, oldDek, newKek, kdf)
}

async function rotateWith(
  env: Envelope,
  state: AppState,
  oldDek: CryptoKey,
  newKek: CryptoKey,
  kdf: KdfParams,
): Promise<{ env: Envelope; dek: CryptoKey; state: AppState }> {
  const fresh = await generateDek()
  const password = await wrapDek(fresh, newKek, AAD.dekPassword)
  const dek = await unwrapDek(password, newKek, AAD.dekPassword, false)
  const resealed = await resealState(state, oldDek, dek)
  return {
    env: { ...env, kdf, keys: { password, passkeys: [] }, data: await encryptJson(dek, resealed), ...next(env) },
    dek,
    state: resealed,
  }
}

/** Re-seal a state that changed while a rotation was running (all its Sealed values use oldDek). */
export { resealState as resealLatest }

export const MAX_BACKUP_BYTES = 32 * 1024 * 1024

export function parseBackup(text: string): Envelope {
  if (text.length > MAX_BACKUP_BYTES) throw new Error('This file is too large to be a MyRM backup.')
  let x: unknown
  try {
    x = JSON.parse(text)
  } catch {
    throw new Error('This file is not a MyRM backup (not JSON).')
  }
  if (!isEnvelope(x)) throw new Error('This file is not a MyRM backup.')
  return x
}

export { WrongPasswordError }
