import { useEffect, useRef, useState } from 'react'
import { passphraseStrength, WrongPasswordError } from '@/core/crypto'
import { useVault } from '@/core/vault'
import { Button, Callout, Field, Input, Panel, Progress, Sheet } from '@/ui'

function Logo() {
  return (
    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-2xl font-bold text-white shadow-lg">
      RM
    </div>
  )
}

export default function LockScreen() {
  const { status, notice, retry } = useVault()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-sm">
        <Logo />
        <h1 className="text-center text-2xl font-semibold text-ink">MyRM</h1>
        <p className="mb-6 text-center text-sm text-muted">Your cards, PINs, dues and money, in one private place.</p>
        {notice && (
          <div className="mb-4">
            <Callout tone="warn">{notice}</Callout>
          </div>
        )}
        {status === 'error' ? (
          <Panel className="space-y-3">
            <Callout tone="danger">
              MyRM couldn't read this browser's storage. Your data has not been changed. Close other MyRM tabs and try again.
            </Callout>
            <Button variant="primary" size="lg" onClick={retry}>
              Try again
            </Button>
          </Panel>
        ) : status === 'new' ? (
          <Onboard />
        ) : (
          <Unlock />
        )}
        <div className="mt-6 text-center">
          <a href="#/help" className="text-sm font-medium text-danger">
            Lost your card? Get help now →
          </a>
        </div>
        <p className="mt-6 text-center text-[11px] leading-relaxed text-muted">
          Unofficial app, not affiliated with HDFC Bank. Everything is encrypted on this device; nothing is sent to any
          server. MyRM never asks for OTPs.
        </p>
      </div>
    </div>
  )
}

function Unlock() {
  const { unlockWithPassphrase, unlockWithPasskey, passkeys, autoPasskey } = useVault()
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [restore, setRestore] = useState(false)
  const tried = useRef(false)

  // Offer Face ID / fingerprint straight away, but only on a fresh app start (not right after "Lock now").
  useEffect(() => {
    if (autoPasskey && passkeys.length && !tried.current) {
      tried.current = true
      void unlockWithPasskey().catch(() => undefined)
    }
  }, [autoPasskey, passkeys.length, unlockWithPasskey])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      await unlockWithPassphrase(pw)
    } catch (x) {
      setErr(x instanceof WrongPasswordError ? 'Wrong passphrase. Try again.' : String((x as Error).message))
      setPw('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Passphrase" error={err}>
          <Input type="password" autoComplete="current-password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} />
        </Field>
        <Button variant="primary" size="lg" disabled={!pw || busy}>
          {busy ? 'Unlocking…' : 'Unlock'}
        </Button>
        {passkeys.length > 0 && (
          <Button type="button" size="lg" onClick={() => unlockWithPasskey().catch((x) => setErr((x as Error).message))}>
            Unlock with Face ID / fingerprint
          </Button>
        )}
        <button type="button" className="w-full text-center text-xs text-muted underline" onClick={() => setRestore(true)}>
          Restore from a backup file
        </button>
      </form>
      <RestoreSheet open={restore} onClose={() => setRestore(false)} />
    </Panel>
  )
}

function Onboard() {
  const { create } = useVault()
  const [step, setStep] = useState<'intro' | 'create'>('intro')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [ack, setAck] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [restore, setRestore] = useState(false)
  const s = passphraseStrength(pw)

  if (step === 'intro')
    return (
      <Panel className="space-y-4">
        <ul className="space-y-3 text-sm text-ink">
          <li>🔐 <b>Encrypted on your device.</b> PINs, passwords and card details are locked with AES-256 and a passphrase only you know.</li>
          <li>📵 <b>No servers, no tracking.</b> MyRM makes no network requests and works offline.</li>
          <li>📅 <b>Never miss a due date.</b> Card bills, EMIs and FD maturities in one place, exportable to your calendar.</li>
          <li>💳 <b>Use the right card.</b> Rewards, fee waivers and caps for HDFC cards.</li>
        </ul>
        <Button variant="primary" size="lg" onClick={() => setStep('create')}>
          Get started
        </Button>
        <button type="button" className="w-full text-center text-xs text-muted underline" onClick={() => setRestore(true)}>
          I have a backup file
        </button>
        <RestoreSheet open={restore} onClose={() => setRestore(false)} />
      </Panel>
    )

  return (
    <Panel>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true)
          setErr('')
          try {
            await create(pw)
          } catch (x) {
            setErr((x as Error).name === 'StaleVaultError' ? 'A vault already exists on this device. Reload to unlock it.' : (x as Error).message)
          } finally {
            setBusy(false)
          }
        }}
      >
        <Field label="Create a passphrase" hint={s.feedback}>
          <Input type="password" autoComplete="new-password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} />
        </Field>
        <Progress value={s.score} max={4} tone={s.score >= 3 ? 'good' : s.ok ? 'accent' : 'warn'} />
        <Field label="Repeat passphrase" error={pw2 && pw2 !== pw ? "Doesn't match." : undefined}>
          <Input type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </Field>
        <Callout tone="warn">
          There is no "forgot passphrase". If you lose it, your data cannot be recovered, by anyone. Write it down and
          keep it somewhere safe. You can add Face ID / fingerprint unlock later.
        </Callout>
        <label className="flex items-start gap-2 text-sm text-ink">
          <input type="checkbox" className="mt-1" checked={ack} onChange={(e) => setAck(e.target.checked)} />
          I understand my passphrase cannot be recovered.
        </label>
        {err && <Callout tone="danger">{err}</Callout>}
        <Button variant="primary" size="lg" disabled={!s.ok || pw !== pw2 || !ack || busy}>
          {busy ? 'Creating vault…' : 'Create my vault'}
        </Button>
      </form>
    </Panel>
  )
}

function RestoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { importBackup } = useVault()
  const [text, setText] = useState('')
  const [name, setName] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const close = () => {
    if (busy) return
    setText('')
    setName('')
    setPw('')
    setErr('')
    onClose()
  }
  return (
    <Sheet open={open} onClose={close} title="Restore from backup">
      <div className="space-y-4">
        <Callout tone="warn">Restoring replaces any vault on this device.</Callout>
        <Field label="Backup file" hint={name || 'A .json file exported from MyRM'}>
          <Input
            type="file"
            accept="application/json,.json"
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f) return
              setName(f.name)
              setText(await f.text())
            }}
          />
        </Field>
        <Field label="Backup passphrase" error={err}>
          <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </Field>
        <Button
          variant="primary"
          size="lg"
          disabled={!text || !pw || busy}
          onClick={async () => {
            setBusy(true)
            setErr('')
            try {
              await importBackup(text, pw)
              setPw('')
              setText('')
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
