import type { ReactElement } from 'react'
import { Box, Flex, Text } from 'theme-ui'
import { formatScore } from '../format'

const MAX_SCORE = 1

interface ScoreBarProps {
  score: number
}

export const ScoreBar = ({ score }: ScoreBarProps): ReactElement => {
  const clamped = Math.min(Math.max(score, 0), MAX_SCORE)
  const filledPercent = (clamped / MAX_SCORE) * 100

  return (
    <Flex sx={{ alignItems: 'center', gap: 3 }}>
      <Text aria-hidden="true" sx={{ fontSize: 1, color: 'muted', whiteSpace: 'nowrap' }}>
        Relevance
      </Text>
      <Box
        role="meter"
        aria-label="Relevance"
        aria-valuemin={0}
        aria-valuemax={MAX_SCORE}
        aria-valuenow={clamped}
        aria-valuetext={formatScore(clamped)}
        sx={{
          flex: 1,
          minWidth: '64px',
          height: '8px',
          borderRadius: 'pill',
          backgroundColor: 'track',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            width: `${filledPercent}%`,
            height: '100%',
            backgroundColor: 'primary',
          }}
        />
      </Box>
      <Text
        aria-hidden="true"
        sx={{ fontSize: 1, fontWeight: 'semibold', fontVariantNumeric: 'tabular-nums' }}
      >
        {formatScore(score)}
      </Text>
    </Flex>
  )
}
