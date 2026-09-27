import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithTheme } from '../test/render'
import { ScoreBar } from './ScoreBar'

const relevance = (): HTMLElement => screen.getByRole('meter', { name: 'Relevance' })

describe('ScoreBar', () => {
  it('shows the score as a number so it is not conveyed by the bar alone', () => {
    renderWithTheme(<ScoreBar score={0.8234} />)

    expect(screen.getByText('82%')).toBeInTheDocument()
  })

  it('reports the score as the meter value', () => {
    renderWithTheme(<ScoreBar score={0.25} />)

    expect(relevance()).toHaveAttribute('aria-valuenow', '0.25')
  })

  it('reports the top score at full value', () => {
    renderWithTheme(<ScoreBar score={1} />)

    expect(relevance()).toHaveAttribute('aria-valuenow', '1')
  })

  it('reports the bottom score at zero value', () => {
    renderWithTheme(<ScoreBar score={0} />)

    expect(relevance()).toHaveAttribute('aria-valuenow', '0')
  })

  it('never reports a value above the maximum', () => {
    renderWithTheme(<ScoreBar score={1.5} />)

    expect(relevance()).toHaveAttribute('aria-valuenow', '1')
  })
})
