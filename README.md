# Parcela

Search smarter, find your next home faster.

A full-stack property listing search service over listings ingested from multiple MLS
feeds. Python/FastAPI on the back end, React/TypeScript on the front.

---

## Quick start

Requires **Python 3.9+** and **Node 22.22+, 24.15+ or 26+** (Vitest and jsdom set the
Node floor, and both skip odd-numbered majors). The scripts are bash — macOS, Linux, WSL
or Git Bash.

```bash
./scripts/setup.sh    # creates the venv and installs all project dependencies
./scripts/dev.sh      # starts the API on :8000 and the UI on :5173 — Ctrl+C stops both
```

Everything `setup.sh` installs lives inside the repo (`backend/venv`,
`frontend/node_modules`). The one opt-in exception: the E2E tests need a real browser,
which Playwright keeps in a shared cache outside the project (~550MB). The rest of the
test suite, and the app itself, run without it.

```bash
INSTALL_BROWSER=1 ./scripts/setup.sh    # adds Chromium, enabling `npx playwright test`
```

| URL | What |
|-----|------|
| http://localhost:5173 | UI |
| http://localhost:8000 | API |
| http://localhost:8000/docs | Swagger API docs |

## Running the checks

```bash
cd backend && venv/bin/pytest -v                 # backend suite
cd frontend && npm test                          # frontend unit suite (Vitest)
cd frontend && npx tsc --noEmit && npm run lint  # type check + lint
cd frontend && npx playwright test               # E2E suite (needs INSTALL_BROWSER setup)
```

---

## Scoring

Results are ranked by a single `relevanceScore` in `[0, 1]`, rounded to 4 decimal places:

```
relevanceScore = 0.6 × budgetScore + 0.4 × recencyScore
```

Budget carries the greater weight because price is the hardest constraint a buyer has —
a listing they cannot afford is not a useful result however fresh it is.

### Budget score (60%)

| Condition | Score |
|-----------|-------|
| No `targetBudget` given | `0.5` (neutral — nothing to rank against) |
| `price == targetBudget` | `1.0` |
| `price < targetBudget` | `1 - (targetBudget - price) / targetBudget` |
| Up to 10% over budget | `1 - overPct / 0.10` |
| More than 10% over budget | `0.0` |

Under budget is penalized, but gently and in proportion: a $100k house on a $500k budget
is probably not what the buyer is looking for, yet it is still worth showing. Over budget
falls away sharply and hits zero at 10%, because stretching a little is realistic and
stretching a lot is not.

### Recency score (40%)

Listed dates are normalized across the filtered result set: the newest match scores `1.0`,
the oldest `0.0`, everything else linearly between. A single match, or several sharing one
date, all score `1.0`.

Recency is a rough availability signal — a listing that has sat on the market for months is
less likely to still be what it appears to be.

Scoring runs on the **whole filtered set, before pagination**, so a listing's score does not
change depending on which page it lands on.

---

## Trade-offs

- **Recency is relative, not absolute.** It is normalized against the current result set
  rather than a fixed window, so a search that returns only old listings still spreads them
  across `0.0`–`1.0`. This keeps the signal useful at any date range, at the cost of scores
  not being comparable between two different searches.
- **Sold listings are hidden by default.** Buyers are looking for available property. The
  status filter in the UI (or `status=sold` on the API) brings them back.
- **Data lives in a flat file.** `backend/data/sample_listings.json` is read and validated
  on every search — at this size, always-fresh and zero invalidation questions beat the
  microseconds a cache would save. The loader is the seam a real ingest layer would
  replace; nothing downstream would change, since filtering, merging and scoring take
  listings, not a file. The provided sample is kept verbatim and extended with synthetic
  rows, enough for pagination and deduplication to be visible in the UI. At this size a
  database would be pure overhead; at fifty thousand rows, filtering and merging would
  move into one. `tests/test_scale.py` runs the pipeline over a much larger synthetic
  feed to keep the invariants honest at a size the sample file cannot reach.
- **Ties keep feed order.** Listings with equal scores stay in the order the feed supplied,
  which is stable and therefore safe to paginate.
- **Validation is duplicated on purpose.** Zod on the client is a UX layer; the API
  validates independently and is the authority. Neither trusts the other — the client
  also parses every API response against a Zod schema pinned to its own types, so a
  contract change fails loudly at the boundary instead of rendering wrong data.
- **Prices accept cents.** The MLS standard (RESO) types list price as a decimal, so
  `price` is a `float` — a feed that sends `199990.99` ingests rather than fails
  validation. In practice list prices are whole dollars, and the UI shows cents only
  when a price actually has them.

---

## Deduplication

The feeds overlap: the same home is often listed by both MLS_A and MLS_B with a different
`id`, a slightly different price and date, a reworded description, and an address written
`55 Elm Ct` in one feed and `55 Elm Court` in the other. Returning both would tell a buyer
there are two houses on Elm Court, overstate the result count, and let one property take two
of the top relevance slots.

Two rows are the same property when they share **coordinates, bedrooms, bathrooms, floor
area and unit** — so a home double-posted by one feed merges too. Full addresses are too
inconsistent to match on (the feeds disagree on `St`/`Street`, and one pair even disagrees
on the zip code), but the unit designator survives the rewording: `Apt 4B`, `Unit 4B` and
`#4B` all reduce to the token `4b`, extracted by one deliberately dumb regex — anything
smarter would be guessing at free text. Coordinates and shape alone would merge separate
units in one building (the sample data has two homes at `1400 Clarendon Blvd`, which stay
separate), and the unit token keeps two units apart even when their floor plans are
identical. A listing with a unit never merges with one that lacks it — showing an
occasional duplicate is a smaller error than collapsing two different homes into one.

The **cheapest** listing is kept, tie-broken by the **most recent** — buyer-favorable and
deterministic. Nothing is discarded: the listings merged away are returned in `duplicates`,
and the UI shows them as *"Also listed on MLS_B at $452,000"*.

Merging happens after filtering and before scoring, so a property is ranked once. One
deliberate consequence: a filter can exclude the cheaper copy of a pair — a `minPrice`
between two duplicate prices leaves only the pricier feed's listing, shown with no
`duplicates`. The cheaper listing wasn't an answer to that query, so it neither appears
nor speaks for the property.

---

## API

Three endpoints: `GET /` (points at the others), `GET /health`, and `GET /search`. Search
parameters are all optional, camelCase, and documented live in Swagger at `/docs`. Invalid
input — an inverted price range, `pageSize=0`, a malformed value like `minPrice=abc`, an
unknown status — is a **400** with a human-readable message, never a stack trace:

```json
{ "detail": "minPrice must not exceed maxPrice" }
```

A filter that matches nothing, or a page past the end of the results, is a **200** with an
empty result — those requests are well-formed, the data just doesn't reach that far, and the
pagination metadata (`total`, `page`, `pageSize`, `totalPages`) says exactly where it ends.

---

## Layout

```
backend/
  main.py          FastAPI routes, CORS, error mapping — no business logic
  models.py        Pydantic models; snake_case in Python, camelCase on the wire
  dedupe.py        one result per property, whichever feeds listed it
  search.py        the pipeline: validate → load → filter → dedupe → score → paginate
  scoring.py       budget_score, recency_scores, score_listings
  validation.py    validate_params and the SearchError domain exception
  tests/           pytest suite

frontend/src/
  components/      SearchPage, SearchForm, ListingList, ListingCard,
                   Pagination, StatusBadge, ScoreBar
  hooks/useSearch  submitted filters + React Query, keyed on those filters
  api.ts           fetch functions — params in, promise out
  types.ts         Listing, SearchResponse, SearchParams
  schemas.ts       Zod schemas: the form (strings in, numbers out) and the API response
  format.ts        price, date and score formatting
  theme.ts         Theme UI tokens
frontend/e2e/      Playwright suite, including axe-core WCAG 2.2 AA scans
```

## Accessibility

The UI targets WCAG 2.2 AA — labeled inputs, errors linked via `aria-describedby`, result
counts announced through a live region, focus moved to the results after a search — verified
by axe-core scans in the E2E suite across the results, empty, invalid-form and error states.
