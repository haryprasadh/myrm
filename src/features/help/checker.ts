export type Verdict = 'safe' | 'suspicious' | 'phishing'
export type SiteKind = 'official' | 'legacy' | 'group' | 'phishing' | 'warning' | 'unknown'
export interface SiteResult { input: string; hostname: string; kind: SiteKind; label: string; warnings: string[] }
export interface CheckResult { verdict: Verdict; sites: SiteResult[]; flags: string[]; sender?: string }
export interface CheckerDomains { officialDomains: string[]; legacyDomains?: string[]; groupDomains: string[]; smsSenderIds?: string[] }

const shorteners = new Set(['bit.ly', 'tinyurl.com', 't.ly', 'is.gd', 'cutt.ly', 'rb.gy', 'shorturl.at', 'goo.gl', 'tiny.cc', 'ow.ly', 'buff.ly', 'rebrand.ly'])
const unusualTlds = new Set(['xyz', 'top', 'click', 'icu', 'buzz', 'zip', 'mov', 'site', 'online'])
const candidate = /(?:https?:\/\/)?(?:[a-z0-9._~%!$&'()*+,;=:-]+@)?(?:\[[a-f0-9:]+\]|(?:[a-z0-9-]+\.)+[a-z0-9-]+|(?:\d{1,3}\.){3}\d{1,3})(?::\d{1,5})?(?:\/[a-z0-9._~%!$&'()*+,;=:@/?#-]*)?/gi
const bankLookalike = /hdfc|hdcf|hfdc|h-d-f-c|xn--/i
/** HDFC Bank's own published mobile-format numbers (SMS banking, WhatsApp ChatBanking). */
const BANK_MOBILE_NUMBERS = new Set(['7308080808', '7070022222'])
const matchesDomain =(host: string, domain: string) => host === domain || host.endsWith('.' + domain)
const norm = (domain: string) => domain.toLowerCase().replace(/\.+$/, '')

function extract(text: string): string[] {
  const found = new Set<string>()
  for (const match of text.matchAll(candidate)) {
    const value = match[0].replace(/[.,;!?)}\]]+$/, '')
    if (value) found.add(value)
  }
  return [...found]
}

function classify(input: string, data: CheckerDomains): SiteResult | null {
  try {
    const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`)
    const hostname = norm(url.hostname)
    const warnings: string[] = []
    const official = data.officialDomains.some(d => matchesDomain(hostname, norm(d)))
    const legacy = data.legacyDomains?.some(d => matchesDomain(hostname, norm(d))) ?? false
    const group = data.groupDomains.some(d => matchesDomain(hostname, norm(d)))
    const deceptiveUser = !!url.username && bankLookalike.test(decodeURIComponent(url.username))
    const hasBankClaim = bankLookalike.test(hostname) || deceptiveUser
    if (url.protocol === 'http:') warnings.push('Uses HTTP, not HTTPS')
    if (url.pathname.toLowerCase().endsWith('.apk') || /\.apk(?:[/?#]|$)/i.test(input)) warnings.push('Links to an APK app file')
    if (shorteners.has(hostname)) warnings.push('Short link hides its destination')
    if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.startsWith('[')) warnings.push('Uses a raw IP address')
    if (unusualTlds.has(hostname.split('.').at(-1) ?? '')) warnings.push('Unusual domain ending')
    if (deceptiveUser) warnings.push('Bank name appears before @, but the real site is elsewhere')
    if (hasBankClaim && !official && !legacy && !group || deceptiveUser) return { input, hostname, kind: 'phishing', label: 'Likely fake / phishing', warnings }
    if (official) return { input, hostname, kind: 'official', label: 'Official HDFC Bank website', warnings }
    if (legacy) return { input, hostname, kind: 'legacy', label: 'Official but older HDFC domain; the bank now uses hdfc.bank.in', warnings }
    if (group) return { input, hostname, kind: 'group', label: 'HDFC group company, not the bank', warnings }
    if (warnings.length) return { input, hostname, kind: 'warning', label: 'Check this link carefully', warnings }
    return { input, hostname, kind: 'unknown', label: 'Not verified as an HDFC Bank site', warnings }
  } catch { return null }
}

export function checkMessage(text: string, data: CheckerDomains): CheckResult {
  const sites = extract(text).map(s => classify(s, data)).filter((s): s is SiteResult => s !== null)
  const flags: string[] = []
  const add = (pattern: RegExp, label: string) => { if (pattern.test(text)) flags.push(label) }
  add(/\b(?:otp|one[ -]?time password|pin|cvv|password)\b/i, 'Mentions OTP, PIN, CVV or password')
  add(/\b(?:kyc|pan)\b.{0,45}\b(?:update|verify|expire|submit)|\b(?:update|verify)\b.{0,35}\b(?:kyc|pan)\b/i, 'Asks for KYC or PAN update')
  add(/\baccount\b.{0,45}\b(?:blocked|suspended|frozen|closed)\b/i, 'Threatens to block the account')
  add(/\breward(?:s)? points?\b.{0,40}\b(?:expir\w*|lapse\w*)\b/i, 'Claims reward points are expiring')
  add(/\bclick (?:here|the link|below)\b/i, 'Asks you to click a link')
  add(/\b(?:urgent(?:ly)?|immediately|act now|today|last chance|within 24 hours)\b/i, 'Uses urgency')
  add(/\bapk\b/i, 'Mentions an APK app file')
  // A 10-digit Indian mobile number standing alone (not part of a longer number like 18002586161),
  // near "call/contact", that is not one of the bank's own published numbers.
  const callMobile = /\b(?:call|contact|ring|phone|whatsapp)\b.{0,20}?(?<!\d)(?:\+?91[- ]?)?([6-9]\d{9})(?!\d)/gi
  if ([...text.matchAll(callMobile)].some((m) => !BANK_MOBILE_NUMBERS.has(m[1]))) flags.push('Asks you to call a personal mobile number')
  const ids = data.smsSenderIds ?? []
  const header = text.match(/\b(?:[A-Z]{2}-)?(HDFC[A-Z-]*)(?:-[A-Z])?\s*:/i) ?? text.match(/\b[A-Z]{2}-(HDFC[A-Z-]*)(?:-[A-Z])?\b/i)
  let sender: string | undefined
  if (header) {
    const id = header[1].replace(/-[A-Z]$/, '').toUpperCase()
    if (ids.some(genuine => genuine.toUpperCase() === id)) sender = 'Genuine-looking sender ID; sender IDs can be spoofed. Check the message too.'
    else flags.push('Sender ID imitates HDFC Bank')
  }
  // Pasted messages often start with the sender. A bank-branded SMS whose sender is a personal mobile number is fake.
  if (/^\s*(?:from:?\s*)?(?:\+?91[- ]?)?[6-9]\d{9}(?!\d)/i.test(text) && /HDFC/i.test(text)) flags.push('Bank sender claim from a mobile number')
  const phishingSite = sites.some(s => s.kind === 'phishing')
  const highRiskFlag = flags.some(f => /OTP|KYC|account|APK|mobile number|imitates/.test(f))
  const verdict: Verdict = phishingSite || (highRiskFlag && (sites.length > 0 || flags.length > 1)) ? 'phishing' : sites.some(s => s.warnings.length > 0 || s.kind === 'warning') || flags.length > 0 ? 'suspicious' : 'safe'
  return { verdict, sites, flags, sender }
}
