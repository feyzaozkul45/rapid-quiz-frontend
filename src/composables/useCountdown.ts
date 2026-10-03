import { computed, getCurrentScope, onScopeDispose, ref } from 'vue'

const TICK_MS = 100

/**
 * Yalnızca görsel geri sayım. Süre kontrolü sunucudadır; süre dolunca `onExpire` bir kez çağrılır.
 * `start(seconds)` ile sunucudan gelen `remaining_seconds` değerinden devam edilir.
 */
export function useCountdown(totalSeconds: number, onExpire: () => void) {
  const remaining = ref(totalSeconds)
  const running = ref(false)
  let deadline = 0
  let timer: ReturnType<typeof setInterval> | null = null

  function stop() {
    if (timer !== null) clearInterval(timer)
    timer = null
    running.value = false
  }

  function tick() {
    remaining.value = Math.max(0, (deadline - performance.now()) / 1000)
    if (remaining.value <= 0) {
      stop()
      onExpire()
    }
  }

  function start(seconds: number = totalSeconds) {
    stop()
    const initial = Math.min(Math.max(seconds, 0), totalSeconds)
    remaining.value = initial
    deadline = performance.now() + initial * 1000
    running.value = true
    if (initial <= 0) {
      tick()
      return
    }
    timer = setInterval(tick, TICK_MS)
  }

  if (getCurrentScope()) onScopeDispose(stop)

  return {
    remaining,
    running,
    /** 1 → 0 arası oran */
    progress: computed(() => remaining.value / totalSeconds),
    /** Ekranda gösterilen tam saniye (5, 4, … 0) */
    displaySeconds: computed(() => Math.ceil(remaining.value)),
    start,
    stop,
  }
}
