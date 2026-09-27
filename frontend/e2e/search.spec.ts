import { expect, test, type Page } from '@playwright/test'
import { FEED, listingsFound } from './sample-feed'

const results = (page: Page) => page.getByRole('region', { name: 'Results' })

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('the whole feed loads without the user searching first', async ({ page }) => {
  await expect(results(page).getByText(listingsFound(FEED.available), { exact: true })).toBeVisible()
})

test('a listing card shows the details a buyer scans for', async ({ page }) => {
  const card = results(page).getByRole('listitem').first()

  await expect(card.getByRole('heading', { level: 3 })).toBeVisible()
  await expect(card.getByText(/^\$[\d,]+$/)).toBeVisible()
  await expect(card.getByText(/\d+ bd · [\d.]+ ba/)).toBeVisible()
  await expect(card.getByText('Relevance')).toBeVisible()
})

test('filtering by city narrows the results', async ({ page }) => {
  await page.getByLabel('City').fill('Springfield')
  await page.getByRole('button', { name: 'Search' }).click()

  await expect(
    results(page).getByText(listingsFound(FEED.inSpringfield), { exact: true }),
  ).toBeVisible()
})

test('a keyword searches the listing description', async ({ page }) => {
  await page.getByLabel('Keyword').fill('garage')
  await page.getByRole('button', { name: 'Search' }).click()

  await expect(results(page).getByRole('listitem')).toHaveCount(FEED.withGarage)
})

test('the target budget reorders the results', async ({ page }) => {
  await page.getByLabel('Target budget').fill(String(FEED.cheapestPrice))
  await page.getByRole('button', { name: 'Search' }).click()

  await expect(results(page).getByRole('listitem').first()).toContainText(
    `$${FEED.cheapestPrice.toLocaleString('en-US')}`,
  )
})

test('the status filter reveals sold listings', async ({ page }) => {
  await page.getByLabel('Status').selectOption({ label: 'Sold' })
  await page.getByRole('button', { name: 'Search' }).click()

  await expect(results(page).getByText(listingsFound(FEED.sold), { exact: true })).toBeVisible()
})

test('a city with no listings shows an empty state, not an error', async ({ page }) => {
  await page.getByLabel('City').fill('Atlantis')
  await page.getByRole('button', { name: 'Search' }).click()

  await expect(
    results(page).getByText('No listings match these filters', { exact: true }),
  ).toBeVisible()
})

test('an inverted price range is reported on the field', async ({ page }) => {
  await page.getByLabel('Min price').fill('900000')
  await page.getByLabel('Max price').fill('100000')
  await page.getByRole('button', { name: 'Search' }).click()

  await expect(page.getByText('Min price must not exceed max price')).toBeVisible()
})

test('clearing restores the unfiltered results', async ({ page }) => {
  await page.getByLabel('City').fill('Springfield')
  await page.getByRole('button', { name: 'Search' }).click()
  await expect(
    results(page).getByText(listingsFound(FEED.inSpringfield), { exact: true }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Clear' }).click()

  await expect(page.getByLabel('City')).toHaveValue('')
  await expect(results(page).getByText(listingsFound(FEED.available), { exact: true })).toBeVisible()
})

test('the API error message is shown when the server rejects the request', async ({ page }) => {
  await page.route('**/search?*', (route) =>
    route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'pageSize must be <= 100' }),
    }),
  )
  await page.reload()

  await expect(page.getByRole('alert')).toContainText('pageSize must be <= 100')
})

test('an unreachable API is reported rather than failing silently', async ({ page }) => {
  await page.route('**/search?*', (route) => route.abort())
  await page.reload()

  await expect(page.getByRole('alert')).toContainText('Could not reach the Parcela API')
})

test('a failed search can be retried once the API is back', async ({ page }) => {
  await page.route('**/search?*', (route) => route.abort())
  await page.reload()
  await expect(page.getByRole('alert')).toBeVisible()

  await page.unroute('**/search?*')
  await page.getByRole('button', { name: 'Try again' }).click()

  await expect(results(page).getByText(listingsFound(FEED.available), { exact: true })).toBeVisible()
})
