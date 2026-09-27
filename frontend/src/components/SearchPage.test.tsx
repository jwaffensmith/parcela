import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildListing, buildResponse, renderWithProviders } from '../test/render'
import type { SearchResponse } from '../types'
import { SearchPage } from './SearchPage'

const respondWith = (body: SearchResponse): void => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))),
  )
}

const failWith = (status: number, detail: string): void => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(JSON.stringify({ detail }), { status }))),
  )
}

const requestedUrls = (): string[] =>
  vi.mocked(fetch).mock.calls.map(([input]) => {
    if (typeof input === 'string') return input
    return input instanceof URL ? input.href : input.url
  })

beforeEach(() => {
  respondWith(buildResponse())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('SearchPage', () => {
  it('loads results on mount without the user searching first', async () => {
    renderWithProviders(<SearchPage />)

    expect(await screen.findByRole('heading', { name: '123 Main St, Apt 4B' })).toBeInTheDocument()
  })

  it('asks the API for the first page before any filters are chosen', async () => {
    renderWithProviders(<SearchPage />)

    await screen.findByRole('heading', { name: '123 Main St, Apt 4B' })
    expect(requestedUrls()[0]).toContain('page=1')
  })

  it('shows a loading state while the first request is in flight', () => {
    renderWithProviders(<SearchPage />)

    expect(screen.getByText('Searching listings…')).toBeInTheDocument()
  })

  it('reports how many properties matched', async () => {
    respondWith(buildResponse({ results: [buildListing({ id: 'A1' }), buildListing({ id: 'A2' })] }))
    renderWithProviders(<SearchPage />)

    expect(await screen.findByText('2 listings found')).toBeInTheDocument()
  })

  it('uses the singular when one property matched', async () => {
    renderWithProviders(<SearchPage />)

    expect(await screen.findByText('1 listing found')).toBeInTheDocument()
  })

  it('shows an empty state rather than an error when nothing matched', async () => {
    respondWith(buildResponse({ results: [], total: 0, totalPages: 1 }))
    renderWithProviders(<SearchPage />)

    // Scoped, because the polite live region announces the same words.
    const results = within(await screen.findByRole('region', { name: 'Results' }))
    expect(await results.findByText('No listings match these filters')).toBeInTheDocument()
  })

  it('surfaces the message the API sent when it rejects the request', async () => {
    failWith(400, 'minPrice must not exceed maxPrice')
    renderWithProviders(<SearchPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent('minPrice must not exceed maxPrice')
  })

  it('reports a network failure differently from an API error', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('boom'))))
    renderWithProviders(<SearchPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach the Parcela API')
  })

  it('re-queries with the submitted filters', async () => {
    renderWithProviders(<SearchPage />)
    await screen.findByRole('heading', { name: '123 Main St, Apt 4B' })

    await userEvent.type(screen.getByLabelText('City'), 'Reston')
    await userEvent.click(screen.getByRole('button', { name: 'Search' }))

    await waitFor(() => {
      expect(requestedUrls().at(-1)).toContain('city=Reston')
    })
  })

  it('asks the server again when the same filters are resubmitted', async () => {
    renderWithProviders(<SearchPage />)
    await screen.findByRole('heading', { name: '123 Main St, Apt 4B' })
    const callsBefore = requestedUrls().length

    await userEvent.click(screen.getByRole('button', { name: 'Search' }))

    await waitFor(() => {
      expect(requestedUrls()).toHaveLength(callsBefore + 1)
    })
  })

  it('does not call the API when the form itself is invalid', async () => {
    renderWithProviders(<SearchPage />)
    await screen.findByRole('heading', { name: '123 Main St, Apt 4B' })
    const callsBefore = requestedUrls().length

    await userEvent.type(screen.getByLabelText('Min price'), '900000')
    await userEvent.type(screen.getByLabelText('Max price'), '100000')
    await userEvent.click(screen.getByRole('button', { name: 'Search' }))

    await screen.findByText('Min price must not exceed max price')
    expect(requestedUrls()).toHaveLength(callsBefore)
  })

  it('asks for the next page when the user pages forward', async () => {
    respondWith(buildResponse({ total: 20, totalPages: 2 }))
    renderWithProviders(<SearchPage />)
    await screen.findByRole('heading', { name: '123 Main St, Apt 4B' })

    await userEvent.click(screen.getByRole('button', { name: /next/i }))

    await waitFor(() => {
      expect(requestedUrls().at(-1)).toContain('page=2')
    })
  })

  it('returns to the first page when new filters are submitted', async () => {
    respondWith(buildResponse({ total: 20, totalPages: 2 }))
    renderWithProviders(<SearchPage />)
    await screen.findByRole('heading', { name: '123 Main St, Apt 4B' })
    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    await waitFor(() => expect(requestedUrls().at(-1)).toContain('page=2'))

    await userEvent.type(screen.getByLabelText('City'), 'Reston')
    await userEvent.click(screen.getByRole('button', { name: 'Search' }))

    await waitFor(() => {
      expect(requestedUrls().at(-1)).toContain('page=1')
    })
  })

  it('drops the filters when the form is cleared', async () => {
    renderWithProviders(<SearchPage />)
    await screen.findByRole('heading', { name: '123 Main St, Apt 4B' })
    await userEvent.type(screen.getByLabelText('City'), 'Reston')
    await userEvent.click(screen.getByRole('button', { name: 'Search' }))
    await waitFor(() => expect(requestedUrls().at(-1)).toContain('city=Reston'))

    await userEvent.click(screen.getByRole('button', { name: 'Clear' }))

    await waitFor(() => {
      expect(requestedUrls().at(-1)).not.toContain('city=')
    })
  })

  it('shows the other feed when a property was listed twice', async () => {
    respondWith(
      buildResponse({
        results: [buildListing({ duplicates: [{ source: 'MLS_B', id: 'B7', price: 452000 }] })],
      }),
    )
    renderWithProviders(<SearchPage />)

    expect(await screen.findByText('Also listed on MLS_B at $452,000')).toBeInTheDocument()
  })
})
