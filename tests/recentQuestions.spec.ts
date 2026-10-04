import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  MAX_RECENT,
  categoryOfSession,
  getRecentQuestionIds,
  rememberQuestion,
  rememberSessionCategory,
} from '@/utils/recentQuestions'

describe('recentQuestions', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('kategori başına ayrı tutulur ve eskiden yeniye sıralıdır', () => {
    rememberQuestion('fizik', 3)
    rememberQuestion('fizik', 1)
    rememberQuestion('yazilim', 9)
    expect(getRecentQuestionIds('fizik')).toEqual([3, 1])
    expect(getRecentQuestionIds('yazilim')).toEqual([9])
    expect(getRecentQuestionIds('hic-oynanmadi')).toEqual([])
  })

  it('tekrar görülen soru çoğalmaz, en sona taşınır', () => {
    for (const id of [1, 2, 3, 1]) rememberQuestion('fizik', id)
    expect(getRecentQuestionIds('fizik')).toEqual([2, 3, 1])
  })

  it(`en fazla ${MAX_RECENT} ID tutulur; en eskiler atılır`, () => {
    for (let id = 1; id <= 55; id++) rememberQuestion('fizik', id)
    const ids = getRecentQuestionIds('fizik')
    expect(ids).toHaveLength(MAX_RECENT)
    expect(ids[0]).toBe(16)
    expect(ids.at(-1)).toBe(55)
  })

  it('bozuk veya elle değiştirilmiş depolama içeriğini yok sayar', () => {
    localStorage.setItem('rq:recent:fizik', '{bozuk json')
    expect(getRecentQuestionIds('fizik')).toEqual([])
    localStorage.setItem('rq:recent:fizik', JSON.stringify({ a: 1 }))
    expect(getRecentQuestionIds('fizik')).toEqual([])
    localStorage.setItem('rq:recent:fizik', JSON.stringify([1, '2', -3, 0, 1.5, null, true, 7]))
    expect(getRecentQuestionIds('fizik')).toEqual([1, 7]) // yalnızca pozitif tam sayılar
    localStorage.setItem(
      'rq:recent:fizik',
      JSON.stringify(Array.from({ length: 80 }, (_, i) => i + 1)),
    )
    expect(getRecentQuestionIds('fizik')).toHaveLength(MAX_RECENT)
  })

  it('depolama kullanılamıyorsa hata fırlatmaz', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('erişim yok')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('kota dolu')
    })
    expect(() => rememberQuestion('fizik', 1)).not.toThrow()
    expect(getRecentQuestionIds('fizik')).toEqual([])
    expect(() => rememberSessionCategory('s1', 'fizik')).not.toThrow()
    expect(categoryOfSession('s1')).toBeNull()
  })

  it('oturumun kategorisi sessionStorage’da hatırlanır', () => {
    rememberSessionCategory('s1', 'fizik')
    expect(categoryOfSession('s1')).toBe('fizik')
    expect(categoryOfSession('s2')).toBeNull()
  })
})
