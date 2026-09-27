import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { buildListing, renderWithTheme } from '../test/render'
import { ListingList } from './ListingList'

describe('ListingList', () => {
  it('renders one entry per listing', () => {
    renderWithTheme(
      <ListingList
        listings={[buildListing({ id: 'A1' }), buildListing({ id: 'A2', address: '9 Oak Ave' })]}
      />,
    )

    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('renders nothing when there are no listings', () => {
    renderWithTheme(<ListingList listings={[]} />)

    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('keeps listings that share an id across feeds apart', () => {
    renderWithTheme(
      <ListingList
        listings={[
          buildListing({ id: 'A1', source: 'MLS_A', address: '123 Main St' }),
          buildListing({ id: 'A1', source: 'MLS_B', address: '123 Main Street' }),
        ]}
      />,
    )

    expect(screen.getByText('123 Main St')).toBeInTheDocument()
    expect(screen.getByText('123 Main Street')).toBeInTheDocument()
  })
})
