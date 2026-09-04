# Cloudscape Strict Rules — AWS Console Clone

A consolidated, enforceable rulebook (not phased prompts) for keeping this project visually and behaviorally consistent with the real AWS Console / Cloudscape Design System. Feed this file directly to your AI coding assistant as a standing style guide (e.g. drop it in as `CLAUDE.md`, `.cursorrules`, or paste it at the top of any UI-related prompt) so every change gets checked against it, not just the initial refactor.

Format: every rule is **Always** / **Never** / **Rule** — imperative, no ambiguity, no "it depends."

---

## 1. Color & Tokens

- **Always** use Cloudscape design tokens (`@cloudscape-design/design-tokens`) for color — never a raw hex value in component code.
- **Always** map: page background → `color-background-layout-main`, card/panel background → `color-background-container-content`, body text → `color-text-body-default`, dividers → `color-border-divider-default`, primary action → `color-background-button-primary-default`.
- **Never** introduce a new accent color not present in the Cloudscape palette.
- **Rule:** status color always follows meaning — green = success/available, red = error/failed, blue = info/in-progress, grey = stopped/inactive. Never swap these for stylistic reasons.
- **Never** rely on color alone to convey status — always pair color with an icon or text label (accessibility requirement, not optional).

## 2. Typography

- **Always** use Open Sans as the typeface, loaded via `@cloudscape-design/global-styles`.
- **Always** follow the Cloudscape type scale for headings/body/small text — do not invent custom font sizes.
- **Never** make page `<h1>` titles larger/bolder than Cloudscape's actual heading weight — the real console's headings are restrained, not oversized SaaS-marketing headings.
- **Never** use all-caps labels or letter-spaced "eyebrow" text above headings — not a Cloudscape pattern.

## 3. Spacing & Layout

- **Always** use the Cloudscape spacing scale (`space-xxxs` → `space-xxl`, 4px increments) for margin/padding.
- **Never** use arbitrary pixel values for spacing (`padding: 13px`, `margin: 7px`, etc.).
- **Rule:** border radius stays small (4–8px). **Never** apply large/full rounding to containers, cards, or tables.
- **Rule:** prefer 1px borders over drop shadows for separating containers. Heavy soft shadows are not a Cloudscape pattern.

## 4. App Shell & Navigation

- **Always** structure the shell as: fixed top navigation bar → collapsible left side navigation → breadcrumbs → page header (title + actions) → content container.
- **Always** show an active-state indicator on the current side-nav item (left border accent), not just a background tint.
- **Always** support side-nav collapse to icon-only mode.
- **Never** put primary page actions (Create, Delete, etc.) anywhere except the top-right of the page Header component.

## 5. Buttons & Interactive Elements

- **Always** set `white-space: nowrap` on every button and link label. Text inside an interactive control must never wrap — not even at the smallest supported width.
- **Always** set `flex-shrink: 0` on buttons inside flex containers, or `min-width: max-content` inside grid containers. A button's minimum width is its content width — never smaller.
- **Never** apply `word-break: break-all` or `overflow-wrap: anywhere` to any button or link text, anywhere in the app, under any circumstance.
- **Never** size a button or its container to a fixed pixel width chosen without checking the longest possible label it will contain.
- **Always** show a visible 2px focus ring on keyboard focus for every interactive element — never rely on the browser default outline being visible, but never remove it without replacing it.
- **Rule:** buttons come in exactly these variants — primary (filled blue), normal (outlined), link (text-only), icon-only. Don't invent new button styles.

## 6. Forms

- **Always** use the label-above-input pattern, with optional description below the label and error/constraint text below the field (Cloudscape FormField pattern).
- **Always** show a required-field indicator consistently (same symbol/position everywhere).
- **Never** validate only on submit if the field type supports inline validation — show errors as the user completes the field.
- **Always** collapse multi-column form layouts to a single column below ~600px width.

## 7. Tables & Data Views

- **Always** put the table title + item count top-left of the table header, and primary/bulk actions top-right.
- **Always** put search/filter controls in a toolbar row above the table body, with a preferences (density/column visibility) icon top-right of that toolbar.
- **Never** use alternating row-color striping — use hover-row highlighting instead.
- **Always** collapse multiple row-level actions (3+) into a single `ButtonDropdown` labeled "Actions", or use icon-only buttons with tooltips. **Never** render 3+ full-text buttons stacked or crammed into a row's action cell.
- **Always** size the Actions column to `auto` / content width — never a fixed px value.
- **Always** let the table scroll horizontally (`overflow-x: auto` on its wrapper) when content doesn't fit. **Never** compress column content or button labels to force a fit.
- **Always** implement a real empty state (icon + message + primary action) — never a blank flash of nothing while data loads or when a list is empty.
- **Always** show inline loading feedback (spinner/skeleton) during data fetches — never a frozen table with no indication of activity.

## 8. Responsive Behavior

- **Rule:** breakpoints are ≥1200px (full layout), 768–1199px (side nav auto-collapses to icons, panels become overlays), <768px (side nav becomes a slide-in drawer, top bar overflows non-essential icons into a menu).
- **Never** allow a page-level horizontal scrollbar. The only acceptable horizontal scroll is inside a table's own wrapper.
- **Always** verify every screen at 1920px, 1440px, 1024px, 768px, and 375px before considering a component "done."
- **Always** give every touch target a minimum 44×44px hit area on touch viewports, even if the visible element is smaller.
- **Never** let text — anywhere, not just in buttons — wrap character-by-character. If a container can't fit a word, the container is wrong, not the text.

## 9. Motion & Feedback

- **Rule:** transitions are short — 150–200ms, ease timing. **Never** use bouncy, slow, or decorative animation.
- **Always** give every async action (button click, page navigate, data fetch) visible loading feedback.
- **Always** respect `prefers-reduced-motion` — disable non-essential transitions when it's set.
- **Rule:** success messages in the Flashbar auto-dismiss after a few seconds; error messages persist until the user dismisses them.

## 10. Accessibility

- **Always** meet WCAG 2.1 AA contrast: 4.5:1 for body text, 3:1 for large text and UI components.
- **Always** make every feature keyboard-operable with a logical tab order.
- **Always** trap focus inside open modals/drawers and return focus to the trigger element on close.
- **Always** label icon-only buttons with `aria-label`.
- **Always** associate form error text with its field via `aria-describedby` (or equivalent).
- **Never** convey required information through color or icon alone without a text/ARIA equivalent.

## 11. Banned Patterns (never do these, full stop)

- Stacked full-text action buttons in a table row (use a dropdown or icons instead).
- `word-break: break-all` / `overflow-wrap: anywhere` on any interactive label.
- Fixed pixel widths on buttons, action columns, or anything containing variable-length text.
- Large border radius or heavy card shadows (generic SaaS-template look, not Cloudscape).
- All-caps eyebrow labels, oversized marketing-style headings, decorative gradients.
- Alternating row-stripe tables.
- Any UI element with no loading/empty/error state defined.
- Removing focus outlines without providing a visible replacement.