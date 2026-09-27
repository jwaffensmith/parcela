import { z } from 'zod'
import {
  LISTING_STATUS,
  type DuplicateRef,
  type Listing,
  type SearchResponse,
} from './types'

export const PAGE_SIZE_OPTIONS = ['5', '10', '25', '50'] as const

/** Blank means the API default: everything that is still for sale. */
export const STATUS_FILTER_VALUES = [
  '',
  LISTING_STATUS.Active,
  LISTING_STATUS.Pending,
  LISTING_STATUS.Sold,
] as const

export type StatusFilterValue = (typeof STATUS_FILTER_VALUES)[number]

/** Text inputs hand back strings; blank means "no filter", not zero. */
const optionalNumber = (message: string, isValid: (value: number) => boolean) =>
  z
    .string()
    .trim()
    .refine((raw) => raw === '' || (Number.isFinite(Number(raw)) && isValid(Number(raw))), {
      message,
    })
    .transform((raw) => (raw === '' ? undefined : Number(raw)))

export const searchFormSchema = z
  .object({
    minPrice: optionalNumber('Min price must be a number of 0 or more', (n) => n >= 0),
    maxPrice: optionalNumber('Max price must be a number of 0 or more', (n) => n >= 0),
    minBedrooms: optionalNumber(
      'Min bedrooms must be a whole number of 0 or more',
      (n) => Number.isInteger(n) && n >= 0,
    ),
    targetBudget: optionalNumber('Target budget must be greater than 0', (n) => n > 0),
    city: z.string().trim(),
    keyword: z.string().trim(),
    status: z
      .enum(STATUS_FILTER_VALUES)
      .transform((value) => (value === '' ? undefined : value)),
    pageSize: z.enum(PAGE_SIZE_OPTIONS).transform(Number),
  })
  .refine(
    ({ minPrice, maxPrice }) =>
      minPrice === undefined || maxPrice === undefined || minPrice <= maxPrice,
    { message: 'Min price must not exceed max price', path: ['minPrice'] },
  )

export const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[1]

export type SearchFormValues = z.input<typeof searchFormSchema>
export type SearchFormOutput = z.output<typeof searchFormSchema>

export const DEFAULT_FORM_VALUES: SearchFormValues = {
  minPrice: '',
  maxPrice: '',
  minBedrooms: '',
  targetBudget: '',
  city: '',
  keyword: '',
  status: '',
  pageSize: DEFAULT_PAGE_SIZE,
}

/**
 * The client trusts the API's shape no more than the API trusts the client's
 * input. The `z.ZodType` annotations pin each schema to the interface in
 * `types.ts`, so the two cannot drift apart without a compile error.
 */
const duplicateRefSchema: z.ZodType<DuplicateRef> = z.object({
  source: z.string(),
  id: z.string(),
  price: z.number(),
})

const listingSchema: z.ZodType<Listing> = z.object({
  id: z.string(),
  source: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  price: z.number(),
  bedrooms: z.number(),
  bathrooms: z.number(),
  sqft: z.number(),
  latitude: z.number(),
  longitude: z.number(),
  listedDate: z.string(),
  status: z.enum([LISTING_STATUS.Active, LISTING_STATUS.Pending, LISTING_STATUS.Sold]),
  description: z.string(),
  relevanceScore: z.number(),
  duplicates: z.array(duplicateRefSchema),
})

export const searchResponseSchema: z.ZodType<SearchResponse> = z.object({
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
  results: z.array(listingSchema),
})
