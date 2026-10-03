import { AxiosError, type AxiosResponse } from 'axios'
import { describe, expect, it } from 'vitest'
import { ApiError, toApiError } from '@/api'
import { errorMessage } from '@/i18n'
import { normalizeName, validateName } from '@/utils/playerName'

function axiosError(status: number | null, data?: unknown) {
  const error = new AxiosError('boom')
  if (status !== null) error.response = { status, data } as AxiosResponse
  return error
}

describe('toApiError', () => {
  it('sabit hata formatını ApiError’a çevirir', () => {
    const error = toApiError(
      axiosError(410, { error: { code: 'session_expired', message: 'Süre doldu' } }),
    )
    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('session_expired')
    expect(error.status).toBe(410)
    expect(error.message).toBe('Süre doldu')
  })

  it('doğrulama hatalarında details’i korur', () => {
    const error = toApiError(
      axiosError(400, { error: { code: 'validation_error', message: 'x', details: { a: 1 } } }),
    )
    expect(error.details).toEqual({ a: 1 })
  })

  it('yanıtsız hatayı network_error yapar', () => {
    expect(toApiError(axiosError(null)).code).toBe('network_error')
  })

  it('beklenen formatta olmayan HTTP hatasını server_error yapar', () => {
    const error = toApiError(axiosError(502, '<html>Bad Gateway</html>'))
    expect(error.code).toBe('server_error')
    expect(error.status).toBe(502)
  })
})

describe('errorMessage', () => {
  it('bilinen kod için Türkçe mesaj, bilinmeyen için genel mesaj verir', () => {
    expect(errorMessage('rate_limited')).toContain('Çok fazla istek')
    expect(errorMessage('hic_boyle_bir_kod_yok')).toBe('Beklenmeyen bir hata oluştu.')
  })
})

describe('isim kuralları', () => {
  it('normalizeName kırpar ve art arda boşlukları teke indirir', () => {
    expect(normalizeName('  Ali   Veli ')).toBe('Ali Veli')
  })

  it.each([
    ['Ayşe', null],
    ['Çağlar Öz-1', null],
    ['A', 'too_short'],
    ['   B  ', 'too_short'],
    ['a'.repeat(21), 'too_long'],
    ['a'.repeat(20), null],
    ['Ali<script>', 'invalid_chars'],
    ['Ali_Veli', 'invalid_chars'],
  ])('validateName(%j) → %s', (input, expected) => {
    expect(validateName(input)).toBe(expected)
  })
})
