// Module lifetime intentionally outlives the screen. Timers retain no plaintext.
let timer: ReturnType<typeof setTimeout> | undefined
export function scheduleClipboardClear(seconds: number): void {
  clearTimeout(timer)
  timer = setTimeout(() => {
    void clearClipboard()
  }, seconds * 1000)
}
async function clearClipboard(): Promise<void> {
  try {
    await navigator.clipboard.writeText('')
  } catch {
    // Browser permission, background suspension or unavailable API: best effort.
  }
}

/** Sanitise the user's clipboard-clear setting (seconds). */
export function clipboardSeconds(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.min(2147483, Math.max(1, Math.floor(value))) : 20
}
