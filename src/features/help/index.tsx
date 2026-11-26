import { useEffect, useMemo, useState } from 'react'
import { go, useRoute } from '@/core/router'
import { HDFC } from '@/data/hdfc'
import type { Helpline, HowTo, OfficialLink } from '@/data/types'
import { Badge, Button, Callout, Empty, Field, Input, Page, Panel, Section, SourceNote } from '@/ui'
import { checkMessage } from './checker'
import { fillSmsBody, lostCardContacts, thirdWorkingDay } from './helpers'

const external = { target: '_blank', rel: 'noopener noreferrer' } as const
const linkClass = 'inline-flex min-h-10 items-center rounded-xl border border-line bg-surface px-4 py-2 text-sm font-medium text-accent'
const source = (href?: string) => <SourceNote asOf={HDFC.asOf} href={href} />
const number = (value: string) => value.replace(/[^+\d]/g, '')

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return <Button type="button" onClick={async () => { try { await navigator.clipboard.writeText(value); setCopied(true) } catch { setCopied(false) } }}>{copied ? 'Copied' : 'Copy'}</Button>
}

function SmsAction({ item }: { item: Helpline }) {
  const [digits, setDigits] = useState('')
  const body = item.smsBody ? fillSmsBody(item.smsBody, digits) : ''
  return <div className="space-y-2 rounded-xl border border-line bg-raised p-3">
    <p className="font-medium text-ink">{item.label}: {item.value}</p>
    {item.smsBody && <Field label="Last 4 card digits" hint="Used here only to prepare the SMS. Never enter the full card number."><Input inputMode="numeric" autoComplete="off" maxLength={4} value={digits} onChange={e => setDigits(e.target.value.replace(/\D/g, '').slice(0, 4))} /></Field>}
    <div className="flex flex-wrap gap-2">
      {body !== null && <a className={linkClass} href={`sms:${number(item.value)}?&body=${encodeURIComponent(body)}`}>Open SMS</a>}
      {body !== null && <CopyButton value={body} />}
    </div>
    {item.note && <p className="text-sm text-muted">{item.note}</p>}
  </div>
}

function Contact({ item }: { item: Helpline }) {
  if (item.kind === 'sms') return <SmsAction item={item} />
  const href = item.kind === 'phone' ? `tel:${number(item.value)}` : item.kind === 'email' ? `mailto:${item.value}` : item.kind === 'whatsapp' ? `https://wa.me/${number(item.value).replace(/^\+/, '')}` : item.value
  return <div className="rounded-xl border border-line p-3">
    <p className="font-medium text-ink">{item.label}</p>
    <div className="mt-2 flex flex-wrap items-center gap-2"><a className={linkClass} href={href} {...(item.kind === 'web' || item.kind === 'whatsapp' ? external : {})}>{item.kind === 'phone' ? 'Call' : item.kind === 'email' ? 'Email' : item.kind === 'whatsapp' ? 'Open WhatsApp' : 'Open'} {item.value}</a><CopyButton value={item.value} /></div>
    {item.note && <p className="mt-2 text-sm text-muted">{item.note}</p>}
  </div>
}

function Official({ item }: { item: OfficialLink }) {
  return <div className="rounded-xl border border-line p-3"><a className="inline-flex min-h-10 items-center text-sm font-semibold text-accent underline" href={item.url} {...external}>{item.label} ↗</a><p className="text-sm text-muted">{item.purpose}</p></div>
}

function Home() {
  const [query, setQuery] = useState('')
  const [allHelplines, setAllHelplines] = useState(false)
  const priorityIds = ['customer-care', 'block-cc-sms', 'report-fraud', 'cyber-1930']
  const priority = priorityIds.flatMap(id => HDFC.helplines.filter(h => h.id === id))
  const otherHelplines = HDFC.helplines.filter(h => !priorityIds.includes(h.id))
  const guides = useMemo(() => HDFC.howTo.filter(h => `${h.title} ${h.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase().trim())), [query])
  const grouped = Object.groupBy(HDFC.officialLinks, l => l.group)
  return <Page title="Help & safety" subtitle="Quick steps when something feels wrong.">
    <div className="grid gap-3"><Button variant="danger" size="lg" onClick={() => go('help/lost')}>Lost card or fraud?</Button><Button size="lg" onClick={() => go('help/check')}>Is this link or SMS safe?</Button></div>
    <Section title="Stay safe"><Panel><ul className="list-disc space-y-2 pl-5 text-sm text-ink"><li>HDFC Bank never asks for your PIN, OTP, CVV or passwords by call, SMS, email or WhatsApp.</li><li>Never install apps (APK) from links.</li><li>Type the bank address yourself.</li><li>If you lost money to fraud, call <a className="font-semibold text-accent underline" href="tel:1930">1930</a> and report at <a className="text-accent underline" href="https://cybercrime.gov.in/" {...external}>cybercrime.gov.in</a>.</li></ul>{source(HDFC.officialLinks.find(l => l.id === 'security')?.url)}</Panel></Section>
    {HDFC.trustMarkers.length > 0 && <Section title="How to spot genuine HDFC contact"><Panel><ul className="list-disc space-y-2 pl-5 text-sm text-ink">{HDFC.trustMarkers.map(m => <li key={m}>{m}</li>)}</ul>{source(HDFC.officialLinks.find(l => l.id === 'trust-markers')?.url)}</Panel></Section>}
    {HDFC.helplines.length > 0 && <Section title="Helplines"><div className="space-y-2">{priority.map(h => <Contact key={h.id} item={h} />)}{otherHelplines.length > 0 && <><Button onClick={() => setAllHelplines(v => !v)} aria-expanded={allHelplines}>{allHelplines ? 'Hide' : 'Show all'} helplines ({HDFC.helplines.length})</Button>{allHelplines && otherHelplines.map(h => <Contact key={h.id} item={h} />)}</>}{source(priority[0]?.source ?? HDFC.helplines[0]?.source)}</div></Section>}
    {HDFC.officialLinks.length > 0 && <Section title="Official links"><div className="space-y-2">{Object.entries(grouped).map(([group, links]) => <details key={group} className="rounded-xl border border-line bg-surface p-3"><summary className="min-h-10 cursor-pointer text-sm font-semibold capitalize text-ink">{group} ({links?.length ?? 0})</summary><div className="space-y-2">{links?.map(l => <Official key={l.id} item={l} />)}</div></details>)}{source(HDFC.officialLinks[0]?.url)}</div></Section>}
    {HDFC.howTo.length > 0 && <Section title="How-to guides"><Field label="Search guides"><Input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Card, PIN, dispute…" /></Field><div className="mt-2 space-y-2">{guides.length ? guides.map(h => <Button key={h.id} className="min-h-10 w-full justify-start text-left" onClick={() => go(`help/howto/${encodeURIComponent(h.id)}`)}>{h.title} →</Button>) : <Empty title="No matching guides" />}</div></Section>}
  </Page>
}

function Back() { return <Button type="button" onClick={() => go('help')}>← Help</Button> }

function Guide({ guide }: { guide?: HowTo }) {
  if (!guide) return <Page title="Guide not found" actions={<Back />}><Empty title="This guide is unavailable" /></Page>
  return <Page title={guide.title} actions={<Back />}><Panel><ol className="list-decimal space-y-4 pl-5 text-sm text-ink">{guide.steps.map((step, i) => <li key={i}>{step}</li>)}</ol>{source(guide.source)}</Panel></Page>
}

function Lost() {
  const contacts = lostCardContacts(HDFC.helplines, HDFC.officialLinks)
  const [digits, setDigits] = useState('')
  const [done, setDone] = useState<boolean[]>([false, false, false, false])
  const [started, setStarted] = useState<Date | null>(null)
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { if (!started) return; const timer = window.setInterval(() => setNow(new Date()), 60_000); return () => clearInterval(timer) }, [started])
  const toggle = (i: number) => setDone(current => current.map((v, n) => n === i ? !v : v))
  const step = (i: number, title: string, body: React.ReactNode) => <Panel><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger/15 font-semibold text-danger">{i + 1}</span><div className="min-w-0 flex-1"><h2 className="text-lg font-semibold text-ink">{title}</h2><div className="mt-2 space-y-3 text-sm text-ink">{body}</div><Button className="mt-4 min-h-10" onClick={() => toggle(i)} aria-pressed={done[i]}>{done[i] ? '✓ Done' : 'Mark done'}</Button></div></div></Panel>
  const deadline = started ? thirdWorkingDay(started) : null
  const elapsed = started ? Math.max(0, Math.floor((now.getTime() - started.getTime()) / 3_600_000)) : 0
  return <Page title="Lost card or fraud" subtitle="Act now. Work through these steps." actions={<Back />}>
    {step(0, 'Block the card now', <><p>Use a bank channel below. If one does not work, try another.</p>{contacts.phones.map(h => <Contact key={h.id} item={h} />)}{contacts.sms.length > 0 && <><Field label="Last 4 card digits" hint="Used here only to prepare the SMS."><Input inputMode="numeric" autoComplete="off" maxLength={4} value={digits} onChange={e => setDigits(e.target.value.replace(/\D/g, '').slice(0, 4))} /></Field>{contacts.sms.map(h => { const body = fillSmsBody(h.smsBody ?? '', digits); return <div key={h.id} className="rounded-xl border border-line p-3"><p className="font-medium">{h.label}</p><div className="mt-2 flex flex-wrap gap-2">{body && <a className={linkClass} href={`sms:${number(h.value)}?&body=${encodeURIComponent(body)}`}>Open SMS</a>}{body && <CopyButton value={body} />}</div>{h.note && <p className="mt-2 text-muted">{h.note}</p>}</div> })}</>}{contacts.web.map(l => <Official key={l.id} item={l} />)}{!contacts.phones.length && !contacts.sms.length && !contacts.web.length && <p>Use your bank app or contact the bank through its official website.</p>}{source(contacts.phones[0]?.source ?? contacts.sms[0]?.source ?? contacts.web[0]?.url)}</>)}
    {step(1, 'If money was lost', <><p>Call the national cyber fraud helpline now, then file a report.</p><div className="flex flex-wrap gap-2"><a className={linkClass} href="tel:1930">Call 1930</a><a className={linkClass} href="https://cybercrime.gov.in/" {...external}>Report on cybercrime.gov.in ↗</a></div></>)}
    {step(2, 'Raise a bank dispute', <><p>Report the transaction to HDFC Bank in writing. Save the complaint reference, screenshots, and the time you reported it.</p>{HDFC.officialLinks.filter(l => /dispute|report-unauthorized|grievance/.test(l.id)).map(l => <Official key={l.id} item={l} />)}{source(HDFC.officialLinks.find(l => /dispute|report-unauthorized|grievance/.test(l.id))?.url)}</>)}
    {step(3, 'Track the reporting clock', <><p>RBI: zero liability can apply when you report a third-party unauthorised transaction within 3 working days of the bank's alert, if neither you nor the bank was at fault. Report immediately; do not wait for this estimate.</p>{started ? <Callout tone="warn"><p>Started {started.toLocaleString('en-IN')}. Elapsed: {elapsed} hour{elapsed === 1 ? '' : 's'}.</p><p>Estimated third working day: {deadline?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}. This estimate starts when you tap the button; RBI counts from the bank's alert. Public holidays may change it.</p></Callout> : <Button onClick={() => { const time = new Date(); setStarted(time); setNow(time) }}>Start clock</Button>}<p><a className="text-accent underline" href="https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=13140" {...external}>Read RBI rule ↗</a></p></>)}
  </Page>
}

function Checker() {
  const [value, setValue] = useState('')
  const result = useMemo(() => value.trim() ? checkMessage(value, HDFC) : null, [value])
  const phishing = HDFC.helplines.find(h => h.id === 'phishing-email')
  const chakshu = HDFC.officialLinks.find(l => l.id === 'chakshu')
  return <Page title="Check a link or message" subtitle="Checked on this device. No network lookup or upload." actions={<Back />}>
    <Field label="Paste a link, SMS, email or WhatsApp message"><textarea className="min-h-32 w-full rounded-xl border border-line bg-raised p-3 text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30" value={value} onChange={e => setValue(e.target.value)} placeholder="Paste the whole message here" /></Field>
    {result && <><Callout tone={result.verdict === 'phishing' ? 'danger' : result.verdict === 'suspicious' ? 'warn' : 'info'}><strong>{result.verdict === 'phishing' ? 'Likely phishing' : result.verdict === 'suspicious' ? 'Suspicious' : 'Safe-looking'}</strong><p className="mt-1">{result.verdict === 'safe' ? 'No obvious red flags found. Still verify unexpected requests through the bank app or a number you know.' : 'Do not click or share any OTP, PIN, CVV or password. Contact the bank using a number you know.'}</p></Callout>
      {result.sender && <Callout>{result.sender}</Callout>}
      {result.sites.length > 0 && <Section title="Links found"><div className="space-y-2">{result.sites.map((site, i) => <Panel key={`${site.input}-${i}`}><p className="break-all text-sm font-semibold text-ink">{site.hostname}</p><Badge tone={site.kind === 'official' ? 'good' : site.kind === 'legacy' ? 'good' : site.kind === 'group' ? 'accent' : site.kind === 'phishing' ? 'bad' : 'warn'}>{site.label}</Badge>{site.warnings.map(w => <p key={w} className="mt-1 text-sm text-warn">{w}</p>)}{site.kind === 'official' || site.kind === 'legacy' ? <p className="mt-2 text-xs text-muted">Never enter OTP or PIN from a link in an SMS.</p> : null}</Panel>)}</div>{source(HDFC.officialLinks.find(l => l.id === 'trust-markers')?.url)}</Section>}
      {result.flags.length > 0 && <Section title="Message red flags"><Panel><ul className="list-disc space-y-1 pl-5 text-sm text-danger">{result.flags.map(f => <li key={f}>{f}</li>)}</ul></Panel></Section>}
      {result.verdict !== 'safe' && <Section title="What to do"><Panel><p className="text-sm text-ink">Do not open the link. Forward a phishing email to the bank. Report suspicious SMS or calls on Chakshu. If money was taken, call 1930 and report on cybercrime.gov.in.</p><div className="mt-3 flex flex-wrap gap-2">{phishing && <a className={linkClass} href={`mailto:${phishing.value}`}>Email {phishing.value}</a>}{chakshu && <a className={linkClass} href={chakshu.url} {...external}>Open Chakshu ↗</a>}<a className={linkClass} href="https://cybercrime.gov.in/" {...external}>Cybercrime portal ↗</a></div>{source(phishing?.source ?? chakshu?.url)}</Panel></Section>}
    </>}
  </Page>
}

export default function Help() {
  const { segments } = useRoute()
  if (segments[1] === 'lost') return <Lost />
  if (segments[1] === 'check') return <Checker />
  if (segments[1] === 'howto') return <Guide guide={HDFC.howTo.find(h => h.id === segments[2])} />
  return <Home />
}
