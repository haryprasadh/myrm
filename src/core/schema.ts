// The whole app state. It is always stored encrypted (see crypto.ts / vault.tsx).
// Fields of type `Sealed` are encrypted a second time and are only decrypted on explicit reveal.

export type ID = string
/** ISO date, `YYYY-MM-DD`. */
export type ISODate = string

/** A value encrypted with the vault key (AES-256-GCM). base64 strings. */
export interface Sealed {
  iv: string
  ct: string
}

export type CredentialKind =
  | 'card_pin' // credit/debit card ATM/POS PIN
  | 'upi_pin'
  | 'mpin' // HDFC mobile app MPIN
  | 'netbanking' // Customer ID + IPIN/password
  | 'tpin' // phone banking TPIN
  | 'other'

export interface Credential {
  id: ID
  kind: CredentialKind
  label: string // e.g. "Regalia Gold PIN"
  /** Card or account this credential belongs to. */
  linkedTo?: { type: 'card' | 'account'; id: ID }
  /** For UPI PINs: which app/VPA (GPay, PhonePe, PayZapp, BHIM...). */
  app?: string
  /** For netbanking: Customer ID (sealed: it is half of the login). */
  username?: Sealed
  /** 'secret' stores the real value; 'hint' stores only a memory hint. */
  mode: 'secret' | 'hint'
  secret?: Sealed
  hint?: string
  createdAt: string
  updatedAt: string
}

export interface UserCard {
  id: ID
  /** Id from the card catalog (src/data/cards.ts), if it is a known HDFC card. */
  catalogId?: string
  nickname: string
  kind: 'credit' | 'debit'
  network?: 'Visa' | 'Mastercard' | 'RuPay' | 'Diners' | 'Amex' | 'Other'
  last4?: string
  /** Full card number, sealed. Optional. CVV is never stored. */
  number?: Sealed
  /** `MM/YY` */
  expiry?: string
  creditLimit?: number
  /** Day of month the statement is generated (1–31). */
  statementDay?: number
  /** Day of month the payment is due (1–31). */
  dueDay?: number
  /** Month (1–12) the annual/renewal fee is charged (card anniversary). */
  feeMonth?: number
  /** Overrides the catalog's fee waiver threshold. */
  feeWaiverSpend?: number
  /** Manually tracked spend for the current card year (adds to imported transactions). */
  manualYearSpend?: number
  linkedAccountId?: ID
  notes?: string
}

export interface Account {
  id: ID
  type: 'savings' | 'salary' | 'current' | 'nre' | 'nro'
  nickname: string
  last4?: string
  balance?: number
  balanceAsOf?: ISODate
}

export interface Deposit {
  id: ID
  type: 'fd' | 'rd'
  nickname: string
  /** FD: principal. RD: monthly instalment. */
  amount: number
  ratePct: number
  startDate: ISODate
  tenureMonths: number
  payout: 'cumulative' | 'monthly' | 'quarterly'
  autoRenew?: boolean
}

export interface Loan {
  id: ID
  type: 'home' | 'personal' | 'car' | 'education' | 'gold' | 'lap' | 'other'
  nickname: string
  principal: number
  ratePct: number
  tenureMonths: number
  startDate: ISODate
  /** Day of month the EMI is debited. */
  emiDay?: number
  prepayments: { date: ISODate; amount: number }[]
}

export type TxnCategory =
  | 'food'
  | 'groceries'
  | 'shopping'
  | 'travel'
  | 'fuel'
  | 'bills'
  | 'rent'
  | 'emi'
  | 'investments'
  | 'insurance'
  | 'health'
  | 'education'
  | 'entertainment'
  | 'transfers'
  | 'cash'
  | 'salary'
  | 'refund'
  | 'fees'
  | 'other'

export interface Txn {
  id: ID
  date: ISODate
  description: string
  /** Negative = money out (debit / card spend). Positive = money in. */
  amount: number
  category: TxnCategory
  source: { type: 'account' | 'card'; id: ID }
  refNo?: string
  balance?: number
  importBatchId?: ID
}

export interface Reminder {
  id: ID
  title: string
  date: ISODate
  repeat: 'none' | 'monthly' | 'yearly'
  notes?: string
}

export interface Settings {
  autoLockMinutes: number
  clipboardClearSeconds: number
  /** Blur amounts on screen (for use in public). */
  hideAmounts: boolean
  theme: 'system' | 'light' | 'dark'
  /** Set when the user exports an encrypted backup. */
  lastBackupAt?: string
  /** Relationship inputs used by the tier tracker. */
  relationship?: { avgMonthlyBalance?: number; totalRelationshipValue?: number; netMonthlySalary?: number }
}

export interface AppState {
  version: 1
  profile: { name?: string }
  cards: UserCard[]
  accounts: Account[]
  deposits: Deposit[]
  loans: Loan[]
  txns: Txn[]
  credentials: Credential[]
  reminders: Reminder[]
  settings: Settings
}

export function emptyState(): AppState {
  return {
    version: 1,
    profile: {},
    cards: [],
    accounts: [],
    deposits: [],
    loans: [],
    txns: [],
    credentials: [],
    reminders: [],
    settings: { autoLockMinutes: 5, clipboardClearSeconds: 20, hideAmounts: false, theme: 'system' },
  }
}

/** Fill in fields added after a state was first saved. */
export function normalizeState(raw: unknown): AppState {
  const base = emptyState()
  const s = (raw ?? {}) as Partial<AppState>
  return {
    ...base,
    ...s,
    version: 1,
    profile: { ...base.profile, ...(s.profile ?? {}) },
    settings: { ...base.settings, ...(s.settings ?? {}) },
    cards: s.cards ?? [],
    accounts: s.accounts ?? [],
    deposits: s.deposits ?? [],
    loans: s.loans ?? [],
    txns: s.txns ?? [],
    credentials: s.credentials ?? [],
    reminders: s.reminders ?? [],
  }
}

export function newId(): ID {
  return crypto.randomUUID()
}
