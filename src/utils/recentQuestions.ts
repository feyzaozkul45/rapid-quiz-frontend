/**
 * Her kategoride son oynanan soru ID'leri (eskiden yeniye). Quiz başlatılırken sunucuya gönderilir;
 * sunucu önce bunların dışından soru seçer, böylece art arda oynayan aynı soruları görmez.
 * Depolama kapalı/dolu olabilir: tüm erişimler sessizce başarısız olur (oyun yine çalışır).
 */

/** Sunucunun kabul ettiği en fazla ID sayısı (backend `MAX_RECENT_QUESTION_IDS`). */
export const MAX_RECENT = 40

const RECENT_PREFIX = 'rq:recent:'
const SESSION_CATEGORY_PREFIX = 'rq:session-category:'

function read(storage: () => Storage, key: string): string | null {
  try {
    return storage().getItem(key)
  } catch {
    return null
  }
}

function write(storage: () => Storage, key: string, value: string) {
  try {
    storage().setItem(key, value)
  } catch {
    // Özel pencere / kota dolu: önemli değil.
  }
}

export function getRecentQuestionIds(category: string): number[] {
  const raw = read(() => localStorage, RECENT_PREFIX + category)
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const ids = parsed.filter((v): v is number => Number.isSafeInteger(v) && v > 0)
    return ids.slice(-MAX_RECENT)
  } catch {
    return []
  }
}

/** Soruyu listenin sonuna (en yeni) ekler; tekrar görülen soru en sona taşınır, liste 40 ile sınırlıdır. */
export function rememberQuestion(category: string, questionId: number) {
  const ids = getRecentQuestionIds(category).filter((id) => id !== questionId)
  ids.push(questionId)
  write(() => localStorage, RECENT_PREFIX + category, JSON.stringify(ids.slice(-MAX_RECENT)))
}

/** Sayfa yenilenince oturumun kategorisi bilinsin diye (URL'de yalnızca oturum ID'si var). */
export function rememberSessionCategory(sessionId: string, category: string) {
  write(() => sessionStorage, SESSION_CATEGORY_PREFIX + sessionId, category)
}

export function categoryOfSession(sessionId: string): string | null {
  return read(() => sessionStorage, SESSION_CATEGORY_PREFIX + sessionId)
}
