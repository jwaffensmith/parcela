import { describe, expect, it } from 'vitest'
import { formatListedDate, formatPrice, formatScore, formatSqft } from './format'

describe('formatting', () => {
  it('shows a price as whole dollars', () => {
    expect(formatPrice(450000)).toBe('$450,000')
  })

  it('shows cents only when a price has them', () => {
    expect(formatPrice(450000.75)).toBe('$450,000.75')
  })

  it('shows a free listing as zero dollars', () => {
    expect(formatPrice(0)).toBe('$0')
  })

  it('renders an ISO date in the reader’s calendar order', () => {
    expect(formatListedDate('2026-08-29')).toBe('Aug 29, 2026')
  })

  it('reads the date in UTC so the day never shifts', () => {
    expect(formatListedDate('2026-01-01')).toBe('Jan 1, 2026')
  })

  it('shows a score as a whole percentage', () => {
    expect(formatScore(0.8234)).toBe('82%')
  })

  it('shows a perfect score as one hundred percent', () => {
    expect(formatScore(1)).toBe('100%')
  })

  it('groups thousands in a floor area', () => {
    expect(formatSqft(1450)).toBe('1,450 sqft')
  })
})
