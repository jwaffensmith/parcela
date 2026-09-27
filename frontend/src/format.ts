const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const centsPriceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

export const formatPrice = (price: number): string =>
  Number.isInteger(price) ? priceFormatter.format(price) : centsPriceFormatter.format(price)

export const formatListedDate = (isoDate: string): string =>
  dateFormatter.format(new Date(`${isoDate}T00:00:00Z`))

export const formatScore = (score: number): string => `${Math.round(score * 100)}%`

export const formatSqft = (sqft: number): string => `${sqft.toLocaleString('en-US')} sqft`
