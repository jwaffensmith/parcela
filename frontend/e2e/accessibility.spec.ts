import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { FEED, listingsFound } from './sample-feed'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

const scan = (page: Page) => new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()

const results = (page: Page) => page.getByRole('region', { name: 'Results' })

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('the results page has no accessibility violations', async ({ page }) => {
  await expect(results(page).getByText(listingsFound(FEED.available), { exact: true })).toBeVisible()

  const { violations } = await scan(page)

  expect(violations).toEqual([])
})

test('the empty state has no accessibility violations', async ({ page }) => {
  await page.getByLabel('City').fill('Atlantis')
  await page.getByRole('button', { name: 'Search' }).click()
  await expect(
    results(page).getByText('No listings match these filters', { exact: true }),
  ).toBeVisible()

  const { violations } = await scan(page)

  expect(violations).toEqual([])
})

test('the invalid-form state has no accessibility violations', async ({ page }) => {
  await page.getByLabel('Min price').fill('900000')
  await page.getByLabel('Max price').fill('100000')
  await page.getByRole('button', { name: 'Search' }).click()
  await expect(page.getByText('Min price must not exceed max price')).toBeVisible()

  const { violations } = await scan(page)

  expect(violations).toEqual([])
})

test('the error state has no accessibility violations', async ({ page }) => {
  await page.route('**/search?*', (route) => route.abort())
  await page.reload()
  await expect(page.getByRole('alert')).toBeVisible()

  const { violations } = await scan(page)

  expect(violations).toEqual([])
})

test('headings step down one level at a time', async ({ page }) => {
  await expect(results(page).getByRole('listitem').first()).toBeVisible()

  const levels = await page
    .locator('h1, h2, h3, h4, h5, h6')
    .evaluateAll((nodes) => nodes.map((node) => Number(node.tagName[1])))

  expect(levels[0]).toBe(1)
  levels.slice(1).forEach((level, index) => {
    expect(level - (levels[index] ?? 0)).toBeLessThanOrEqual(1)
  })
})

test('every filter input is reachable by keyboard in visual order', async ({ page }) => {
  const labels = [
    'Min price',
    'Max price',
    'Min bedrooms',
    'Target budget',
    'City',
    'Keyword',
    'Status',
    'Results per page',
  ]

  await page.getByLabel(labels[0]!).focus()
  for (const label of labels.slice(1)) {
    await page.keyboard.press('Tab')
    await expect(page.getByLabel(label)).toBeFocused()
  }
})

test('the form submits from the keyboard', async ({ page }) => {
  await page.getByLabel('City').fill('Springfield')
  await page.getByLabel('City').press('Enter')

  await expect(
    results(page).getByText(listingsFound(FEED.inSpringfield), { exact: true }),
  ).toBeVisible()
})

test('focus moves to the results after a search', async ({ page }) => {
  await page.getByLabel('City').fill('Springfield')
  await page.getByRole('button', { name: 'Search' }).click()
  await expect(
    results(page).getByText(listingsFound(FEED.inSpringfield), { exact: true }),
  ).toBeVisible()

  await expect(results(page)).toBeFocused()
})

test('the result count is announced to screen readers', async ({ page }) => {
  await page.getByLabel('City').fill('Springfield')
  await page.getByRole('button', { name: 'Search' }).click()

  await expect(page.getByRole('status')).toContainText(listingsFound(FEED.inSpringfield))
})
