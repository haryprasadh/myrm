import type { Account, Credential, CredentialKind, UserCard } from '@/core/schema'

export const kindMeta: Record<CredentialKind, { label: string; icon: string }> = {
  card_pin: { label: 'Card PIN', icon: '💳' },
  upi_pin: { label: 'UPI PIN', icon: '📱' },
  mpin: { label: 'MPIN', icon: '🔢' },
  netbanking: { label: 'NetBanking', icon: '🔐' },
  tpin: { label: 'TPIN', icon: '☎️' },
  other: { label: 'Other credential', icon: '🔑' },
}

/** Returns a user-facing error, or null. Never includes the supplied value. */
export function validateSecret(kind: CredentialKind, value: string): string | null {
  const digits = value.length > 0 && !/[^0-9]/.test(value)
  switch (kind) {
    case 'card_pin': case 'mpin': return digits && value.length >= 4 && value.length <= 6 ? null : 'Enter 4–6 digits.'
    case 'upi_pin': return digits && (value.length === 4 || value.length === 6) ? null : 'Enter 4 or 6 digits.'
    case 'tpin': return digits ? null : 'Enter digits only.'
    default: return value.trim() ? null : 'Enter a secret.'
  }
}

export function defaultLabel(kind: CredentialKind, linkedName = '', app = ''): string {
  const prefix = [linkedName.trim(), kind === 'upi_pin' ? app.trim() : ''].filter(Boolean).join(' ')
  const suffix = kind === 'card_pin' && prefix ? 'card PIN' : kindMeta[kind].label
  return [prefix, suffix].filter(Boolean).join(' ')
}

export interface CredentialGroup { key: string; label: string; credentials: Credential[] }
export function groupCredentials(credentials: Credential[], cards: UserCard[], accounts: Account[]): CredentialGroup[] {
  const links = new Map<string, string>([
    ...cards.map(c => [`card:${c.id}`, c.nickname || 'Unnamed card'] as const),
    ...accounts.map(a => [`account:${a.id}`, a.nickname || 'Unnamed account'] as const),
  ])
  const groups = new Map<string, CredentialGroup>()
  for (const credential of credentials) {
    const link = credential.linkedTo
    const candidate = link ? `${link.type}:${link.id}` : 'other'
    const key = links.has(candidate) ? candidate : 'other'
    const group = groups.get(key) ?? { key, label: links.get(key) ?? 'Other', credentials: [] }
    group.credentials.push(credential)
    groups.set(key, group)
  }
  return [...groups.values()].sort((a, b) => a.key === 'other' ? 1 : b.key === 'other' ? -1 : a.label.localeCompare(b.label))
}

export function ageBadge(updatedAt: string, now: Date = new Date()): { label: string; tone: 'neutral' | 'warn' } {
  const date = new Date(updatedAt)
  if (!Number.isFinite(date.getTime()) || !Number.isFinite(now.getTime())) return { label: 'Change date unknown', tone: 'neutral' }
  // Calendar days: DST and time of day do not change the badge.
  const day = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
  const days = Math.max(0, Math.round((day(now) - day(date)) / 86_400_000))
  return { label: days === 0 ? 'Changed today' : `Changed ${days} ${days === 1 ? 'day' : 'days'} ago`, tone: days > 365 ? 'warn' : 'neutral' }
}

export function clipboardSeconds(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.min(2147483, Math.max(1, Math.floor(value))) : 20
}
