---
description: Run all verification checks — pytest, Vitest, TypeScript, ESLint, and Playwright E2E tests. Reports pass/fail for each.
---

# Verify

Run all project checks and report results. Execute each check below in order, collecting pass/fail status for each. Do not stop on first failure — run all checks and report a summary at the end.

## Checks

### 1. Backend tests (pytest)

```bash
cd backend
source venv/bin/activate
pytest -v
```

If `backend/venv` does not exist, report it as missing and skip to the next check.

### 2. Frontend unit tests (Vitest)

```bash
cd frontend
npm test
```

### 3. TypeScript type check

```bash
cd frontend
npx tsc --noEmit
```

### 4. ESLint

```bash
cd frontend
npm run lint
```

### 5. Playwright E2E tests

Before running Playwright, the backend API must be available on port 8000.

1. Check if the API is already running: `curl -sf http://localhost:8000/health`
2. If not running, start it in the background:
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn main:app --port 8000 &
   ```
   Wait up to 20 seconds for `/health` to respond before giving up.
3. Run the tests:
   ```bash
   cd frontend
   npx playwright test
   ```
4. If you started the API yourself, stop it when done.

If `frontend/e2e/` does not exist or has no test files, skip this check and note it.

## Summary

After all checks, report a table:

| Check | Status |
|-------|--------|
| pytest | PASS / FAIL / SKIPPED |
| vitest | PASS / FAIL |
| tsc | PASS / FAIL |
| eslint | PASS / FAIL |
| playwright | PASS / FAIL / SKIPPED |

If any check failed, list the specific errors. End with a single line: **All checks passed** or **N check(s) failed**.
