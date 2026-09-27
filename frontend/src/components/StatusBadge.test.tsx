import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithTheme } from '../test/render'
import { LISTING_STATUS } from '../types'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it('names an active listing in words, not color alone', () => {
    renderWithTheme(<StatusBadge status={LISTING_STATUS.Active} />)

    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('names a pending listing', () => {
    renderWithTheme(<StatusBadge status={LISTING_STATUS.Pending} />)

    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('names a sold listing', () => {
    renderWithTheme(<StatusBadge status={LISTING_STATUS.Sold} />)

    expect(screen.getByText('Sold')).toBeInTheDocument()
  })

  it('gives each status its own color', () => {
    const { unmount } = renderWithTheme(<StatusBadge status={LISTING_STATUS.Active} />)
    const activeColor = getComputedStyle(screen.getByText('Active')).backgroundColor
    unmount()

    renderWithTheme(<StatusBadge status={LISTING_STATUS.Sold} />)
    const soldColor = getComputedStyle(screen.getByText('Sold')).backgroundColor

    expect(activeColor).not.toBe(soldColor)
  })
})
