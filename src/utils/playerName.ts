const NAME_PATTERN = /^[\p{L}\p{N} -]+$/u

export const NAME_MIN = 2
export const NAME_MAX = 20

/** Baştaki/sondaki boşlukları kırpar, art arda boşlukları teke indirir (backend ile aynı kural). */
export function normalizeName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ')
}

export type NameProblem = 'too_short' | 'too_long' | 'invalid_chars'

/** Sunucu kuralının istemci aynası; asıl doğrulama sunucudadır. */
export function validateName(raw: string): NameProblem | null {
  const name = normalizeName(raw)
  const length = [...name].length
  if (length < NAME_MIN) return 'too_short'
  if (length > NAME_MAX) return 'too_long'
  if (!NAME_PATTERN.test(name)) return 'invalid_chars'
  return null
}
