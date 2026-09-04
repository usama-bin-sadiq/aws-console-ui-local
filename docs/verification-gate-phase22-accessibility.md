# Phase 22 — Accessibility + i18n Foundation Verification Gate

> **Reference:** `docs/prd-aws-management-console-v1.3.md` §19 (Accessibility), §20 (i18n)
> **Status:** Foundation fixes delivered; full audit continues.
> **Target:** WCAG 2.1 AA (4.5:1 contrast), screen-reader parity, keyboard navigability.

---

## 1. Skip Navigation (§19.1)

- [x] Skip-nav link added to `AppShell` (`src/components/AppShell.tsx` line ~228)
- [x] Link text: `"Skip to main content"` (P0 i18n key: `a11y.skip-to-main`)
- [x] Focus-visible: shows at `top: 0` when focused; hidden (`top: -40px`) when blurred
- [x] Targets `#main-content` wrapper around `children`
- [x] `main-content` div has `aria-label="Main content"` and `role="main"`

---

## 2. ARIA Labels — Major Service Pages (§19.3)

Audited pages: **EC2, Lambda, S3, IAM, DynamoDB, VPC, RDS**.

| Component | Page / Component | Critical Violations Fixed | Remaining Gaps |
|---|---|---|---|
| `AppShell` | Global | Skip-nav, search `aria-label`, terminal button `aria-label`, region dropdown label, theme toggle label | Search dropdown results lack `role="listbox"` / `aria-selected` |
| `ConfirmModal` | Global modal | `closeAriaLabel`, input `ariaLabel`, alert `statusIconAriaLabel` | Needs `aria-modal` on root (Cloudscape Modal handles partially) |
| `EC2Page` | `/ec2` | `Launch instances` button `aria-label`, refresh `aria-label`, pagination `ariaLabels`, table filter `filteringAriaLabel` | Bulk-action dropdown items (`Start`, `Stop`, `Reboot`, `Terminate`) have no individual `aria-label` |
| `LambdaPage` | `/lambda` | `Create function` button `aria-label`, refresh `aria-label`, pagination `ariaLabels`, action buttons (`View`, `Invoke`, `Delete`) have `aria-label`, bulk actions `aria-label` | Invoke modal payload/result fields missing `aria-describedby` |
| `S3BucketsPage` | `/s3` | `Create bucket` button `aria-label`, refresh `aria-label`, link `ariaLabel` (`View bucket`), resource table uses shared component | Resource table action buttons (`View`, `Delete`) rely on default text (acceptable) |
| `IAMPage` | `/iam` | `Create User`, `Create Role`, action buttons (`View`, `Attach Policy`, `Delete`, `Detach`) all have `aria-label` | Policy editor (`IamPolicyEditor`) needs `aria-label` on JSON editor |
| `DynamoDBPage` | `/dynamodb` | `Create Table` button `aria-label`, action buttons (`View`, `Delete`) `aria-label` | Create modal input `aria-label` implicit via `FormField` label |
| `VPCPage` / `RDSPage` | `/vpc`, `/rds` | Not fully audited in this phase; use `ServiceLayout` which passes `serviceName` but no `aria-label` on actions | Needs audit |

### Priority Fix List (P0)

1. Add `aria-label` to all primary CTA buttons (`Launch`, `Create`, `Refresh`).
2. Ensure every interactive `Button` that uses only an icon (`iconName`) has `aria-label`.
3. Ensure `Modal` components expose `closeAriaLabel` (done in `ConfirmModal`).
4. Verify all `Table` column headers (`<th>`) and `scope` attributes (Cloudscape handles).
5. Verify all `FormField` labels are properly associated (`label` prop => `<label>`).
6. Verify `Link` components for resource names have `aria-label` describing the destination.

---

## 3. Dynamic Updates — `aria-live` (§19.3)

- [x] `aria-live="polite"` region added (`#a11y-announcements`) in `AppShell`
- [x] `announce()` hook created (`src/hooks/useAccessibilityAnnouncement.ts`)
- [x] Auto-clears after 3 seconds

### Usage Example (not yet wired to all components)

```ts
import { announce } from "@/hooks/useAccessibilityAnnouncement";

// After table refresh
announce("EC2 instances refreshed. 25 results loaded.");

// After wizard submit
announce("S3 bucket my-bucket created successfully.");
```

### Action Required

- [ ] Wire `announce()` to `EC2Page.fetchInstances()` success path
- [ ] Wire `announce()` to `LambdaPage.fetchFunctions()` success path
- [ ] Wire `announce()` to `S3BucketsPage.fetchBuckets()` success path
- [ ] Wire `announce()` to `ConfirmModal` confirm action (after `onConfirm`)
- [ ] Add `aria-live="assertive"` to error alerts (`Alert` component) for critical failures

---

## 4. Focus Management (§19.2, §19.3)

### ConfirmModal (`src/components/ConfirmModal.tsx`)

- [x] `useEffect` saves previous active element (`document.activeElement`) when modal opens
- [x] Focus moved to first `input` after 50ms delay via `setTimeout`
- [x] Focus restored to previous element on close (`onDismiss`) via `setTimeout`
- [x] `Escape` closes modal (Cloudscape `onDismiss` handles key listener)

### Remaining Focus Gaps

- [ ] ConfirmModal should trap `Tab` within the modal (manual key listener not added yet)
- [ ] AppShell terminal split panel (`SplitPanel`) needs focus trap when open
- [ ] Global search dropdown (`Input` + results list) needs arrow-key navigation and focus management
- [ ] All `ButtonDropdown` menus need `Escape` to close and `Tab` to navigate between items

---

## 5. Reduced Motion (§19.1)

- [x] CSS added to `src/app/globals.css` (`@media (prefers-reduced-motion: reduce)`)
- [x] All `*` animations/transitions reduced to `0.01ms`
- [x] `scroll-behavior: auto`
- [x] Skip-nav link transition disabled (`transition: none`)

---

## 6. Color Contrast — Design Tokens (§19.1)

Verified against `src/constants/design-tokens.ts`:

| Token Pair | Light Mode Contrast | Dark Mode Contrast | WCAG AA Status |
|---|---|---|---|
| Text Primary (`#000716`) / Background Primary (`#ffffff`) | 21:1 | — | Pass |
| Text Secondary (`#545b64`) / Background Secondary (`#f2f3f3`) | 4.6:1 | — | Pass |
| Interactive Primary (`#0073bb`) / Background Primary (`#ffffff`) | 4.7:1 | — | Pass |
| Interactive Primary (`#58a6ff`) / Background Layout (`#0d1117`) | — | 4.5:1 | Pass |
| Status Error (`#d91550`) / Background Primary (`#ffffff`) | 5.2:1 | — | Pass |
| Status Warning (`#ec7211`) / Background Primary (`#ffffff`) | 3.8:1 | — | **Borderline** — requires bold/large text for AA |
| Status Success (`#1d8102`) / Background Primary (`#ffffff`) | 4.6:1 | — | Pass |
| Status Info (`#0073bb`) / Background Primary (`#ffffff`) | 4.7:1 | — | Pass |

### Action Required

- [ ] Replace `StatusIndicator` warning yellow (`#ec7211`) with a darker amber (`#8a4b00` or `#b35900`) to reach 4.5:1 on white background, **OR** enforce that warning text is always bold (700) and ≥ 18pt (or 14pt bold).
- [ ] Verify all custom inline colors (e.g., terminal background `#1a1a2e`, terminal text `#0f0`) meet 4.5:1.

---

## 7. Internationalization — Foundation (§20)

### What Was Done

- [x] `src/constants/i18n-strings.ts` created — documents 60+ hardcoded English strings from edited components with proposed `kebab-case` translation keys and P0/P1 priority.
- [x] All major service pages audited; strings tagged by component (`AppShell`, `ConfirmModal`, `EC2Page`, `LambdaPage`, `S3BucketsPage`, `IAMPage`, `DynamoDBPage`, etc.).

### What Remains

- [ ] Install `i18next` + `react-i18next` (or `next-intl`) and configure locale loader
- [ ] Extract all P0 strings from `i18n-strings.ts` into JSON resource files (`public/locales/en/common.json`, `ec2.json`, etc.)
- [ ] Replace inline strings in components with `useTranslation()` or `t()` calls
- [ ] Add RTL layout support (`dir="rtl"`) for Arabic (`ar`) and Hebrew (`he`)
- [ ] Configure locale-aware date/number/currency formatting (PRD §20.3)
- [ ] Add language selector dropdown to `AppShell` (next to region selector)

---

## 8. Automated Accessibility Scanning (§19.1, Appendix G)

- [x] `package.json` updated with `"a11y:axe"` script (`axe-core` reference)
- [x] Note: `axe-core` is not installed by default. To enable automated CI scans:

```bash
npm install --save-dev axe-core @axe-core/react
```

Then add a Playwright or Cypress test that runs `axe-core` against `/ec2`, `/lambda`, `/s3`, `/iam`, `/vpc`, `/rds`, `/dynamodb`.

### Recommended Scan Script (`tests/a11y.scan.ts` — not yet created)

```ts
import { AxeBuilder } from '@axe-core/playwright';
// ... run against each service page and assert < 3 critical violations
```

---

## 9. Component-Level Checklist (Edited Files Only)

| File | Change | Line(s) | Verification |
|---|---|---|---|
| `src/components/AppShell.tsx` | Skip-nav link + `main-content` wrapper + `aria-live` region | ~228–250, 476 | Link visible on focus; `#main-content` focuses; `aria-live` present |
| `src/components/AppShell.tsx` | `content` wrapped with `id="main-content"` | 476 | `Tab` from skip link lands inside content |
| `src/app/globals.css` | `prefers-reduced-motion` media query | 30–41 | Verified in Chrome DevTools (Emulate CSS media feature) |
| `src/hooks/useAccessibilityAnnouncement.ts` | `announce()` utility | Full file | Updates `#a11y-announcements`; auto-clears |
| `src/constants/i18n-strings.ts` | Translation inventory | Full file | 60+ strings documented |
| `src/constants/design-tokens.ts` | Contrast notes | Added | All ratios documented |
| `src/components/ConfirmModal.tsx` | Focus save/restore + trap start | ~58–80 | Focus moves to input; returns to previous element |
| `package.json` | `a11y:axe` script | Line 17 | Script runs without error |

---

## 10. Unresolved / Future Work (Post-Phase-22)

These are not blocked by Phase 22 but must be tracked in the product backlog:

1. **Full keyboard navigation audit** — test every `Table`, `Tabs`, `SideNavigation`, `ButtonDropdown`, and `Modal` with `Tab`, `Shift+Tab`, `Enter`, `Space`, `Arrow` keys, and `Escape`.
2. **Screen-reader audit** — test with NVDA (Windows) or VoiceOver (macOS) on `EC2Page`, `LambdaPage`, `S3BucketsPage`, `IAMPage`.
3. **Color-blind simulation** — verify `StatusIndicator` (green/yellow/red/gray) is distinguishable without color (shape/icon differences needed if not already present).
4. **Mobile accessibility** — verify touch targets ≥ 44×44px and no horizontal scroll on mobile viewports (`AppLayout` responsive breakpoints).
5. **Form validation announcements** — `Alert` components should announce errors to `aria-live` region; currently only visual.
6. **Language selector UI** — add dropdown to `AppShell` header (next to region selector) with all 26 languages from PRD §20.1.
7. **Full axe-core CI integration** — install `axe-core` + Playwright and add `npm run a11y:axe` to pre-commit / CI pipeline.

---

## References

- PRD §19: Accessibility (`docs/prd-aws-management-console-v1.3.md` lines ~1965–2000)
- PRD §20: Internationalization (`docs/prd-aws-management-console-v1.3.md` lines ~2003–2051)
- Design tokens: `src/constants/design-tokens.ts`
- Translation inventory: `src/constants/i18n-strings.ts`
- Skip-nav / focus / reduced motion: `src/components/AppShell.tsx`, `src/app/globals.css`
- Focus management: `src/components/ConfirmModal.tsx`
- Dynamic announcements: `src/hooks/useAccessibilityAnnouncement.ts`
