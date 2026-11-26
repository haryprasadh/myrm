// Types for the bundled HDFC reference data. Every fact carries lastVerified + source.

export type SpendCategory =
  | 'general'
  | 'online'
  | 'dining'
  | 'groceries'
  | 'fuel'
  | 'travel'
  | 'utilities'
  | 'rent'
  | 'insurance'
  | 'education'
  | 'wallet'
  | 'government'
  | 'smartbuy'
  | 'swiggy'
  | 'tataneu'
  | 'amazon'
  | 'flipkart'
  | 'international'

export interface CatalogCard {
  id: string
  name: string
  kind: 'credit' | 'debit'
  networks: string[]
  tier: 'entry' | 'mid' | 'premium' | 'super-premium' | 'cobrand' | 'business'
  fees: { joining: number | null; annual: number | null; waiverSpend: number | null }
  rewardUnit: 'RP' | 'CashPoints' | 'NeuCoins' | 'Cashback' | 'Miles' | 'Other'
  /** Base earning as % of spend at the best practical redemption value. */
  baseRatePct: number | null
  /** Per-category effective % of spend; overrides base. 0 = excluded / no rewards. */
  categoryRatePct: Partial<Record<SpendCategory, number>>
  /** Human-readable caps, e.g. "Utilities: max 2,000 RP / month". */
  caps: string[]
  pointValueNote: string
  lounge: { domestic: string | null; international: string | null }
  forexMarkupPct: number | null
  milestones: string[]
  highlights: string[]
  lastVerified: string
  source: string
  /** Fields we could not verify. Show a warning. */
  unverified?: string[]
}

export interface OfficialLink {
  id: string
  label: string
  url: string
  purpose: string
  group: 'login' | 'cards' | 'payments' | 'loans' | 'deposits' | 'support' | 'security'
}

export interface Helpline {
  id: string
  label: string
  value: string
  kind: 'phone' | 'sms' | 'whatsapp' | 'email' | 'web'
  note?: string
  source?: string
}

export interface HowTo {
  id: string
  title: string
  steps: string[]
  source?: string
  tags: string[]
}

export interface RelationshipProgram {
  id: string
  name: string
  /** Each item is one way to qualify (any one is enough). */
  eligibility: { avgMonthlyBalance?: number; totalRelationshipValue?: number; netMonthlySalary?: number; note?: string }[]
  benefits: string[]
  source?: string
}

export interface FdRateRow {
  tenure: string
  minDays: number
  maxDays: number
  generalPct: number
  seniorPct: number
}

export interface BankFacts {
  asOf: string
  officialLinks: OfficialLink[]
  /** Domains that belong to the bank itself. Subdomains of these are official. */
  officialDomains: string[]
  /** HDFC group companies (not the bank). Official, but not banking. */
  groupDomains: string[]
  helplines: Helpline[]
  howTo: HowTo[]
  relationshipPrograms: RelationshipProgram[]
  statements: { accountPdfPassword: string; cardPdfPassword: string; delimitedColumns: string[]; alertSenders: string[] }
  fdRates: { asOf: string; source: string; rows: FdRateRow[] }
}
