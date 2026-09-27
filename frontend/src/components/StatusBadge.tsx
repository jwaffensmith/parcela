import type { ReactElement } from 'react'
import { Text } from 'theme-ui'
import { LISTING_STATUS, type ListingStatus } from '../types'

const STATUS_LABELS: Record<ListingStatus, string> = {
  [LISTING_STATUS.Active]: 'Active',
  [LISTING_STATUS.Pending]: 'Pending',
  [LISTING_STATUS.Sold]: 'Sold',
}

interface StatusBadgeProps {
  status: ListingStatus
}

export const StatusBadge = ({ status }: StatusBadgeProps): ReactElement => {
  return (
    <Text
      sx={{
        display: 'inline-block',
        fontSize: 0,
        fontWeight: 'semibold',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        borderRadius: 'pill',
        px: 3,
        py: 1,
        backgroundColor: `status.${status}.background`,
        color: `status.${status}.text`,
      }}
    >
      {STATUS_LABELS[status]}
    </Text>
  )
}
