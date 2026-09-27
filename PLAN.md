# Parcela — Full-Stack Listing Search Service

A full-stack property listing search app with a Python/FastAPI backend and React/TypeScript frontend. FastAPI is a modern Python web framework — minimal boilerplate, automatic query param validation via type hints, and a built-in Swagger docs UI at `/docs`.

---

## Requirements

### What to build

A search experience over property listings ingested from multiple MLS data feeds. One working application, end to end — a real UI backed by real API logic.

### Functional requirements

- **Filtering**: by `minPrice`, `maxPrice`, `minBedrooms`, `city`, and free-text `keyword` matched against the listing description
- **Relevance scoring**: a `targetBudget` value combined with recency to rank results — design the scoring formula; it should be sensible and clearly explainable
- **Pagination**: users can see and move between pages of results
- **UI inputs**: real form inputs for all of the above. Results display at minimum: address, price, bedrooms, and relevance score. Handle loading, no-results, and error states
- **Invalid input handling**: handle deliberately, not incidentally. Examples: `minPrice > maxPrice`, `pageSize <= 0`, city with no matches. A clear error response beats a crash, silent empty result, or wrong data

### Data

- `sample_listings.json` — ~12 listings with fields: `id`, `source`, `address`, `city`, `state`, `zip`, `price`, `bedrooms`, `bathrooms`, `sqft`, `latitude`, `longitude`, `listedDate`, `status`, `description`
- `id` is unique per source, not globally unique
- Multiple MLS sources (MLS_A, MLS_B) — some listings are near-duplicates across sources
- `status`: `"active"` | `"pending"` | `"sold"`

### Tech stack

- **Backend**: Python with FastAPI. Expose as a REST API
- **Frontend**: React with TypeScript (required). Visual polish is not the point — what matters is the UI actually calls the API and renders real results

### Deliverables

1. A working, runnable solution wired together end to end
2. A test suite covering core logic, including edge cases (no matches, tied scores, invalid filter values, pagination boundaries)
3. A short README explaining the scoring approach and any trade-offs

---

## Architecture

### Backend

```
backend/
  main.py          # thin FastAPI routes, CORS, error mapping
  search.py        # orchestrator: search() calls the pipeline
  scoring.py       # budget_score, recency_scores
  validation.py    # validate_params, SearchError
```

- **`main.py`** — thin FastAPI layer: `GET /search` endpoint, `GET /health`, CORS config. Catches `SearchError` → HTTP 400. No business logic here
- **`search.py`** — orchestrates the pipeline: validate → load → filter → score → paginate. Exposes a single `search()` function
- **`scoring.py`** — budget score and recency score calculations
- **`validation.py`** — `validate_params()` and the `SearchError` exception class

Data loaded from `sample_listings.json` in memory — fine for this dataset size.

### Frontend

```
frontend/src/
  components/
    SearchPage.tsx       # main page: form + results + pagination
    SearchForm.tsx       # filter inputs, React Hook Form + Zod
    ListingCard.tsx      # single listing display
    ListingList.tsx      # list of listing cards
    Pagination.tsx       # page navigation controls
    StatusBadge.tsx      # active/pending/sold badge
    ScoreBar.tsx         # relevance score visual bar
  api.ts                 # fetch functions for React Query
  types.ts               # Listing, SearchResponse interfaces
  schemas.ts             # Zod validation schema
  theme.ts               # Theme UI theme object
  App.tsx                # thin shell — renders <SearchPage />
  main.tsx               # entry point: QueryClientProvider + ThemeUIProvider
```

- **React + TypeScript** via Vite, strict mode
- **React Query** (`@tanstack/react-query`) for server state — loads all listings on mount, re-queries with filters on submit
- **React Hook Form + Zod** for form validation (`schemas.ts` defines the schema, components consume it)
- **Theme UI** — use component primitives (`Box`, `Flex`, `Grid`, `Container`, `Heading`, `Text`, `Button`, `Input`, `Label`, `Select`), not raw HTML elements
- `App.tsx` is a thin shell — renders `<SearchPage />` and nothing else. All page logic lives in `SearchPage`

### API contract

`GET /search` with query params: `minPrice`, `maxPrice`, `minBedrooms`, `city`, `keyword`, `targetBudget`, `status`, `page`, `pageSize`

```json
{
  "total": 12,
  "page": 1,
  "pageSize": 10,
  "totalPages": 2,
  "results": [
    {
      "id": "A1",
      "source": "MLS_A",
      "address": "123 Main St, Apt 4B",
      "city": "Springfield",
      "state": "VA",
      "zip": "22150",
      "price": 450000,
      "bedrooms": 2,
      "bathrooms": 1.5,
      "sqft": 980,
      "latitude": 38.7893,
      "longitude": -77.1873,
      "listedDate": "2026-08-29",
      "status": "active",
      "description": "Bright top-floor condo...",
      "relevanceScore": 0.8234
    }
  ]
}
```

---

## Key Design Decisions

### Scoring formula

`relevance_score = 0.6 * budget_score + 0.4 * recency_score`

**Budget score** (60% weight — hardest buyer constraint):

| Condition | Score |
|-----------|-------|
| No targetBudget provided | 0.5 (neutral) |
| price == targetBudget | 1.0 |
| price < targetBudget | Linear penalty: `1.0 - (targetBudget - price) / targetBudget` |
| price up to 10% over budget | Linear decline to 0: `1.0 - overPct / 0.10` |
| price > 10% over budget | 0.0 |

Rationale: under-budget gets a mild penalty — a $100k listing on a $500k budget isn't as relevant. Over-budget has a hard cutoff at 10%; listings slightly over are still useful, but 15% over isn't helpful.

**Recency score** (40% weight — availability signal):

Normalized across the filtered result set. Most recent = 1.0, oldest = 0.0. Single listing or all same date → all get 1.0.

### Input validation

Validated at both layers: Zod on the client for UX, `SearchError` on the server for correctness.

| Rule | Error message |
|------|---------------|
| `page < 1` | `"page must be >= 1"` |
| `pageSize < 1` | `"pageSize must be >= 1"` |
| `pageSize > 100` | `"pageSize must be <= 100"` |
| `minPrice < 0` | `"minPrice must be >= 0"` |
| `maxPrice < 0` | `"maxPrice must be >= 0"` |
| `minPrice > maxPrice` | `"minPrice must not exceed maxPrice"` |
| `minBedrooms < 0` | `"minBedrooms must be >= 0"` |
| `targetBudget <= 0` | `"targetBudget must be > 0"` |

### Acknowledged trade-offs

- Recency normalization is relative to the current result set, not a fixed window — a search returning only old listings will still spread them 0.0–1.0
- Sold listings excluded by default — buyers are searching for available properties. Pass `status=sold` to include them explicitly
- No deduplication of cross-source near-duplicates — both MLS_A and MLS_B versions appear independently
- In-memory data with no database — appropriate for this dataset size

---

## Implementation Phases

### Phase 1: Project Setup

- Update `.gitignore` for Python + Node artifacts
- Backend: `backend/` with Python venv, `requirements.txt` (fastapi, uvicorn, pytest, httpx)
- Frontend: Vite `react-ts` template with dependencies: `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`, `zod`, `theme-ui`, `@emotion/react`, `@emotion/styled`
- Dev dependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@playwright/test`, `@axe-core/playwright`
- TypeScript strict mode, ESLint flat config extending recommended presets (`typescript-eslint`, `eslint-plugin-react`, `jsx-a11y`)
- Branding: Parcela favicon (SVG), Inter font, `<title>Parcela</title>`
- Icons: inline SVGs only — no icon library. Use `aria-hidden="true"` on the SVG with a text label on the button

**Checklist:**
- [ ] `.gitignore` updated
- [ ] Backend venv created and dependencies installed
- [ ] Frontend scaffolded with Vite
- [ ] TypeScript strict mode enabled
- [ ] ESLint configured with presets
- [ ] Favicon and branding in place

### Phase 2: Backend — API & Search Logic

Implement the search pipeline across the backend modules:

- **`validation.py`**: `SearchError` exception class, `validate_params()` — raises `SearchError` for any invalid input (see validation table)
- **`scoring.py`**: `budget_score()` + `recency_scores()` — per the scoring formula, combine as `relevanceScore` rounded to 4 decimal places, sort descending
- **`search.py`**: `filter_listings()` (all filters optional; city is case-insensitive exact match, keyword is case-insensitive substring against description, sold listings excluded by default unless `status` is explicitly set), `paginate()`, and the main `search()` orchestrator

Wire it up in `backend/main.py`:

- `GET /search` with query params, `GET /health` returning `{"status": "ok"}`
- CORS allowing `http://localhost:5173` and `http://localhost:3000`
- `SearchError` → HTTP 400 with `{"detail": message}`

**Checklist:**
- [ ] Backend modules implemented (validation, scoring, search orchestrator)
- [ ] `main.py` with GET /search and GET /health
- [ ] CORS configured
- [ ] API manually tested

### Phase 3: Frontend — React UI

**Types & validation**: `types.ts` for `Listing` and `SearchResponse` interfaces. `schemas.ts` for Zod search form schema with cross-field validation (min > max via `.refine()`).

**API layer**: fetch function in `api.ts` that builds the query string and calls `GET /search`. React Query loads all listings on mount (no filters), then re-queries when the user submits filters.

**Theme**: Theme UI with semantic design tokens. Brand color indigo, Inter font. Color tokens for text, background, surface, error, status badges (active/pending/sold).

**Components**:
- Header with app name
- Search form (React Hook Form + Zod): inputs for all filter params, results-per-page select, clear and submit buttons. Inline error messages from Zod via `aria-describedby`
- Listing cards: address, status badge (color + text), price, beds/baths/sqft, description, relevance score bar, listed date
- Pagination: previous/next buttons, page indicator, disabled at boundaries

**UI states**: loading (spinner — on mount and on search), error (banner with API message via `role="alert"`), no results (friendly empty state), results (count + cards + pagination). No empty initial state — results load immediately on mount. Loading and result changes announced via `aria-live`.

**Checklist:**
- [ ] TypeScript types and Zod schema defined
- [ ] React Query API layer (loads on mount, re-queries on submit)
- [ ] Theme configured
- [ ] Search form with inline validation
- [ ] Listing cards and pagination
- [ ] All UI states handled
- [ ] End-to-end data flow verified in browser

### Phase 4: Tests

**Backend (pytest):**
- Validation: each invalid input raises SearchError, valid params pass
- Filtering: by city (case-insensitive, no matches), price range, bedrooms, keyword, status (sold excluded by default), combined filters
- Budget score: no budget → 0.5, at budget → 1.0, under/over proportional, >10% over → 0.0
- Recency score: empty list, single listing → 1.0, multiple normalized, tied dates
- Score integration: sorted descending, scores in [0, 1], tied scores equal
- Pagination: first page, last page, beyond last page, empty input, exact fit
- Search integration: no matches → total=0, invalid range → error, filter + score together

**Frontend unit (Vitest):**
- Zod schema: valid input, empty strings optional, negative price rejected, min > max rejected, invalid pageSize
- Utilities: price formatting, error message extraction
- Components: listing card renders key fields, status badge colors, score bar width

**Frontend E2E (Playwright):**
- Search flow: form renders, search returns results, cards show data
- Pagination: buttons disabled at boundaries
- Clear resets form and results
- Error and empty states
- Accessibility (axe-core WCAG 2.2 AA scan)

**Checklist:**
- [ ] All backend tests passing
- [ ] All frontend unit tests passing
- [ ] Edge cases covered
- [ ] E2E tests passing

### Phase 5: README & Polish

README covering: scoring approach and rationale, trade-offs, local setup instructions, API parameter reference.

**Final checks:**
- [ ] Both servers start without errors
- [ ] Search works end-to-end in browser
- [ ] All tests pass (pytest, vitest, playwright)
- [ ] `tsc` passes with no errors
- [ ] ESLint passes
- [ ] Or just run `/verify`
- [ ] README is complete
- [ ] No secrets or venv committed

---

## Quick Reference

| Command | What it does |
|---------|-------------|
| `./scripts/setup.sh` | One-time setup: creates venv, installs all dependencies, installs Playwright browsers |
| `./scripts/dev.sh` | Starts both backend (port 8000) and frontend (port 5173) — Ctrl+C stops both |
| `cd backend && source venv/bin/activate && pytest -v` | Run backend tests |
| `cd frontend && npm test` | Run frontend unit tests (Vitest) |
| `cd frontend && npx tsc --noEmit && npm run lint` | Type check + lint |
| `cd frontend && npx playwright test` | Run E2E tests (requires backend running) |

| URL | What |
|-----|------|
| `http://localhost:8000` | API |
| `http://localhost:5173` | UI |
| `http://localhost:8000/docs` | Swagger API docs |
