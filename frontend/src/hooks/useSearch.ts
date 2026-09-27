import { useQuery } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { fetchListings } from '../api'
import { DEFAULT_PAGE_SIZE } from '../schemas'
import { FIRST_PAGE, type SearchFilters, type SearchParams, type SearchResponse } from '../types'

const INITIAL_PARAMS: SearchParams = {
  page: FIRST_PAGE,
  pageSize: Number(DEFAULT_PAGE_SIZE),
}

const isSameSearch = (a: SearchParams, b: SearchParams): boolean => {
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])] as (keyof SearchParams)[]
  return keys.every((key) => a[key] === b[key])
}

export interface UseSearchResult {
  params: SearchParams
  data: SearchResponse | undefined
  isSearching: boolean
  isError: boolean
  errorMessage: string | undefined
  retry: () => void
  submitFilters: (filters: SearchFilters) => void
  clearFilters: () => void
  goToPage: (page: number) => void
}

export const useSearch = (): UseSearchResult => {
  const [params, setParams] = useState<SearchParams>(INITIAL_PARAMS)

  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['listings', params],
    queryFn: () => fetchListings(params),
    // Results change only when the user acts, so every fetch is user-initiated
    // and isFetching can drive the searching state without focus-driven noise.
    refetchOnWindowFocus: false,
  })

  const retry = useCallback(() => {
    void refetch()
  }, [refetch])

  const submit = useCallback(
    (next: SearchParams) => {
      // Identical params leave the query key unchanged, so refetch explicitly —
      // pressing Search must always ask the server again.
      if (isSameSearch(params, next)) {
        void refetch()
      } else {
        setParams(next)
      }
    },
    [params, refetch],
  )

  const submitFilters = useCallback(
    (filters: SearchFilters) => {
      submit({ ...filters, page: FIRST_PAGE })
    },
    [submit],
  )

  const clearFilters = useCallback(() => {
    submit(INITIAL_PARAMS)
  }, [submit])

  const goToPage = useCallback((page: number) => {
    setParams((current) => ({ ...current, page }))
  }, [])

  return {
    params,
    data,
    // isFetching, not isPending: a search resolved from the cache still refetches
    // in the background, and the UI should treat that as searching too.
    isSearching: isFetching,
    isError,
    errorMessage: error?.message,
    retry,
    submitFilters,
    clearFilters,
    goToPage,
  }
}
