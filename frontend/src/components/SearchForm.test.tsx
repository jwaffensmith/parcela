import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithTheme } from '../test/render'
import { SearchForm } from './SearchForm'

const renderForm = (isSearching = false) => {
  const onSearch = vi.fn()
  const onClear = vi.fn()
  renderWithTheme(
    <SearchForm isSearching={isSearching} onSearch={onSearch} onClear={onClear} />,
  )
  return { onSearch, onClear }
}

describe('SearchForm', () => {
  it('labels every filter input', () => {
    renderForm()

    expect(screen.getByLabelText('Min price')).toBeInTheDocument()
    expect(screen.getByLabelText('Max price')).toBeInTheDocument()
    expect(screen.getByLabelText('Min bedrooms')).toBeInTheDocument()
    expect(screen.getByLabelText('Target budget')).toBeInTheDocument()
    expect(screen.getByLabelText('City')).toBeInTheDocument()
    expect(screen.getByLabelText('Keyword')).toBeInTheDocument()
    expect(screen.getByLabelText('Status')).toBeInTheDocument()
    expect(screen.getByLabelText('Results per page')).toBeInTheDocument()
  })

  it('passes the entered filters on to the caller', async () => {
    const { onSearch } = renderForm()

    await userEvent.type(screen.getByLabelText('City'), 'Reston')
    await userEvent.type(screen.getByLabelText('Min price'), '300000')
    await userEvent.click(screen.getByRole('button', { name: 'Search' }))

    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith(
        expect.objectContaining({ city: 'Reston', minPrice: 300000 }),
      )
    })
  })

  it('leaves untouched filters out of the search', async () => {
    const { onSearch } = renderForm()

    await userEvent.click(screen.getByRole('button', { name: 'Search' }))

    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith(
        expect.objectContaining({ city: undefined, minPrice: undefined, status: undefined }),
      )
    })
  })

  it('passes the chosen status on to the caller', async () => {
    const { onSearch } = renderForm()

    await userEvent.selectOptions(screen.getByLabelText('Status'), 'Sold')
    await userEvent.click(screen.getByRole('button', { name: 'Search' }))

    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith(expect.objectContaining({ status: 'sold' }))
    })
  })

  it('blocks a search when the price range is inverted', async () => {
    const { onSearch } = renderForm()

    await userEvent.type(screen.getByLabelText('Min price'), '900000')
    await userEvent.type(screen.getByLabelText('Max price'), '100000')
    await userEvent.click(screen.getByRole('button', { name: 'Search' }))

    await screen.findByText('Min price must not exceed max price')
    expect(onSearch).not.toHaveBeenCalled()
  })

  it('flags an inverted price range as soon as max price loses focus', async () => {
    renderForm()

    await userEvent.type(screen.getByLabelText('Min price'), '900000')
    await userEvent.type(screen.getByLabelText('Max price'), '100000')
    await userEvent.tab()

    expect(await screen.findByText('Min price must not exceed max price')).toBeInTheDocument()
  })

  it('clears the price range error once max price is corrected', async () => {
    renderForm()

    await userEvent.type(screen.getByLabelText('Min price'), '900000')
    await userEvent.type(screen.getByLabelText('Max price'), '100000')
    await userEvent.tab()
    await screen.findByText('Min price must not exceed max price')

    await userEvent.clear(screen.getByLabelText('Max price'))
    await userEvent.type(screen.getByLabelText('Max price'), '950000')
    await userEvent.tab()

    await waitFor(() => {
      expect(screen.queryByText('Min price must not exceed max price')).not.toBeInTheDocument()
    })
  })

  it('ties the error message to the field it describes', async () => {
    renderForm()

    await userEvent.type(screen.getByLabelText('Min price'), '-5')
    await userEvent.click(screen.getByRole('button', { name: 'Search' }))

    const message = await screen.findByText('Min price must be a number of 0 or more')
    expect(screen.getByLabelText('Min price')).toHaveAttribute(
      'aria-describedby',
      message.id,
    )
  })

  it('marks an invalid field as invalid for screen readers', async () => {
    renderForm()

    await userEvent.type(screen.getByLabelText('Target budget'), '0')
    await userEvent.click(screen.getByRole('button', { name: 'Search' }))

    await screen.findByText('Target budget must be greater than 0')
    expect(screen.getByLabelText('Target budget')).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows a field error on blur, before the search is submitted', async () => {
    const { onSearch } = renderForm()

    await userEvent.type(screen.getByLabelText('Min price'), '-5')
    await userEvent.tab()

    await screen.findByText('Min price must be a number of 0 or more')
    expect(onSearch).not.toHaveBeenCalled()
  })

  it('empties the fields when cleared', async () => {
    renderForm()
    const city = screen.getByLabelText('City')

    await userEvent.type(city, 'Reston')
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }))

    expect(city).toHaveValue('')
  })

  it('tells the caller to drop the filters when cleared', async () => {
    const { onClear } = renderForm()

    await userEvent.click(screen.getByRole('button', { name: 'Clear' }))

    expect(onClear).toHaveBeenCalled()
  })

  it('disables the submit button while a search is running', () => {
    renderForm(true)

    expect(screen.getByRole('button', { name: /searching/i })).toBeDisabled()
  })
})
