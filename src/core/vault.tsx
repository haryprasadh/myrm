// VaultProvider: owns the decrypted state in memory, persists it encrypted, and auto-locks.
// Feature code uses `useVault()` (status, state, update, seal/unseal) and never touches keys.
//
// Invariants (see the security review notes in git history):
//  - Every envelope write goes through ONE serialized queue and is compare-and-swap on `rev`.
//  - A failed write never wedges the queue; the error is surfaced and the data stays dirty.
//  - lock() takes effect synchronously (UI + key dropped at once); the last edits are flushed
//    from a captured snapshot. A session generation counter rejects late unlock completions.
//  - Only one tab is unlocked at a time (BroadcastChannel); stale writers are locked out.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { seal as sealWith, unseal as unsealWith } from './crypto'
import {
  type Envelope,
  addPasskeyWrap,
  changePassphraseRotate,
  createEnvelope,
  migrateSealed,
  openWithPassphrase,
  openWithPrf,
  parseBackup,
  removePasskeyWrap,
  writeState,
} from './envelope'
import { assertPrf, registerPrfPasskey } from './passkey'
import { type AppState, type Sealed, emptyState } from './schema'
import { StaleVaultError, deleteEnvelope, loadEnvelope, replaceEnvelope, requestPersistence, revOf, saveEnvelope } from './storage'

export type VaultStatus = 'loading' | 'error' | 'new' | 'locked' | 'unlocked'

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
  lock: () => void
  /** True only on a fresh app start (never right after a lock), so Face ID isn't auto-prompted after "Lock now". */
  autoPasskey: boolean
  passkeys: { credId: string; label: string; createdAt: string }[]
  addPasskey: (passphrase: string, label: string) => Promise<void>
  removePasskey: (credId: string) => Promise<void>
  /** Changes the passphrase and rotates the data key. Removes passkeys (they wrap the old key). */
  changePassphrase: (oldPass: string, newPass: string) => Promise<void>
  /** Encrypted backup file contents (same passphrase). */
  exportBackup: () => Promise<Blob>
  /** Replace this device's vault with a backup; requires the backup's passphrase. */
  importBackup: (text: string, passphrase: string) => Promise<void>
  /** Permanently delete everything on this device. */
  wipe: () => Promise<void>
  /** Retry after a storage read error at startup. */
  retry: () => void
  lastSavedAt: string | null
  /** Set when the latest save failed (data is still in memory and will be retried). */
  saveError: string | null
  /** A message for the lock screen (e.g. locked because another tab took over). */
  notice: string | null
  persisted: boolean
}

const VaultContext = createContext<VaultApi | null>(null)

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'wheel'] as const
const HIDDEN_LOCK_MS = 60_000
const TAB_ID = typeof crypto !== 'undefined' ? crypto.randomUUID() : String(Math.random())

class SessionEndedError extends Error {
  constructor() {
    super('The vault was locked.')
    this.name = 'SessionEndedError'
  }
}

class KeyChangedError extends SessionEndedError {
  constructor() {
    super()
    this.message = 'The passphrase was changed before this edit could be saved.'
    this.name = 'KeyChangedError'
  }
}

interface Session {
  gen: number
  dek: CryptoKey
}

export function VaultProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<VaultStatus>('loading')
  const [state, setState] = useState<AppState | null>(null)
  const [env, setEnv] = useState<Envelope | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [persisted, setPersisted] = useState(false)
  const [autoPasskey, setAutoPasskey] = useState(true)
  const [loadTick, setLoadTick] = useState(0)

  const sessionRef = useRef<Session | null>(null)
  const genRef = useRef(0)
  const envRef = useRef<Envelope | null>(null)
  const stateRef = useRef<AppState | null>(null)
  const dirty = useRef(false)
  const queue = useRef<Promise<unknown>>(Promise.resolve())
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastActivity = useRef(Date.now())
  const hiddenAt = useRef<number | null>(null)
  const channel = useRef<BroadcastChannel | null>(null)
  /** While the data key rotates, edits are held here and applied to the re-keyed state afterwards. */
  const rotating = useRef(false)
  const heldUpdates = useRef<((s: AppState) => AppState)[]>([])
  /** Bumped when a new data key is committed; snapshots taken under an older key are never written. */
  const keyEpoch = useRef(0)
  /** Set while an erase is in progress: unlocking is refused until it finishes. */
  const destructive = useRef(false)

  const setEnvBoth = (e: Envelope | null) => {
    envRef.current = e
    setEnv(e)
  }

  /** Serialize async work. The queue itself never rejects, so one failure can't wedge later work. */
  const enqueue = useCallback(<T,>(fn: () => Promise<T>): Promise<T> => {
    const run = queue.current.then(fn)
    queue.current = run.catch(() => undefined)
    return run
  }, [])

  // ---- startup -------------------------------------------------------------------------------
  useEffect(() => {
    let alive = true
    setStatus('loading')
    loadEnvelope()
      .then((e) => {
        if (!alive) return
        setEnvBoth(e ?? null)
        setStatus(e ? 'locked' : 'new')
      })
      .catch(() => alive && setStatus('error')) // a read error is NOT "no vault": never offer to create over it
    return () => {
      alive = false
    }
  }, [loadTick])

  // ---- saving --------------------------------------------------------------------------------
  /** Persist a captured snapshot (used both while unlocked and right after lock). */
  const persistSnapshot = useCallback(
    (snap: { dek: CryptoKey; state: AppState; epoch: number }) =>
      enqueue(async () => {
        const cur = envRef.current
        if (!cur) return
        if (snap.epoch !== keyEpoch.current) throw new KeyChangedError() // never write old-key data under new wrappers
        const next = await writeState(cur, snap.dek, snap.state)
        await saveEnvelope(next, revOf(cur))
        setEnvBoth(next)
        setLastSavedAt(next.updatedAt)
        setSaveError(null)
      }),
    [enqueue],
  )

  const lockRef = useRef<(msg?: string, opts?: { skipSave?: boolean }) => void>(() => undefined)

  const handleWriteError = useCallback((e: unknown) => {
    if (e instanceof StaleVaultError) {
      lockRef.current('MyRM was changed in another tab or window. Unlock again to continue here.', { skipSave: true })
    } else if (!(e instanceof SessionEndedError)) {
      setSaveError(`Couldn't save your latest changes (${(e as Error)?.message ?? 'storage error'}). They're kept in memory; export a backup if this continues.`)
    }
  }, [])

  const flush = useCallback((): Promise<void> => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
    const sess = sessionRef.current
    const s = stateRef.current
    if (rotating.current || !dirty.current || !sess || !s) return queue.current.then(() => undefined)
    dirty.current = false
    return persistSnapshot({ dek: sess.dek, state: s, epoch: keyEpoch.current }).catch((e) => {
      if (sessionRef.current?.gen === sess.gen) dirty.current = true // keep it dirty for the next attempt
      handleWriteError(e)
    })
  }, [persistSnapshot, handleWriteError])

  const update = useCallback(
    (fn: (s: AppState) => AppState) => {
      const cur = stateRef.current
      if (!cur || !sessionRef.current) return
      if (rotating.current) {
        // Never snapshot old-key state while the key is being replaced; replay after the commit.
        heldUpdates.current.push(fn)
        return
      }
      const next = fn(cur)
      stateRef.current = next
      setState(next)
      dirty.current = true
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => void flush(), 400)
    },
    [flush],
  )

  // ---- session lifecycle -----------------------------------------------------------------------
  const enter = useCallback(async (gen: number, dek: CryptoKey, s: AppState, e: Envelope) => {
    // Locked/wiped/restored meanwhile, or another unlock already won: discard this late completion.
    if (gen !== genRef.current) throw new SessionEndedError()
    sessionRef.current = { gen: ++genRef.current, dek }
    stateRef.current = s
    dirty.current = false
    setEnvBoth(e)
    setState(s)
    setNotice(null)
    setSaveError(null)
    lastActivity.current = Date.now()
    // If the app went to the background while unlocking, the background deadline starts now.
    hiddenAt.current = typeof document !== 'undefined' && document.visibilityState === 'hidden' ? Date.now() : null
    setStatus('unlocked')
    channel.current?.postMessage({ type: 'unlocked', from: TAB_ID })
    setPersisted(await requestPersistence())
  }, [])

  const lock = useCallback((msg?: string, opts: { skipSave?: boolean } = {}) => {
    const sess = sessionRef.current
    let s = stateRef.current
    let wasDirty = dirty.current
    // Edits held during a key rotation belong to the old-key state; keep them in the lock-time save.
    // If the rotation commits first, the epoch check drops this snapshot instead of corrupting the vault.
    if (s && heldUpdates.current.length) {
      for (const fn of heldUpdates.current) s = fn(s)
      wasDirty = true
    }
    const epoch = keyEpoch.current
    // 1) take effect immediately
    genRef.current++
    sessionRef.current = null
    stateRef.current = null
    dirty.current = false
    heldUpdates.current = []
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = null
    setState(null)
    setAutoPasskey(false)
    setStatus(envRef.current ? 'locked' : 'new')
    if (msg) setNotice(msg)
    // 2) flush the captured snapshot in the background
    if (sess && s && wasDirty && !opts.skipSave)
      void persistSnapshot({ dek: sess.dek, state: s, epoch }).catch((e) => {
        if (e instanceof KeyChangedError) setNotice('Your last change was not saved because the passphrase was changed at the same moment.')
        else if (e instanceof StaleVaultError) setNotice('Your last change was not saved because MyRM was changed in another tab.')
        else setNotice(`Your last change could not be saved: ${(e as Error)?.message ?? 'storage error'}`)
      })
  }, [persistSnapshot])
  lockRef.current = lock

  /** Always unlock against the freshest envelope on disk (another tab may have changed it). */
  const freshEnv = useCallback(async (): Promise<Envelope> => {
    if (destructive.current) throw new Error('Please wait: MyRM is erasing data on this device.')
    const e = await loadEnvelope()
    if (!e) {
      setEnvBoth(null)
      setStatus('new')
      throw new Error('No vault on this device.')
    }
    setEnvBoth(e)
    return e
  }, [])

  /** Vaults created before vault ids existed get one on their first unlock (atomic CAS write). */
  const ensureVid = useCallback(
    (e: Envelope): Promise<Envelope> =>
      e.vid
        ? Promise.resolve(e)
        : enqueue(async () => {
            const withId: Envelope = { ...e, vid: crypto.randomUUID(), rev: revOf(e) + 1, updatedAt: new Date().toISOString() }
            await saveEnvelope(withId, revOf(e))
            setEnvBoth(withId)
            return withId
          }),
    [enqueue],
  )

  const create = useCallback(
    async (passphrase: string) => {
      const gen = genRef.current
      const { env: e, dek } = await createEnvelope(passphrase, emptyState())
      await enqueue(() => saveEnvelope(e, -1)) // refuses to overwrite an existing vault
      await enter(gen, dek, emptyState(), e)
    },
    [enqueue, enter],
  )

  const unlockWithPassphrase = useCallback(
    async (passphrase: string) => {
      const gen = genRef.current
      const e = await freshEnv()
      const { dek, state: s } = await openWithPassphrase(e, passphrase)
      if (destructive.current || gen !== genRef.current) throw new SessionEndedError()
      await enter(gen, dek, s, await ensureVid(e))
    },
    [enter, freshEnv, ensureVid],
  )

  const unlockWithPasskey = useCallback(async () => {
    const gen = genRef.current
    const e = await freshEnv()
    if (e.keys.passkeys.length === 0) throw new Error('No passkey set up for this vault.')
    const { credId, prfOutput } = await assertPrf(e.keys.passkeys)
    const latest = await freshEnv()
    const { dek, state: s } = await openWithPrf(latest, credId, prfOutput)
    if (destructive.current || gen !== genRef.current) throw new SessionEndedError()
    await enter(gen, dek, s, await ensureVid(latest))
  }, [enter, freshEnv, ensureVid])

  /** Run an envelope mutation against the CURRENT envelope inside the queue, with CAS. */
  const mutateEnv = useCallback(
    async (fn: (cur: Envelope) => Promise<Envelope>) => {
      await flush()
      const gen = genRef.current
      try {
        await enqueue(async () => {
          if (gen !== genRef.current) throw new SessionEndedError()
          const cur = envRef.current
          if (!cur) throw new Error('No vault on this device.')
          const next = await fn(cur)
          await saveEnvelope(next, revOf(cur))
          setEnvBoth(next)
        })
      } catch (e) {
        if (e instanceof StaleVaultError) handleWriteError(e)
        throw e
      }
    },
    [enqueue, flush, handleWriteError],
  )

  const addPasskey = useCallback(
    async (passphrase: string, label: string) => {
      const reg = await registerPrfPasskey(label) // user interaction happens outside the queue
      await mutateEnv((cur) => addPasskeyWrap(cur, passphrase, { ...reg, label }))
    },
    [mutateEnv],
  )

  const removePasskey = useCallback((credId: string) => mutateEnv(async (cur) => removePasskeyWrap(cur, credId)), [mutateEnv])

  const changePassphrase = useCallback(
    async (oldPass: string, newPass: string) => {
      await flush()
      const gen = genRef.current
      try {
        await enqueue(async () => {
          const sess = sessionRef.current
          const cur = envRef.current
          const start = stateRef.current
          if (gen !== genRef.current || !sess || !cur || !start) throw new SessionEndedError()
          rotating.current = true // from here no snapshot of old-key state can be captured or saved
          const wasDirty = dirty.current
          dirty.current = false // `start` already contains any unsaved edits; the rotation saves them
          let committed = false
          try {
            const rotated = await changePassphraseRotate(cur, start, oldPass, newPass)
            if (gen !== genRef.current) throw new SessionEndedError() // locked meanwhile: abort, nothing saved
            await saveEnvelope(rotated.env, revOf(cur))
            keyEpoch.current++
            committed = true
            setEnvBoth(rotated.env)
            setLastSavedAt(rotated.env.updatedAt)
            if (gen !== genRef.current) throw new SessionEndedError() // saved, but keep the session closed
            sessionRef.current = { gen, dek: rotated.dek }
            stateRef.current = rotated.state // new key + re-keyed state become current together (no await between)
            // Replay edits held during the rotation, then re-key any Sealed value they carried over from
            // the old state (an editor may have captured an existing card number before the rotation).
            let next = rotated.state
            let replayed = 0
            while (heldUpdates.current.length) {
              const held = heldUpdates.current
              heldUpdates.current = []
              for (const fn of held) next = fn(next)
              replayed += held.length
              next = await migrateSealed(next, sess.dek, rotated.dek)
            }
            stateRef.current = next
            setState(next)
            dirty.current = replayed > 0
          } finally {
            rotating.current = false
            if (!committed && sessionRef.current?.gen === gen && stateRef.current) {
              // Rotation failed (e.g. wrong current passphrase): keep the edits on the unchanged old-key state.
              let n = stateRef.current
              const held = heldUpdates.current
              heldUpdates.current = []
              for (const fn of held) n = fn(n)
              stateRef.current = n
              setState(n)
              dirty.current = wasDirty || held.length > 0
            }
          }
        })
        if (dirty.current) void flush()
      } catch (e) {
        if (e instanceof StaleVaultError) handleWriteError(e)
        throw e
      }
    },
    [enqueue, flush, handleWriteError],
  )

  const exportBackup = useCallback(async () => {
    await flush()
    await queue.current
    return new Blob([JSON.stringify(envRef.current, null, 1)], { type: 'application/json' })
  }, [flush])

  const importBackup = useCallback(
    async (text: string, passphrase: string) => {
      const g0 = genRef.current
      const e = parseBackup(text)
      const { dek, state: s } = await openWithPassphrase(e, passphrase)
      if (g0 !== genRef.current) throw new SessionEndedError()
      // End any current session synchronously: its pending writes must not land on the restore,
      // and no decrypted screen may stay up if the write below fails.
      const g = ++genRef.current
      sessionRef.current = null
      stateRef.current = null
      dirty.current = false
      heldUpdates.current = []
      if (saveTimer.current) clearTimeout(saveTimer.current)
      setState(null)
      setStatus(envRef.current ? 'locked' : 'new')
      const stored = await enqueue(() => replaceEnvelope(e))
      setEnvBoth(stored)
      channel.current?.postMessage({ type: 'replaced', from: TAB_ID })
      await enter(g, dek, s, stored) // rejects if a lock happened meanwhile
    },
    [enqueue, enter],
  )

  const wipe = useCallback(async () => {
    destructive.current = true
    genRef.current++
    sessionRef.current = null
    stateRef.current = null
    dirty.current = false
    heldUpdates.current = []
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setState(null)
    setStatus(envRef.current ? 'locked' : 'new') // if the delete fails, the vault stays locked, not open
    try {
      await enqueue(() => deleteEnvelope())
    } finally {
      genRef.current++ // invalidate anything that started during the erase
      destructive.current = false
    }
    channel.current?.postMessage({ type: 'wiped', from: TAB_ID })
    setEnvBoth(null)
    setStatus('new')
  }, [enqueue])

  const seal = useCallback(
    (plaintext: string) =>
      enqueue(async () => {
        const sess = sessionRef.current
        if (!sess) throw new Error('Vault is locked.')
        return sealWith(sess.dek, plaintext)
      }),
    [enqueue],
  )

  const unseal = useCallback(
    (sealed: Sealed) =>
      enqueue(async () => {
        const sess = sessionRef.current
        if (!sess) throw new Error('Vault is locked.')
        return unsealWith(sess.dek, sealed)
      }),
    [enqueue],
  )

  const retry = useCallback(() => setLoadTick((n) => n + 1), [])

  // ---- one unlocked tab at a time ------------------------------------------------------------
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return
    const ch = new BroadcastChannel('myrm-vault')
    channel.current = ch
    ch.onmessage = (ev: MessageEvent<{ type: string; from: string }>) => {
      if (ev.data?.from === TAB_ID) return
      if (ev.data.type === 'unlocked' && sessionRef.current) lockRef.current('MyRM was opened in another tab or window, so it was locked here.')
      if (ev.data.type === 'replaced' || ev.data.type === 'wiped') {
        if (sessionRef.current) lockRef.current('This vault was restored or erased in another tab.', { skipSave: true })
        else genRef.current++ // also cancel an unlock that is still in progress here
        setLoadTick((n) => n + 1)
      }
    }
    return () => {
      ch.close()
      channel.current = null
    }
  }, [])

  // ---- auto-lock: idle timeout + absolute background deadline --------------------------------
  useEffect(() => {
    if (status !== 'unlocked') return
    const idleMs = (stateRef.current?.settings.autoLockMinutes ?? 5) * 60_000
    const overdue = () =>
      Date.now() - lastActivity.current > idleMs || (hiddenAt.current !== null && Date.now() - hiddenAt.current >= HIDDEN_LOCK_MS)
    const onActivity = () => {
      if (overdue()) lock() // never let activity "refresh" an already-expired session
      else lastActivity.current = Date.now()
    }
    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true, capture: true }))
    const tick = setInterval(() => overdue() && lock(), 5_000)
    let hiddenTimer: ReturnType<typeof setTimeout> | null = null
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt.current = Date.now()
        void flush()
        hiddenTimer = setTimeout(() => lock(), HIDDEN_LOCK_MS)
      } else {
        if (hiddenTimer) clearTimeout(hiddenTimer)
        hiddenTimer = null
        if (overdue()) lock() // timers may have been suspended while hidden
        else hiddenAt.current = null
      }
    }
    if (document.visibilityState === 'hidden') {
      hiddenAt.current ??= Date.now()
      hiddenTimer = setTimeout(() => lock(), Math.max(0, HIDDEN_LOCK_MS - (Date.now() - hiddenAt.current)))
    }
    const onPageShow = () => overdue() && lock()
    const onPageHide = () => void flush()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pageshow', onPageShow)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, onActivity, { capture: true }))
      clearInterval(tick)
      if (hiddenTimer) clearTimeout(hiddenTimer)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pageshow', onPageShow)
      window.removeEventListener('pagehide', onPageHide)
    }
  }, [status, state?.settings.autoLockMinutes, lock, flush])

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
      lock: () => lock(),
      autoPasskey,
      passkeys: (env?.keys.passkeys ?? []).map(({ credId, label, createdAt }) => ({ credId, label, createdAt })),
      addPasskey,
      removePasskey,
      changePassphrase,
      exportBackup,
      importBackup,
      wipe,
      retry,
      lastSavedAt,
      saveError,
      notice,
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
      autoPasskey,
      addPasskey,
      removePasskey,
      changePassphrase,
      exportBackup,
      importBackup,
      wipe,
      retry,
      lastSavedAt,
      saveError,
      notice,
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
