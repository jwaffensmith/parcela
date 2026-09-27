---
description: Review the changes on the current branch against RULES.md. Reports rule violations per file with fixes.
---

# Code Review

`RULES.md` is the single source of truth for this review. Do not apply standards that aren't in it.

## 1. Scope

Find everything changed on this branch, committed and uncommitted:

```bash
git diff main...HEAD --name-only
git status --porcelain
```

Review all changed files: backend and frontend source, tests, E2E specs (`frontend/e2e/`), and config (`tsconfig`, ESLint, Vite, Playwright, `pyproject`/pytest). Skip dependency and lockfile noise (`node_modules/`, `venv/`, `package-lock.json`, `*.lock`, vendored packages).

## 2. Review

Read `RULES.md`, then check each changed file against every section that applies to it. Read the surrounding code, not just the diff, when a rule depends on context (e.g. whether logic is duplicated elsewhere, whether a route handler is thin).

## 3. Verify

Before reporting a finding, confirm it against the actual code. Drop anything you can't point to a specific line for, and anything RULES.md doesn't actually require.

## 4. Report

For each issue:

- **File:line**
- **Rule** — the RULES.md section and rule broken
- **Problem** — what's wrong
- **Fix** — how to fix it
- **Severity** — high (bug, a11y failure, leaked internals), medium (clear rule violation), low (style/consistency)

Group issues by RULES.md section, most severe first. End with a count per section and a total, or **No issues found**.
