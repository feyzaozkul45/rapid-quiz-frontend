import { ref } from 'vue'

const NORMAL_TIMEOUT_MS = 10_000
const DEFAULT_COLD_START_TIMEOUT_MS = 90_000

/**
 * Render ücretsiz servisi 15 dk hareketsizlikte uyur ve uyanması 30–60 sn sürer.
 * İlk istekler için uzun zaman aşımı ve yeniden deneme kullanılır; `0` bu korumayı kapatır.
 */
export const coldStartTimeoutMs = (() => {
  const raw = import.meta.env.VITE_COLD_START_TIMEOUT_MS
  if (raw === undefined || raw === '') return DEFAULT_COLD_START_TIMEOUT_MS
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_COLD_START_TIMEOUT_MS
})()

/** Sunucu bir kez yanıt verdi mi? Verdiyse normal zaman aşımına dönülür. */
export const serverAwake = ref(coldStartTimeoutMs === 0)

/** İlk istek yavaşlayınca true olur: "Sunucu uyanıyor" mesajını gösterir. */
export const serverWaking = ref(false)

export const WAKING_NOTICE_DELAY_MS = 3_000
export const WAKE_RETRY_DELAY_MS = 3_000

export function requestTimeoutMs(): number {
  return serverAwake.value ? NORMAL_TIMEOUT_MS : coldStartTimeoutMs
}

let noticeTimer: ReturnType<typeof setTimeout> | null = null

function clearNoticeTimer() {
  if (noticeTimer !== null) clearTimeout(noticeTimer)
  noticeTimer = null
}

/** İstek başlarken çağrılır; sunucu uyanana kadar yavaş istekte mesaj çıkarır. */
export function watchForSlowServer() {
  if (serverAwake.value || noticeTimer !== null) return
  noticeTimer = setTimeout(() => {
    noticeTimer = null
    if (!serverAwake.value) serverWaking.value = true
  }, WAKING_NOTICE_DELAY_MS)
}

/** Sunucu yanıt verdi (başarılı ya da 4xx): artık uyanık. */
export function markServerAwake() {
  clearNoticeTimer()
  serverAwake.value = true
  serverWaking.value = false
}

/** Yeniden deneme hakkı bitti: mesajı kaldır, hatayı ekran göstersin. */
export function giveUpWaiting() {
  clearNoticeTimer()
  serverWaking.value = false
}

/** Testler için. */
export function resetServerStatus() {
  clearNoticeTimer()
  serverAwake.value = coldStartTimeoutMs === 0
  serverWaking.value = false
}
