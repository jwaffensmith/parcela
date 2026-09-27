import { expect, test, type Page } from '@playwright/test'
import { FEED, PAGE_SIZE, TOTAL_PAGES } from './sample-feed'

const WIDER_PAGE_SIZE = 25

const results = (page: Page) => page.getByRole('region', { name: 'Results' })

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(results(page).getByText(`Page 1 of ${TOTAL_PAGES}`, { exact: true })).toBeVisible()
})

test('previous is disabled on the first page', async ({ page }) => {
  await expect(results(page).getByRole('button', { name: /previous/i })).toBeDisabled()
})

test('next moves to the following page', async ({ page }) => {
  await results(page).getByRole('button', { name: /next/i }).click()

  await expect(results(page).getByText(`Page 2 of ${TOTAL_PAGES}`, { exact: true })).toBeVisible()
})

test('next is disabled on the last page', async ({ page }) => {
  for (let click = 0; click < TOTAL_PAGES - 1; click += 1) {
    await results(page).getByRole('button', { name: /next/i }).click()
  }

  await expect(results(page).getByRole('button', { name: /next/i })).toBeDisabled()
})

test('the last page holds only the remaining listings', async ({ page }) => {
  for (let click = 0; click < TOTAL_PAGES - 1; click += 1) {
    await results(page).getByRole('button', { name: /next/i }).click()
  }

  await expect(results(page).getByRole('listitem')).toHaveCount(
    FEED.available - (TOTAL_PAGES - 1) * PAGE_SIZE,
  )
})

test('changing the page size repaginates the results', async ({ page }) => {
  await page.getByLabel('Results per page').selectOption(String(WIDER_PAGE_SIZE))
  await page.getByRole('button', { name: 'Search' }).click()

  await expect(
    results(page).getByText(`Page 1 of ${Math.ceil(FEED.available / WIDER_PAGE_SIZE)}`, {
      exact: true,
    }),
  ).toBeVisible()
  await expect(results(page).getByRole('listitem')).toHaveCount(
    Math.min(WIDER_PAGE_SIZE, FEED.available),
  )
})

test('a new search returns the user to the first page', async ({ page }) => {
  await results(page).getByRole('button', { name: /next/i }).click()
  await expect(results(page).getByText(`Page 2 of ${TOTAL_PAGES}`, { exact: true })).toBeVisible()

  await page.getByLabel('City').fill('Springfield')
  await page.getByRole('button', { name: 'Search' }).click()

  await expect(
    results(page).getByText(`Page 1 of ${Math.ceil(FEED.inSpringfield / PAGE_SIZE)}`, {
      exact: true,
    }),
  ).toBeVisible()
})

test('previous opens up once past the first page', async ({ page }) => {
  await results(page).getByRole('button', { name: /next/i }).click()

  await expect(results(page).getByRole('button', { name: /previous/i })).toBeEnabled()
})
