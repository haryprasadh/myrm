import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Envelope } from './envelope'
import { StaleVaultError, deleteEnvelope, loadEnvelope, replaceEnvelope, saveEnvelope } from './storage'

const env = (rev: number, tag = ''): Envelope => ({
  app: 'myrm',
  format: 1,
  kdf: { alg: 'argon2id', salt: 'AAAAAAAAAAAAAAAAAAAAAA==', m: 8192, t: 1, p: 1 },
  keys: { password: { iv: 'a', ct: 'b' + tag }, passkeys: [] },
  data: { iv: 'c', ct: 'd' + tag },
  updatedAt: '',
  rev,
})

describe('storage compare-and-swap (review #3/#4)', () => {
  beforeEach(async () => deleteEnvelope())

  it('create refuses to overwrite an existing vault', async () => {
    await saveEnvelope(env(0), -1)
    await expect(saveEnvelope(env(0, 'other'), -1)).rejects.toBeInstanceOf(StaleVaultError)
  })

  it('a stale writer cannot overwrite newer data or resurrect an old wrapper', async () => {
    await saveEnvelope(env(0), -1)
    await saveEnvelope(env(1, 'tabA-new-password'), 0) // tab A changes the passphrase
    await expect(saveEnvelope(env(1, 'tabB-old-password'), 0)).rejects.toBeInstanceOf(StaleVaultError) // tab B still at rev 0
    expect((await loadEnvelope())?.keys.password.ct).toBe('btabA-new-password')
  })

  it('restore always lands with a higher rev', async () => {
    await saveEnvelope(env(0), -1)
    await saveEnvelope(env(1), 0)
    const stored = await replaceEnvelope(env(0, 'backup'))
    expect(stored.rev).toBe(2)
    expect((await loadEnvelope())?.data.ct).toBe('dbackup')
  })

  it('a writer from an erased vault cannot land on a new vault with the same rev (verify #3)', async () => {
    await saveEnvelope({ ...env(0), vid: 'old' }, -1)
    await deleteEnvelope() // erased in another tab
    await saveEnvelope({ ...env(0, 'new'), vid: 'new' }, -1) // and a new vault created
    await expect(saveEnvelope({ ...env(1, 'stale'), vid: 'old' }, 0)).rejects.toBeInstanceOf(StaleVaultError)
    expect((await loadEnvelope())?.vid).toBe('new')
  })

  it('rejects writes whose rev is not exactly expectRev + 1', async () => {
    await saveEnvelope(env(0), -1)
    await expect(saveEnvelope(env(5), 0)).rejects.toBeInstanceOf(StaleVaultError)
  })

  it('restore gives the vault a fresh id', async () => {
    await saveEnvelope({ ...env(0), vid: 'a' }, -1)
    const stored = await replaceEnvelope({ ...env(0, 'b'), vid: 'a' })
    expect(stored.vid).not.toBe('a')
    await expect(saveEnvelope({ ...env(1), vid: 'a' }, 0)).rejects.toBeInstanceOf(StaleVaultError)
  })
})
