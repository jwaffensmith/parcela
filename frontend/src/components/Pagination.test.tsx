import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithTheme } from '../test/render'
import { Pagination } from './Pagination'

describe('Pagination', () => {
  it('tells the user where they are in the results', () => {
    renderWithTheme(<Pagination page={2} totalPages={5} onPageChange={vi.fn()} />)

    expect(screen.getByText('Page 2 of 5')).toBeInTheDocument()
  })

  it('cannot go back from the first page', () => {
    renderWithTheme(<Pagination page={1} totalPages={5} onPageChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled()
  })

  it('cannot go forward from the last page', () => {
    renderWithTheme(<Pagination page={5} totalPages={5} onPageChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })

  it('locks both directions when there is a single page', () => {
    renderWithTheme(<Pagination page={1} totalPages={1} onPageChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })

  it('moves forward one page at a time', async () => {
    const onPageChange = vi.fn()
    renderWithTheme(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />)

    await userEvent.click(screen.getByRole('button', { name: /next/i }))

    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('moves back one page at a time', async () => {
    const onPageChange = vi.fn()
    renderWithTheme(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />)

    await userEvent.click(screen.getByRole('button', { name: /previous/i }))

    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it('is exposed as a labeled navigation region', () => {
    renderWithTheme(<Pagination page={1} totalPages={2} onPageChange={vi.fn()} />)

    expect(screen.getByRole('navigation', { name: 'Results pages' })).toBeInTheDocument()
  })
})
