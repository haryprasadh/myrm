import { describe, expect, it } from 'vitest'
import { AAD, decryptJson, newKdfParams, passphraseStrength, seal, unseal, WrongPasswordError } from './crypto'
import {
  addPasskeyWrap,
  changePassphraseWrap,
  createEnvelope,
  isEnvelope,
  openWithPassphrase,
  openWithPrf,
  parseBackup,
  removePasskeyWrap,
  writeState,
} from './envelope'
import { emptyState } from './schema'

// Light KDF params keep the suite fast; production uses DEFAULT_KDF (64 MiB, t=3).
const fastKdf = () => ({ ...newKdfParams(), m: 1024, t: 1 })
const PASS = 'mango river pencil cloud'

describe('envelope', () => {
  it('round-trips state with the right passphrase', async () => {
    const s = emptyState()
    s.profile.name = 'Asha'
    const { env } = await createEnvelope(PASS, s, fastKdf())
    expect(isEnvelope(env)).toBe(true)
    const opened = await openWithPassphrase(env, PASS)
    expect(opened.state.profile.name).toBe('Asha')
  })

  it('rejects a wrong passphrase', async () => {
    const { env } = await createEnvelope(PASS, emptyState(), fastKdf())
    await expect(openWithPassphrase(env, 'wrong pass phrase here')).rejects.toBeInstanceOf(WrongPasswordError)
  })

  it('never stores plaintext', async () => {
    const s = emptyState()
    s.profile.name = 'UNIQUE_MARKER_123'
    const { env } = await createEnvelope(PASS, s, fastKdf())
    expect(JSON.stringify(env)).not.toContain('UNIQUE_MARKER_123')
  })

  it('session DEK is not extractable', async () => {
    const { dek } = await createEnvelope(PASS, emptyState(), fastKdf())
    expect(dek.extractable).toBe(false)
    await expect(crypto.subtle.exportKey('raw', dek)).rejects.toBeTruthy()
  })

  it('writes new state and keeps the passphrase valid', async () => {
    const { env, dek } = await createEnvelope(PASS, emptyState(), fastKdf())
    const s2 = emptyState()
    s2.profile.name = 'Updated'
    const env2 = await writeState(env, dek, s2)
    expect((await openWithPassphrase(env2, PASS)).state.profile.name).toBe('Updated')
  })

  it('binds ciphertext to its slot (AAD)', async () => {
    const { env, dek } = await createEnvelope(PASS, emptyState(), fastKdf())
    await expect(decryptJson(dek, env.data, AAD.sealed)).rejects.toBeTruthy()
  })

  it('seals and unseals individual secrets', async () => {
    const { dek } = await createEnvelope(PASS, emptyState(), fastKdf())
    const sealed = await seal(dek, '4821')
    expect(JSON.stringify(sealed)).not.toContain('4821')
    expect(await unseal(dek, sealed)).toBe('4821')
  })

  it('unlocks via a passkey PRF output and rejects a different PRF output', async () => {
    const { env } = await createEnvelope(PASS, emptyState(), fastKdf())
    const prf = crypto.getRandomValues(new Uint8Array(32)).buffer
    const env2 = await addPasskeyWrap(env, PASS, { credId: 'cred1', prfSalt: 'c2FsdA==', prfOutput: prf, label: 'Phone' })
    expect((await openWithPrf(env2, 'cred1', prf)).state.version).toBe(1)
    const other = crypto.getRandomValues(new Uint8Array(32)).buffer
    await expect(openWithPrf(env2, 'cred1', other)).rejects.toBeInstanceOf(WrongPasswordError)
    await expect(openWithPrf(removePasskeyWrap(env2, 'cred1'), 'cred1', prf)).rejects.toThrow(/not registered/)
  })

  it('adding a passkey requires the passphrase', async () => {
    const { env } = await createEnvelope(PASS, emptyState(), fastKdf())
    const prf = new Uint8Array(32).buffer
    await expect(
      addPasskeyWrap(env, 'not the passphrase', { credId: 'c', prfSalt: 'eA==', prfOutput: prf, label: 'x' }),
    ).rejects.toBeInstanceOf(WrongPasswordError)
  })

  it('changes passphrase; old one stops working, passkeys survive', async () => {
    const { env } = await createEnvelope(PASS, emptyState(), fastKdf())
    const prf = crypto.getRandomValues(new Uint8Array(32)).buffer
    const withPk = await addPasskeyWrap(env, PASS, { credId: 'c1', prfSalt: 'eA==', prfOutput: prf, label: 'p' })
    const changed = await changePassphraseWrap(withPk, PASS, 'new long pass phrase words', fastKdf())
    await expect(openWithPassphrase(changed, PASS)).rejects.toBeInstanceOf(WrongPasswordError)
    expect((await openWithPassphrase(changed, 'new long pass phrase words')).state.version).toBe(1)
    expect((await openWithPrf(changed, 'c1', prf)).state.version).toBe(1)
  })

  it('parses backups and rejects junk', async () => {
    const { env } = await createEnvelope(PASS, emptyState(), fastKdf())
    expect(parseBackup(JSON.stringify(env)).app).toBe('myrm')
    expect(() => parseBackup('{"hello":1}')).toThrow(/not a MyRM backup/)
    expect(() => parseBackup('nope')).toThrow(/not JSON/)
  })
})

describe('passphraseStrength', () => {
  it('rejects weak and accepts multi-word passphrases', () => {
    expect(passphraseStrength('').ok).toBe(false)
    expect(passphraseStrength('password123456').ok).toBe(false)
    expect(passphraseStrength('Hdfc@2024').ok).toBe(false)
    expect(passphraseStrength('1111111111111').ok).toBe(false)
    expect(passphraseStrength('mango river pencil cloud').ok).toBe(true)
    expect(passphraseStrength('mango river pencil cloud').score).toBeGreaterThanOrEqual(3)
  })
})
