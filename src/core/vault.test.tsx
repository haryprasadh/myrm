// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { unseal } from './crypto'
import { openWithPassphrase } from './envelope'
import * as storage from './storage'
import { type VaultApi, VaultProvider, useVault } from './vault'

vi.mock('./storage', async (orig) => {
  const real = await orig<typeof import('./storage')>()
  return { ...real, saveEnvelope: vi.fn(real.saveEnvelope) }
})

const PASS = 'mango river pencil cloud'
let api: VaultApi
function Probe() {
  api = useVault()
  return null
}
const wait = (ms: number) => act(() => new Promise((r) => setTimeout(r, ms)))

async function setup() {
  render(
    <VaultProvider>
      <Probe />
    </VaultProvider>,
  )
  await wait(50)
  await act(() => api.create(PASS))
  expect(api.status).toBe('unlocked')
}

describe('VaultProvider (security review regressions)', () => {
  beforeEach(async () => {
    await storage.deleteEnvelope()
  })
  afterEach(() => vi.mocked(storage.saveEnvelope).mockClear())

  it('one failed save does not wedge later saves (review #2)', async () => {
    await setup()
    vi.mocked(storage.saveEnvelope).mockRejectedValueOnce(new Error('QuotaExceededError'))
    act(() => api.update((s) => ({ ...s, profile: { name: 'first' } })))
    await wait(600)
    expect(api.saveError).toMatch(/Couldn't save/)
    act(() => api.update((s) => ({ ...s, profile: { name: 'second' } })))
    await wait(600)
    expect(api.saveError).toBeNull()
    const env = await storage.loadEnvelope()
    expect((await openWithPassphrase(env!, PASS)).state.profile.name).toBe('second')
  })

  it('lock takes effect immediately and still saves the last edit (review #5)', async () => {
    await setup()
    act(() => api.update((s) => ({ ...s, profile: { name: 'just-typed' } })))
    act(() => api.lock())
    expect(api.status).toBe('locked')
    expect(api.state).toBeNull()
    await expect(api.unseal({ iv: 'x', ct: 'y' })).rejects.toThrow(/locked/)
    await wait(300)
    const env = await storage.loadEnvelope()
    expect((await openWithPassphrase(env!, PASS)).state.profile.name).toBe('just-typed')
  })

  it('a late unlock that finishes after a lock does not reopen the vault (review #5)', async () => {
    await setup()
    act(() => api.lock())
    let late!: Promise<void>
    act(() => {
      late = api.unlockWithPassphrase(PASS)
    })
    act(() => api.lock()) // user (or another tab) locks again while Argon2 runs
    await act(async () => {
      await expect(late).rejects.toThrow(/locked/)
    })
    expect(api.status).toBe('locked')
  })

  it('does not auto-prompt Face ID after a deliberate lock (review #13)', async () => {
    await setup()
    act(() => api.lock())
    expect(api.autoPasskey).toBe(false)
  })

  it('edits made during a passphrase change are kept and the vault still opens (verify #1)', async () => {
    await setup()
    let sealed!: Awaited<ReturnType<VaultApi['seal']>>
    await act(async () => {
      sealed = await api.seal('4821')
    })
    act(() => api.update((s) => ({ ...s, credentials: [{ id: 'c', kind: 'card_pin', label: 'PIN', mode: 'secret', secret: sealed, createdAt: '', updatedAt: '' }] })))
    await wait(600)
    const NEW = 'river cloud pencil mango lamp'
    let change!: Promise<void>
    act(() => {
      change = api.changePassphrase(PASS, NEW)
    })
    await wait(40) // inside the rotation
    act(() => api.update((s) => ({ ...s, profile: { name: 'edited-during-rotation' } })))
    await act(() => change)
    await wait(700)
    const env = await storage.loadEnvelope()
    const opened = await openWithPassphrase(env!, NEW)
    expect(opened.state.profile.name).toBe('edited-during-rotation')
    expect(await unseal(opened.dek, opened.state.credentials[0].secret!)).toBe('4821')
    await expect(openWithPassphrase(env!, PASS)).rejects.toBeTruthy()
  })

  it('locking during a passphrase change keeps the vault locked and the old passphrase (verify #2)', async () => {
    await setup()
    let change!: Promise<void>
    act(() => {
      change = api.changePassphrase(PASS, 'river cloud pencil mango lamp')
    })
    await wait(40)
    act(() => api.lock())
    await act(async () => {
      await expect(change).rejects.toThrow(/locked/)
    })
    expect(api.status).toBe('locked')
    expect(api.state).toBeNull()
    const env = await storage.loadEnvelope()
    expect((await openWithPassphrase(env!, PASS)).state.version).toBe(1)
  })
})
