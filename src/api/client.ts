import axios, { isAxiosError, type InternalAxiosRequestConfig } from 'axios'
import {
  WAKE_RETRY_DELAY_MS,
  coldStartTimeoutMs,
  giveUpWaiting,
  markServerAwake,
  requestTimeoutMs,
  serverAwake,
  watchForSlowServer,
} from './serverStatus'

export const CLIENT_VERSION = '0.1.0'

const DEFAULT_BASE_URL = 'http://localhost:8000/api/v1'

/** Backend'in sabit hata formatından (`{ error: { code, message, details? } }`) üretilen hata. */
export class ApiError extends Error {
  readonly code: string
  readonly status: number
  readonly details?: unknown

  constructor(code: string, message: string, status = 0, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (isAxiosError(error)) {
    const body = error.response?.data as
      { error?: { code?: string; message?: string; details?: unknown } } | undefined
    if (error.response && body?.error?.code) {
      return new ApiError(
        body.error.code,
        body.error.message ?? '',
        error.response.status,
        body.error.details,
      )
    }
    if (error.response) {
      return new ApiError('server_error', error.message, error.response.status)
    }
    return new ApiError('network_error', error.message)
  }
  return new ApiError('unknown', error instanceof Error ? error.message : String(error))
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL,
  timeout: requestTimeoutMs(),
  headers: { 'X-Client-Type': 'web', 'X-Client-Version': CLIENT_VERSION },
})

type WakeConfig = InternalAxiosRequestConfig & { __wakeStartedAt?: number }

/** Uyuyan sunucunun verdiği geçiş hataları: yanıt yok (CORS'suz ağ hatası) veya 502/503/504. */
function isWakeError(error: unknown): boolean {
  if (!isAxiosError(error)) return false
  if (error.response) return [502, 503, 504].includes(error.response.status)
  return error.code === 'ERR_NETWORK'
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

http.interceptors.request.use((config) => {
  // Sunucu ilk kez uyanırken uzun, sonrasında normal zaman aşımı.
  config.timeout = requestTimeoutMs()
  watchForSlowServer()
  return config
})

http.interceptors.response.use(
  (response) => {
    markServerAwake()
    return response
  },
  async (error) => {
    if (isAxiosError(error) && error.response && !isWakeError(error)) {
      markServerAwake() // 4xx/409 de olsa sunucu yanıt verdi
    } else if (!serverAwake.value && isWakeError(error) && isAxiosError(error) && error.config) {
      const config = error.config as WakeConfig
      config.__wakeStartedAt ??= Date.now()
      if (Date.now() - config.__wakeStartedAt + WAKE_RETRY_DELAY_MS < coldStartTimeoutMs) {
        await sleep(WAKE_RETRY_DELAY_MS)
        // Yanıt alınmadığı için sunucu isteği işlememiştir; yeniden göndermek güvenlidir.
        return http.request(config)
      }
    }
    if (!serverAwake.value) giveUpWaiting()
    return Promise.reject(toApiError(error))
  },
)
