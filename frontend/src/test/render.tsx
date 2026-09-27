import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderResult } from '@testing-library/react'
import type { ReactElement } from 'react'
import { ThemeUIProvider } from 'theme-ui'
import { theme } from '../theme'
import { LISTING_STATUS, type Listing, type SearchResponse } from '../types'

export const renderWithTheme = (ui: ReactElement): RenderResult =>
  render(<ThemeUIProvider theme={theme}>{ui}</ThemeUIProvider>)

export const buildListing = (overrides: Partial<Listing> = {}): Listing => {
  return {
    id: 'A1',
    source: 'MLS_A',
    address: '123 Main St, Apt 4B',
    city: 'Springfield',
    state: 'VA',
    zip: '22150',
    price: 450000,
    bedrooms: 2,
    bathrooms: 1.5,
    sqft: 980,
    latitude: 38.7893,
    longitude: -77.1873,
    listedDate: '2026-08-29',
    status: LISTING_STATUS.Active,
    description: 'Bright top-floor condo near shops and transit.',
    relevanceScore: 0.8234,
    duplicates: [],
    ...overrides,
  }
}

export const renderWithProviders = (ui: ReactElement): RenderResult => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeUIProvider theme={theme}>{ui}</ThemeUIProvider>
    </QueryClientProvider>,
  )
}

export const buildResponse = (overrides: Partial<SearchResponse> = {}): SearchResponse => {
  const results = overrides.results ?? [buildListing()]
  return {
    total: results.length,
    page: 1,
    pageSize: 10,
    totalPages: 1,
    ...overrides,
    results,
  }
}
