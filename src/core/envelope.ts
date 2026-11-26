// The on-disk / backup format. Pure functions over WebCrypto; no DOM or React here (unit-tested).

import {
  AAD,
  type Box,
  type KdfParams,
  WrongPasswordError,
  decryptJson,
  derivePasswordKek,
  derivePrfKek,
  encryptJson,
  generateDek,
  newKdfParams,
  unwrapDek,
  wrapDek,
} from './crypto'
import { type AppState, normalizeState } from './schema'

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
}

export function isEnvelope(x: unknown): x is Envelope {
  const e = x as Envelope
  return (
    !!e &&
    e.app === 'myrm' &&
    e.format === 1 &&
    e.kdf?.alg === 'argon2id' &&
    typeof e.kdf.salt === 'string' &&
    typeof e.keys?.password?.ct === 'string' &&
    Array.isArray(e.keys?.passkeys) &&
    typeof e.data?.ct === 'string'
  )
}

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
    env: { app: 'myrm', format: 1, kdf, keys: { password, passkeys: [] }, data, updatedAt: new Date().toISOString() },
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
  return { ...env, data: await encryptJson(dek, state), updatedAt: new Date().toISOString() }
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
    updatedAt: new Date().toISOString(),
  }
}

export function removePasskeyWrap(env: Envelope, credId: string): Envelope {
  return {
    ...env,
    keys: { ...env.keys, passkeys: env.keys.passkeys.filter((w) => w.credId !== credId) },
    updatedAt: new Date().toISOString(),
  }
}

/** Change the passphrase. Same DEK, new salt; passkey wraps stay valid. */
export async function changePassphraseWrap(
  env: Envelope,
  oldPass: string,
  newPass: string,
  kdf: KdfParams = newKdfParams(),
): Promise<Envelope> {
  const oldKek = await derivePasswordKek(oldPass, env.kdf)
  const dekX = await unwrapDek(env.keys.password, oldKek, AAD.dekPassword, true)
  const password = await wrapDek(dekX, await derivePasswordKek(newPass, kdf), AAD.dekPassword)
  return { ...env, kdf, keys: { ...env.keys, password }, updatedAt: new Date().toISOString() }
}

export function parseBackup(text: string): Envelope {
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
