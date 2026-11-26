// Small shared UI kit (Tailwind). Feature screens should compose these rather than restyle.
import { type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, useEffect } from 'react'
import { formatINR, formatINRCompact } from '@/core/format'
import { useVault } from '@/core/vault'

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

export function Page({ title, subtitle, actions, children }: { title: string; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-28 pt-5">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
      </header>
      <div className="space-y-5">{children}</div>
    </div>
  )
}

export function Section({ title, action, children }: { title?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section>
      {(title || action) && (
        <div className="mb-2 flex items-center justify-between">
          {title && <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function Panel({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cx(
        'rounded-2xl border border-line bg-surface p-4 shadow-sm',
        onClick && 'cursor-pointer transition hover:border-accent/50',
        className,
      )}
    >
      {children}
    </div>
  )
}

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export function Button({ variant = 'secondary', size = 'md', className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <button
      {...p}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2 text-sm',
        size === 'lg' && 'w-full px-5 py-3 text-base',
        variant === 'primary' && 'bg-accent text-white hover:bg-accent/90',
        variant === 'secondary' && 'border border-line bg-surface text-ink hover:bg-raised',
        variant === 'ghost' && 'text-ink hover:bg-raised',
        variant === 'danger' && 'bg-danger text-white hover:bg-danger/90',
        className,
      )}
    />
  )
}

export function Field({ label, hint, error, children }: { label: string; hint?: ReactNode; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  )
}

const inputCls =
  'w-full rounded-xl border border-line bg-raised px-3 py-2 text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30'

export function Input(p: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={cx(inputCls, p.className)} />
}

export function Select({ options, ...p }: SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }) {
  return (
    <select {...p} className={cx(inputCls, p.className)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-3 py-1 text-left">
      <span className="text-sm text-ink">{label}</span>
      <span className={cx('relative h-6 w-11 shrink-0 rounded-full transition', checked ? 'bg-accent' : 'bg-line')}>
        <span className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition', checked ? 'left-[22px]' : 'left-0.5')} />
      </span>
    </button>
  )
}

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'accent'; children: ReactNode }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        tone === 'neutral' && 'bg-raised text-muted',
        tone === 'good' && 'bg-good/15 text-good',
        tone === 'warn' && 'bg-warn/15 text-warn',
        tone === 'bad' && 'bg-danger/15 text-danger',
        tone === 'accent' && 'bg-accent/15 text-accent',
      )}
    >
      {children}
    </span>
  )
}

export function Progress({ value, max, tone = 'accent' }: { value: number; max: number; tone?: 'accent' | 'good' | 'warn' }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-raised" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cx('h-full rounded-full transition-all', tone === 'accent' && 'bg-accent', tone === 'good' && 'bg-good', tone === 'warn' && 'bg-warn')} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-0.5 text-xl font-semibold text-ink tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  )
}

export function Empty({ title, body, action }: { title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line p-6 text-center">
      <div className="font-medium text-ink">{title}</div>
      {body && <div className="mt-1 text-sm text-muted">{body}</div>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}

/** Money respecting the "hide amounts" privacy setting. */
export function Money({ value, compact, paise, className }: { value: number; compact?: boolean; paise?: boolean; className?: string }) {
  const { state } = useVault()
  const hidden = state?.settings.hideAmounts
  return (
    <span className={cx('tabular-nums', hidden && 'select-none blur-sm', className)} aria-label={hidden ? 'hidden amount' : undefined}>
      {compact ? formatINRCompact(value) : formatINR(value, { paise })}
    </span>
  )
}

/** Bottom sheet / modal. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-line bg-surface p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-muted hover:bg-raised" aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Callout({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'danger'; children: ReactNode }) {
  return (
    <div
      className={cx(
        'rounded-xl border p-3 text-sm',
        tone === 'info' && 'border-accent/30 bg-accent/10 text-ink',
        tone === 'warn' && 'border-warn/30 bg-warn/10 text-ink',
        tone === 'danger' && 'border-danger/30 bg-danger/10 text-ink',
      )}
    >
      {children}
    </div>
  )
}

/** Subtle "as of / source" line for any bank fact we show. */
export function SourceNote({ asOf, href }: { asOf: string; href?: string }) {
  return (
    <p className="mt-2 text-xs text-muted">
      As of {asOf}. Bank rules change. Confirm on the{' '}
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="underline">
          official page
        </a>
      ) : (
        'official site'
      )}
      .
    </p>
  )
}
