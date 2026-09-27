---
description: Audit the frontend for WCAG 2.2 AA accessibility compliance. Checks semantic HTML, keyboard navigation, ARIA attributes, color contrast, and runs automated axe-core scans.
---

# Accessibility Audit

Run a full WCAG 2.2 AA audit of the frontend. Execute each check below and report findings.

## 1. Automated scan (axe-core via Playwright)

If `@axe-core/playwright` is installed, run or create a Playwright test that:

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('should have no accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
```

Ensure the backend API is running on port 8000 before executing. Report all violations with their impact level and affected elements.

## 2. Semantic HTML review

Check all components for:

- [ ] Every `<input>` has an associated `<label>` (via `htmlFor`/`id` or wrapping) — placeholder is not a label
- [ ] Heading hierarchy is correct (`h1` → `h2` → `h3`, no skipped levels)
- [ ] Landmark elements used (`<main>`, `<header>`, `<nav>`, `<section>`)
- [ ] `<button>` used for actions, not `<div onClick>`
- [ ] Lists of items use `<ul>`/`<ol>` + `<li>`

## 3. Keyboard navigation

Manually trace the tab order through the UI:

- [ ] All interactive elements are reachable via Tab/Shift+Tab
- [ ] Tab order matches visual layout (no `tabIndex` > 0)
- [ ] Visible focus indicator on every focusable element
- [ ] Form submits on Enter
- [ ] Buttons activate on Enter and Space
- [ ] No keyboard traps

## 4. ARIA attributes

- [ ] Error messages linked to inputs via `aria-describedby`
- [ ] Loading state announced via `aria-live="polite"` region
- [ ] Error banners use `role="alert"`
- [ ] Result count changes announced to screen readers
- [ ] Decorative icons have `aria-hidden="true"`
- [ ] Icon-only buttons have `aria-label`
- [ ] Disabled buttons use `aria-disabled` or native `disabled`

## 5. Color & contrast

- [ ] Text meets 4.5:1 contrast ratio (3:1 for large text)
- [ ] Focus indicators meet 3:1 contrast
- [ ] Status badges convey meaning via text, not just color
- [ ] Error states use text + icon, not just red color

## Summary

Report findings as a table:

| Category | Issues found | Severity |
|----------|-------------|----------|
| axe-core automated | N | critical / serious / moderate / minor |
| Semantic HTML | N | - |
| Keyboard | N | - |
| ARIA | N | - |
| Color & contrast | N | - |

List each specific issue with the file, line, and fix. End with: **WCAG 2.2 AA compliant** or **N issue(s) to fix**.
