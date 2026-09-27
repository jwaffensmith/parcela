export const LISTING_STATUS = {
  Active: 'active',
  Pending: 'pending',
  Sold: 'sold',
} as const

export type ListingStatus = (typeof LISTING_STATUS)[keyof typeof LISTING_STATUS]

export interface DuplicateRef {
  source: string
  id: string
  price: number
}

export interface Listing {
  id: string
  source: string
  address: string
  city: string
  state: string
  zip: string
  price: number
  bedrooms: number
  bathrooms: number
  sqft: number
  latitude: number
  longitude: number
  listedDate: string
  status: ListingStatus
  description: string
  relevanceScore: number
  duplicates: DuplicateRef[]
}

export interface SearchResponse {
  total: number
  page: number
  pageSize: number
  totalPages: number
  results: Listing[]
}

export const FIRST_PAGE = 1

export interface SearchParams {
  minPrice?: number
  maxPrice?: number
  minBedrooms?: number
  city?: string
  keyword?: string
  targetBudget?: number
  status?: ListingStatus
  page: number
  pageSize: number
}

export type SearchFilters = Omit<SearchParams, 'page'>
