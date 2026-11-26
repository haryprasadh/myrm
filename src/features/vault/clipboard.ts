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
