# Project Rules

## General

- Comments only when the *why* is non-obvious. Never narrate what code does — names should do that.
- DRY: extract shared logic, but don't abstract prematurely. Three concrete uses before making a helper.
- Declarative over imperative. Prefer expressions (map, filter, ternary) over mutation and loops where readability allows.
- No magic strings. Use enums or typed constants for values that appear more than once or represent a fixed set (status, sort order, color keys).
- No `TODO` or `FIXME` in committed code.

## Python / FastAPI

- Type hints on every function signature — params and return types.
- Business logic lives in modules (`search.py`), not in route handlers. Route handlers are thin: parse input, call logic, return response.
- No `Any` — ever. Parse external data (feed rows, query params) into Pydantic models at the boundary and pass models, not `dict`s, through the app. Use a `TypeVar` bound to the model for helpers that work over any of them.
- Use `Enum` for fixed value sets (e.g., listing status) and a Pydantic model for every structured shape — feed rows, responses, anything crossing a module boundary.
- Shared models live in `models.py` and are the one source of truth for both business logic and the API. Every route declares a `response_model`, and its handler returns that model rather than a dict.
- snake_case everywhere in Python, including model fields. Bridge to the API's camelCase with the shared `ApiModel` base (`alias_generator=to_camel`, `populate_by_name=True`) — never name an attribute in camelCase to match JSON.
- Raise domain exceptions (`SearchError`) from business logic; convert to HTTP errors only at the route layer.
- No bare `except`. Catch specific exceptions.
- `Optional[T]` with explicit `None` defaults — never use mutable default arguments.
- Prefer `pathlib.Path` over `os.path`.
- Keep imports organized: stdlib, third-party, local — one blank line between groups.

## TypeScript

- Strict mode (`"strict": true`) — no exceptions.
- No `any` — ever. Use `unknown` and narrow, or define a proper type. Enforce via `@typescript-eslint/no-explicit-any`.
- Use `interface` for object shapes, `type` for unions and intersections.
- Use `as const` objects or TypeScript enums for fixed string sets (status values, color keys, route paths).
- Explicit return types on exported functions.
- Prefer `const` over `let`. Never use `var`.
- Arrow functions assigned to `const`, not `function` declarations — for components, hooks, and helpers alike. A default export is assigned to a `const` first, then `export default`.
- Destructure props and function params where it improves clarity.

## React

- Functional components only. No class components.
- One component per concern. If a component handles layout *and* data fetching *and* formatting, split it.
- Extract reusable UI patterns into components (badges, score bars, field groups).
- `App.tsx` is a thin shell — it renders a single top-level page component and nothing else. All page logic lives in that component.
- Custom hooks (`useSearch`, `usePagination`) for stateful logic that can be named and tested independently.
- Props interfaces defined next to the component, explicitly typed — no inline anonymous types.
- Controlled inputs. Form state in React, not the DOM.
- Conditional rendering with early returns or ternaries — no nested `&&` chains deeper than one level.
- Key props: use stable, unique identifiers (e.g., `${source}-${id}`), never array index.

## State Management (React Query)

- All API calls go through React Query — no raw `fetch` or `useEffect` data fetching in components.
- Define fetch functions in a dedicated `api.ts` module. Keep them pure: params in, promise out.
- Use `useQuery` with search params as the query key — the query runs on mount and re-fetches when the key changes. Store submitted params in state and pass them as the query key.
- Derive UI state from React Query's built-in flags (`isPending`, `isError`, `isSuccess`, `data`, `error`) — don't duplicate into local state.
- Extract error messages from the structured error response, don't show raw HTTP status codes.
- Configure `QueryClient` in `main.tsx`. Keep default options minimal.

## Forms (React Hook Form + Zod)

- All forms use React Hook Form with Zod schemas via `@hookform/resolvers/zod`.
- Define validation schemas in a dedicated `schemas.ts` file, not inline in components.
- Use `register` for simple inputs. Use `Controller` only when the component doesn't expose a ref (e.g., custom select).
- Display field-level error messages inline below the input — use `errors.fieldName?.message`.
- Cross-field validation (e.g., min > max) belongs in Zod `.refine()`, not in component logic.
- Use `reset()` from RHF to clear forms — don't manually reset state.
- Client-side validation is a UX layer. The API always validates independently.

## Accessibility (WCAG 2.2 AA)

### Semantic HTML
- Use the correct element for its purpose: `<button>` for actions, `<a>` for navigation, `<form>` for forms, `<h1>`–`<h6>` in order with no skipped levels.
- Every `<input>` must have an associated `<label>` (explicitly via `htmlFor`/`id`, or by wrapping). Placeholder text is not a label.
- Use `<main>`, `<nav>`, `<header>`, `<section>` landmarks so screen readers can navigate by region.

### Keyboard
- Every interactive element must be reachable and operable by keyboard alone (Tab, Shift+Tab, Enter, Space, Escape).
- Focus order must follow visual order. Never use `tabIndex` > 0.
- Visible focus indicator on all interactive elements — never `outline: none` without a visible replacement.
- After a search, move focus to the results region so keyboard users don't have to tab through the form again.

### Color & Contrast
- Text contrast ratio: minimum 4.5:1 for normal text, 3:1 for large text (18px+ bold or 24px+).
- Non-text contrast (borders, icons, focus rings): minimum 3:1 against adjacent colors.
- Never convey information by color alone — pair color with text, icons, or patterns (e.g., status badges use both color and text).

### Forms & Errors
- Inline error messages must be programmatically linked to their input via `aria-describedby`.
- Error messages must be visible, not just color changes — include text describing the issue.
- Group related fields with `<fieldset>` and `<legend>` where appropriate (e.g., price range).
- Disable submit button during loading and indicate it visually + via `aria-disabled`.

### Dynamic Content
- Loading states: use `aria-live="polite"` to announce when results are loading and when they arrive.
- Result count and page changes should be announced to screen readers.
- Error banners should use `role="alert"` so they're announced immediately.

### Images & Icons
- Decorative icons use `aria-hidden="true"` with a text label on the button.
- If using SVG icons, provide accessible text via `aria-label` on the button, not on the SVG.

## Styling (Theme UI)

- Use Theme UI component primitives (`Box`, `Flex`, `Grid`, `Container`, `Heading`, `Text`, `Button`, `Input`, `Label`, `Select`) — not raw HTML elements. These accept the `sx` prop natively.
- Prefer theme tokens for colors, spacing, radii, and shadows — but raw hex/px values are allowed where no token fits or for one-off values.
- Responsive values use Theme UI's array syntax (`[mobile, tablet, desktop]`).
- Component-level `sx` props for one-off styles. Extract shared style objects into named constants if used more than twice.

## Testing

- Test behavior, not implementation. Tests should survive a refactor.
- Each test has one clear assertion about one behavior.
- Test names describe the scenario and expected outcome, not the function name.
- Edge cases are first-class: empty inputs, boundary values, tied scores, invalid combinations.
- Backend: pytest with plain assertions. No mocks for the in-memory data layer.
- Frontend unit: Vitest + React Testing Library. Test Zod schemas, utility functions, and component rendering.
- Frontend E2E: Playwright. Test user-visible behavior through the real UI + API.

## Error Handling

### Backend
- Validate at the boundary — check all user input before it reaches business logic.
- Use domain-specific exception classes (`SearchError`), not generic `ValueError` or `Exception`.
- Every error path returns a structured response with a human-readable message. Never leak stack traces, internal paths, or implementation details to the client.
- Fail fast: if input is invalid, reject it immediately — don't process half a request then fail.
- Handle each error case explicitly. No catch-all handlers that swallow different failure modes into the same response.
- Log unexpected errors server-side; return a generic 500 message to the client.

### Frontend
- Every API call must handle three states: loading, success, and error. No fire-and-forget fetches.
- Display error messages from the API (`detail` field) to the user — don't silently fail or show generic "Something went wrong."
- Catch network failures (server down, timeout) separately from API errors (400/500) and show appropriate messages for each.
- Disable submit buttons during loading to prevent duplicate requests.
- Invalid form input should be caught client-side before hitting the API where practical (e.g., min > max). The API still validates independently — client-side checks are a UX improvement, not a substitute.
- Never let an unhandled promise rejection crash the UI. Errors in async operations should be caught and surfaced to the user.

## API Design

- Consistent casing: camelCase for query params and JSON response keys (matches JS conventions). On the Python side this is an alias, not a field name — see the Python rules.
- Invalid input returns HTTP 400 with a human-readable `detail` message — never a stack trace.
- Pagination metadata always present: `total`, `page`, `pageSize`, `totalPages`.
- Empty results are a valid 200 response, not an error.
