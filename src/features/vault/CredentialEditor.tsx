import { useEffect, useRef, useState, type FormEvent } from 'react'
import { type Credential, type CredentialKind, newId } from '@/core/schema'
import { useAppState, useVault } from '@/core/vault'
import { Button, Callout, Field, Input, Select, Sheet } from '@/ui'
import { defaultLabel, kindMeta, validateSecret } from './logic'

const apps = ['GPay', 'PhonePe', 'Paytm', 'PayZapp', 'BHIM', 'CRED', 'Other']
export function CredentialEditor({ existing, onClose }: { existing?: Credential; onClose: () => void }) {
  const [state, update] = useAppState()
  const { seal } = useVault()
  const [kind, setKind] = useState<CredentialKind>(existing?.kind ?? 'card_pin')
  const [label, setLabel] = useState(existing?.label ?? '')
  const [link, setLink] = useState(existing?.linkedTo ? `${existing.linkedTo.type}:${existing.linkedTo.id}` : '')
  const [app, setApp] = useState(existing?.app ?? apps[0])
  const [mode, setMode] = useState<Credential['mode']>(existing?.mode ?? 'hint')
  const [secret, setSecret] = useState('')
  const [username, setUsername] = useState('')
  const [hint, setHint] = useState(existing?.hint ?? '')
  const [show, setShow] = useState(false)
  const [showUsername, setShowUsername] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const active = useRef(true)
  const form = useRef<HTMLFormElement>(null)
  const saving = useRef(false)
  const close = () => { active.current = false; setSecret(''); setUsername(''); setHint(''); onClose() }
  const closeRef = useRef(close)
  closeRef.current = close
  useEffect(() => {
    active.current = true
    const previous = document.activeElement as HTMLElement | null
    form.current?.querySelector<HTMLElement>('select, input, button')?.focus()
    const hidden = () => { if (document.hidden) closeRef.current() }
    const hide = () => closeRef.current()
    document.addEventListener('visibilitychange', hidden)
    window.addEventListener('pagehide', hide)
    return () => {
      active.current = false
      document.removeEventListener('visibilitychange', hidden)
      window.removeEventListener('pagehide', hide)
      previous?.focus()
    }
  }, [])
  const options = [
    { value: '', label: 'Other / no link' },
    ...state.cards.map(c => ({ value: `card:${c.id}`, label: `Card: ${c.nickname}` })),
    ...state.accounts.map(a => ({ value: `account:${a.id}`, label: `Account: ${a.nickname}` })),
  ]
  const linkedName = state.cards.find(c => `card:${c.id}` === link)?.nickname ?? state.accounts.find(a => `account:${a.id}` === link)?.nickname ?? ''
  const suggested = defaultLabel(kind, linkedName, app)
  const keepSecret = existing?.kind === kind && existing.mode === 'secret' && !!existing.secret
  const keepUsername = existing?.kind === kind && !!existing.username

  async function save(event: FormEvent) {
    event.preventDefault()
    if (saving.current) return
    setError('')
    if (mode === 'hint' && !hint.trim()) { setError('Add a memory hint. Do not enter the actual PIN or password.'); return }
    if (mode === 'secret' && (secret || !keepSecret)) {
      const problem = validateSecret(kind, secret)
      if (problem) { setError(problem); return }
    }
    if (kind === 'netbanking' && !username.trim() && !keepUsername) { setError('Enter your Customer ID.'); return }
    saving.current = true
    setBusy(true)
    try {
      const sealedSecret = mode === 'secret' ? (secret ? await seal(secret) : existing?.secret) : undefined
      const sealedUsername = kind === 'netbanking' ? (username ? await seal(username) : existing?.username) : undefined
      if (!active.current || document.hidden) return
      const now = new Date().toISOString()
      const selected = options.some(o => o.value === link) ? link : ''
      const linkedTo: Credential['linkedTo'] = selected ? { type: selected.startsWith('card:') ? 'card' : 'account', id: selected.slice(selected.indexOf(':') + 1) } : undefined
      const next: Credential = {
        id: existing?.id ?? newId(), kind, label: label.trim() || suggested, linkedTo,
        app: kind === 'upi_pin' ? app : undefined, mode,
        secret: sealedSecret, username: sealedUsername, hint: mode === 'hint' ? hint.trim() : undefined,
        createdAt: existing?.createdAt ?? now, updatedAt: now,
      }
      update(s => ({ ...s, credentials: existing ? s.credentials.map(c => c.id === existing.id ? next : c) : [...s.credentials, next] }))
      close()
    } catch {
      if (active.current) setError('Could not save. Please unlock the vault and try again.')
    } finally {
      saving.current = false
      if (active.current) { setBusy(false); setSecret(''); setUsername(''); setShow(false); setShowUsername(false) }
    }
  }

  return <div className="[&_button]:min-h-10" onKeyDown={e => {
      if (e.key !== 'Tab') return
      const dialog = form.current?.closest('[role="dialog"]')
      const targets = dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]')
      if (!targets?.length) return
      const first = targets[0], last = targets[targets.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }}><Sheet open onClose={close} title={existing ? 'Edit credential' : 'Add credential'}>
    <form ref={form} onSubmit={e => void save(e)} className="space-y-4">
      <Field label="Kind"><Select className="min-h-10" value={kind} disabled={busy} options={Object.entries(kindMeta).map(([value, meta]) => ({ value, label: meta.label }))} onChange={e => { setKind(e.target.value as CredentialKind); setSecret(''); setUsername(''); setShow(false); setShowUsername(false) }} /></Field>
      <Field label="Linked card or account"><Select className="min-h-10" value={options.some(o => o.value === link) ? link : ''} options={options} onChange={e => setLink(e.target.value)} /></Field>
      {kind === 'upi_pin' && <Field label="UPI app"><Select className="min-h-10" value={app} options={[...new Set([...apps, app])].map(value => ({ value, label: value }))} onChange={e => setApp(e.target.value)} /></Field>}
      <Field label="Label" hint={`Default: ${suggested}`}><Input className="min-h-10" value={label} placeholder={suggested} onChange={e => setLabel(e.target.value)} /></Field>
      <Field label="Storage mode" hint="Prefer a memory hint if you do not want to keep the actual secret here."><Select className="min-h-10" value={mode} options={[{ value: 'hint', label: 'Store only a memory hint' }, { value: 'secret', label: 'Store the secret' }]} onChange={e => { setMode(e.target.value as Credential['mode']); setSecret(''); setShow(false); setHint('') }} /></Field>
      {kind === 'netbanking' && <div className="space-y-1">
        <Field label="Customer ID" hint={keepUsername ? 'Leave blank to keep the saved ID. Stored encrypted in either mode.' : 'Stored encrypted in either mode.'}><Input className="min-h-10" type={showUsername ? 'text' : 'password'} autoComplete="off" spellCheck={false} autoCapitalize="none" value={username} onChange={e => setUsername(e.target.value)} /></Field>
        <Button className="min-h-10" type="button" aria-pressed={showUsername} onClick={() => setShowUsername(v => !v)}>◉ {showUsername ? 'Hide' : 'Show'} Customer ID</Button>
      </div>}
      {mode === 'secret' ? <div className="space-y-1">
        <Field label={kind === 'netbanking' ? 'Password / IPIN' : 'Secret'} hint={keepSecret ? 'Leave blank to keep the saved secret.' : undefined}><Input className="min-h-10" type={show ? 'text' : 'password'} inputMode={['card_pin', 'upi_pin', 'mpin', 'tpin'].includes(kind) ? 'numeric' : 'text'} autoComplete="off" spellCheck={false} autoCapitalize="none" value={secret} onChange={e => setSecret(e.target.value)} /></Field>
        <Button className="min-h-10" type="button" aria-pressed={show} onClick={() => setShow(v => !v)}>◉ {show ? 'Hide' : 'Show'} secret</Button>
      </div> : <Field label="Memory hint" hint="Use a clue only. Never enter the actual PIN or password."><Input className="min-h-10" autoComplete="off" value={hint} onChange={e => setHint(e.target.value)} /></Field>}
      <p className="text-xs text-muted">The age badge tracks the last edit here, not a bank-confirmed PIN change.</p>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <div className="flex flex-wrap gap-2"><Button className="min-h-10" variant="primary" type="submit" disabled={busy}>{busy ? 'Encrypting…' : 'Save credential'}</Button><Button className="min-h-10" type="button" onClick={close}>Cancel</Button></div>
      {existing && (confirmDelete ? <Callout tone="danger"><p>Delete this credential from this device? This cannot be undone.</p><div className="mt-2 flex gap-2"><Button className="min-h-10" type="button" variant="danger" disabled={busy} onClick={() => { update(s => ({ ...s, credentials: s.credentials.filter(c => c.id !== existing.id) })); close() }}>Confirm delete</Button><Button className="min-h-10" type="button" onClick={() => setConfirmDelete(false)}>Keep it</Button></div></Callout> : <Button className="min-h-10" type="button" variant="ghost" disabled={busy} onClick={() => setConfirmDelete(true)}>Delete credential</Button>)}
    </form>
  </Sheet></div>
}
