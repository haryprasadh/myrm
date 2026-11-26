// Face ID / fingerprint quick-unlock via WebAuthn passkeys with the PRF extension.
// The authenticator returns a secret (PRF output) only after user verification; we turn it
// into a key that wraps the vault key. No server: the challenge is random and only the PRF
// output matters. Unsupported browsers simply keep passphrase unlock.

import { fromB64, fromB64url, randomBytes, toB64, toB64url } from './crypto'
import type { PasskeyWrap } from './envelope'

interface PrfResults {
  enabled?: boolean
  results?: { first?: ArrayBuffer }
}

function prfOf(cred: PublicKeyCredential): PrfResults | undefined {
  return (cred.getClientExtensionResults() as { prf?: PrfResults }).prf
}

export function passkeysAvailable(): boolean {
  return typeof window !== 'undefined' && 'PublicKeyCredential' in window && window.isSecureContext
}

/** True / false when the browser can say; undefined when it can't (we then just try). */
export async function prfSupported(): Promise<boolean | undefined> {
  if (!passkeysAvailable()) return false
  const getCaps = (PublicKeyCredential as unknown as { getClientCapabilities?: () => Promise<Record<string, boolean>> })
    .getClientCapabilities
  if (!getCaps) return undefined
  try {
    const caps = await getCaps()
    return caps['extension:prf'] ?? undefined
  } catch {
    return undefined
  }
}

export interface PrfAssertion {
  credId: string
  prfOutput: ArrayBuffer
}

/** Ask for an existing passkey and evaluate PRF with each credential's salt. */
export async function assertPrf(wraps: Pick<PasskeyWrap, 'credId' | 'prfSalt'>[]): Promise<PrfAssertion> {
  const evalByCredential: Record<string, { first: ArrayBuffer }> = {}
  for (const w of wraps) evalByCredential[w.credId] = { first: fromB64(w.prfSalt).buffer }
  const cred = (await navigator.credentials.get({
    publicKey: {
      challenge: randomBytes(32),
      rpId: location.hostname,
      allowCredentials: wraps.map((w) => ({ type: 'public-key' as const, id: fromB64url(w.credId) })),
      userVerification: 'required',
      timeout: 60_000,
      extensions: { prf: { evalByCredential } } as AuthenticationExtensionsClientInputs,
    },
  })) as PublicKeyCredential | null
  if (!cred) throw new Error('Passkey prompt was cancelled.')
  const first = prfOf(cred)?.results?.first
  if (!first) throw new Error('This passkey or browser does not support secure unlock (PRF).')
  return { credId: toB64url(cred.rawId), prfOutput: first }
}

/** Create a new passkey for this vault and return its PRF output (may prompt twice). */
export async function registerPrfPasskey(label: string): Promise<PrfAssertion & { prfSalt: string }> {
  const prfSalt = randomBytes(32)
  const cred = (await navigator.credentials.create({
    publicKey: {
      challenge: randomBytes(32),
      rp: { name: 'MyRM', id: location.hostname },
      user: { id: randomBytes(16), name: `myrm-${label}`, displayName: `MyRM vault (${label})` },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: { residentKey: 'preferred', userVerification: 'required' },
      timeout: 60_000,
      extensions: { prf: { eval: { first: prfSalt.buffer } } } as AuthenticationExtensionsClientInputs,
    },
  })) as PublicKeyCredential | null
  if (!cred) throw new Error('Passkey creation was cancelled.')
  const credId = toB64url(cred.rawId)
  const prf = prfOf(cred)
  if (prf?.enabled === false) throw new Error('This device created a passkey without PRF support; use your passphrase.')
  const saltB64 = toB64(prfSalt)
  // Some authenticators return PRF output at creation; others need an assertion.
  const first = prf?.results?.first ?? (await assertPrf([{ credId, prfSalt: saltB64 }])).prfOutput
  return { credId, prfOutput: first, prfSalt: saltB64 }
}
