import type { TxnCategory } from '@/core/schema'

const rules: [TxnCategory, RegExp][] = [
  ['refund', /\b(REFUND|REVERSAL|CASHBACK)\b/i],
  ['salary', /\b(SALARY|SAL CREDIT|SAL CR)\b/i],
  ['fees', /\b(CHARGES?|ANNUAL FEE|GST|PENALTY)\b/i],
  ['food', /\b(SWIGGY|ZOMATO)\b/i],
  ['groceries', /\b(BIGBASKET|BLINKIT|ZEPTO|DMART|INSTAMART)\b/i],
  ['shopping', /\b(AMAZON|FLIPKART|MYNTRA|AJIO|NYKAA)\b/i],
  ['travel', /\b(UBER|OLA|RAPIDO|IRCTC|MAKEMYTRIP|INDIGO|AIR INDIA)\b/i],
  ['fuel', /\b(IOCL|HPCL|BPCL|PETROL|FUEL)\b/i],
  ['bills', /\b(ELECTRICITY|BESCOM|TATA POWER|AIRTEL|JIO|VI |BBPS|BROADBAND)\b/i],
  ['rent', /\bRENT\b/i],
  ['emi', /\b(EMI|LOAN|ACH D-)\b/i],
  ['investments', /\b(ZERODHA|GROWW|KUVERA|SIP|MUTUAL FUND|NACH MF|INDIAN CLEARING CORP)\b/i],
  ['insurance', /\b(LIC|INSURANCE|HDFC LIFE|ERGO|STAR HEALTH)\b/i],
  ['health', /\b(APOLLO|PHARM|HOSPITAL|1MG|PRACTO)\b/i],
  ['education', /\b(SCHOOL|COLLEGE|TUITION|FEES)\b/i],
  ['entertainment', /\b(NETFLIX|SPOTIFY|BOOKMYSHOW|PVR|HOTSTAR)\b/i],
  ['cash', /\b(ATM|NWD|CASH WDL)\b/i],
  ['transfers', /\b(NEFT|IMPS|UPI)\b/i],
]

export function merchantName(description: string): string {
  const upi = description.match(/\bUPI[-/ ]+(.+?)[-/ ]+[\w.\-]+@[\w.\-]+(?:[-/ ].*)?$/i)
  if (upi) return upi[1].replace(/[-_/]+/g, ' ').trim()
  const debit = description.match(/^(?:ACH|NACH)\s+D\s*[-/]?\s*(.+)$/i)
  if (debit) return debit[1].replace(/[-/]\s*/g, ' ').replace(/\s+\d{5,}\s*$/, '').replace(/\bHDFC BANK LTD\b/i, 'HDFC Bank').replace(/\bHOME LOAN EMI\b/i, 'home loan EMI').replace(/\s+/g, ' ').trim()
  return description.replace(/\s+/g, ' ').trim()
}

export function categorize(description: string, amount: number): TxnCategory {
  for (const [category, regex] of rules) {
    if (category === 'salary' && amount < 0) continue
    if (regex.test(description)) return category
  }
  return 'other'
}
