import { zodResolver } from '@hookform/resolvers/zod'
import type { ReactElement } from 'react'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import { Box, Button, Flex, Grid, Input, Label, Select, Text } from 'theme-ui'
import {
  DEFAULT_FORM_VALUES,
  PAGE_SIZE_OPTIONS,
  STATUS_FILTER_VALUES,
  searchFormSchema,
  type SearchFormOutput,
  type SearchFormValues,
  type StatusFilterValue,
} from '../schemas'
import { LISTING_STATUS, type SearchFilters } from '../types'

const STATUS_FILTER_LABELS: Record<StatusFilterValue, string> = {
  '': 'For sale (active & pending)',
  [LISTING_STATUS.Active]: 'Active',
  [LISTING_STATUS.Pending]: 'Pending',
  [LISTING_STATUS.Sold]: 'Sold',
}

interface SearchFormProps {
  isSearching: boolean
  onSearch: (filters: SearchFilters) => void
  onClear: () => void
}

export const SearchForm = ({ isSearching, onSearch, onClear }: SearchFormProps): ReactElement => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SearchFormValues, unknown, SearchFormOutput>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: DEFAULT_FORM_VALUES,
    mode: 'onBlur',
  })

  const submit = handleSubmit((values) => {
    onSearch({
      minPrice: values.minPrice,
      maxPrice: values.maxPrice,
      minBedrooms: values.minBedrooms,
      targetBudget: values.targetBudget,
      city: values.city || undefined,
      keyword: values.keyword || undefined,
      status: values.status,
      pageSize: values.pageSize,
    })
  })

  const handleClear = (): void => {
    reset(DEFAULT_FORM_VALUES)
    onClear()
  }

  return (
    <Box
      as="form"
      onSubmit={(event) => void submit(event)}
      sx={{
        backgroundColor: 'surface',
        border: 'hairline',
        borderColor: 'border',
        borderRadius: 'lg',
        boxShadow: 'card',
        p: 5,
        mb: 6,
      }}
    >
      <Box as="fieldset" sx={{ border: 'none', m: 0, p: 0, mb: 4 }}>
        <Text as="legend" sx={{ fontSize: 1, fontWeight: 'semibold', mb: 2, p: 0 }}>
          Price range
        </Text>
        <Grid sx={{ gap: 4, gridTemplateColumns: ['1fr', '1fr 1fr'] }}>
          <NumericField
            id="minPrice"
            label="Min price"
            error={errors.minPrice?.message}
            registration={register('minPrice')}
          />
          <NumericField
            id="maxPrice"
            label="Max price"
            error={errors.maxPrice?.message}
            registration={register('maxPrice', { deps: 'minPrice' })}
          />
        </Grid>
      </Box>

      <Grid sx={{ gap: 4, gridTemplateColumns: ['1fr', '1fr 1fr', 'repeat(4, 1fr)'], mb: 4 }}>
        <NumericField
          id="minBedrooms"
          label="Min bedrooms"
          error={errors.minBedrooms?.message}
          registration={register('minBedrooms')}
        />
        <NumericField
          id="targetBudget"
          label="Target budget"
          error={errors.targetBudget?.message}
          registration={register('targetBudget')}
        />
        <TextField
          id="city"
          label="City"
          error={errors.city?.message}
          registration={register('city')}
        />
        <TextField
          id="keyword"
          label="Keyword"
          error={errors.keyword?.message}
          registration={register('keyword')}
        />
      </Grid>

      <Flex sx={{ alignItems: 'flex-end', justifyContent: 'space-between', gap: 4, flexWrap: 'wrap' }}>
        <Flex sx={{ gap: 4, flexWrap: 'wrap' }}>
          <Box sx={{ minWidth: '280px' }}>
            <Label htmlFor="status">Status</Label>
            <Select id="status" arrow={<SelectArrow />} {...register('status')}>
              {STATUS_FILTER_VALUES.map((value) => (
                <option key={value} value={value}>
                  {STATUS_FILTER_LABELS[value]}
                </option>
              ))}
            </Select>
          </Box>
          <Box sx={{ minWidth: '160px' }}>
            <Label htmlFor="pageSize">Results per page</Label>
            <Select id="pageSize" arrow={<SelectArrow />} {...register('pageSize')}>
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Box>
        </Flex>

        <Flex sx={{ gap: 3 }}>
          <Button
            type="button"
            variant="secondary"
            disabled={isSearching}
            aria-disabled={isSearching}
            onClick={handleClear}
          >
            Clear
          </Button>
          <Button type="submit" disabled={isSearching} aria-disabled={isSearching}>
            {isSearching ? 'Searching…' : 'Search'}
          </Button>
        </Flex>
      </Flex>
    </Box>
  )
}

/** Theme UI's default select arrow, minus its screen-reader visibility. */
const SelectArrow = (): ReactElement => (
  <svg
    aria-hidden="true"
    focusable="false"
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentcolor"
    style={{ marginLeft: '-28px', alignSelf: 'center', pointerEvents: 'none' }}
  >
    <path d="M7 10l5 5 5-5z" />
  </svg>
)

interface FieldProps {
  id: keyof SearchFormValues
  label: string
  error: string | undefined
  registration: UseFormRegisterReturn
}

const NumericField = ({ id, label, error, registration }: FieldProps): ReactElement => (
  <FieldGroup id={id} label={label} error={error} registration={registration} inputMode="numeric" />
)

const TextField = ({ id, label, error, registration }: FieldProps): ReactElement => (
  <FieldGroup id={id} label={label} error={error} registration={registration} inputMode="text" />
)

interface FieldGroupProps extends FieldProps {
  inputMode: 'numeric' | 'text'
}

const FieldGroup = ({ id, label, error, registration, inputMode }: FieldGroupProps): ReactElement => {
  const errorId = `${id}-error`

  return (
    <Box>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="text"
        inputMode={inputMode}
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={error === undefined ? undefined : errorId}
        {...registration}
      />
      {error === undefined ? null : (
        <Text as="p" id={errorId} variant="fieldError" sx={{ mt: 1, mb: 0 }}>
          {error}
        </Text>
      )}
    </Box>
  )
}
