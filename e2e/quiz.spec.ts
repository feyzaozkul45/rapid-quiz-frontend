import { expect, test } from '@playwright/test'
import { mockApi } from './fakeApi'

test.beforeEach(async ({ page }) => {
  await mockApi(page)
})

test('tam bir quiz turu: kategori, 20 soru, sonuç, isim, skor tablosu', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('category-yapay-zeka').click()
  await expect(page).toHaveURL(/\/quiz\//)

  // Her tur: soru göster, ilk seçeneği (doğru) tıkla, geri bildirimi gör, sonrakine geç.
  for (let i = 1; i <= 20; i++) {
    await expect(page.getByTestId('progress')).toHaveText(`Soru ${i}/20`)
    const choices = page.getByTestId('choice')
    await expect(choices).toHaveCount(4)
    await choices.first().click()
    await expect(choices.first()).toHaveAttribute('data-state', 'correct')
    // İlk tıklamada kilitlenir.
    await expect(choices.nth(1)).toBeDisabled()
  }

  await expect(page).toHaveURL(/\/result\//)
  await expect(page.getByTestId('score')).toContainText('2000')
  await expect(page.getByTestId('correct-count')).toHaveText('20 / 20 doğru')

  // Geçersiz isim sunucuya gitmeden reddedilir.
  await page.getByTestId('name-input').fill('A')
  await page.getByTestId('name-submit').click()
  await expect(page.getByRole('alert')).toContainText('en az 2')

  await page.getByTestId('name-input').fill('  Ayşe  ')
  await page.getByTestId('name-submit').click()

  await expect(page).toHaveURL(/\/leaderboard\/yapay-zeka/)
  const mine = page.locator('[data-testid=leaderboard-row][data-me=true]')
  await expect(mine).toHaveCount(1)
  await expect(mine).toContainText('Ayşe')
  // 2000 puanla birinci sıra
  await expect(page.getByTestId('leaderboard-row').first()).toContainText('Ayşe')

  // Tekrar oyna yeni bir quiz başlatır.
  await page.getByTestId('play-again').click()
  await expect(page).toHaveURL(/\/quiz\//)
  await expect(page.getByTestId('progress')).toHaveText('Soru 1/20')
})

test('quiz sırasında geri tuşu onay ister; vazgeçilirse quiz sürer', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('category-fizik').click()
  await expect(page.getByTestId('progress')).toHaveText('Soru 1/20')

  page.once('dialog', (dialog) => dialog.dismiss())
  await page.goBack()
  await expect(page).toHaveURL(/\/quiz\//)
  await expect(page.getByTestId('progress')).toHaveText('Soru 1/20')
})

test('sayfa yenilenince aynı soru ile devam edilir', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('category-fizik').click()
  await expect(page.getByTestId('question-text')).toHaveText('Soru 1 metni?')
  await page.reload()
  await expect(page.getByTestId('question-text')).toHaveText('Soru 1 metni?')
})
