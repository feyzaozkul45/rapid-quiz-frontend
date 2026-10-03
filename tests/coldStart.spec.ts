import {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, getCategories, http } from '@/api'
import {
  coldStartTimeoutMs,
  resetServerStatus,
  serverAwake,
  serverWaking,
} from '@/api/serverStatus'

type Outcome = 'network' | number

/** Sırayla verilen sonuçları döndüren sahte adaptör; son sonuç tekrarlanır. */
function fakeServer(outcomes: Outcome[]) {
  const timeouts: (number | undefined)[] = []
  let calls = 0
  const adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
    timeouts.push(config.timeout)
    const outcome = outcomes[Math.min(calls, outcomes.length - 1)]!
    calls += 1
    if (outcome === 'network') throw new AxiosError('Network Error', 'ERR_NETWORK', config)
    const response = { status: outcome, data: [], config, headers: {}, statusText: '' }
    if (outcome >= 400) {
      const data = { error: { code: 'session_not_found', message: 'yok' } }
      throw new AxiosError('failed', 'ERR_BAD_REQUEST', config, undefined, {
        ...response,
        data,
      } as AxiosResponse)
    }
    return response as AxiosResponse
  }
  http.defaults.adapter = adapter
  return { timeouts, calls: () => calls }
}

describe('soğuk başlangıç (uyuyan sunucu)', () => {
  const originalAdapter = http.defaults.adapter

  beforeEach(() => {
    vi.useFakeTimers()
    resetServerStatus()
  })
  afterEach(() => {
    http.defaults.adapter = originalAdapter
    vi.useRealTimers()
    resetServerStatus()
  })

  it('testlerde koruma açıktır (varsayılan 90 sn)', () => {
    expect(coldStartTimeoutMs).toBe(90_000)
    expect(serverAwake.value).toBe(false)
  })

  it('503 döndükçe yeniden dener, 3 sn sonra mesajı gösterir, uyanınca kaldırır', async () => {
    const server = fakeServer([503, 503, 200])
    const result = getCategories()

    await vi.advanceTimersByTimeAsync(2_900)
    expect(serverWaking.value).toBe(false)
    await vi.advanceTimersByTimeAsync(200)
    expect(serverWaking.value).toBe(true)

    await vi.advanceTimersByTimeAsync(3_000)
    await expect(result).resolves.toEqual([])
    expect(server.calls()).toBe(3)
    expect(serverAwake.value).toBe(true)
    expect(serverWaking.value).toBe(false)
  })

  it('ağ hatasında da (CORS’suz geçiş yanıtı) yeniden dener', async () => {
    const server = fakeServer(['network', 200])
    const result = getCategories()
    await vi.advanceTimersByTimeAsync(3_000)
    await expect(result).resolves.toEqual([])
    expect(server.calls()).toBe(2)
  })

  it('ilk istek 90 sn, uyandıktan sonraki istekler 10 sn zaman aşımı kullanır', async () => {
    const server = fakeServer([200])
    await getCategories()
    await getCategories()
    expect(server.timeouts).toEqual([90_000, 10_000])
  })

  it('sunucu uyandıktan sonra ağ hatası yeniden denenmez', async () => {
    const server = fakeServer([200, 'network'])
    await getCategories()

    const failure = getCategories()
    await expect(failure).rejects.toMatchObject({ code: 'network_error' })
    expect(server.calls()).toBe(2)
  })

  it('4xx yanıtı sunucunun uyanık olduğunu gösterir ve yeniden denenmez', async () => {
    const server = fakeServer([404])
    const failure = getCategories()
    await expect(failure).rejects.toBeInstanceOf(ApiError)
    expect(server.calls()).toBe(1)
    expect(serverAwake.value).toBe(true)
  })

  it('90 sn içinde uyanmazsa vazgeçer, mesajı kaldırır ve network_error verir', async () => {
    const server = fakeServer(['network'])
    const failure = getCategories().catch((e: unknown) => e)

    await vi.advanceTimersByTimeAsync(100_000)
    const error = await failure

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).code).toBe('network_error')
    expect(serverWaking.value).toBe(false)
    expect(serverAwake.value).toBe(false)
    expect(server.calls()).toBeGreaterThan(20)
    expect(server.calls()).toBeLessThan(40)
  })
})
