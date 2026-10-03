import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCountdown } from '@/composables/useCountdown'

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('5 saniyeden geriye sayar ve süre dolunca bir kez onExpire çağırır', () => {
    const onExpire = vi.fn()
    const countdown = useCountdown(5, onExpire)
    countdown.start()

    expect(countdown.displaySeconds.value).toBe(5)
    vi.advanceTimersByTime(2000)
    expect(countdown.displaySeconds.value).toBe(3)
    expect(onExpire).not.toHaveBeenCalled()

    vi.advanceTimersByTime(3000)
    expect(countdown.remaining.value).toBe(0)
    expect(countdown.running.value).toBe(false)
    expect(onExpire).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(5000)
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('sunucudan gelen kalan süreden devam eder (sayfa yenileme)', () => {
    const onExpire = vi.fn()
    const countdown = useCountdown(5, onExpire)
    countdown.start(2.4)

    expect(countdown.displaySeconds.value).toBe(3)
    vi.advanceTimersByTime(2500)
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('kalan süre toplamı aşamaz', () => {
    const countdown = useCountdown(5, vi.fn())
    countdown.start(99)
    expect(countdown.remaining.value).toBe(5)
  })

  it('kalan süre 0 ise hemen onExpire çağırır', () => {
    const onExpire = vi.fn()
    useCountdown(5, onExpire).start(0)
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('stop() sonrası onExpire çağrılmaz', () => {
    const onExpire = vi.fn()
    const countdown = useCountdown(5, onExpire)
    countdown.start()
    vi.advanceTimersByTime(1000)
    countdown.stop()
    vi.advanceTimersByTime(10_000)
    expect(onExpire).not.toHaveBeenCalled()
    expect(countdown.running.value).toBe(false)
  })

  it('progress 1 → 0 arasında azalır', () => {
    const countdown = useCountdown(5, vi.fn())
    countdown.start()
    expect(countdown.progress.value).toBe(1)
    vi.advanceTimersByTime(2500)
    expect(countdown.progress.value).toBeCloseTo(0.5, 1)
  })
})
