---
description: Build a new feature with gated design, plan approval, TDD, and verification. Use when adding a new feature or implementing new requirements.
---

# Build a Feature

The rest of the user message is the feature or requirement. If it is empty, ask what to build and wait. Follow the steps in order.

Do not commit, push, or open a pull request unless the user asks. Still write the spec and plan files.

## Rules

Before Gate 1, read and follow every rule file that exists:

- `README.md`
- `CLAUDE.md`

Repo rules apply for the whole run.

## Gate 1 — Confirm the feature

Restate the requirement as observable acceptance criteria. Propose a branch slug: lowercase, hyphens, no spaces, so the branch will be `feature/<slug>`.

Stop. Wait for an explicit yes, or a correction. No design, plan, branch, or code before that yes.

## Branch from main

Immediately after Gate 1, and before writing any file:

1. If `git status --porcelain` is non-empty, stop and ask. Do not stash or discard.
2. If the current branch is already `feature/<slug>` and `git merge-base --is-ancestor main HEAD` succeeds, stay on it.
3. Otherwise:
   - `git fetch origin`
   - `git checkout main`
   - `git pull --ff-only origin main`
   - `git checkout -b feature/<slug>`
4. If `feature/<slug>` already exists, stop and ask.
5. If fetch or fast-forward fails, stop and report the output. Do not branch from a stale `main`.

The base branch is `main` only.

## Gate 2 — Approve the design

Inspect the relevant code. Offer two or three approaches with trade-offs (complexity, scope of change, test surface). Present a recommended design.

Stop until the user approves the design.

After approval, write `docs/specs/YYYY-MM-DD-<topic>-design.md` recording the approved design and rationale. Continue to Gate 3.

## Gate 3 — Approve the plan

Break the approved design into ordered implementation tasks. Each task should be a single testable unit of work. Save the plan to `docs/plans/YYYY-MM-DD-<feature>.md`.

Stop until the user approves the plan. No production code before that approval.

## Implement

Follow test-driven development for each task:

1. **Red**: write a failing test first.
   - User-visible behavior: a Playwright spec in `frontend/e2e/`.
   - Backend behavior: a pytest test in `backend/`.
2. **Green**: write the minimum code that makes the test pass.
3. **Refactor**: clean up only if needed, keeping tests green.

When plan tasks are independent, use the Agent tool to parallelize. When they are tightly coupled, execute sequentially.

## Verify

After implementation, and after every fix, run `/verify`.

A failure means fix the cause, then run `/verify` again. Claim the feature is done only when all checks pass.

If the same failure persists after three attempts, stop and show the output.

Backend-only work still runs the full verification, including the existing Playwright suite.

## Done

Report:
- The confirmed requirement
- The branch name
- The spec path
- The plan path
- The files changed
- The `/verify` result (each check and its pass/fail)
