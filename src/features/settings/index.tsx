import { useEffect, useState } from 'react'
import { passphraseStrength, WrongPasswordError } from '@/core/crypto'
import { daysBetween, formatDate, today } from '@/core/format'
import { passkeysAvailable, prfSupported } from '@/core/passkey'
import { useAppState, useVault } from '@/core/vault'
import { Badge, Button, Callout, Field, Input, Page, Panel, Progress, Section, Select, Sheet, Toggle } from '@/ui'

export const REPO_URL = 'https://github.com/haryprasadh/myrm'

export default function Settings() {
  const [state, update] = useAppState()
  const { lock } = useVault()
  const s = state.settings
  const setSettings = (patch: Partial<typeof s>) => update((st) => ({ ...st, settings: { ...st.settings, ...patch } }))

  return (
    <Page title="Settings" subtitle="Security, backup and privacy" actions={<Button onClick={() => void lock()}>Lock now</Button>}>
      <Section title="Profile">
        <Panel>
          <Field label="Your name (shown on Home)">
            <Input value={state.profile.name ?? ''} onChange={(e) => update((st) => ({ ...st, profile: { ...st.profile, name: e.target.value || undefined } }))} />
          </Field>
        </Panel>
      </Section>

      <Section title="Unlock & security">
        <Panel className="space-y-4">
          <PasskeyBlock />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Auto-lock after">
              <Select
                value={String(s.autoLockMinutes)}
                onChange={(e) => setSettings({ autoLockMinutes: Number(e.target.value) })}
                options={[1, 2, 5, 10, 15].map((m) => ({ value: String(m), label: `${m} minute${m > 1 ? 's' : ''} idle` }))}
              />
            </Field>
            <Field label="Clear copied secrets after">
              <Select
                value={String(s.clipboardClearSeconds)}
                onChange={(e) => setSettings({ clipboardClearSeconds: Number(e.target.value) })}
                options={[10, 20, 30, 60].map((n) => ({ value: String(n), label: `${n} seconds` }))}
              />
            </Field>
          </div>
          <p className="text-xs text-muted">MyRM also locks 1 minute after you switch away from it.</p>
          <ChangePassphrase />
        </Panel>
      </Section>

      <Section title="Privacy & display">
        <Panel className="space-y-3">
          <Toggle label="Hide amounts on screen (for use in public)" checked={s.hideAmounts} onChange={(v) => setSettings({ hideAmounts: v })} />
          <Field label="Theme">
            <Select
              value={s.theme}
              onChange={(e) => setSettings({ theme: e.target.value as typeof s.theme })}
              options={[
                { value: 'system', label: 'Match my device' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
            />
          </Field>
        </Panel>
      </Section>

      <Section title="Backup">
        <BackupBlock />
      </Section>

      <Section title="About & security">
        <AboutBlock />
      </Section>

      <Section title="Danger zone">
        <WipeBlock />
      </Section>
    </Page>
  )
}

function PasskeyBlock() {
  const { passkeys, addPasskey, removePasskey } = useVault()
  const [supported, setSupported] = useState<boolean | undefined>(undefined)
  const [open, setOpen] = useState(false)
  const [pw, setPw] = useState('')
  const [label, setLabel] = useState(defaultDeviceLabel())
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!passkeysAvailable()) setSupported(false)
    else void prfSupported().then(setSupported)
  }, [])

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium text-ink">Face ID / fingerprint unlock</div>
          <div className="text-sm text-muted">Uses a passkey on this device. Your passphrase still works as a fallback.</div>
        </div>
        {passkeys.length > 0 ? <Badge tone="good">On</Badge> : <Badge>Off</Badge>}
      </div>
      {passkeys.length > 0 && (
        <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
          {passkeys.map((p) => (
            <li key={p.credId} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="text-ink">
                {p.label} <span className="text-muted">· added {formatDate(p.createdAt.slice(0, 10), 'long')}</span>
              </span>
              <Button size="sm" variant="ghost" onClick={() => void removePasskey(p.credId)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
      {supported === false ? (
        <p className="mt-2 text-xs text-muted">This browser can't do secure biometric unlock. Try Safari on iOS 18+ or Chrome on Android, from the installed app.</p>
      ) : (
        <Button className="mt-3" onClick={() => setOpen(true)}>
          {passkeys.length ? 'Add another device' : 'Turn on'}
        </Button>
      )}
      <Sheet
        open={open}
        onClose={() => {
          if (busy) return
          setOpen(false)
          setPw('')
          setErr('')
        }}
        title="Turn on Face ID / fingerprint"
      >
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault()
            setBusy(true)
            setErr('')
            try {
              await addPasskey(pw, label.trim() || 'This device')
              setOpen(false)
              setPw('')
            } catch (x) {
              setErr(x instanceof WrongPasswordError ? 'Wrong passphrase.' : (x as Error).message)
            } finally {
              setBusy(false)
            }
          }}
        >
          <p className="text-sm text-muted">Confirm your passphrase, then approve the passkey prompt. Your device may ask twice.</p>
          <Field label="Passphrase" error={err}>
            <Input type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} />
          </Field>
          <Field label="Device name">
            <Input value={label} onChange={(e) => setLabel(e.target.value)} />
          </Field>
          <Button variant="primary" size="lg" disabled={!pw || busy}>
            {busy ? 'Waiting for your device…' : 'Continue'}
          </Button>
        </form>
      </Sheet>
    </div>
  )
}

function defaultDeviceLabel(): string {
  const ua = navigator.userAgent
  if (/iPhone/.test(ua)) return 'iPhone'
  if (/iPad/.test(ua)) return 'iPad'
  if (/Android/.test(ua)) return 'Android phone'
  if (/Mac/.test(ua)) return 'Mac'
  if (/Windows/.test(ua)) return 'Windows PC'
  return 'This device'
}

function ChangePassphrase() {
  const { changePassphrase } = useVault()
  const [open, setOpen] = useState(false)
  const [oldPw, setOld] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const s = passphraseStrength(pw)
  const close = () => {
    if (busy) return
    setOpen(false)
    setOld('')
    setPw('')
    setPw2('')
    setErr('')
  }
  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink">{done ? 'Passphrase changed ✓' : 'Passphrase'}</span>
        <Button size="sm" onClick={() => setOpen(true)}>
          Change
        </Button>
      </div>
      <Sheet open={open} onClose={close} title="Change passphrase">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault()
            setBusy(true)
            setErr('')
            try {
              await changePassphrase(oldPw, pw)
              setDone(true)
              setBusy(false)
              setOpen(false)
              setOld('')
              setPw('')
              setPw2('')
            } catch (x) {
              setErr(x instanceof WrongPasswordError ? 'Current passphrase is wrong.' : (x as Error).message)
            } finally {
              setBusy(false)
            }
          }}
        >
          <Field label="Current passphrase" error={err}>
            <Input type="password" autoComplete="current-password" value={oldPw} onChange={(e) => setOld(e.target.value)} />
          </Field>
          <Field label="New passphrase" hint={s.feedback}>
            <Input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
          </Field>
          <Progress value={s.score} max={4} tone={s.score >= 3 ? 'good' : s.ok ? 'accent' : 'warn'} />
          <Field label="Repeat new passphrase" error={pw2 && pw2 !== pw ? "Doesn't match." : undefined}>
            <Input type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </Field>
          <Callout tone="warn">
            This also replaces your encryption key and turns off Face ID / fingerprint unlock (turn it on again afterwards). Old backup files still
            open with the old passphrase, so export a new backup and delete the old ones.
          </Callout>
          <Button variant="primary" size="lg" disabled={!oldPw || !s.ok || pw !== pw2 || busy}>
            {busy ? 'Changing…' : 'Change passphrase'}
          </Button>
        </form>
      </Sheet>
    </>
  )
}

function BackupBlock() {
  const [state, update] = useAppState()
  const { exportBackup, importBackup, persisted } = useVault()
  const [restoreOpen, setRestoreOpen] = useState(false)
  const last = state.settings.lastBackupAt
  const age = last ? daysBetween(last.slice(0, 10), today()) : null

  async function doExport() {
    const blob = await exportBackup()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `myrm-backup-${today()}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    update((s) => ({ ...s, settings: { ...s.settings, lastBackupAt: new Date().toISOString() } }))
  }

  return (
    <Panel className="space-y-3">
      <p className="text-sm text-muted">
        Your data lives only on this device. If you lose the phone, clear the browser or uninstall the app, it's gone. A backup file is
        encrypted with your passphrase, so it's safe to keep in Google Drive, iCloud or email.
      </p>
      {age === null ? (
        <Callout tone="warn">You have never made a backup.</Callout>
      ) : age > 30 ? (
        <Callout tone="warn">Last backup was {age} days ago.</Callout>
      ) : (
        <p className="text-sm text-good">Last backup: {formatDate(last!.slice(0, 10), 'long')}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => void doExport()}>
          Export encrypted backup
        </Button>
        <Button onClick={() => setRestoreOpen(true)}>Restore from file</Button>
      </div>
      <p className="text-xs text-muted">
        Storage: {persisted ? 'protected from automatic clean-up ✓' : 'the browser may clear it under storage pressure. Install the app (Add to Home Screen) and keep backups.'}
      </p>
      <RestoreSheet open={restoreOpen} onClose={() => setRestoreOpen(false)} onRestore={importBackup} />
    </Panel>
  )
}

function RestoreSheet({ open, onClose, onRestore }: { open: boolean; onClose: () => void; onRestore: (text: string, pw: string) => Promise<void> }) {
  const [text, setText] = useState('')
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const close = () => {
    if (busy) return
    setText('')
    setPw('')
    setConfirm(false)
    setErr('')
    onClose()
  }
  return (
    <Sheet open={open} onClose={close} title="Restore from backup">
      <div className="space-y-4">
        <Callout tone="danger">Restoring replaces everything currently on this device with the backup's contents.</Callout>
        <Field label="Backup file">
          <Input type="file" accept="application/json,.json" onChange={async (e) => setText((await e.target.files?.[0]?.text()) ?? '')} />
        </Field>
        <Field label="Backup passphrase" error={err}>
          <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </Field>
        <label className="flex items-start gap-2 text-sm text-ink">
          <input type="checkbox" className="mt-1" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
          Replace this device's data with the backup.
        </label>
        <Button
          variant="danger"
          size="lg"
          disabled={!text || !pw || !confirm || busy}
          onClick={async () => {
            setBusy(true)
            setErr('')
            try {
              await onRestore(text, pw)
              setPw('')
              setText('')
              setConfirm(false)
              onClose()
            } catch (x) {
              setErr(x instanceof WrongPasswordError ? 'Wrong passphrase for this backup.' : (x as Error).message)
            } finally {
              setBusy(false)
            }
          }}
        >
          {busy ? 'Restoring…' : 'Restore'}
        </Button>
      </div>
    </Sheet>
  )
}

function AboutBlock() {
  return (
    <Panel className="space-y-3 text-sm text-ink">
      <ul className="space-y-2">
        <li>🔐 Everything you enter is encrypted with AES-256-GCM. The key comes from your passphrase via Argon2id (64 MiB) or from a device passkey.</li>
        <li>🔁 PINs, passwords and card numbers are encrypted a second time and decrypted only when you tap Reveal or Copy.</li>
        <li>📵 No servers, accounts, analytics or trackers. MyRM makes no network requests, and its security policy blocks background requests to other sites.</li>
        <li>🧾 MyRM never asks for OTPs or CVVs. Anyone who does is a fraudster.</li>
        <li>🧑‍💻 Open source: anyone can check the code. Like any app, it is only as trustworthy as the code you run; each release publishes file hashes so you can confirm the live site matches the public code.</li>
      </ul>
      <a className="inline-block text-accent underline" href={REPO_URL} target="_blank" rel="noopener noreferrer">
        View the source code
      </a>
      <p className="text-xs text-muted">
        MyRM is an independent, unofficial tool. It is not affiliated with, endorsed by or connected to HDFC Bank Ltd. "HDFC" is a trademark of its
        owner and is used only to describe compatibility. Bank facts shown here are a convenience snapshot; always confirm on the bank's official site.
        Version {__APP_VERSION__}.
      </p>
    </Panel>
  )
}

function WipeBlock() {
  const { wipe } = useVault()
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  return (
    <Panel>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-medium text-ink">Erase everything on this device</div>
          <div className="text-sm text-muted">Deletes the encrypted vault. Backups you exported are not affected.</div>
        </div>
        <Button variant="danger" onClick={() => setOpen(true)}>
          Erase
        </Button>
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} title="Erase all data?">
        <div className="space-y-4">
          <Callout tone="danger">This cannot be undone. Type ERASE to confirm.</Callout>
          <Field label="Confirmation">
            <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoCapitalize="characters" />
          </Field>
          <Button variant="danger" size="lg" disabled={typed !== 'ERASE'} onClick={() => void wipe()}>
            Erase everything
          </Button>
        </div>
      </Sheet>
    </Panel>
  )
}
