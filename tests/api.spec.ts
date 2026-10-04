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

describe('createSession isteği', () => {
  it('son oynanan soru ID’lerini gövdede gönderir', async () => {
    const { http, createSession } = await import('@/api')
    const original = http.defaults.adapter
    let body: unknown
    http.defaults.adapter = async (config) => {
      body = JSON.parse(config.data as string)
      return { status: 201, data: {}, config, headers: {}, statusText: '' } as AxiosResponse
    }
    try {
      await createSession('fizik', [3, 1, 2])
      expect(body).toEqual({
        category: 'fizik',
        client_type: 'web',
        recent_question_ids: [3, 1, 2],
      })
      await createSession('fizik')
      expect(body).toMatchObject({ recent_question_ids: [] })
    } finally {
      http.defaults.adapter = original
    }
  })
})

describe('oturum ID’si yol parçası olarak kodlanır', () => {
  async function requestedUrl(call: (api: typeof import('@/api')) => Promise<unknown>) {
    const api = await import('@/api')
    const original = api.http.defaults.adapter
    let url = ''
    api.http.defaults.adapter = async (config) => {
      url = config.url ?? ''
      return { status: 200, data: {}, config, headers: {}, statusText: '' } as AxiosResponse
    }
    try {
      await call(api)
    } finally {
      api.http.defaults.adapter = original
    }
    return url
  }

  const evil = '../admin?x=1#y'
  const encoded = '..%2Fadmin%3Fx%3D1%23y'

  it('normal UUID değişmez', async () => {
    const id = '8f1c0000-0000-4000-8000-000000000000'
    expect(await requestedUrl((api) => api.getCurrentQuestion(id))).toBe(
      `/quiz-sessions/${id}/current-question/`,
    )
  })

  it.each([
    [
      'getCurrentQuestion',
      (api: typeof import('@/api')) => api.getCurrentQuestion(evil),
      'current-question',
    ],
    ['submitAnswer', (api: typeof import('@/api')) => api.submitAnswer(evil, 1, null), 'answers'],
    ['getResult', (api: typeof import('@/api')) => api.getResult(evil), 'result'],
    [
      'savePlayerName',
      (api: typeof import('@/api')) => api.savePlayerName(evil, 'Ayşe'),
      'player-name',
    ],
  ])('%s: ../ ve ? kodlanır, yol dışına çıkamaz', async (_name, call, tail) => {
    const url = await requestedUrl(call)
    expect(url).toBe(`/quiz-sessions/${encoded}/${tail}/`)
    expect(url).not.toContain('../')
    expect(url.split('/')).toHaveLength(5) // '', quiz-sessions, <tek parça>, <son>, ''
  })
})
