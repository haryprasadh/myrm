import { useState, type ChangeEvent } from 'react'
import type { Account, Txn, TxnCategory } from '@/core/schema'
import { newId } from '@/core/schema'
import { useAppState } from '@/core/vault'
import { useRoute } from '@/core/router'
import { formatDate, today } from '@/core/format'
import { Button, Callout, Empty, Field, Input, Money, Page, Panel, Progress, Section, Select, Sheet, Stat } from '@/ui'
import { HDFC } from '@/data/hdfc'
import { monthlyTotals, spendByCategory, topMerchants, lastSixMonths } from './aggregates'
import { merchantName } from './categorize'
import { uniqueTransactions } from './dedupe'
import { netWorth } from './networth'
import { detectHdfcMapping, parseCsvTable, parseMappedRows, parsePdfLines, reconstructPdfLines, statementKind, type ColumnMapping, type ParsedTxn, type CsvTable } from './parsers'

const categories: TxnCategory[] = ['food','groceries','shopping','travel','fuel','bills','rent','emi','investments','insurance','health','education','entertainment','transfers','cash','salary','refund','fees','other']
const categoryLabels: Record<TxnCategory, string> = Object.fromEntries(categories.map(value => [value, value === 'emi' ? 'EMI' : value[0].toUpperCase() + value.slice(1)])) as Record<TxnCategory, string>
const categoryOptions = categories.map(value => ({ value, label: categoryLabels[value] }))
const accountTypes: Account['type'][] = ['savings','salary','current','nre','nro']
const monthNow = () => today().slice(0, 7)
const cls = 'space-y-3'

export default function MoneyScreen() {
  const { segments, go } = useRoute()
  const screen = segments[1] ?? ''
  const nav = <div className="flex flex-wrap gap-2"><Button onClick={() => go('money')}>Overview</Button><Button onClick={() => go('money/txns')}>Transactions</Button><Button onClick={() => go('money/accounts')}>Accounts</Button><Button onClick={() => go('money/import')}>Import</Button></div>
  return <Page title={screen === 'import' ? 'Import statement' : screen === 'txns' ? 'Transactions' : screen === 'accounts' ? 'Accounts' : 'Money'} subtitle="Your money, on this device only.">{nav}{screen === 'import' ? <ImportScreen /> : screen === 'txns' ? <TransactionsScreen /> : screen === 'accounts' ? <AccountsScreen /> : <Overview />}</Page>
}

function Overview() {
  const [state] = useAppState()
  const { go } = useRoute()
  const [month, setMonth] = useState(monthNow)
  const totals = monthlyTotals(state.txns, month)
  const categoriesData = spendByCategory(state.txns, month)
  const merchants = topMerchants(state.txns, month)
  const history = lastSixMonths(state.txns, month)
  const maxSpend = Math.max(1, ...history.map(h => h.spend))
  const worth = netWorth(state.accounts, state.deposits, state.loans, today())
  return <div className={cls}>
    <Field label="Month"><Input type="month" value={month} onChange={e => setMonth(e.target.value)} /></Field>
    <Panel><div className="grid grid-cols-3 gap-2"><Stat label="Money in" value={<Money value={totals.moneyIn} compact />} /><Stat label="Money out" value={<Money value={totals.moneyOut} compact />} /><Stat label="Net" value={<Money value={totals.net} compact />} /></div></Panel>
    <Panel><div className="flex items-center justify-between"><div><div className="text-sm text-muted">Estimated net worth</div><div className="text-2xl font-semibold text-ink"><Money value={worth.total} compact /></div></div><Button onClick={() => go('money/accounts')}>Accounts</Button></div><p className="mt-2 text-xs text-muted">Accounts + deposits − loans. FD interest is estimated; RD counts paid instalments. Card dues are excluded.</p></Panel>
    {state.txns.length === 0 ? <Empty title="No transactions yet" body="Import a statement to see spending insights." action={<Button variant="primary" onClick={() => go('money/import')}>Import statement</Button>} /> : <>
      <Section title="Spend by category">{categoriesData.length ? <Panel><div className="space-y-3">{categoriesData.map(c => <div key={c.category}><div className="mb-1 flex justify-between text-sm text-ink"><span>{categoryLabels[c.category]}</span><Money value={c.amount} compact /></div><Progress value={c.amount} max={categoriesData[0].amount} /></div>)}</div></Panel> : <Empty title="No spend this month" />}</Section>
      <Section title="Top merchants"><Panel><div className="space-y-2">{merchants.length ? merchants.map(m => <div key={m.name} className="flex justify-between gap-3 text-sm text-ink"><span className="truncate">{m.name}</span><Money value={m.amount} compact /></div>) : <p className="text-sm text-muted">No spend this month.</p>}</div></Panel></Section>
      <Section title="Last 6 months"><Panel><div className="flex h-32 items-end gap-2">{history.map(h => <div key={h.month} className="flex h-full flex-1 flex-col justify-end text-center"><div className="w-full rounded-t bg-accent" style={{ height: `${Math.max(h.spend ? 4 : 0, h.spend / maxSpend * 90)}%` }} title={`${h.month}: ₹${h.spend.toFixed(0)}`} /><span className="mt-1 text-[10px] text-muted">{h.month.slice(5)}</span></div>)}</div></Panel></Section>
    </>}
  </div>
}

function AccountsScreen() {
  const [state, update] = useAppState()
  const [editing, setEditing] = useState<Account | null>(null)
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<Account['type']>('savings')
  const [nickname, setNickname] = useState('')
  const [last4, setLast4] = useState('')
  const [balance, setBalance] = useState('')
  const [asOf, setAsOf] = useState(today)
  const [error, setError] = useState('')
  const start = (account?: Account) => { setEditing(account ?? null); setType(account?.type ?? 'savings'); setNickname(account?.nickname ?? ''); setLast4(account?.last4 ?? ''); setBalance(account?.balance?.toString() ?? ''); setAsOf(account?.balanceAsOf ?? today()); setError(''); setOpen(true) }
  const save = () => {
    if (!nickname.trim() || (last4 && !/^\d{4}$/.test(last4)) || (balance && !Number.isFinite(Number(balance)))) { setError('Add a nickname, valid last 4 digits and balance.'); return }
    const account: Account = { id: editing?.id ?? newId(), type, nickname: nickname.trim(), ...(last4 ? { last4 } : {}), ...(balance ? { balance: Number(balance), balanceAsOf: asOf } : {}) }
    update(s => ({ ...s, accounts: editing ? s.accounts.map(a => a.id === editing.id ? account : a) : [...s.accounts, account] }))
    setOpen(false)
  }
  const remove = (account: Account) => {
    if (state.txns.some(t => t.source.type === 'account' && t.source.id === account.id)) { setError('Delete its imported transactions first.'); return }
    if (!window.confirm(`Delete ${account.nickname}?`)) return
    update(s => ({ ...s, accounts: s.accounts.filter(a => a.id !== account.id) }))
  }
  return <div className={cls}><Button variant="primary" onClick={() => start()}>Add account</Button>{error && <Callout tone="warn">{error}</Callout>}{state.accounts.length ? state.accounts.map(a => <Panel key={a.id}><div className="flex items-start justify-between gap-3"><div><div className="font-medium text-ink">{a.nickname} {a.last4 && `••${a.last4}`}</div><div className="text-sm uppercase text-muted">{a.type}</div><div className="mt-2 text-xl text-ink"><Money value={a.balance ?? 0} /></div>{a.balanceAsOf && <div className="text-xs text-muted">As of {formatDate(a.balanceAsOf, 'long')}</div>}</div><div className="flex flex-col gap-2"><Button onClick={() => start(a)}>Edit</Button><Button variant="ghost" onClick={() => remove(a)}>Delete</Button></div></div></Panel>) : <Empty title="No accounts" body="Add your account balance to estimate net worth." />}
    <Sheet open={open} onClose={() => setOpen(false)} title={editing ? 'Edit account' : 'Add account'}><div className={cls}><Field label="Account type"><Select value={type} onChange={e => setType(e.target.value as Account['type'])} options={accountTypes.map(value => ({ value, label: value.toUpperCase() }))} /></Field><Field label="Nickname"><Input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Salary account" /></Field><Field label="Last 4 digits (optional)"><Input value={last4} onChange={e => setLast4(e.target.value)} inputMode="numeric" maxLength={4} /></Field><Field label="Balance in ₹ (optional)"><Input value={balance} onChange={e => setBalance(e.target.value)} inputMode="decimal" type="number" step="0.01" /></Field><Field label="Balance as of"><Input value={asOf} onChange={e => setAsOf(e.target.value)} type="date" /></Field>{error && <Callout tone="warn">{error}</Callout>}<Button variant="primary" onClick={save}>Save account</Button></div></Sheet>
  </div>
}

function TransactionsScreen() {
  const [state, update] = useAppState()
  const [search, setSearch] = useState('')
  const [month, setMonth] = useState('')
  const [source, setSource] = useState('')
  const [category, setCategory] = useState('')
  const [similarId, setSimilarId] = useState('')
  const sources = [...state.accounts.map(a => ({ value: `account:${a.id}`, label: a.nickname })), ...state.cards.map(c => ({ value: `card:${c.id}`, label: c.nickname }))]
  const rows = state.txns.filter(t => (!search || `${t.description} ${t.refNo ?? ''}`.toLowerCase().includes(search.toLowerCase())) && (!month || t.date.startsWith(month)) && (!source || `${t.source.type}:${t.source.id}` === source) && (!category || t.category === category)).sort((a,b) => b.date.localeCompare(a.date))
  const batches = [...new Set(state.txns.map(t => t.importBatchId).filter((id): id is string => !!id))]
  const changeCategory = (txn: Txn, next: TxnCategory) => { const name = merchantName(txn.description).toUpperCase(); update(s => ({ ...s, txns: s.txns.map(t => t.id === txn.id || (similarId === txn.id && merchantName(t.description).toUpperCase() === name) ? { ...t, category: next } : t) })); setSimilarId('') }
  const deleteBatch = (id: string) => { if (!window.confirm(`Delete all ${state.txns.filter(t => t.importBatchId === id).length} transactions in this import batch?`)) return; update(s => ({ ...s, txns: s.txns.filter(t => t.importBatchId !== id) })) }
  return <div className={cls}><Field label="Search transactions"><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Merchant or reference" /></Field><div className="grid grid-cols-2 gap-2"><Field label="Month"><Input type="month" value={month} onChange={e => setMonth(e.target.value)} /></Field><Field label="Category"><Select value={category} onChange={e => setCategory(e.target.value)} options={[{ value: '', label: 'All' }, ...categoryOptions]} /></Field></div><Field label="Source"><Select value={source} onChange={e => setSource(e.target.value)} options={[{ value: '', label: 'All' }, ...sources]} /></Field><div className="text-sm text-muted">{rows.length} transactions</div>{rows.length ? rows.map(t => <Panel key={t.id}><div className="flex justify-between gap-2"><div className="min-w-0"><div className="truncate font-medium text-ink">{merchantName(t.description)}</div><div className="text-xs text-muted">{formatDate(t.date, 'long')} · {t.source.type}</div></div><div className={t.amount >= 0 ? 'text-good' : 'text-ink'}><Money value={t.amount} /></div></div><div className="mt-2 flex items-end gap-2"><select className="min-h-10 max-w-36 rounded-xl border border-line bg-raised px-2 text-sm text-ink" aria-label={`Category for ${merchantName(t.description)}`} value={t.category} onChange={e => changeCategory(t, e.target.value as TxnCategory)}>{categoryOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select><label className="flex min-h-10 items-center gap-1 text-xs text-muted"><input type="checkbox" checked={similarId === t.id} onChange={e => setSimilarId(e.target.checked ? t.id : '')} />Apply to similar</label></div></Panel>) : <Empty title="No matching transactions" />}{batches.length > 0 && <Section title="Import batches"><Panel><div className="space-y-2">{batches.map((id, i) => <div key={id} className="flex items-center justify-between text-sm text-ink"><span>Batch {i + 1} · {state.txns.filter(t => t.importBatchId === id).length} rows</span><Button variant="danger" onClick={() => deleteBatch(id)}>Delete batch</Button></div>)}</div></Panel></Section>}</div>
}

function ImportScreen() {
  const [state, update] = useAppState()
  const { go } = useRoute()
  const [table, setTable] = useState<CsvTable | null>(null)
  const [mapping, setMapping] = useState<ColumnMapping | null>(null)
  const [pdfRows, setPdfRows] = useState<ParsedTxn[] | null>(null)
  const [pdfHints, setPdfHints] = useState<string[]>([])
  const [pdfUnparsed, setPdfUnparsed] = useState(0)
  const [password, setPassword] = useState('')
  const [pendingPdf, setPendingPdf] = useState<File | null>(null)
  const [target, setTarget] = useState('')
  const [newNickname, setNewNickname] = useState('')
  const [newLast4, setNewLast4] = useState('')
  const [accountError, setAccountError] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const targets = [...state.accounts.map(a => ({ value: `account:${a.id}`, label: `Account · ${a.nickname}` })), ...state.cards.map(c => ({ value: `card:${c.id}`, label: `Card · ${c.nickname}` }))]
  const parsed = pdfRows !== null ? { transactions: pdfRows, unparsed: pdfUnparsed } : table && mapping ? parseMappedRows(table.rows, mapping) : { transactions: [], unparsed: 0 }
  const kind = statementKind(table?.headers ?? pdfHints, mapping, parsed.transactions)
  const preferred = kind === 'account' ? state.accounts[0] ? `account:${state.accounts[0].id}` : '' : state.cards[0] ? `card:${state.cards[0].id}` : ''
  const selected = targets.some(t => t.value === target) ? target : preferred
  const source = selected ? { type: selected.split(':')[0] as 'account' | 'card', id: selected.split(':')[1] } : null
  const candidates = source ? parsed.transactions.map(t => ({ ...t, id: '', source })) : []
  const deduped = uniqueTransactions(candidates, state.txns)
  const totalIn = deduped.unique.reduce((n, t) => n + Math.max(0, t.amount), 0)
  const totalOut = deduped.unique.reduce((n, t) => n + Math.max(0, -t.amount), 0)
  const dates = deduped.unique.map(t => t.date).sort()
  const reset = () => { setTable(null); setMapping(null); setPdfRows(null); setPdfHints([]); setPdfUnparsed(0); setError(''); setPendingPdf(null); setPassword(''); setTarget(''); setAccountError('') }
  const createAccount = () => {
    if (!newNickname.trim()) return setAccountError('Add an account nickname.')
    if (newLast4 && !/^\d{4}$/.test(newLast4)) return setAccountError('Last 4 must be four digits.')
    const id = newId()
    const account: Account = { id, type: 'savings', nickname: newNickname.trim(), ...(newLast4 ? { last4: newLast4 } : {}) }
    update(s => ({ ...s, accounts: [...s.accounts, account] }))
    setTarget(`account:${id}`); setNewNickname(''); setNewLast4(''); setAccountError('')
  }
  const readPdf = async (file: File, pass = '') => {
    setBusy(true); setError('')
    try {
      const pdfjs = await import('pdfjs-dist')
      const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default
      const bytes = new Uint8Array(await file.arrayBuffer())
      const task = pdfjs.getDocument({ data: bytes, password: pass || undefined, isEvalSupported: false } as Parameters<typeof pdfjs.getDocument>[0])
      const pdf = await task.promise
      const lines: string[] = []
      for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
        const page = await pdf.getPage(pageNo)
        const content = await page.getTextContent()
        lines.push(...reconstructPdfLines(content.items.filter((item): item is typeof item & { str: string; transform: number[] } => 'str' in item && 'transform' in item).map(item => ({ str: item.str, transform: item.transform }))))
      }
      const result = parsePdfLines(lines)
      setPdfRows(result.transactions); setPdfHints(lines.slice(0, 30)); setPdfUnparsed(result.unparsed); setPendingPdf(null); setPassword('')
      if (!result.transactions.length) setError('No transactions found. This PDF layout may not be supported. Try CSV instead.')
    } catch (e) {
      const message = e instanceof Error ? e.message : ''
      if (/password/i.test(message)) { setPendingPdf(file); setError('This PDF needs a password, or the password was incorrect.') }
      else setError('Could not read this PDF. Try a delimited or CSV statement.')
    } finally { setBusy(false) }
  }
  const pickFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    reset(); event.target.value = ''
    if (!file) return
    if (/\.xlsx?$/i.test(file.name)) { setError('Excel files are not supported. Download the “Delimited” or CSV format from NetBanking.'); return }
    if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') { await readPdf(file); return }
    if (!/\.(csv|txt)$/i.test(file.name) && !file.type.startsWith('text/')) { setError('Choose a CSV, delimited text, or PDF statement.'); return }
    try {
      const parsedTable = parseCsvTable(await file.text())
      if (!parsedTable.headers.length) { setError('No CSV columns found.'); return }
      setTable(parsedTable)
      setMapping(detectHdfcMapping(parsedTable.headers) ?? { date: 0, description: Math.min(1, parsedTable.headers.length - 1), amount: undefined, dateFormat: 'dmy' })
    } catch { setError('Could not read this file.') }
  }
  const setColumn = (key: keyof ColumnMapping, value: string) => { if (!mapping) return; setMapping({ ...mapping, [key]: key === 'dateFormat' ? value : value === '' ? undefined : Number(value) } as ColumnMapping) }
  const importRows = () => {
    if (!source || !deduped.unique.length) return
    const importBatchId = newId()
    const rows: Txn[] = deduped.unique.map(t => ({ ...t, id: newId(), importBatchId }))
    update(s => ({ ...s, txns: [...s.txns, ...rows] }))
    go('money/txns')
  }
  const cols = table?.headers.map((h, i) => ({ value: String(i), label: `${i + 1}: ${h || '(blank)'}` })) ?? []
  const optionalCols = [{ value: '', label: 'None' }, ...cols]
  return <div className={cls}>
    <Callout>Files are parsed on this device. They are never uploaded. Imported transactions are saved in your encrypted vault.</Callout>
    {targets.length === 0 && !table && pdfRows === null && <Callout tone="warn">Choose a statement to set up its import destination.</Callout>}
    <Field label="Statement file"><Input type="file" accept=".csv,.txt,.pdf,.xls,.xlsx,text/csv,text/plain,application/pdf" onChange={e => void pickFile(e)} /></Field>
    {busy && <p className="text-sm text-muted">Reading statement…</p>}
    {pendingPdf && <Panel><div className={cls}><p className="text-sm text-ink">Enter the PDF password. {HDFC.statements.accountPdfPassword && HDFC.statements.cardPdfPassword ? `Account statements: ${HDFC.statements.accountPdfPassword}. Card statements: ${HDFC.statements.cardPdfPassword}. ` : ''}Check the statement email for the exact password format. This password stays in memory only.</p><Field label="PDF password"><Input type="password" autoComplete="off" value={password} onChange={e => setPassword(e.target.value)} /></Field><Button variant="primary" disabled={!password || busy} onClick={() => void readPdf(pendingPdf, password)}>Open PDF</Button></div></Panel>}
    {error && <Callout tone="warn">{error}</Callout>}
    {table && mapping && !table.hdfc && <Panel><div className={cls}><h2 className="font-medium text-ink">Match CSV columns</h2><Field label="Date column"><Select value={mapping.date} onChange={e => setColumn('date', e.target.value)} options={cols} /></Field><Field label="Date format"><Select value={mapping.dateFormat} onChange={e => setColumn('dateFormat', e.target.value)} options={[{value:'dmy',label:'DD/MM/YYYY'},{value:'mdy',label:'MM/DD/YYYY'},{value:'ymd',label:'YYYY-MM-DD'}]} /></Field><Field label="Description column"><Select value={mapping.description} onChange={e => setColumn('description', e.target.value)} options={cols} /></Field><Field label="Debit column"><Select value={mapping.debit ?? ''} onChange={e => setColumn('debit', e.target.value)} options={optionalCols} /></Field><Field label="Credit column"><Select value={mapping.credit ?? ''} onChange={e => setColumn('credit', e.target.value)} options={optionalCols} /></Field><Field label="Signed amount column"><Select value={mapping.amount ?? ''} onChange={e => setColumn('amount', e.target.value)} options={optionalCols} /></Field><Field label="Balance column (optional)"><Select value={mapping.balance ?? ''} onChange={e => setColumn('balance', e.target.value)} options={optionalCols} /></Field><Field label="Dr/Cr column (optional)"><Select value={mapping.drCr ?? ''} onChange={e => setColumn('drCr', e.target.value)} options={optionalCols} /></Field><Field label="Reference column (optional)"><Select value={mapping.refNo ?? ''} onChange={e => setColumn('refNo', e.target.value)} options={optionalCols} /></Field><p className="text-xs text-muted">Choose debit and credit columns, or one signed amount column. Negative amounts mean money out.</p></div></Panel>}
    {(table || pdfRows !== null) && <>{kind === 'account' && state.accounts.length === 0 && <Panel><div className={cls}><h2 className="font-medium text-ink">Create a savings account to import into</h2><Field label="Account nickname"><Input value={newNickname} onChange={e => setNewNickname(e.target.value)} placeholder="My savings account" /></Field><Field label="Last 4 digits (optional)"><Input value={newLast4} onChange={e => setNewLast4(e.target.value)} inputMode="numeric" maxLength={4} /></Field>{accountError && <p role="alert" className="text-sm text-danger">{accountError}</p>}<Button onClick={createAccount}>Create savings account</Button></div></Panel>}{kind === 'account' && !selected && <Callout tone="warn">Create a savings account before importing this statement.</Callout>}<Field label="Import to"><Select value={selected} onChange={e => setTarget(e.target.value)} options={[{ value: '', label: 'Choose an account or card' }, ...targets]} /></Field><Panel><div className="grid grid-cols-2 gap-3"><Stat label="Ready" value={deduped.unique.length} /><Stat label="Duplicates skipped" value={deduped.skipped} /><Stat label="Money in" value={<Money value={totalIn} compact />} /><Stat label="Money out" value={<Money value={totalOut} compact />} /></div><div className="mt-2 text-sm text-muted">{dates.length ? `${formatDate(dates[0], 'long')} – ${formatDate(dates[dates.length - 1], 'long')}` : 'No valid rows'} · {parsed.unparsed} unparsed rows</div></Panel><Section title="Sample rows"><Panel><div className="space-y-2">{deduped.unique.slice(0, 5).map((t, i) => <div key={i} className="flex justify-between gap-2 text-sm text-ink"><span className="min-w-0 truncate">{t.date} · {t.description}</span><Money value={t.amount} paise /></div>)}{!deduped.unique.length && <p className="text-sm text-muted">No rows ready. Check the column mapping or file format.</p>}</div></Panel></Section><Button variant="primary" disabled={!source || !deduped.unique.length} onClick={importRows}>Import {deduped.unique.length} transactions</Button></>}
  </div>
}
