import { createI18n } from 'vue-i18n'
import tr from './locales/tr.json'

export const i18n = createI18n({
  legacy: false,
  locale: 'tr',
  fallbackLocale: 'tr',
  messages: { tr },
})

/** API hata koduna karşılık gelen kullanıcı mesajı; bilinmeyen kod için genel mesaj. */
export function errorMessage(code: string): string {
  const { t, te } = i18n.global
  return te(`errors.${code}`) ? t(`errors.${code}`) : t('errors.unknown')
}
