import { useState, type FormEvent } from 'react'
import { addMonths, daysBetween, formatDate, relativeDays, today } from '@/core/format'
import { newId, type Reminder } from '@/core/schema'
import { useAppState, useVault } from '@/core/vault'
import { Badge, Button, Empty, Field, Input, Money, Page, Panel, Progress, Section, Select, Sheet, Stat, cx } from '@/ui'
import { buildIcs } from './ics'
import { calendarEvents, upcomingEvents, type HomeEvent } from './upcoming'

const quickActions = [
  ['Add card', '#/cards'], ['Save a PIN', '#/vault'], ['Which card to use?', '#/cards/pick'],
  ['Import statement', '#/money/import'], ['EMI calculator', '#/tools/emi'], ['Backup', '#/settings'],
] as const
const linkClass = 'inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-medium text-accent hover:bg-raised'
const blank = (): Reminder => ({ id: newId(), title: '', date: today(), repeat: 'none', notes: '' })

function weekStart(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const utc = new Date(Date.UTC(y, m - 1, d))
  utc.setUTCDate(utc.getUTCDate() - (utc.getUTCDay() + 6) % 7)
  return utc.toISOString().slice(0, 10)
}

function UpcomingRow({ event, from }: { event: HomeEvent; from: string }) {
  const days = daysBetween(from, event.date)
  const tone = event.kind === 'statement' ? 'neutral' : days <= 3 ? 'bad' : days <= 7 ? 'warn' : 'neutral'
  const content = <>
    <div className="min-w-0 flex-1">
      <div className="truncate text-sm font-medium text-ink">{event.title}</div>
      <div className="mt-0.5 text-xs text-muted">{formatDate(event.date, 'long')} · {relativeDays(event.date, from)}</div>
    </div>
    {event.amount !== undefined && <Money value={event.amount} compact className="shrink-0 text-sm font-medium text-ink" />}
    <Badge tone={tone}>{event.kind === 'statement' ? 'Statement' : event.kind === 'card-due' ? 'Due' : event.kind === 'loan-emi' ? 'EMI' : event.kind === 'deposit' ? 'Maturity' : 'Reminder'}</Badge>
  </>
  return event.href ? <a href={event.href} className="flex min-h-14 items-center gap-2 border-b border-line py-2 last:border-0 focus-visible:outline-accent">{content}</a>
    : <div className="flex min-h-14 items-center gap-2 border-b border-line py-2 last:border-0">{content}</div>
}

export default function Home() {
  const [state, update] = useAppState()
  const { passkeys } = useVault()
  const [draft, setDraft] = useState<Reminder | null>(null)
  const [error, setError] = useState('')
  const from = today()
  const events = upcomingEvents(state, from, 45)
  const groups = new Map<string, HomeEvent[]>()
  for (const event of events) {
    const key = weekStart(event.date)
    groups.set(key, [...(groups.get(key) ?? []), event])
  }
  const checklist = [
    { label: 'Create your vault', done: true, href: '#/home' },
    { label: 'Add a card', done: state.cards.length > 0, href: '#/cards' },
    { label: 'Save a PIN or password', done: state.credentials.length > 0, href: '#/vault' },
    { label: 'Turn on Face ID / fingerprint unlock', done: passkeys.length > 0, href: '#/settings' },
    { label: 'Export an encrypted backup', done: !!state.settings.lastBackupAt, href: '#/settings' },
    { label: 'Import a bank statement', done: state.txns.length > 0, href: '#/money/import' },
  ]
  const done = checklist.filter((item) => item.done).length
  const activeLoans = state.loans.filter((loan) => loan.startDate <= from && loan.tenureMonths > 0 && from < (Number.isInteger(loan.tenureMonths) ? addMonths(loan.startDate, loan.tenureMonths) : loan.startDate)).length
  const balance = state.accounts.reduce((sum, account) => sum + (Number.isFinite(account.balance) ? account.balance! : 0), 0)
  const creditLimit = state.cards.reduce((sum, card) => sum + (card.kind === 'credit' && Number.isFinite(card.creditLimit) ? card.creditLimit! : 0), 0)

  function downloadCalendar() {
    const entries = calendarEvents(state, from).filter((event) => event.kind !== 'statement')
    const blob = new Blob([buildIcs(entries, new Date())], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'myrm-calendar.ics'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  function saveReminder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft) return
    const title = draft.title.trim()
    const parsed = new Date(`${draft.date}T00:00:00Z`)
    if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(draft.date) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== draft.date) {
      setError('Enter a title and a valid date.')
      return
    }
    const saved = { ...draft, title, notes: draft.notes?.trim() }
    update((s) => ({ ...s, reminders: s.reminders.some((r) => r.id === saved.id) ? s.reminders.map((r) => r.id === saved.id ? saved : r) : [...s.reminders, saved] }))
    setDraft(null)
    setError('')
  }
  function removeReminder(id: string) {
    update((s) => ({ ...s, reminders: s.reminders.filter((r) => r.id !== id) }))
    setDraft(null)
  }
  return <Page title={state.profile.name?.trim() ? `Hi, ${state.profile.name.trim()}` : 'Hi there'} subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} actions={<a href="#/help/lost" className="inline-flex min-h-10 items-center rounded-xl px-2 text-xs font-semibold text-danger">Lost card?</a>}>
    {done < checklist.length && <Section title="Get started"><Panel>
      <div className="mb-2 flex items-center justify-between gap-2 text-sm"><span className="font-medium text-ink">Your setup</span><span className="text-muted">{done} of {checklist.length} done</span></div>
      <Progress value={done} max={checklist.length} />
      <div className="mt-3 grid gap-1">{checklist.map((item) => <a key={item.label} href={item.href} className="flex min-h-10 items-center gap-3 rounded-lg px-1 text-sm hover:bg-raised"><span aria-hidden className={cx('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs', item.done ? 'border-good bg-good text-white' : 'border-line text-muted')}>{item.done ? '✓' : ''}</span><span className={cx(item.done ? 'text-muted' : 'text-ink')}>{item.label}</span></a>)}</div>
    </Panel></Section>}
    <Section title="Upcoming · next 45 days" action={<Button size="sm" onClick={downloadCalendar}>Add to calendar</Button>}>
      <p className="mb-2 text-xs text-muted">Import into Google/Apple Calendar to get alerts even when MyRM is closed.</p>
      {events.length ? <Panel>{[...groups].map(([week, items]) => <div key={week} className="mb-3 last:mb-0"><h3 className="text-xs font-semibold text-muted">Week of {formatDate(week, 'long')}</h3>{items.map((item) => <UpcomingRow key={`${item.kind}-${item.id}-${item.date}`} event={item} from={from} />)}</div>)}</Panel> : <Empty title="Nothing coming up" body="Add card dates, a loan, a deposit or a reminder to see it here." />}
    </Section>
    <Section title="Reminders" action={<Button size="sm" onClick={() => { setError(''); setDraft(blank()) }}>Add reminder</Button>}>
      {state.reminders.length ? <Panel className="divide-y divide-line">{[...state.reminders].sort((a, b) => a.date.localeCompare(b.date)).map((reminder) => <div key={reminder.id} className="flex min-h-14 items-center justify-between gap-2 py-2"><div className="min-w-0"><div className="truncate text-sm font-medium text-ink">{reminder.title}</div><div className="text-xs text-muted">{formatDate(reminder.date, 'long')} · {reminder.repeat}</div></div><Button size="sm" variant="ghost" onClick={() => { setError(''); setDraft({ ...reminder }) }}>Edit</Button></div>)}</Panel> : <Empty title="No reminders yet" body="Keep track of any date that matters to you." />}
    </Section>
    <Section title="Snapshot"><div className="grid grid-cols-2 gap-3"><Panel><Stat label="Cards" value={state.cards.length} sub={<><Money value={creditLimit} compact /> total credit limit</>} /></Panel><Panel><Stat label="Saved PINs & passwords" value={state.credentials.length} /></Panel><Panel><Stat label="Account balances" value={<Money value={balance} compact />} /></Panel><Panel><Stat label="Active loans" value={activeLoans} /></Panel></div></Section>
    <Section title="Quick actions"><div className="grid grid-cols-2 gap-2">{quickActions.map(([label, href]) => <a key={label} href={href} className={cx(linkClass, 'border border-line bg-surface')}>{label} <span aria-hidden className="ml-auto">→</span></a>)}</div></Section>
    <Sheet open={!!draft} onClose={() => setDraft(null)} title={draft && state.reminders.some((r) => r.id === draft.id) ? 'Edit reminder' : 'Add reminder'}>
      {draft && <form onSubmit={saveReminder} className="space-y-4"><Field label="Title"><Input required maxLength={120} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field><Field label="Date"><Input required type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></Field><Field label="Repeat"><Select value={draft.repeat} options={[{ value: 'none', label: 'One time' }, { value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' }]} onChange={(e) => setDraft({ ...draft, repeat: e.target.value as Reminder['repeat'] })} /></Field><Field label="Notes"><Input maxLength={500} value={draft.notes ?? ''} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></Field>{error && <p role="alert" className="text-sm text-danger">{error}</p>}<div className="flex gap-2"><Button type="submit" variant="primary" className="min-h-10 flex-1">Save reminder</Button>{state.reminders.some((r) => r.id === draft.id) && <Button type="button" variant="danger" className="min-h-10" onClick={() => removeReminder(draft.id)}>Delete</Button>}</div></form>}
    </Sheet>
  </Page>
}

