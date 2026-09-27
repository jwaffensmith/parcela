import type { ReactElement } from 'react'
import { Box } from 'theme-ui'
import type { Listing } from '../types'
import { ListingCard } from './ListingCard'

interface ListingListProps {
  listings: Listing[]
}

export const ListingList = ({ listings }: ListingListProps): ReactElement => {
  return (
    <Box
      as="ul"
      sx={{ listStyle: 'none', display: 'grid', gap: 4, m: 0, p: 0 }}
    >
      {listings.map((listing) => (
        <Box as="li" key={`${listing.source}-${listing.id}`}>
          <ListingCard listing={listing} />
        </Box>
      ))}
    </Box>
  )
}
