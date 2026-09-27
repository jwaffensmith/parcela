import type { ReactElement } from 'react'
import { Button, Flex, Text } from 'theme-ui'
import { FIRST_PAGE } from '../types'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

const pageButtonSx = {
  px: [3, 5],
  py: [2, 3],
  fontSize: [1, 2],
  minWidth: ['104px', '132px'],
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 1,
}

export const Pagination = ({ page, totalPages, onPageChange }: PaginationProps): ReactElement => {
  const isFirstPage = page <= FIRST_PAGE
  const isLastPage = page >= totalPages

  return (
    <Flex
      as="nav"
      aria-label="Results pages"
      sx={{ alignItems: 'center', justifyContent: 'center', gap: [3, 4], mt: 5 }}
    >
      <Button
        type="button"
        variant="secondary"
        disabled={isFirstPage}
        aria-disabled={isFirstPage}
        onClick={() => onPageChange(page - 1)}
        sx={pageButtonSx}
      >
        <ChevronIcon direction="left" /> Previous
      </Button>

      {/* Not a live region — the page's status region already announces page changes. */}
      <Text sx={{ fontSize: 1, fontWeight: 'medium' }}>
        Page {page} of {totalPages}
      </Text>

      <Button
        type="button"
        variant="secondary"
        disabled={isLastPage}
        aria-disabled={isLastPage}
        onClick={() => onPageChange(page + 1)}
        sx={pageButtonSx}
      >
        Next <ChevronIcon direction="right" />
      </Button>
    </Flex>
  )
}

interface ChevronIconProps {
  direction: 'left' | 'right'
}

const ChevronIcon = ({ direction }: ChevronIconProps): ReactElement => {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={direction === 'left' ? 'M10 3 5 8l5 5' : 'M6 3l5 5-5 5'} />
    </svg>
  )
}
