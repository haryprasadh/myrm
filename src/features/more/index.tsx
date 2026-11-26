import { Page, Panel } from '@/ui'

const ITEMS = [
  { href: '#/tools', title: 'Tools', body: 'EMI & prepayment, FD maturity & ladder, relationship tier' },
  { href: '#/help', title: 'Help & safety', body: 'Lost card, helplines, how-tos, link checker' },
  { href: '#/settings', title: 'Settings & backup', body: 'Face ID unlock, auto-lock, encrypted backup' },
]

export default function More() {
  return (
    <Page title="More">
      <div className="grid gap-3">
        {ITEMS.map((i) => (
          <a key={i.href} href={i.href}>
            <Panel className="transition hover:border-accent/50">
              <div className="font-medium text-ink">{i.title}</div>
              <div className="text-sm text-muted">{i.body}</div>
            </Panel>
          </a>
        ))}
      </div>
    </Page>
  )
}
