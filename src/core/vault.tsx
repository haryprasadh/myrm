// VaultProvider: owns the decrypted state in memory, persists it encrypted, and auto-locks.
// Feature code uses `useVault()` (status, state, update, seal/unseal) and never touches keys.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { seal as sealWith, unseal as unsealWith } from './crypto'
import {
  type Envelope,
  addPasskeyWrap,
  changePassphraseWrap,
  createEnvelope,
  openWithPassphrase,
  openWithPrf,
  parseBackup,
  removePasskeyWrap,
  writeState,
} from './envelope'
import { assertPrf, registerPrfPasskey } from './passkey'
import { type AppState, type Sealed, emptyState } from './schema'
import { deleteEnvelope, loadEnvelope, requestPersistence, saveEnvelope } from './storage'

export type VaultStatus = 'loading' | 'new' | 'locked' | 'unlocked'

export interface VaultApi {
  status: VaultStatus
  /** Decrypted state. Non-null only when status === 'unlocked'. */
  state: AppState | null
  /** Immutable update; persisted (encrypted) shortly after. */
  update: (fn: (s: AppState) => AppState) => void
  seal: (plaintext: string) => Promise<Sealed>
  unseal: (sealed: Sealed) => Promise<string>
  create: (passphrase: string) => Promise<void>
  unlockWithPassphrase: (passphrase: string) => Promise<void>
  unlockWithPasskey: () => Promise<void>
  lock: () => Promise<void>
  passkeys: { credId: string; label: string; createdAt: string }[]
  addPasskey: (passphrase: string, label: string) => Promise<void>
  removePasskey: (credId: string) => Promise<void>
  changePassphrase: (oldPass: string, newPass: string) => Promise<void>
  /** Encrypted backup file contents (same passphrase). */
  exportBackup: () => Promise<Blob>
  /** Replace this device's vault with a backup; requires the backup's passphrase. */
  importBackup: (text: string, passphrase: string) => Promise<void>
  /** Permanently delete everything on this device. */
  wipe: () => Promise<void>
  lastSavedAt: string | null
  persisted: boolean
}

const VaultContext = createContext<VaultApi | null>(null)

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'wheel'] as const
const HIDDEN_LOCK_MS = 60_000

export function VaultProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<VaultStatus>('loading')
  const [state, setState] = useState<AppState | null>(null)
  const [env, setEnv] = useState<Envelope | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [persisted, setPersisted] = useState(false)

  const dekRef = useRef<CryptoKey | null>(null)
  const envRef = useRef<Envelope | null>(null)
  const stateRef = useRef<AppState | null>(null)
  const saveChain = useRef<Promise<void>>(Promise.resolve())
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dirty = useRef(false)
  const lastActivity = useRef(Date.now())

  const setEnvBoth = (e: Envelope | null) => {
    envRef.current = e
    setEnv(e)
  }

  useEffect(() => {
    loadEnvelope()
      .then((e) => {
        setEnvBoth(e ?? null)
        setStatus(e ? 'locked' : 'new')
      })
      .catch(() => setStatus('new'))
  }, [])

  const persistNow = useCallback((): Promise<void> => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
    saveChain.current = saveChain.current.then(async () => {
      if (!dirty.current) return
      const dek = dekRef.current
      const e = envRef.current
      const s = stateRef.current
      if (!dek || !e || !s) return
      dirty.current = false
      const next = await writeState(e, dek, s)
      await saveEnvelope(next)
      setEnvBoth(next)
      setLastSavedAt(next.updatedAt)
    })
    return saveChain.current
  }, [])

  const update = useCallback(
    (fn: (s: AppState) => AppState) => {
      const cur = stateRef.current
      if (!cur) return
      const next = fn(cur)
      stateRef.current = next
      setState(next)
      dirty.current = true
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => void persistNow(), 400)
    },
    [persistNow],
  )

  const enter = useCallback(async (dek: CryptoKey, s: AppState, e: Envelope) => {
    dekRef.current = dek
    stateRef.current = s
    setEnvBoth(e)
    setState(s)
    lastActivity.current = Date.now()
    setStatus('unlocked')
    setPersisted(await requestPersistence())
  }, [])

  const lock = useCallback(async () => {
    try {
      await persistNow()
    } finally {
      dekRef.current = null
      stateRef.current = null
      setState(null)
      setStatus(envRef.current ? 'locked' : 'new')
    }
  }, [persistNow])

  const create = useCallback(
    async (passphrase: string) => {
      const { env: e, dek } = await createEnvelope(passphrase, emptyState())
      await saveEnvelope(e)
      await enter(dek, emptyState(), e)
    },
    [enter],
  )

  const unlockWithPassphrase = useCallback(
    async (passphrase: string) => {
      const e = envRef.current
      if (!e) throw new Error('No vault on this device.')
      const { dek, state: s } = await openWithPassphrase(e, passphrase)
      await enter(dek, s, e)
    },
    [enter],
  )

  const unlockWithPasskey = useCallback(async () => {
    const e = envRef.current
    if (!e || e.keys.passkeys.length === 0) throw new Error('No passkey set up for this vault.')
    const { credId, prfOutput } = await assertPrf(e.keys.passkeys)
    const { dek, state: s } = await openWithPrf(e, credId, prfOutput)
    await enter(dek, s, e)
  }, [enter])

  const replaceEnv = useCallback(async (next: Envelope) => {
    await saveChain.current
    await saveEnvelope(next)
    setEnvBoth(next)
  }, [])

  const addPasskey = useCallback(
    async (passphrase: string, label: string) => {
      await persistNow()
      const reg = await registerPrfPasskey(label)
      await replaceEnv(await addPasskeyWrap(envRef.current!, passphrase, { ...reg, label }))
    },
    [persistNow, replaceEnv],
  )

  const removePasskey = useCallback(
    async (credId: string) => {
      await persistNow()
      await replaceEnv(removePasskeyWrap(envRef.current!, credId))
    },
    [persistNow, replaceEnv],
  )

  const changePassphrase = useCallback(
    async (oldPass: string, newPass: string) => {
      await persistNow()
      await replaceEnv(await changePassphraseWrap(envRef.current!, oldPass, newPass))
    },
    [persistNow, replaceEnv],
  )

  const exportBackup = useCallback(async () => {
    await persistNow()
    return new Blob([JSON.stringify(envRef.current, null, 1)], { type: 'application/json' })
  }, [persistNow])

  const importBackup = useCallback(
    async (text: string, passphrase: string) => {
      const e = parseBackup(text)
      const { dek, state: s } = await openWithPassphrase(e, passphrase)
      // Drop any pending writes of the old vault.
      dirty.current = false
      if (saveTimer.current) clearTimeout(saveTimer.current)
      await saveChain.current
      await saveEnvelope(e)
      await enter(dek, s, e)
    },
    [enter],
  )

  const wipe = useCallback(async () => {
    dirty.current = false
    if (saveTimer.current) clearTimeout(saveTimer.current)
    await saveChain.current
    await deleteEnvelope()
    dekRef.current = null
    stateRef.current = null
    setState(null)
    setEnvBoth(null)
    setStatus('new')
  }, [])

  const seal = useCallback(async (plaintext: string) => {
    if (!dekRef.current) throw new Error('Vault is locked.')
    return sealWith(dekRef.current, plaintext)
  }, [])

  const unseal = useCallback(async (sealed: Sealed) => {
    if (!dekRef.current) throw new Error('Vault is locked.')
    return unsealWith(dekRef.current, sealed)
  }, [])

  // Auto-lock: idle timeout, and 60 s after the app goes to the background.
  useEffect(() => {
    if (status !== 'unlocked') return
    const bump = () => (lastActivity.current = Date.now())
    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, bump, { passive: true }))
    const minutes = stateRef.current?.settings.autoLockMinutes ?? 5
    const idle = setInterval(() => {
      if (Date.now() - lastActivity.current > minutes * 60_000) void lock()
    }, 10_000)
    let hiddenTimer: ReturnType<typeof setTimeout> | null = null
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        void persistNow()
        hiddenTimer = setTimeout(() => void lock(), HIDDEN_LOCK_MS)
      } else if (hiddenTimer) {
        clearTimeout(hiddenTimer)
        hiddenTimer = null
      }
    }
    const onHide = () => void persistNow()
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('pagehide', onHide)
    return () => {
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, bump))
      clearInterval(idle)
      if (hiddenTimer) clearTimeout(hiddenTimer)
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('pagehide', onHide)
    }
  }, [status, state?.settings.autoLockMinutes, lock, persistNow])

  const api = useMemo<VaultApi>(
    () => ({
      status,
      state,
      update,
      seal,
      unseal,
      create,
      unlockWithPassphrase,
      unlockWithPasskey,
      lock,
      passkeys: (env?.keys.passkeys ?? []).map(({ credId, label, createdAt }) => ({ credId, label, createdAt })),
      addPasskey,
      removePasskey,
      changePassphrase,
      exportBackup,
      importBackup,
      wipe,
      lastSavedAt,
      persisted,
    }),
    [
      status,
      state,
      env,
      update,
      seal,
      unseal,
      create,
      unlockWithPassphrase,
      unlockWithPasskey,
      lock,
      addPasskey,
      removePasskey,
      changePassphrase,
      exportBackup,
      importBackup,
      wipe,
      lastSavedAt,
      persisted,
    ],
  )

  return <VaultContext.Provider value={api}>{children}</VaultContext.Provider>
}

export function useVault(): VaultApi {
  const v = useContext(VaultContext)
  if (!v) throw new Error('useVault must be used inside <VaultProvider>')
  return v
}

/** Convenience for feature screens rendered only while unlocked. */
export function useAppState(): [AppState, VaultApi['update']] {
  const { state, update } = useVault()
  if (!state) throw new Error('Vault is locked.')
  return [state, update]
}
