import { useEffect, useRef, useState } from 'react'
import type { Sealed } from '@/core/schema'
import { useVault } from '@/core/vault'
import { Button } from '@/ui'
import { clipboardSeconds } from './logic'

import { scheduleClipboardClear } from './clipboard'

export function SecretValue({ value, label }: { value: Sealed; label: string }) {
  const { unseal, state } = useVault()
  const [plain, setPlain] = useState('')
  const [remaining, setRemaining] = useState(0)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const generation = useRef(0)
  const expiry = useRef(0)
  useEffect(() => {
    const mask = () => {
      generation.current++
      expiry.current = 0
      setPlain('')
      setRemaining(0)
      setBusy(false)
    }
    const hidden = () => { if (document.hidden) mask() }
    document.addEventListener('visibilitychange', hidden)
    window.addEventListener('pagehide', mask)
    const timer = setInterval(() => {
      if (!expiry.current) return
      const left = Math.max(0, Math.ceil((expiry.current - Date.now()) / 1000))
      setRemaining(left)
      if (!left) mask()
    }, 200)
    return () => {
      generation.current++
      clearInterval(timer)
      document.removeEventListener('visibilitychange', hidden)
      window.removeEventListener('pagehide', mask)
    }
  }, [value])

  async function access(copy: boolean) {
    const request = ++generation.current
    setBusy(true)
    setMessage('')
    setPlain('')
    setRemaining(0)
    expiry.current = 0
    let text = ''
    try {
      text = await unseal(value)
      if (request !== generation.current || document.hidden) return
      if (copy) {
        const seconds = clipboardSeconds(state?.settings.clipboardClearSeconds ?? 20)
        await navigator.clipboard.writeText(text)
        scheduleClipboardClear(seconds)
        if (request === generation.current) setMessage(`Copied, clears in ${seconds} s (best effort).`)
      } else {
        expiry.current = Date.now() + 10_000
        setPlain(text)
        setRemaining(10)
      }
    } catch {
      if (request === generation.current) setMessage(copy ? 'Could not copy. Try Reveal instead.' : 'Could not reveal. Unlock the vault and try again.')
    } finally {
      text = ''
      if (request === generation.current) setBusy(false)
    }
  }
  return <div className="space-y-2">
    <p className="text-xs text-muted">{label}</p>
    <p className="break-all font-mono text-ink" aria-label={plain ? undefined : `${label} hidden`}>{plain || '••••'}</p>
    <div className="flex flex-wrap items-center gap-2">
      <Button className="min-h-10" disabled={busy} onClick={() => {
        if (plain) { generation.current++; setPlain(''); setRemaining(0); expiry.current = 0 }
        else void access(false)
      }}>{plain ? 'Hide' : 'Reveal'} {label}</Button>
      <Button className="min-h-10" disabled={busy} onClick={() => void access(true)}>Copy {label}</Button>
      {remaining > 0 && <span className="text-xs text-muted">Hides in {remaining} s</span>}
    </div>
    {message && <p role="status" className="text-xs text-muted">{message}</p>}
  </div>
}
