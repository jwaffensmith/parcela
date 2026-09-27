import { describe, expect, it } from 'vitest'
import { DEFAULT_FORM_VALUES, searchFormSchema } from './schemas'
import { LISTING_STATUS } from './types'

const parse = (overrides: Partial<typeof DEFAULT_FORM_VALUES> = {}) =>
  searchFormSchema.safeParse({ ...DEFAULT_FORM_VALUES, ...overrides })

describe('search form schema', () => {
  it('accepts an untouched form', () => {
    expect(parse().success).toBe(true)
  })

  it('treats blank numeric fields as no filter at all', () => {
    const result = parse()

    expect(result.success && result.data.minPrice).toBeUndefined()
  })

  it('converts entered numbers from strings', () => {
    const result = parse({ minPrice: '250000' })

    expect(result.success && result.data.minPrice).toBe(250000)
  })

  it('trims surrounding whitespace from the city', () => {
    const result = parse({ city: '  Reston  ' })

    expect(result.success && result.data.city).toBe('Reston')
  })

  it('rejects a negative min price', () => {
    const result = parse({ minPrice: '-1' })

    expect(result.success).toBe(false)
  })

  it('explains why a negative min price was rejected', () => {
    const result = parse({ minPrice: '-1' })

    expect(result.success ? [] : result.error.issues.map((issue) => issue.message)).toContain(
      'Min price must be a number of 0 or more',
    )
  })

  it('accepts a min price of zero', () => {
    expect(parse({ minPrice: '0' }).success).toBe(true)
  })

  it('rejects a target budget of zero', () => {
    expect(parse({ targetBudget: '0' }).success).toBe(false)
  })

  it('rejects fractional bedrooms', () => {
    expect(parse({ minBedrooms: '2.5' }).success).toBe(false)
  })

  it('explains that bedrooms must be a whole number', () => {
    const result = parse({ minBedrooms: '2.5' })

    expect(result.success ? [] : result.error.issues.map((issue) => issue.message)).toContain(
      'Min bedrooms must be a whole number of 0 or more',
    )
  })

  it('accepts a whole number of bedrooms', () => {
    const result = parse({ minBedrooms: '2' })

    expect(result.success && result.data.minBedrooms).toBe(2)
  })

  it('rejects a min price above the max price', () => {
    const result = parse({ minPrice: '900000', maxPrice: '100000' })

    expect(result.success ? [] : result.error.issues.map((issue) => issue.message)).toContain(
      'Min price must not exceed max price',
    )
  })

  it('reports the min/max conflict against the min price field', () => {
    const result = parse({ minPrice: '900000', maxPrice: '100000' })

    expect(result.success ? [] : result.error.issues[0]?.path).toEqual(['minPrice'])
  })

  it('accepts a min price equal to the max price', () => {
    expect(parse({ minPrice: '450000', maxPrice: '450000' }).success).toBe(true)
  })

  it('ignores the min/max rule when only one bound is given', () => {
    expect(parse({ minPrice: '900000' }).success).toBe(true)
  })

  it('treats the default status as no filter at all', () => {
    const result = parse()

    expect(result.success && result.data.status).toBeUndefined()
  })

  it('passes a chosen status through', () => {
    const result = parse({ status: LISTING_STATUS.Sold })

    expect(result.success && result.data.status).toBe(LISTING_STATUS.Sold)
  })

  it('rejects a status outside the offered options', () => {
    const result = searchFormSchema.safeParse({ ...DEFAULT_FORM_VALUES, status: 'leased' })

    expect(result.success).toBe(false)
  })

  it('rejects a page size outside the offered options', () => {
    const result = searchFormSchema.safeParse({ ...DEFAULT_FORM_VALUES, pageSize: '7' })

    expect(result.success).toBe(false)
  })

  it('converts the chosen page size to a number', () => {
    const result = parse({ pageSize: '25' })

    expect(result.success && result.data.pageSize).toBe(25)
  })
})
