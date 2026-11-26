import { useEffect, type ReactNode } from 'react'
import { useRoute } from './core/router'
import { useVault } from './core/vault'
import { cx } from './ui'
import LockScreen from './features/lock/LockScreen'
import Home from './features/home'
import Cards from './features/cards'
import VaultScreen from './features/vault'
import Money from './features/money'
import Tools from './features/tools'
import Help from './features/help'
import Settings from './features/settings'
import More from './features/more'

const TABS: { id: string; label: string; icon: ReactNode }[] = [
  { id: 'home', label: 'Home', icon: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /> },
  { id: 'cards', label: 'Cards', icon: <path d="M3 6h18v12H3zM3 10h18" /> },
  { id: 'vault', label: 'Vault', icon: <path d="M6 10V7a6 6 0 0 1 12 0v3M5 10h14v11H5zM12 14v3" /> },
  { id: 'money', label: 'Money', icon: <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" /> },
  { id: 'more', label: 'More', icon: <path d="M5 12h.01M12 12h.01M19 12h.01" /> },
]

function useTheme(pref: 'system' | 'light' | 'dark' | undefined) {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = pref === 'dark' || ((pref ?? 'system') === 'system' && mq.matches)
      document.documentElement.classList.toggle('dark', dark)
      document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#0a0f1c' : '#f5f7fa')
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [pref])
}

export default function App() {
  const { status, state } = useVault()
  const { segments } = useRoute()
  useTheme(state?.settings.theme)

  if (status === 'loading') return <div className="flex min-h-screen items-center justify-center text-muted">Loading…</div>
  // The Help hub (lost card, helplines) works even while locked: it holds no personal data.
  if (status !== 'unlocked') {
    if (segments[0] === 'help') return <Shell locked>{<Help />}</Shell>
    return <LockScreen />
  }

  const route = segments[0]
  const screen =
    route === 'cards' ? <Cards /> :
    route === 'vault' ? <VaultScreen /> :
    route === 'money' ? <Money /> :
    route === 'tools' ? <Tools /> :
    route === 'help' ? <Help /> :
    route === 'settings' ? <Settings /> :
    route === 'more' ? <More /> :
    <Home />
  return <Shell>{screen}</Shell>
}

function Shell({ children, locked }: { children: ReactNode; locked?: boolean }) {
  const { segments } = useRoute()
  const active = ['tools', 'help', 'settings', 'more'].includes(segments[0]) ? 'more' : segments[0] || 'home'
  return (
    <div className="min-h-screen bg-bg">
      <main>{children}</main>
      <footer className="mx-auto max-w-3xl px-4 pb-28 text-center text-[11px] leading-relaxed text-muted">
        MyRM is unofficial and not affiliated with or endorsed by HDFC Bank. Your data is encrypted and never leaves this device.
      </footer>
      {locked ? (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 p-3 text-center backdrop-blur">
          <a href="#/" className="text-sm font-medium text-accent">← Back to unlock</a>
        </nav>
      ) : (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          <ul className="mx-auto flex max-w-3xl justify-around">
            {TABS.map((t) => (
              <li key={t.id}>
                <a href={`#/${t.id}`} className={cx('flex flex-col items-center gap-0.5 px-3 py-2 text-[11px]', active === t.id ? 'text-accent' : 'text-muted')} aria-current={active === t.id ? 'page' : undefined}>
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    {t.icon}
                  </svg>
                  {t.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  )
}
