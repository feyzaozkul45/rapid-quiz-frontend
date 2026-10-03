# rapid-quiz-frontend

Rapid Quiz'in Vue 3 web istemcisi: kategori seç, 20 soruyu her biri için 5 saniyede cevapla, adını yaz, skor tablosunda yerini gör. Gereksinimler: [docs/PROJECT.md](docs/PROJECT.md) (Bölüm 9 ve API sözleşmesi Bölüm 6).

**Teknoloji:** Vue 3 (Composition API) · TypeScript · Vite · Pinia · Vue Router · Axios · Tailwind CSS 4 · vue-i18n (`tr`) · Vitest · Playwright · ESLint · Prettier

## Gereksinimler

- Node.js 22 veya üstü (geliştirme v24 ile yapıldı)
- Çalışan bir backend: [rapid-quiz-backend](../RapidQuizBackend)

## Hızlı başlangıç

### 1. Backend'i başlat (Docker'sız, SQLite)

Backend reposunda (`DATABASE_URL` tanımlı değilse SQLite kullanılır):

```powershell
cd ..\RapidQuizBackend
.venv\Scripts\python manage.py migrate
.venv\Scripts\python manage.py createcachetable
.venv\Scripts\python manage.py seed_questions
.venv\Scripts\python manage.py runserver 8000
```

Docker varsa `docker compose up -d` yeterlidir. Sağlık kontrolü: <http://localhost:8000/api/v1/health/>

### 2. Frontend'i başlat

```powershell
cd ..\RapidQuizFrontend
copy .env.example .env      # ilk seferde
npm install
npm run dev
```

Uygulama <http://localhost:5173> adresinde açılır.

> `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` ile `npm install` yapmak, yavaş bağlantıda Playwright tarayıcılarının indirilmemesini garanti eder (`npm install` zaten tarayıcı indirmez; yalnızca `npx playwright install` indirir).

## Backend'e bağlanma

API adresi `VITE_API_BASE_URL` ortam değişkeniyle verilir (`.env` dosyası; örnek: `.env.example`):

| Ortam            | Değer                                                                      |
| ---------------- | -------------------------------------------------------------------------- |
| Yerel geliştirme | `http://localhost:8000/api/v1` (değişken yoksa varsayılan budur)           |
| Production       | `https://api.rapidquiz.example.com/api/v1` (derleme anında pakete gömülür) |

Tarayıcıdan farklı bir origin'e istek gittiği için backend'in `CORS_ALLOWED_ORIGINS` ayarında frontend adresi bulunmalıdır. Geliştirmede bu `http://localhost:5173`'tür (backend `.env.example` varsayılanı); portu değiştirirsen backend'de de güncelle. Aksi halde tarayıcı konsolunda CORS hatası ve ekranda "Sunucuya ulaşılamadı" mesajı görürsün.

## Komutlar

| Komut              | Ne yapar                                                     |
| ------------------ | ------------------------------------------------------------ |
| `npm run dev`      | Geliştirme sunucusu (HMR)                                    |
| `npm test`         | Vitest birim testleri                                        |
| `npm run build`    | `vue-tsc` tip denetimi + `dist/` derlemesi                   |
| `npm run preview`  | Derlenen paketi yerelde sunar                                |
| `npm run lint`     | ESLint + Prettier kontrolü                                   |
| `npm run format`   | Prettier ile biçimlendir                                     |
| `npm run test:e2e` | Playwright uçtan uca testleri (**yalnızca CI**, aşağıya bak) |

## Testler

- **Birim (Vitest + Vue Test Utils):** geri sayım (`useCountdown`), quiz store akışı (kilitleme, süre aşımı, `question_mismatch` senkronu, bitiş), bileşenler, hata dönüşümü ve isim kuralları. Yerelde çalışır: `npm test`.
- **Uçtan uca (Playwright):** `e2e/quiz.spec.ts` tam bir quiz turunu (kategori → 20 soru → sonuç → isim → skor tablosu), geri tuşu onayını ve sayfa yenilemeyi dener; masaüstü ve 360 px mobil görünümde. API, `e2e/fakeApi.ts` içindeki sahte sunucuyla taklit edilir; backend gerekmez.
  Tarayıcılar yerelde indirilmediği için bu testler **yalnızca GitHub Actions'ta** çalışır (`.github/workflows/ci.yml` → `e2e` işi `npx playwright install --with-deps chromium` yapar). İnternet hızlıysa yerelde denemek için: `npx playwright install chromium` ardından `npm run test:e2e`.

## Yapı

```
src/
├── api/          # axios istemcisi (client.ts), uç noktalar (endpoints.ts), tipler; tek HTTP katmanı
├── stores/       # quizStore: oturum, mevcut soru, geri bildirim, puan
├── views/        # Home, Quiz, Result, Leaderboard
├── components/   # CategoryCard, QuestionCard, ChoiceButton, CountdownTimer, NameForm, LeaderboardTable
├── composables/  # useCountdown
├── utils/        # playerName (isim kuralının istemci aynası)
├── locales/      # tr.json (tüm arayüz ve hata metinleri)
└── router/
```

## Davranış notları

- **Süre ve puan sunucudadır.** Geri sayım yalnızca görseldir; süre dolunca `choice_id: null` gönderilir. Sayfa yenilenirse sunucu aynı soruyu kalan süresiyle (`remaining_seconds`) döner.
- Cevap butonları ilk tıklamada kilitlenir. Cevaptan sonra ~1 sn doğru/yanlış gösterilir; sonraki soru bu süre dolunca istenir, yani gösterim 5 saniyeye dahil değildir.
- Quiz sırasında tarayıcı geri tuşu/ana sayfa bağlantısı onay penceresi açar. Önceki soruya dönülemez.
- Klavye: quiz ekranında 1–4 tuşları seçenekleri işaretler.
- Hata mesajları `error.code`'a göre `tr.json` içindeki `errors.*` anahtarlarından gelir.

## Deployment (DigitalOcean App Platform)

`.do/app.yaml` statik site tanımıdır (`catchall_document: index.html` history modu için zorunlu). `<github-kullanıcı>` ve alan adlarını doldur, sonra:

```bash
doctl apps spec validate .do/app.yaml
doctl apps create --spec .do/app.yaml
```

`VITE_API_BASE_URL` derleme anında gömülür; API alan adı değişirse yeniden derle. Backend'in `CORS_ALLOWED_ORIGINS` ayarına frontend alan adını eklemeyi unutma.
