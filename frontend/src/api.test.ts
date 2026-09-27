import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildSearchQuery, errorMessageFrom, fetchListings } from './api'
import { buildResponse } from './test/render'
import type { SearchResponse } from './types'

const FALLBACK = 'The search could not be completed. Please try again.'
const MALFORMED = 'The server returned an unexpected response. Please try again.'

const respondWith = (body: BodyInit): void => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(body, { status: 200 }))),
  )
}

describe('buildSearchQuery', () => {
  it('always sends the pagination params', () => {
    expect(buildSearchQuery({ page: 2, pageSize: 25 })).toBe('page=2&pageSize=25')
  })

  it('includes the filters that were set', () => {
    const query = buildSearchQuery({ page: 1, pageSize: 10, city: 'Reston', minPrice: 300000 })

    expect(query).toContain('city=Reston')
    expect(query).toContain('minPrice=300000')
  })

  it('leaves out filters the user never filled in', () => {
    expect(buildSearchQuery({ page: 1, pageSize: 10, city: undefined })).not.toContain('city')
  })

  it('leaves out blank filters', () => {
    expect(buildSearchQuery({ page: 1, pageSize: 10, keyword: '' })).not.toContain('keyword')
  })

  it('keeps a zero filter, which is a real bound', () => {
    expect(buildSearchQuery({ page: 1, pageSize: 10, minPrice: 0 })).toContain('minPrice=0')
  })

  it('escapes characters that would break the query string', () => {
    expect(buildSearchQuery({ page: 1, pageSize: 10, city: 'New York' })).toContain(
      'city=New+York',
    )
  })
})

describe('errorMessageFrom', () => {
  it('surfaces the message the API sent', () => {
    expect(errorMessageFrom({ detail: 'pageSize must be >= 1' })).toBe('pageSize must be >= 1')
  })

  it('falls back when the body has no detail', () => {
    expect(errorMessageFrom({})).toBe(FALLBACK)
  })

  it('falls back when the response body could not be read', () => {
    expect(errorMessageFrom(null)).toBe(FALLBACK)
  })

  it('falls back when detail is not a string', () => {
    expect(errorMessageFrom({ detail: [{ msg: 'nope' }] })).toBe(FALLBACK)
  })

  it('falls back when detail is empty', () => {
    expect(errorMessageFrom({ detail: '' })).toBe(FALLBACK)
  })
})

describe('fetchListings', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the response once it matches the contract', async () => {
    const body = buildResponse()
    respondWith(JSON.stringify(body))

    await expect(fetchListings({ page: 1, pageSize: 10 })).resolves.toEqual(body)
  })

  it('rejects a response missing a field rather than rendering it', async () => {
    const truncated: Partial<SearchResponse> = buildResponse()
    delete truncated.totalPages
    respondWith(JSON.stringify(truncated))

    await expect(fetchListings({ page: 1, pageSize: 10 })).rejects.toThrow(MALFORMED)
  })

  it('rejects a listing of the wrong shape rather than rendering it', async () => {
    respondWith(JSON.stringify(buildResponse({ results: [{ id: 'A1' }] as never })))

    await expect(fetchListings({ page: 1, pageSize: 10 })).rejects.toThrow(MALFORMED)
  })

  it('rejects a body that is not JSON at all', async () => {
    respondWith('<html>gateway error</html>')

    await expect(fetchListings({ page: 1, pageSize: 10 })).rejects.toThrow(MALFORMED)
  })
})
