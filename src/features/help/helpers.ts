import type { Helpline, OfficialLink } from '@/data/types'

export function lostCardContacts(helplines: Helpline[], links: OfficialLink[]) {
  const phones = helplines.filter(h => h.kind === 'phone' && (/report-fraud|customer-care|block/i.test(h.id) || /fraud|block|customer care/i.test(h.label)))
  const sms = helplines.filter(h => h.kind === 'sms' && (/block/i.test(h.id) || /block/i.test(h.label)))
  const web = links.filter(l => /mycards|block-(?:credit|debit)/i.test(l.id) || /block.*card|mycards/i.test(l.label))
  return { phones, sms, web }
}

export function fillSmsBody(template: string, lastFour: string): string | null {
  if (!/^\d{4}$/.test(lastFour)) return null
  return template.replace(/<last (?:4|four)(?: digits)?>/i, lastFour)
}

export function thirdWorkingDay(start: Date): Date {
  const day = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  let count = 0
  while (count < 3) {
    day.setDate(day.getDate() + 1)
    if (day.getDay() !== 0 && day.getDay() !== 6) count++
  }
  return day
}
