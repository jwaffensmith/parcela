import type { ReactElement } from 'react'
import { Box, Card, Flex, Heading, Text } from 'theme-ui'
import { formatListedDate, formatPrice, formatSqft } from '../format'
import type { Listing } from '../types'
import { ScoreBar } from './ScoreBar'
import { StatusBadge } from './StatusBadge'

interface ListingCardProps {
  listing: Listing
}

export const ListingCard = ({ listing }: ListingCardProps): ReactElement => {
  const { address, city, state, zip, price, bedrooms, bathrooms, sqft } = listing
  const { status, description, listedDate, relevanceScore, source, duplicates } = listing

  const alsoListedOn = duplicates
    .map((duplicate) => `${duplicate.source} at ${formatPrice(duplicate.price)}`)
    .join(', ')

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Flex sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 3 }}>
        <Box>
          <Heading as="h3" sx={{ fontSize: 3 }}>
            {address}
          </Heading>
          <Text as="p" variant="muted" sx={{ m: 0, mt: 1 }}>
            {city}, {state} {zip} · {source}
          </Text>
        </Box>
        <StatusBadge status={status} />
      </Flex>

      <Flex sx={{ alignItems: 'baseline', gap: 3, flexWrap: 'wrap' }}>
        <Text sx={{ fontSize: 5, fontWeight: 'heading' }}>{formatPrice(price)}</Text>
        <Text variant="muted">
          {bedrooms} bd · {bathrooms} ba · {formatSqft(sqft)}
        </Text>
      </Flex>

      {alsoListedOn === '' ? null : (
        <Text as="p" variant="muted" sx={{ m: 0 }}>
          Also listed on {alsoListedOn}
        </Text>
      )}

      <Text as="p" sx={{ m: 0, color: 'text' }}>
        {description}
      </Text>

      <ScoreBar score={relevanceScore} />

      <Text variant="muted">Listed {formatListedDate(listedDate)}</Text>
    </Card>
  )
}
