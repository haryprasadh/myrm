// Vault cryptography. Everything here runs on-device with WebCrypto + Argon2id (hash-wasm).
//
// Key hierarchy
//   DEK  : random AES-256-GCM key. Encrypts the app state and each Sealed field.
//   KEK_pw  = Argon2id(passphrase, salt)            -> wraps the DEK
//   KEK_pk  = HKDF-SHA256(WebAuthn PRF output)      -> wraps the DEK (optional quick unlock)
// The DEK is held in memory only as a non-extractable CryptoKey while unlocked.
// Every ciphertext carries an AAD label so a blob cannot be swapped into another slot.

import { argon2id } from 'hash-wasm'
import type { Sealed } from './schema'

export const AAD = {
  dekPassword: 'myrm/v1/dek-password',
  dekPasskey: 'myrm/v1/dek-passkey',
  data: 'myrm/v1/data',
  sealed: 'myrm/v1/sealed',
} as const

export interface KdfParams {
  alg: 'argon2id'
  salt: string
  /** memory in KiB */
  m: number
  t: number
  p: number
}

/** RFC 9106 second recommended option (64 MiB, t=3), p=1 for browsers. */
export const DEFAULT_KDF: Omit<KdfParams, 'salt'> = { alg: 'argon2id', m: 65536, t: 3, p: 1 }

export interface Box {
  iv: string
  ct: string
}

export class WrongPasswordError extends Error {
  constructor() {
    super('Wrong passphrase')
    this.name = 'WrongPasswordError'
  }
}

const enc = new TextEncoder()
const dec = new TextDecoder()

export function randomBytes(n: number): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(new ArrayBuffer(n)))
}

export function toB64(buf: ArrayBuffer | Uint8Array): string {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let s = ''
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000))
  return btoa(s)
}

export function fromB64(b64: string): Uint8Array<ArrayBuffer> {
  const s = atob(b64)
  const u8 = new Uint8Array(new ArrayBuffer(s.length))
  for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i)
  return u8
}

export function toB64url(buf: ArrayBuffer | Uint8Array): string {
  return toB64(buf).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function fromB64url(s: string): Uint8Array<ArrayBuffer> {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  return fromB64(s.replace(/-/g, '+').replace(/_/g, '/') + pad)
}

export function newKdfParams(): KdfParams {
  return { ...DEFAULT_KDF, salt: toB64(randomBytes(16)) }
}

/** Bounds for KDF params read from disk/backups (unauthenticated): stops "t = 1e9" style freezes. */
export const KDF_BOUNDS = { mMin: 8192, mMax: 262144, tMin: 1, tMax: 10, pMin: 1, pMax: 4 } as const

export function isValidKdf(kdf: unknown): kdf is KdfParams {
  const k = kdf as KdfParams
  if (!k || k.alg !== 'argon2id' || typeof k.salt !== 'string') return false
  const int = (n: unknown, lo: number, hi: number) => Number.isInteger(n) && (n as number) >= lo && (n as number) <= hi
  if (!int(k.m, KDF_BOUNDS.mMin, KDF_BOUNDS.mMax) || !int(k.t, KDF_BOUNDS.tMin, KDF_BOUNDS.tMax) || !int(k.p, KDF_BOUNDS.pMin, KDF_BOUNDS.pMax))
    return false
  try {
    return fromB64(k.salt).length >= 16 && fromB64(k.salt).length <= 64
  } catch {
    return false
  }
}

/** Derive the passphrase key-encryption key. Slow on purpose (~0.5–2 s). */
export async function derivePasswordKek(passphrase: string, kdf: KdfParams): Promise<CryptoKey> {
  if (!isValidKdf(kdf)) throw new Error('Unsupported or unsafe key-derivation settings in this vault file.')
  const raw = await argon2id({
    password: passphrase.normalize('NFKC'),
    salt: fromB64(kdf.salt),
    parallelism: kdf.p,
    iterations: kdf.t,
    memorySize: kdf.m,
    hashLength: 32,
    outputType: 'binary',
  })
  const key = await crypto.subtle.importKey('raw', new Uint8Array(raw), { name: 'AES-GCM' }, false, [
    'wrapKey',
    'unwrapKey',
  ])
  raw.fill(0)
  return key
}

/** Turn a WebAuthn PRF output into a key-encryption key. */
export async function derivePrfKek(prfOutput: ArrayBuffer): Promise<CryptoKey> {
  const ikm = await crypto.subtle.importKey('raw', prfOutput, 'HKDF', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: enc.encode('myrm/v1/prf-salt'), info: enc.encode(AAD.dekPasskey) },
    ikm,
    { name: 'AES-GCM', length: 256 },
    false,
    ['wrapKey', 'unwrapKey'],
  )
}

/** A fresh data key. Extractable only so it can be wrapped right away; use `unwrapDek` for session use. */
export async function generateDek(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
}

export async function wrapDek(dek: CryptoKey, kek: CryptoKey, aad: string): Promise<Box> {
  const iv = randomBytes(12)
  const ct = await crypto.subtle.wrapKey('raw', dek, kek, { name: 'AES-GCM', iv, additionalData: enc.encode(aad) })
  return { iv: toB64(iv), ct: toB64(ct) }
}

/**
 * Unwrap the DEK. `extractable` is true only transiently, when the DEK must be re-wrapped
 * (adding a passkey, changing the passphrase).
 */
export async function unwrapDek(box: Box, kek: CryptoKey, aad: string, extractable = false): Promise<CryptoKey> {
  try {
    return await crypto.subtle.unwrapKey(
      'raw',
      fromB64(box.ct),
      kek,
      { name: 'AES-GCM', iv: fromB64(box.iv), additionalData: enc.encode(aad) },
      { name: 'AES-GCM', length: 256 },
      extractable,
      ['encrypt', 'decrypt'],
    )
  } catch {
    throw new WrongPasswordError()
  }
}

export async function encryptBytes(dek: CryptoKey, data: Uint8Array<ArrayBuffer>, aad: string): Promise<Box> {
  const iv = randomBytes(12)
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: enc.encode(aad) }, dek, data)
  return { iv: toB64(iv), ct: toB64(ct) }
}

export async function decryptBytes(dek: CryptoKey, box: Box, aad: string): Promise<Uint8Array<ArrayBuffer>> {
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromB64(box.iv), additionalData: enc.encode(aad) },
    dek,
    fromB64(box.ct),
  )
  return new Uint8Array(pt)
}

export async function encryptJson(dek: CryptoKey, value: unknown, aad: string = AAD.data): Promise<Box> {
  return encryptBytes(dek, enc.encode(JSON.stringify(value)) as Uint8Array<ArrayBuffer>, aad)
}

export async function decryptJson<T>(dek: CryptoKey, box: Box, aad: string = AAD.data): Promise<T> {
  return JSON.parse(dec.decode(await decryptBytes(dek, box, aad))) as T
}

/** Encrypt a single secret field (PIN, password, card number). */
export async function seal(dek: CryptoKey, plaintext: string): Promise<Sealed> {
  return encryptBytes(dek, enc.encode(plaintext) as Uint8Array<ArrayBuffer>, AAD.sealed)
}

export async function unseal(dek: CryptoKey, sealed: Sealed): Promise<string> {
  return dec.decode(await decryptBytes(dek, sealed, AAD.sealed))
}

// ---------------------------------------------------------------------------
// Passphrase strength (no dictionary download; keeps the bundle small and offline)

const COMMON = ['password', 'hdfc', 'qwerty', 'admin', 'welcome', 'india', '123456', 'abc123', 'iloveyou', 'letmein']

export interface Strength {
  score: 0 | 1 | 2 | 3 | 4
  ok: boolean
  feedback: string
}

export function passphraseStrength(raw: string): Strength {
  // Score exactly what the KDF will see (NFKC), so look-alike characters can't inflate the score.
  const pw = raw.normalize('NFKC')
  const len = [...pw].length
  if (len === 0) return { score: 0, ok: false, feedback: 'Choose a passphrase.' }
  const lower = pw.toLowerCase()
  const compact = lower.replace(/[\s\-_.]+/g, '')
  if (COMMON.some((w) => lower.includes(w)) && len < 20)
    return { score: 0, ok: false, feedback: 'Avoid common words like "password" or "hdfc".' }
  if (/^(.+?)\1+$/.test(compact) || /^(0123456789|1234567890|abcdefghij)/.test(compact))
    return { score: 0, ok: false, feedback: 'Avoid repeated words, characters or sequences.' }
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length
  // Only distinct words count: "mango mango mango mango" is one word repeated.
  const words = new Set(lower.trim().split(/[\s\-_.]+/).filter((w) => w.length >= 3)).size
  let score: Strength['score'] = 0
  if (len >= 10) score = 1
  if (len >= 12 && (classes >= 2 || words >= 3)) score = 2
  if (len >= 16 && (classes >= 3 || words >= 4)) score = 3
  if (len >= 20 && (classes >= 3 || words >= 5)) score = 4
  const ok = score >= 2
  const feedback = ok
    ? score >= 3
      ? 'Strong passphrase.'
      : 'OK. Longer is stronger: 4+ random words is ideal.'
    : 'Use at least 12 characters, e.g. 4 random words: "mango river pencil cloud".'
  return { score, ok, feedback }
}
