import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { scheduleClipboardClear } from './clipboard'

beforeEach(() => vi.useFakeTimers())
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals() })
it('clears only at the requested deadline and retains no secret', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal('navigator', { clipboard: { writeText } })
  scheduleClipboardClear(20)
  await vi.advanceTimersByTimeAsync(19_999)
  expect(writeText).not.toHaveBeenCalled()
  await vi.advanceTimersByTimeAsync(1)
  expect(writeText).toHaveBeenCalledExactlyOnceWith('')
})
it('a new copy replaces the previous timer across rows', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal('navigator', { clipboard: { writeText } })
  scheduleClipboardClear(10)
  await vi.advanceTimersByTimeAsync(5_000)
  scheduleClipboardClear(20)
  await vi.advanceTimersByTimeAsync(5_000)
  expect(writeText).not.toHaveBeenCalled()
  await vi.advanceTimersByTimeAsync(15_000)
  expect(writeText).toHaveBeenCalledExactlyOnceWith('')
})
it('swallows permission rejection and missing API failures', async () => {
  vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) } })
  scheduleClipboardClear(1)
  await expect(vi.advanceTimersByTimeAsync(1000)).resolves.toBeDefined()
  vi.stubGlobal('navigator', {})
  scheduleClipboardClear(1)
  await expect(vi.advanceTimersByTimeAsync(1000)).resolves.toBeDefined()
})
