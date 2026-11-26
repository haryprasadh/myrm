import { useState } from 'react'
import type { Credential } from '@/core/schema'
import { useAppState } from '@/core/vault'
import { HDFC } from '@/data/hdfc'
import { Badge, Button, Empty, Field, Input, Page, Panel, Section, SourceNote } from '@/ui'
import { ageBadge, groupCredentials, kindMeta } from './logic'
import { CredentialEditor } from './CredentialEditor'
import { SecretValue } from '@/ui/SecretValue'

export default function Vault() {
  const [state] = useAppState()
  const [search, setSearch] = useState('')
  const [editor, setEditor] = useState<Credential | 'new' | null>(null)
  const query = search.trim().toLocaleLowerCase()
  const groups = groupCredentials(state.credentials, state.cards, state.accounts)
    .map(group => ({ ...group, credentials: group.credentials.filter(c => [c.label, kindMeta[c.kind].label, c.app ?? '', group.label].some(text => text.toLocaleLowerCase().includes(query))) }))
    .filter(group => group.credentials.length)
  const securityLink = HDFC.officialLinks.find(link => link.group === 'security')
  return <Page title="Vault" subtitle="PINs and credentials, encrypted on this device." actions={<Button className="min-h-10" variant="primary" onClick={() => setEditor('new')}>Add</Button>}>
    <Field label="Search credentials"><Input className="min-h-10" type="search" autoComplete="off" placeholder="Label, app, card or account" value={search} onChange={e => setSearch(e.target.value)} /></Field>
    {!state.credentials.length ? <Empty title="Your private place for PINs" body="Keep card PINs, UPI PINs per app, MPIN, and NetBanking Customer ID + IPIN together. Encrypted on device. Store a memory hint if you prefer." action={<Button className="min-h-10" onClick={() => setEditor('new')}>Add your first credential</Button>} /> : !groups.length ? <Empty title="No matching credentials" action={<Button className="min-h-10" onClick={() => setSearch('')}>Clear search</Button>} /> : groups.map(group => <Section key={group.key} title={group.label}>
      <div className="space-y-3">{group.credentials.map(credential => {
        const meta = kindMeta[credential.kind]
        const age = ageBadge(credential.updatedAt)
        return <Panel key={credential.id}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0"><h3 className="break-words font-semibold text-ink"><span aria-hidden="true">{meta.icon}</span> {credential.label}</h3><p className="text-sm text-muted">{meta.label}{credential.app ? ` · ${credential.app}` : ''} · {group.label}</p></div>
            <Button className="min-h-10" aria-label={`Edit ${credential.label}`} onClick={() => setEditor(credential)}>Edit</Button>
          </div>
          <div className="my-3 flex flex-wrap gap-2"><Badge>{credential.mode === 'hint' ? 'Hint only' : 'Secret'}</Badge><Badge tone={age.tone}>{age.label}</Badge></div>
          {/* Hide all revealed values while editing; remount sealed values after edits. */}
          {!editor && <div className="space-y-4">
            {credential.username && <SecretValue key={`username:${credential.username.iv}:${credential.username.ct}`} value={credential.username} label="Customer ID" />}
            {credential.mode === 'hint' ? <p className="break-words text-sm text-ink">Hint: {credential.hint || 'No hint saved.'}</p> : credential.secret ? <SecretValue key={`secret:${credential.secret.iv}:${credential.secret.ct}`} value={credential.secret} label={credential.kind === 'netbanking' ? 'password / IPIN' : 'PIN / secret'} /> : <p className="text-sm text-muted">No secret saved. Edit to add one.</p>}
          </div>}
        </Panel>
      })}</div>
    </Section>)}
    <Panel><details><summary className="min-h-10 cursor-pointer py-2 font-medium text-ink">Keep your credentials safe</summary><div className="space-y-2 text-sm text-muted">
      <p>HDFC Bank will never ask for your PIN, OTP, CVV or password. Never share them.</p>
      <SourceNote asOf={HDFC.asOf} href={securityLink?.url} />
      <p>MyRM never asks for OTPs or CVV.</p>
      <ul className="list-disc space-y-1 pl-5"><li>Use different PINs for different cards and apps.</li><li>Do not use birth years.</li><li>Change PINs if you suspect exposure.</li></ul>
      <a className="inline-flex min-h-10 items-center text-accent underline" href="#/help">How to change a PIN</a>
      <p>Clipboard clearing is best effort. Your browser may block it, and clipboard history or other apps may keep copies.</p>
    </div></details></Panel>
    {editor && <CredentialEditor existing={editor === 'new' ? undefined : editor} onClose={() => setEditor(null)} />}
  </Page>
}
