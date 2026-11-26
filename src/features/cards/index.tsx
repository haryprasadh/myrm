import { useEffect, useState, type FormEvent } from 'react'
import { daysBetween, formatDate, relativeDays, today } from '@/core/format'
import { go, useRoute } from '@/core/router'
import { newId, type UserCard } from '@/core/schema'
import { useAppState, useVault } from '@/core/vault'
import { CARD_CATALOG, CARD_RULE_CHANGES, catalogCard } from '@/data/cards'
import type { CatalogCard, SpendCategory } from '@/data/types'
import { Badge, Button, Callout, Empty, Field, Input, Money, Page, Panel, Progress, Section, Select, Sheet, SourceNote, Toggle, cx } from '@/ui'
import { SecretValue } from '@/ui/SecretValue'
import { bestPurchaseDay, cardYearRange, cardYearSpend, feeWaiverProgress, luhnValid, nextDueDate, nextStatementDate, rankCards, recentRuleChanges, validateExpiry } from './logic'

const categories: { value: SpendCategory; label: string }[] = [
  ['general', 'Everyday'], ['online', 'Online shopping'], ['dining', 'Dining'], ['groceries', 'Groceries'], ['fuel', 'Fuel'], ['travel', 'Travel'], ['utilities', 'Utility bills'], ['rent', 'Rent'], ['insurance', 'Insurance'], ['education', 'Education'], ['wallet', 'Wallet loads'], ['government', 'Government payments'], ['smartbuy', 'SmartBuy'], ['swiggy', 'Swiggy'], ['tataneu', 'Tata Neu'], ['amazon', 'Amazon'], ['flipkart', 'Flipkart'], ['international', 'International'],
].map(([value, label]) => ({ value: value as SpendCategory, label }))
const networks: NonNullable<UserCard['network']>[] = ['Visa', 'Mastercard', 'RuPay', 'Diners', 'Amex', 'Other']
const dayOptions = [{ value: '', label: 'Not set' }, ...Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))]
const monthOptions = [{ value: '', label: 'Not set' }, ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: new Date(2026, i, 1).toLocaleString('en-IN', { month: 'long' }) }))]
const numberValue = (value: string) => value.trim() === '' ? undefined : Number(value)
const validMoney = (value: string) => value.trim() === '' || (Number.isFinite(Number(value)) && Number(value) >= 0)
const gradient: Record<CatalogCard['tier'], string> = {
  entry: 'from-accent to-accent/70', mid: 'from-accent to-good', premium: 'from-ink to-accent', 'super-premium': 'from-ink to-warn', cobrand: 'from-accent to-warn', business: 'from-ink to-muted',
}
function CatalogWarnings({ card }: { card: CatalogCard }) {
  return <>{card.status === 'invite_only' && <Badge tone="accent">Invite only</Badge>}{card.status === 'legacy' && <Badge tone="neutral">No longer issued</Badge>}{!!card.unverified?.length && <span className="text-xs text-warn" title={card.unverified.join(' · ')}>Some details unverified</span>}</>
}

export default function Cards() {
  const [state] = useAppState()
  const { segments } = useRoute()
  const [editing, setEditing] = useState<UserCard | null | 'new'>(null)
  const card = state.cards.find(c => c.id === segments[1])
  if (segments[1] === 'pick') return <Picker />
  if (segments[1]) return card ? <Detail card={card} onEdit={() => setEditing(card)} editing={editing} close={() => setEditing(null)} /> : <Page title="Card not found"><Button onClick={() => go('cards')}>Back to cards</Button></Page>
  return <Page title="Your cards" subtitle="Dues, rewards and card details in one place" actions={<Button variant="primary" onClick={() => setEditing('new')}>Add card</Button>}>
    {state.cards.length ? <div className="grid gap-3 sm:grid-cols-2">{state.cards.map(c => <WalletTile key={c.id} card={c} />)}</div> : <Empty title="No cards yet" body="Add a card to track due dates, fee waivers and the best card for each purchase." action={<Button variant="primary" onClick={() => setEditing('new')}>Add your first card</Button>} />}
    <Panel><div className="flex items-center justify-between gap-3"><div><h2 className="font-medium text-ink">Which card should I use?</h2><p className="text-sm text-muted">Compare rewards for your next purchase.</p></div><Button onClick={() => go('cards/pick')}>Compare cards</Button></div></Panel>
    {editing && <CardForm key={editing === 'new' ? 'new' : editing.id} card={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
  </Page>
}
function WalletTile({ card }: { card: UserCard }) {
  const catalog = catalogCard(card.catalogId)
  const due = card.kind === 'credit' && card.dueDay ? nextDueDate(card.dueDay, today()) : undefined
  const days = due ? daysBetween(today(), due) : undefined
  return <button type="button" onClick={() => go(`cards/${card.id}`)} className={cx('min-h-44 w-full rounded-2xl bg-gradient-to-br p-5 text-left text-white shadow-md transition active:scale-[.99]', catalog ? gradient[catalog.tier] : card.kind === 'debit' ? 'from-good to-accent' : 'from-accent to-ink')}>
    <span className="flex justify-between gap-3 text-sm opacity-90"><span>{card.kind === 'credit' ? 'Credit card' : 'Debit card'}</span><span>{card.network ?? catalog?.networks[0] ?? ''}</span></span>
    <span className="mt-8 block text-xl font-semibold">{card.nickname}</span>
    <span className="mt-1 block text-sm opacity-90">{catalog?.name ?? 'Other card'} · {card.last4 ? `•••• ${card.last4}` : 'Number not added'}</span>
    {due && <span className={cx('mt-4 inline-block rounded-full px-2 py-1 text-xs', days != null && days <= 3 ? 'bg-danger text-white' : days != null && days <= 7 ? 'bg-warn text-ink' : 'bg-surface/20 text-white')}>Due {formatDate(due)} · {relativeDays(due)}</span>}
  </button>
}
function CardForm({ card, onClose }: { card?: UserCard; onClose: () => void }) {
  const [, update] = useAppState()
  const { seal } = useVault()
  const [kind, setKind] = useState<UserCard['kind']>(card?.kind ?? 'credit')
  const [catalogId, setCatalogId] = useState(card?.catalogId ?? '')
  const [search, setSearch] = useState('')
  const [nickname, setNickname] = useState(card?.nickname ?? '')
  const [network, setNetwork] = useState(card?.network ?? '')
  const [last4, setLast4] = useState(card?.last4 ?? '')
  const [expiry, setExpiry] = useState(card?.expiry ?? '')
  const [creditLimit, setCreditLimit] = useState(card?.creditLimit?.toString() ?? '')
  const [statementDay, setStatementDay] = useState(card?.statementDay?.toString() ?? '')
  const [dueDay, setDueDay] = useState(card?.dueDay?.toString() ?? '')
  const [feeMonth, setFeeMonth] = useState(card?.feeMonth?.toString() ?? '')
  const [feeWaiverSpend, setFeeWaiverSpend] = useState(card?.feeWaiverSpend?.toString() ?? '')
  const [manualYearSpend, setManualYearSpend] = useState(card?.manualYearSpend?.toString() ?? '')
  const [fullNumber, setFullNumber] = useState('')
  const [showNumber, setShowNumber] = useState(false)
  const [removeNumber, setRemoveNumber] = useState(false)
  const [notes, setNotes] = useState(card?.notes ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  useEffect(() => {
    const clear = () => { if (document.hidden) { setFullNumber(''); setShowNumber(false) } }
    document.addEventListener('visibilitychange', clear)
    return () => document.removeEventListener('visibilitychange', clear)
  }, [])
  const closeForm = () => { setFullNumber(''); setShowNumber(false); onClose() }
  const matches = CARD_CATALOG.filter(c => c.kind === kind && c.name.toLowerCase().includes(search.toLowerCase()))
  const chosen = catalogCard(catalogId)
  const save = async (event: FormEvent) => {
    event.preventDefault()
    const digits = fullNumber.replace(/[ -]/g, '')
    if (!nickname.trim()) return setError('Add a nickname.')
    if (last4 && !/^\d{4}$/.test(last4)) return setError('Last four digits must be exactly 4 numbers.')
    if (expiry && !validateExpiry(expiry, today())) return setError('Enter a valid, unexpired MM/YY.')
    if ([creditLimit, feeWaiverSpend, manualYearSpend].some(v => !validMoney(v))) return setError('Amounts must be zero or more.')
    if (fullNumber && !luhnValid(fullNumber)) return setError('Enter a valid card number.')
    if (digits && last4 && last4 !== digits.slice(-4)) return setError('Last four digits must match the card number.')
    if (card?.number && !digits && !removeNumber && last4 !== (card.last4 ?? '')) return setError('Replace or remove the saved number before changing its last four digits.')
    setBusy(true); setError('')
    try {
      const sealed = digits ? await seal(digits) : removeNumber ? undefined : card?.number
      const next: UserCard = { id: card?.id ?? newId(), kind, nickname: nickname.trim(), catalogId: chosen?.kind === kind ? catalogId : undefined, network: network ? network as UserCard['network'] : undefined, last4: digits ? digits.slice(-4) : last4 || undefined, number: sealed, expiry: expiry || undefined, creditLimit: numberValue(creditLimit), statementDay: numberValue(statementDay), dueDay: numberValue(dueDay), feeMonth: numberValue(feeMonth), feeWaiverSpend: numberValue(feeWaiverSpend), manualYearSpend: numberValue(manualYearSpend), notes: notes.trim() || undefined, linkedAccountId: card?.linkedAccountId }
      update(s => ({ ...s, cards: card ? s.cards.map(c => c.id === card.id ? next : c) : [...s.cards, next] }))
      closeForm()
    } catch { setError('Could not save the card. Try again.') } finally { setBusy(false) }
  }
  const deleteCard = () => {
    if (!card || !confirmDelete) return
    update(s => ({ ...s, cards: s.cards.filter(c => c.id !== card.id) }))
    closeForm(); go('cards')
  }
  return <Sheet open onClose={closeForm} title={card ? 'Edit card' : 'Add card'}><form onSubmit={e => void save(e)} className="space-y-4">
    <Field label="Card type"><Select value={kind} onChange={e => { setKind(e.target.value as UserCard['kind']); setCatalogId('') }} options={[{ value: 'credit', label: 'Credit' }, { value: 'debit', label: 'Debit' }]} /></Field>
    <div><Field label="Find your card"><Input value={search} onChange={e => { setSearch(e.target.value); setCatalogId('') }} placeholder="Search the card list" /></Field><div className="mt-2 max-h-36 overflow-y-auto rounded-xl border border-line">{matches.map(c => <button type="button" key={c.id} onClick={() => { setCatalogId(c.id); setSearch(c.name) }} className={cx('block min-h-10 w-full px-3 py-2 text-left text-sm text-ink', catalogId === c.id ? 'bg-accent/15' : 'hover:bg-raised')}>{c.name}<CatalogWarnings card={c} /></button>)}<button type="button" onClick={() => { setCatalogId(''); setSearch('') }} className={cx('block min-h-10 w-full px-3 py-2 text-left text-sm text-ink', !catalogId && 'bg-accent/15')}>Other / not listed</button></div></div>
    <Field label="Nickname"><Input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="My daily card" required /></Field>
    <div className="grid grid-cols-2 gap-3"><Field label="Network"><Select value={network} onChange={e => setNetwork(e.target.value)} options={[{ value: '', label: 'Not set' }, ...networks.map(n => ({ value: n, label: n }))]} /></Field><Field label="Last 4 digits"><Input inputMode="numeric" maxLength={4} value={last4} onChange={e => setLast4(e.target.value)} placeholder="1234" /></Field></div>
    <div className="grid grid-cols-2 gap-3"><Field label="Expiry (MM/YY)"><Input value={expiry} onChange={e => setExpiry(e.target.value)} placeholder="08/28" inputMode="numeric" /></Field><Field label="Credit limit (₹)"><Input type="number" min="0" step="0.01" value={creditLimit} onChange={e => setCreditLimit(e.target.value)} /></Field></div>
    <div className="grid grid-cols-2 gap-3"><Field label="Statement day"><Select value={statementDay} onChange={e => setStatementDay(e.target.value)} options={dayOptions} /></Field><Field label="Payment due day"><Select value={dueDay} onChange={e => setDueDay(e.target.value)} options={dayOptions} /></Field></div>
    <Field label="Annual fee month"><Select value={feeMonth} onChange={e => setFeeMonth(e.target.value)} options={monthOptions} /></Field>
    <div className="grid grid-cols-2 gap-3"><Field label="Fee waiver spend (₹)" hint="Overrides catalog"><Input type="number" min="0" step="0.01" value={feeWaiverSpend} onChange={e => setFeeWaiverSpend(e.target.value)} /></Field><Field label="Manual spend this card year (₹)"><Input type="number" min="0" step="0.01" value={manualYearSpend} onChange={e => setManualYearSpend(e.target.value)} /></Field></div>
    <div><Field label="Full card number (optional)" hint={card?.number ? 'Leave blank to keep the saved number.' : 'Encrypted separately in your vault.'}><Input type={showNumber ? 'text' : 'password'} inputMode="numeric" autoComplete="off" value={fullNumber} onChange={e => setFullNumber(e.target.value)} /></Field><Button type="button" variant="ghost" className="mt-1 min-h-10" onClick={() => setShowNumber(v => !v)}>{showNumber ? 'Hide' : 'Show'} card number</Button></div>
    {card?.number && <Toggle label="Remove saved full number" checked={removeNumber} onChange={setRemoveNumber} />}
    <Callout>MyRM never stores your CVV.</Callout>
    <Field label="Notes"><Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" /></Field>
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    <Button type="submit" variant="primary" size="lg" disabled={busy}>{busy ? 'Saving…' : 'Save card'}</Button>
    {card && <div className="border-t border-line pt-4">{confirmDelete ? <div className="flex gap-2"><Button type="button" variant="danger" onClick={deleteCard}>Delete card</Button><Button type="button" onClick={() => setConfirmDelete(false)}>Cancel</Button></div> : <Button type="button" variant="ghost" onClick={() => setConfirmDelete(true)}>Delete card…</Button>}</div>}
  </form></Sheet>
}
function Detail({ card, onEdit, editing, close }: { card: UserCard; onEdit: () => void; editing: UserCard | null | 'new'; close: () => void }) {
  const [state] = useAppState()
  const catalog = catalogCard(card.catalogId)
  const changes = recentRuleChanges(CARD_RULE_CHANGES, card.catalogId)
  const current = today()
  const statement = card.kind === 'credit' && card.statementDay ? nextStatementDate(card.statementDay, current) : undefined
  const due = card.kind === 'credit' && card.dueDay ? nextDueDate(card.dueDay, current) : undefined
  const range = cardYearRange(card.feeMonth, current)
  const waiver = feeWaiverProgress(cardYearSpend(state.txns, card.id, range) + (card.manualYearSpend ?? 0), card.feeWaiverSpend ?? catalog?.fees.waiverSpend)
  const dueDays = due ? daysBetween(current, due) : undefined
  return <Page title={card.nickname} subtitle={`${catalog?.name ?? 'Other card'} · ${card.kind} · ${card.network ?? catalog?.networks[0] ?? 'Network not set'}`} actions={<Button onClick={onEdit}>Edit</Button>}>
    <Button variant="ghost" onClick={() => go('cards')}>← All cards</Button>
    <Panel>{card.number ? <SecretValue key={card.id} value={card.number} label="card number" /> : <span className="text-lg font-semibold text-ink">{card.last4 ? `•••• •••• •••• ${card.last4}` : 'Number not added'}</span>}{card.expiry && <p className="mt-2 text-sm text-muted">Expires {card.expiry}</p>}</Panel>
    {card.kind === 'credit' && <Section title="Dates"><div className="grid gap-3 sm:grid-cols-2"><Panel><p className="text-sm text-muted">Next statement</p><p className="mt-1 text-xl font-semibold text-ink">{statement ? formatDate(statement, 'long') : 'Not set'}</p>{statement && <p className="text-sm text-muted">{relativeDays(statement)}</p>}</Panel><Panel><p className="text-sm text-muted">Next payment due</p><p className="mt-1 text-xl font-semibold text-ink">{due ? formatDate(due, 'long') : 'Not set'}</p>{due && <Badge tone={dueDays != null && dueDays <= 3 ? 'bad' : dueDays != null && dueDays <= 7 ? 'warn' : 'neutral'}>{relativeDays(due)}</Badge>}</Panel></div></Section>}
    {statement && <Callout>The day after your statement, {formatDate(bestPurchaseDay(statement))}, usually gives a big purchase the longest time before payment is due. Check your card statement for the actual interest-free period.</Callout>}
    {waiver && <Section title="Annual fee waiver"><Panel><div className="flex justify-between gap-2 text-sm text-ink"><span><Money value={waiver.spend} /> spent</span><span><Money value={waiver.threshold} /> goal</span></div><div className="mt-3"><Progress value={waiver.spend} max={waiver.threshold} tone={waiver.met ? 'good' : 'accent'} /></div><p className="mt-3 text-sm text-muted">{waiver.met ? 'Spend goal reached for this card year.' : <>Spend <Money value={waiver.remaining} /> more before {formatDate(range.end, 'long')}{catalog?.fees.annual != null ? <> to save <Money value={catalog.fees.annual} /></> : ' to reach the waiver goal'}.</>}</p><p className="mt-1 text-xs text-muted">Includes card debits and your manual spend. Card year: {formatDate(range.start, 'long')}–{formatDate(range.end, 'long')} (end exclusive).</p>{catalog && card.feeWaiverSpend == null && <SourceNote asOf={catalog.lastVerified} href={catalog.source} />}</Panel></Section>}
    {catalog && <Section title="Card benefits"><Panel className="space-y-3"><div className="grid grid-cols-2 gap-3 text-sm"><div><p className="text-muted">Base reward</p><p className="text-ink">{catalog.baseRatePct == null ? 'Not verified' : `${catalog.baseRatePct}%`}</p></div><div><p className="text-muted">Forex markup</p><p className="text-ink">{catalog.forexMarkupPct == null ? 'Not verified' : `${catalog.forexMarkupPct}%`}</p></div></div>{catalog.pointValueNote && <p className="text-sm text-muted">{catalog.pointValueNote}</p>}{(catalog.lounge.domestic || catalog.lounge.international) && <p className="text-sm text-ink">Lounge: {[catalog.lounge.domestic, catalog.lounge.international].filter(Boolean).join(' · ')}</p>}{catalog.caps.length > 0 && <BenefitList title="Caps" items={catalog.caps} />}{catalog.milestones.length > 0 && <BenefitList title="Milestones" items={catalog.milestones} />}{catalog.highlights.length > 0 && <BenefitList title="Highlights" items={catalog.highlights} />}{catalog.unverified && catalog.unverified.length > 0 && <Callout tone="warn">Unverified: {catalog.unverified.join(' · ')}</Callout>}<SourceNote asOf={catalog.lastVerified} href={catalog.source} /></Panel></Section>}
    {changes.length > 0 && <Section title="Recent rule changes"><Panel><div className="space-y-3">{changes.map((change, i) => <div key={`${change.date}-${i}`} className="border-b border-line pb-3 last:border-0 last:pb-0"><p className="text-xs text-muted">{formatDate(change.date, 'long')}</p><p className="text-sm text-ink">{change.text}</p><SourceNote asOf={change.date} href={change.source} /></div>)}</div></Panel></Section>}
    {card.notes && <Section title="Notes"><Panel><p className="text-sm text-ink">{card.notes}</p></Panel></Section>}
    {editing && <CardForm key={card.id} card={card} onClose={close} />}
  </Page>
}
function BenefitList({ title, items }: { title: string; items: string[] }) {
  return <div><h3 className="text-sm font-medium text-ink">{title}</h3><ul className="mt-1 list-inside list-disc text-sm text-muted">{items.map(item => <li key={item}>{item}</li>)}</ul></div>
}
function Picker() {
  const [state] = useAppState()
  const [category, setCategory] = useState<SpendCategory>('general')
  const [amount, setAmount] = useState('1000')
  const [all, setAll] = useState(false)
  const value = Number(amount)
  const catalog = all ? CARD_CATALOG : state.cards.flatMap(c => { const entry = catalogCard(c.catalogId); return entry ? [entry] : [] })
  const ranking = rankCards(catalog, category, value)
  return <Page title="Which card should I use?" subtitle="Estimated rewards for one purchase">
    <Button variant="ghost" onClick={() => go('cards')}>← All cards</Button>
    <Panel className="space-y-4"><Field label="Spend category"><Select value={category} onChange={e => setCategory(e.target.value as SpendCategory)} options={categories} /></Field><Field label="Purchase amount (₹)"><Input type="number" min="1" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} /></Field><Toggle checked={all} onChange={setAll} label="Compare all HDFC cards" /></Panel>
    {!Number.isFinite(value) || value <= 0 ? <Callout tone="warn">Enter an amount above zero.</Callout> : ranking.length ? <Section title="Highest estimated reward first"><div className="space-y-3">{ranking.map((entry, index) => <Panel key={entry.card.id}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-ink">{index + 1}. {entry.card.name}</p><div className="flex flex-wrap gap-2"><CatalogWarnings card={entry.card} /></div><p className="text-sm text-muted">{entry.ratePct}% effective reward · {entry.card.rewardUnit}</p></div><p className="shrink-0 text-lg font-semibold text-good"><Money value={entry.earned} paise /></p></div>{entry.caveats.length > 0 && <p className="mt-2 text-xs text-warn">{entry.caveats.join(' · ')}</p>}{entry.card.pointValueNote && <p className="mt-2 text-xs text-muted">{entry.card.pointValueNote}</p>}<SourceNote asOf={entry.card.lastVerified} href={entry.card.source} /></Panel>)}</div></Section> : <Empty title={CARD_CATALOG.length === 0 ? 'Card data is coming soon' : all ? 'No comparable cards' : 'No catalog cards in your wallet'} body={CARD_CATALOG.length === 0 ? 'You can still add and track your cards. Reward comparisons will appear when verified card data is available.' : 'Add a listed card, or compare all HDFC cards.'} />}
    <p className="text-xs text-muted">Estimates use published effective rates. Caps, exclusions and redemption terms may reduce actual rewards.</p>
  </Page>
}
