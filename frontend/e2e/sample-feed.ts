import { DEFAULT_PAGE_SIZE } from '../src/schemas'

/**
 * Facts about backend/data/sample_listings.json, stated once. Specs assert
 * against these names rather than repeating the numbers, so a change to the
 * dataset is one edit here instead of a hunt through the suite.
 */
export const FEED = {
  available: 35,
  sold: 4,
  inSpringfield: 3,
  withGarage: 6,
  cheapestPrice: 299_000,
} as const

export const PAGE_SIZE = Number(DEFAULT_PAGE_SIZE)

export const TOTAL_PAGES = Math.ceil(FEED.available / PAGE_SIZE)

export const listingsFound = (count: number): string =>
  `${count} listing${count === 1 ? '' : 's'} found`
