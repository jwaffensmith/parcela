import { searchResponseSchema } from './schemas'
import type { SearchParams, SearchResponse } from './types'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const NETWORK_ERROR = 'Could not reach the Parcela API. Is the server running?'
export const UNKNOWN_ERROR = 'The search could not be completed. Please try again.'
const MALFORMED_RESPONSE = 'The server returned an unexpected response. Please try again.'

const hasDetail = (body: unknown): body is { detail: unknown } =>
  typeof body === 'object' && body !== null && 'detail' in body

export const buildSearchQuery = (params: SearchParams): string => {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      query.set(key, String(value))
    }
  })

  return query.toString()
}

export const errorMessageFrom = (body: unknown): string => {
  const detail = hasDetail(body) ? body.detail : undefined

  return typeof detail === 'string' && detail.length > 0 ? detail : UNKNOWN_ERROR
}

export const fetchListings = async (params: SearchParams): Promise<SearchResponse> => {
  const response = await fetch(`${API_BASE_URL}/search?${buildSearchQuery(params)}`).catch(
    () => {
      throw new Error(NETWORK_ERROR)
    },
  )

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null)
    throw new Error(errorMessageFrom(body))
  }

  const body: unknown = await response.json().catch(() => null)
  const parsed = searchResponseSchema.safeParse(body)
  if (!parsed.success) {
    throw new Error(MALFORMED_RESPONSE)
  }
  return parsed.data
}
