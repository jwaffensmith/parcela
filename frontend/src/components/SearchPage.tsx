import { useEffect, useRef, type ReactElement } from 'react'
import { Box, Button, Container, Flex, Heading, Spinner, Text } from 'theme-ui'
import { UNKNOWN_ERROR } from '../api'
import { useSearch } from '../hooks/useSearch'
import { focusRing } from '../theme'
import type { SearchFilters, SearchResponse } from '../types'
import { AlertIcon, ParcelaMark } from './Icons'
import { ListingList } from './ListingList'
import { Pagination } from './Pagination'
import { SearchForm } from './SearchForm'

const RESULTS_HEADING_ID = 'results-heading'
const EMPTY_MESSAGE = 'No listings match these filters'

const countLabel = (total: number): string =>
  `${total} ${total === 1 ? 'listing' : 'listings'} found`

const visuallyHidden = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
} as const

const RESULTS_STATE = {
  Loading: 'loading',
  Error: 'error',
  Empty: 'empty',
  Ready: 'ready',
} as const

type ResultsState =
  | { kind: typeof RESULTS_STATE.Loading }
  | { kind: typeof RESULTS_STATE.Error; message: string }
  | { kind: typeof RESULTS_STATE.Empty }
  | { kind: typeof RESULTS_STATE.Ready; data: SearchResponse }

interface SearchStatus {
  isSearching: boolean
  isError: boolean
  errorMessage: string | undefined
  data: SearchResponse | undefined
}

const resolveResultsState = ({
  isSearching,
  isError,
  errorMessage,
  data,
}: SearchStatus): ResultsState => {
  if (isSearching) {
    return { kind: RESULTS_STATE.Loading }
  }
  if (isError) {
    return {
      kind: RESULTS_STATE.Error,
      message: errorMessage ?? UNKNOWN_ERROR,
    }
  }
  if (data === undefined || data.total === 0) {
    return { kind: RESULTS_STATE.Empty }
  }
  return { kind: RESULTS_STATE.Ready, data }
}

const describeResults = (state: ResultsState): string => {
  switch (state.kind) {
    case RESULTS_STATE.Loading:
      return 'Loading listings'
    case RESULTS_STATE.Error:
      return state.message
    case RESULTS_STATE.Empty:
      return EMPTY_MESSAGE
    case RESULTS_STATE.Ready:
      return `${countLabel(state.data.total)}. Page ${state.data.page} of ${state.data.totalPages}.`
  }
}

export const SearchPage = (): ReactElement => {
  const { params, data, isSearching, isError, errorMessage, retry, submitFilters, clearFilters, goToPage } =
    useSearch()

  const resultsRef = useRef<HTMLDivElement>(null)
  const awaitingResultsFocus = useRef(false)

  // Keyed on isSearching (isFetching) rather than isPending: a search that hits the
  // query cache still refetches in the background, so the flag is always consumed
  // by its own search instead of leaking into a later pagination fetch.
  useEffect(() => {
    if (!isSearching && awaitingResultsFocus.current) {
      awaitingResultsFocus.current = false
      resultsRef.current?.focus()
    }
  }, [isSearching])

  const handleSearch = (filters: SearchFilters): void => {
    awaitingResultsFocus.current = true
    submitFilters(filters)
  }

  const handleClear = (): void => {
    awaitingResultsFocus.current = true
    clearFilters()
  }

  const resultsState = resolveResultsState({ isSearching, isError, errorMessage, data })

  return (
    <>
      <Box as="header" sx={{ backgroundColor: 'surface', borderBottom: 'hairline', borderColor: 'border', py: 5 }}>
        <Container>
          <Flex sx={{ alignItems: 'center', gap: 3 }}>
            <ParcelaMark />
            <Heading as="h1" sx={{ fontSize: 6 }}>
              Parcela
            </Heading>
          </Flex>
          <Text as="p" variant="muted" sx={{ mt: 2, mb: 0 }}>
            Search smarter, find your next home faster.
          </Text>
        </Container>
      </Box>

      <Container as="main" sx={{ py: 6 }}>
        <Heading as="h2" sx={{ fontSize: 4, mb: 4 }}>
          Filters
        </Heading>
        <SearchForm isSearching={isSearching} onSearch={handleSearch} onClear={handleClear} />

        <Box role="status" aria-live="polite" sx={visuallyHidden}>
          {describeResults(resultsState)}
        </Box>

        <Box
          as="section"
          ref={resultsRef}
          tabIndex={-1}
          aria-labelledby={RESULTS_HEADING_ID}
          sx={{ '&:focus-visible': { ...focusRing, outlineOffset: '4px' } }}
        >
          <Heading as="h2" id={RESULTS_HEADING_ID} sx={{ fontSize: 4, mb: 4 }}>
            Results
          </Heading>
          <ResultsBody
            state={resultsState}
            page={params.page}
            onPageChange={goToPage}
            onRetry={retry}
          />
        </Box>
      </Container>
    </>
  )
}

interface ResultsBodyProps {
  state: ResultsState
  page: number
  onPageChange: (page: number) => void
  onRetry: () => void
}

const ResultsBody = ({ state, page, onPageChange, onRetry }: ResultsBodyProps): ReactElement => {
  switch (state.kind) {
    case RESULTS_STATE.Loading:
      return (
        <Flex sx={{ alignItems: 'center', gap: 3, py: 7, justifyContent: 'center' }}>
          <Spinner aria-hidden="true" size={28} sx={{ color: 'primary' }} />
          <Text>Searching listings…</Text>
        </Flex>
      )

    case RESULTS_STATE.Error:
      return (
        <Box
          role="alert"
          sx={{
            backgroundColor: 'errorBackground',
            border: 'hairline',
            borderColor: 'error',
            borderRadius: 'md',
            color: 'errorText',
            p: 5,
          }}
        >
          <Flex sx={{ alignItems: 'flex-start', gap: 3 }}>
            <AlertIcon />
            <Box>
              <Text as="p" sx={{ fontWeight: 'semibold', m: 0 }}>
                Search failed
              </Text>
              <Text as="p" sx={{ m: 0, mt: 1 }}>
                {state.message}
              </Text>
              <Button type="button" variant="secondary" onClick={onRetry} sx={{ mt: 4 }}>
                Try again
              </Button>
            </Box>
          </Flex>
        </Box>
      )

    case RESULTS_STATE.Empty:
      return (
        <Box sx={{ backgroundColor: 'surface', border: 'hairline', borderColor: 'border', borderRadius: 'lg', p: 6, textAlign: 'center' }}>
          <Text as="p" sx={{ fontWeight: 'semibold', m: 0 }}>
            {EMPTY_MESSAGE}
          </Text>
          <Text as="p" variant="muted" sx={{ m: 0, mt: 2 }}>
            Try widening the price range or clearing the city and keyword.
          </Text>
        </Box>
      )

    case RESULTS_STATE.Ready:
      return (
        <>
          <Text as="p" variant="muted" sx={{ mt: 0, mb: 4 }}>
            {countLabel(state.data.total)}
          </Text>
          <ListingList listings={state.data.results} />
          <Pagination page={page} totalPages={state.data.totalPages} onPageChange={onPageChange} />
        </>
      )
  }
}
