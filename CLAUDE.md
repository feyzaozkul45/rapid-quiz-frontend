# rapid-quiz-frontend

Proje gereksinimleri: docs/PROJECT.md (frontend: Bölüm 9, API sözleşmesi: Bölüm 6)
Backend reposu: ../RapidQuizBackend

## Kurallar

- Vue 3 (Composition API, `<script setup>`) + TypeScript + Vite; Pinia, Vue Router, Axios, Tailwind, vue-i18n
- Tüm HTTP çağrıları yalnızca `src/api/` altından yapılır; ekranlar axios'u doğrudan kullanmaz
- Süre ve puan kuralları sunucudadır: geri sayım yalnızca görseldir, puan/doğru cevap istemcide hesaplanmaz
- Kullanıcıya görünen tüm metinler `src/locales/tr.json`'dadır; hata mesajları `errors.<error.code>` anahtarıyla gelir
- Backend hata formatı: `{ error: { code, message, details? } }` → `ApiError`; kullanıcıya `errorMessage(code)` ile gösterilir
- Bağımlılık eklemeden önce gerçekten gerekli mi düşün (bağlantı yavaş, paketler minimumda tutulur)
- Her yeni özellik Vitest testiyle gelir

## Komutlar

- `npm run dev` — geliştirme sunucusu (http://localhost:5173)
- `npm test` — Vitest birim testleri
- `npm run build` — `vue-tsc` tip denetimi + üretim derlemesi
- `npm run lint` — ESLint + Prettier kontrolü (`npm run format` düzeltir)
- `npm run test:e2e` — Playwright; **yalnızca CI'da çalışır** (tarayıcılar yerelde indirilmez, API testte taklit edilir)

## Notlar

- Windows'ta PATH'e Node eklenmemiş kabuklarda: `C:\Program Files\nodejs` yolunu PATH'e ekle
- `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` ile `npm install` yap; `npx playwright install` yerelde çalıştırma
