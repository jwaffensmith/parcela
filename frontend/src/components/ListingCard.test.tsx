import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { buildListing, renderWithTheme } from '../test/render'
import { ListingCard } from './ListingCard'

describe('ListingCard', () => {
  it('shows the street address as the card heading', () => {
    renderWithTheme(<ListingCard listing={buildListing()} />)

    expect(screen.getByRole('heading', { name: '123 Main St, Apt 4B' })).toBeInTheDocument()
  })

  it('shows the price as formatted dollars', () => {
    renderWithTheme(<ListingCard listing={buildListing({ price: 525000 })} />)

    expect(screen.getByText('$525,000')).toBeInTheDocument()
  })

  it('shows bedrooms, bathrooms and floor area together', () => {
    renderWithTheme(<ListingCard listing={buildListing()} />)

    expect(screen.getByText('2 bd · 1.5 ba · 980 sqft')).toBeInTheDocument()
  })

  it('shows the relevance score', () => {
    renderWithTheme(<ListingCard listing={buildListing({ relevanceScore: 0.8234 })} />)

    expect(screen.getByText('82%')).toBeInTheDocument()
  })

  it('shows which feed the listing came from', () => {
    renderWithTheme(<ListingCard listing={buildListing({ source: 'MLS_B' })} />)

    expect(screen.getByText(/MLS_B/)).toBeInTheDocument()
  })

  it('names the other feed when the same property was listed twice', () => {
    renderWithTheme(
      <ListingCard
        listing={buildListing({
          duplicates: [{ source: 'MLS_B', id: 'B8', price: 527500 }],
        })}
      />,
    )

    expect(screen.getByText('Also listed on MLS_B at $527,500')).toBeInTheDocument()
  })

  it('says nothing about other feeds when the property was listed once', () => {
    renderWithTheme(<ListingCard listing={buildListing({ duplicates: [] })} />)

    expect(screen.queryByText(/Also listed on/)).not.toBeInTheDocument()
  })

  it('shows when the listing went on the market', () => {
    renderWithTheme(<ListingCard listing={buildListing({ listedDate: '2026-08-29' })} />)

    expect(screen.getByText('Listed Aug 29, 2026')).toBeInTheDocument()
  })

  it('shows the description', () => {
    renderWithTheme(<ListingCard listing={buildListing({ description: 'Fenced yard.' })} />)

    expect(screen.getByText('Fenced yard.')).toBeInTheDocument()
  })
})
