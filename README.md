# rapid-quiz-frontend

**Rapid Quiz**, bir kategori seçip 20 soruyu her biri için yalnızca 5 saniyede cevapladığınız, sonunda adınızı yazıp skor tablosunda yerinizi gördüğünüz bir bilgi yarışmasıdır. Bu depo uygulamanın Vue 3 web arayüzüdür; API [rapid-quiz-backend](https://github.com/feyzaozkul45/rapid-quiz-backend) reposundadır.

**Canlı adres:** <https://king-prawn-app-ou5mt.ondigitalocean.app>

Gereksinimler ve ayrıntılı tasarım: [docs/PROJECT.md](docs/PROJECT.md) (frontend: Bölüm 9, API sözleşmesi: Bölüm 6).

## Teknolojiler ve özellikler

| Katman        | Teknoloji                                                                                                            |
| ------------- | -------------------------------------------------------------------------------------------------------------------- |
| Frontend      | Vue 3 (Composition API) · TypeScript · Vite · Pinia · Vue Router · Axios · Tailwind CSS 4 · vue-i18n (`tr`)          |
| Backend       | Python · Django 6 · Django REST Framework · drf-spectacular (OpenAPI, `/api/docs/`) · gunicorn · WhiteNoise · Docker |
| Veritabanı    | PostgreSQL 18 (Neon); yerelde `DATABASE_URL` yoksa SQLite                                                            |
| Test / kalite | pytest · Vitest · Playwright · ruff · ESLint · Prettier                                                              |
| Altyapı       | DigitalOcean (statik site) · Render (API) · Neon (veritabanı) · GitHub Actions                                       |

**Özellikler**

- **5 kategori** (Yapay Zeka, Bilgisayar Mühendisliği, Ülkeler, Fizik, Yazılım): her birinde 40 soruluk havuz, her quiz 20 soru; 4 seçenekli, tek doğru cevaplı, her soru ayrı ekranda.
- **5 saniye süre:** geri sayım görseldir, süre kontrolü sunucudadır (1 sn ağ toleransı). Cevaptan sonra ~1 sn doğru/yanlış gösterilir; geri dönüş ve cevap değiştirme yoktur.
- **Hile önleme:** doğru cevap soru yanıtlarında yoktur; puan ve süre yalnızca sunucuda hesaplanır; seçenek sırası oturum başına karışır; 300 ms'den hızlı cevap puansızdır; IP ve oturum bazlı hız sınırları vardır.
- **Tekrar önleme:** tarayıcı her kategoride son oynanan 40 soruyu saklar ve quiz başlatırken sunucuya gönderir; sunucu önce bunların dışından soru seçer.
- **Skor tablosu:** quiz sonunda isim (2–20 karakter, Türkçe dahil Unicode) bir kez kaydedilir; kategori başına ilk 10 gösterilir, kullanıcının satırı vurgulanır.
- **Mobil uyum:** 360 px'e kadar kullanılabilir arayüz; durumsuz JSON API sayesinde mobil uygulamaya hazır.
- **Ücretsiz altyapıya uyum:** uyuyan sunucu için "Sunucu uyanıyor" mesajı ve uzun ilk zaman aşımı; eski oturumların otomatik temizliği.
- **CI/CD:** GitHub Actions her push ve PR'da çalışır. Backend: ruff, migration kontrolü, PostgreSQL 18'e karşı pytest (Python 3.13/3.14), Docker imajı derleme ve duman testi. Frontend: lint, Vitest, build ve Playwright uçtan uca testi. Render, backend'i yalnızca CI başarılı olunca yayına alır (Auto-Deploy: _After CI Checks Pass_); DigitalOcean statik sitesi `main`'e her push'ta yayına çıkar.

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

| Ortam            | Değer                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Yerel geliştirme | `http://localhost:8000/api/v1` (değişken yoksa varsayılan budur)                  |
| Production       | `https://rapid-quiz-api-pqpc.onrender.com/api/v1` (derleme anında pakete gömülür) |

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
- **Tekrar önleme.** Her kategoride son oynanan 40 soru ID'si tarayıcının `localStorage`'ında (`rq:recent:<kategori>`) tutulur ve quiz başlatılırken `recent_question_ids` olarak sunucuya gönderilir; sunucu önce bu listenin dışından soru seçer. Depolama kapalıysa oyun yine çalışır, yalnızca tekrar önleme devre dışı kalır. Sayfa yenilenince kategori `sessionStorage`'daki oturum kaydından bulunur.
- Soruya 300 ms'den hızlı verilen cevap sunucuda puansız sayılır; ekranda "Çok hızlı! Bu cevap için puan verilmedi" görünür.
- Hata mesajları `error.code`'a göre `tr.json` içindeki `errors.*` anahtarlarından gelir.
- **Uyuyan sunucu (Render ücretsiz plan).** Backend 15 dk hareketsizlikte uyur, uyanması 30–60 sn sürer. Sunucu henüz hiç yanıt vermediyse istek zaman aşımı 90 sn'dir, ağ hatası/502/503/504'te 3 sn arayla yeniden denenir ve 3 sn içinde yanıt gelmezse "Sunucu uyanıyor, lütfen bekleyin" mesajı görünür. İlk yanıttan sonra normal 10 sn zaman aşımına dönülür. `VITE_COLD_START_TIMEOUT_MS` süreyi ayarlar; `0` korumayı kapatır (yerel `.env.example` bunu `0` yapar, böylece backend kapalıyken hata hemen görünür). Mantık `src/api/client.ts` ve `src/api/serverStatus.ts` içindedir.

## Deployment (DigitalOcean App Platform)

Frontend ücretsiz DigitalOcean statik sitesidir; backend Render'da, veritabanı Neon'dadır (kurulum: backend README ve [docs/PROJECT.md](docs/PROJECT.md) Bölüm 11). `.do/app.yaml` statik site tanımıdır (`catchall_document: index.html` history modu için zorunlu). `VITE_API_BASE_URL` değeri Render servisinin gerçek adresini göstermelidir (`rapid-quiz-api-pqpc.onrender.com`), sonra:

```bash
doctl apps spec validate .do/app.yaml
doctl apps create --spec .do/app.yaml
```

`VITE_API_BASE_URL` derleme anında gömülür; API alan adı değişirse yeniden derle. Backend'in `CORS_ALLOWED_ORIGINS` ayarına frontend alan adını eklemeyi unutma.
