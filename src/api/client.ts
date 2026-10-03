import axios, { isAxiosError } from 'axios'

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
  timeout: 10_000,
  headers: { 'X-Client-Type': 'web', 'X-Client-Version': CLIENT_VERSION },
})

http.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toApiError(error)),
)
