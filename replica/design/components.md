# Component Specifications

Every component below is a spec block: variants, sizes, states, tokens, a11y,
and the screens (S-IDs from recon.md) where it appears. Build these in
isolation first (a `/design` route or Storybook), screenshot them, then use
them in screens.

---

## TopBand
**Role:** Sticky dark top navigation band, full viewport width.
**Variants:** none (single dark theme).
**Sizes:** height 44px fixed.
**States:** default, scrolled (sticky always on).
**Tokens:** bg nav-bg, text nav-text, border nav-border.
**A11y:** Skip-to-content link as first focusable; logo link has accessible name "AWS Management Console"; every utility button has aria-label.
**Used on:** All screens (S01–S13).

## BrandMark
**Role:** AWS smiling-arrow logo + "Console" wordmark.
**Variants:** none.
**Sizes:** logo 26x26px, wordmark 20px font.
**States:** default, hover (slight background lift).
**Tokens:** bg nav-bg, text nav-text, accent brand orange (#ff9900).
**A11y:** svg aria-hidden, link text provides the name.
**Used on:** S01, S07.

## ServicesButton
**Role:** Opens the Services overlay panel.
**Variants:** default.
**Sizes:** min-height 44px, padding 0 12px.
**States:** default, hover (bg nav-hover), active (open overlay).
**Tokens:** bg nav-bg, text nav-text, border nav-border (transparent default).
**A11y:** aria-label "Open services"; keyboard Enter/Space.
**Used on:** S03.

## SearchField
**Role:** Global service search input.
**Variants:** default.
**Sizes:** height 32px, min-width 220px, max-width 620px.
**States:** empty, focused, has-value, disabled (when emulator unreachable).
**Tokens:** bg search-bg, border search-border, text nav-text, muted #6b7785 placeholder.
**A11y:** aria-label "Search AWS services"; magnifying glass svg aria-hidden; [Alt+S] kbd hint visible.
**Used on:** S04.

## RegionSelector
**Role:** Region picker trigger and dropdown.
**Variants:** default.
**Sizes:** min-height 36px.
**States:** default, hover (bg nav-hover), open (dropdown showing region list).
**Tokens:** bg nav-bg, text nav-text, border nav-border.
**A11y:** aria-label "Change AWS Region"; region list items are real links/buttons with aria-selected.
**Used on:** S05.

## AccountMenu
**Role:** Account profile and sign-out trigger.
**Variants:** default.
**Sizes:** min-height 36px.
**States:** default, hover, open (dropdown with provider label, username, sign out).
**Tokens:** bg nav-bg, text nav-text.
**A11y:** aria-label "Account menu"; sign-out button is a real button.
**Used on:** S06.

## UtilityButton
**Role:** Terminal, notifications, support, theme toggle.
**Variants:** terminal, notifications (with badge dot), support, theme.
**Sizes:** min-height 44px, square-ish 44x44.
**States:** default, hover (bg nav-hover), active, notifications-badge (red dot #ff3d00).
**Tokens:** bg nav-bg, text nav-text, danger (badge).
**A11y:** Each has unique aria-label; focus ring 2px accent; badge is presentational (aria-hidden) with label on parent.
**Used on:** S12 (notifications), S13 (terminal).

## BreadcrumbGroup
**Role:** Path breadcrumbs Home > Service > Resource.
**Variants:** default.
**Sizes:** 12px font.
**States:** default, last-item (current, not a link).
**Tokens:** text text-muted (links), text text (current), accent (link hover underline).
**A11y:** Cloudscape BreadcrumbGroup; each crumb is a link except current; aria-label "Breadcrumb".
**Used on:** S07–S10.

## AwsServiceHeader
**Role:** Service page header: icon + service name + resource counter + primary create button + secondary actions.
**Variants:** with/without counter, with/without primary action.
**Sizes:** icon 24x24px, name font-weight 600, counter parens.
**States:** default.
**Tokens:** bg surface, text text, accent for counter and primary button border/hover.
**A11y:** Header variant="h1"; icon decorative (aria-hidden); create button is real button with clear label.
**Used on:** S07.

## PrimaryCreateButton
**Role:** "Create X" primary action on service pages.
**Variants:** default, disabled.
**Sizes:** min-height 32px, padding 0 16px.
**States:** default, hover (border accent, text accent), disabled (50% opacity, not-allowed cursor).
**Tokens:** border border-input, bg surface, text text, accent on hover.
**A11y:** real `<button>`, visible focus, disabled state communicated.
**Used on:** S07.

## ResourceTable
**Role:** Main resource list: filter, multi-select, actions dropdown, pagination, column preferences, empty state.
**Variants:** with/without actions, with/without create.
**Sizes:** rows min-height 32px, font 13px.
**States:** empty, loading, filled, error; row selected (bg hl #eaf3fb, text accent); row hovered (bg #f2f3f3).
**Tokens:** bg surface, border border, text text, text-muted for muted cells, accent for selected row dot and link.
**A11y:** Cloudscape Table; selection group has aria-label; sort buttons have aria-sort; filter has aria-label; pagination has aria-labels.
**Used on:** S07.

## SideNavLink / SideNavGroup
**Role:** Side rail navigation items and group headers.
**Variants:** link, group-header.
**Sizes:** link min-height 32px; group header font 11px uppercase muted.
**States:** default, hover (bg #f2f3f3), active (bg #eaf3fb, text accent, font-weight 700, dot accent).
**Tokens:** bg surface, text text, accent for active.
**A11y:** aria-current="page" on active link; group headers have no role (presentational).
**Used on:** S07–S10.

## SideRail
**Role:** Fixed 250px left navigation column.
**Variants:** global (Console Home: Recent visited / Favorites), service (contextual nav + Additional services).
**Sizes:** width 250px, collapses below 760px.
**States:** expanded, collapsed (toggle button).
**Tokens:** bg surface, border border (right edge).
**A11y:** aria-label "Service navigation"; Escape closes; toggle has aria-expanded/aria-controls.
**Used on:** S07–S10.

## ConfirmDialog
**Role:** Destructive-action confirmation modal.
**Variants:** warning, error.
**Sizes:** modal width ~420px.
**States:** open, closed.
**Tokens:** bg surface, text text, danger (error variant text/border), ok (success).
**A11y:** Cloudscape Modal; focus trapped; confirm button is primary and matches variant danger; cancel dismisses; Escape closes.
**Used on:** S11.

## Flashbar
**Role:** Status/toast strip between top band and body.
**Variants:** success, error, warning, info.
**Sizes:** full width, dismissible items.
**States:** visible, hidden (dismissed).
**Tokens:** per-variant background/text; dismiss button text-muted.
**A11y:** Cloudscape Flashbar; role alert for error, status otherwise; dismiss button has aria-label; each item has statusIconAriaLabel.
**Used on:** S12.

## TerminalPanel
**Role:** CLI shell docked to the right (desktop) or below (narrow).
**Variants:** docked, below.
**Sizes:** width 520px docked; full width below; min-height 320px.
**States:** open, closed; typing, executing.
**Tokens:** bg surface, border border (left edge when docked, top edge when below).
**A11y:** xterm terminal region; focus management; commands announced? (best effort).
**Used on:** S13.

## StatusBadge
**Role:** Small pill badge for resource state.
**Variants:** success, warning, error, info.
**Sizes:** height auto, padding 0 12px, font 13px.
**States:** default.
**Tokens:** per-variant bg/text (e.g. success green #1d8102 on light green).
**A11y:** text label conveys meaning; color alone never used (badge has text).
**Used on:** S07, S09.

## EmptyState
**Role:** "No X found" state with optional create action.
**Variants:** with/without create action.
**Sizes:** centered, max-width ~420px.
**States:** default.
**Tokens:** bg surface, text text-muted for description, accent for action button.
**A11y:** heading describes state; action button is real button; no colour-only meaning.
**Used on:** S07.

## ErrorState / ErrorAlert
**Role:** Error message with retry/dismiss.
**Variants:** inline alert, modal.
**Sizes:** inline full width of container.
**States:** visible, dismissed.
**Tokens:** danger bg/text.
**A11y:** Cloudscape Alert type="error"; role alert; dismiss button aria-label.
**Used on:** S07.

## ConfirmModal (generic)
**Role:** Generic confirmation modal for delete/archive actions.
**Variants:** warning, error.
**Sizes:** ~420px wide.
**States:** open, closed.
**Tokens:** bg surface, text text, variant-specific accent/danger.
**A11y:** role dialog; focus trapped; confirm primary; cancel secondary; Escape closes.
**Used on:** S11 (and any delete flow).

## CrossServiceLinks
**Role:** Dependent-service create actions menu ("In another service").
**Variants:** default.
**Sizes:** trigger button min-height 36px; dropdown items min-height 36px with description.
**States:** default, open, item hover (bg #eaf3fb).
**Tokens:** bg surface, text text, border border.
**A11y:** Cloudscape ButtonDropdown; aria-label on trigger; items are real links with descriptions.
**Used on:** S07.

## PageHeaderActions
**Role:** Secondary actions row next to primary create on service pages.
**Variants:** none.
**Sizes:** gap 8px.
**States:** default, item disabled.
**Tokens:** bg surface, text text, hover bg #eaf3fb.
**A11y:** each button has visible label; disabled state communicated.
**Used on:** S07–S10.

---

## Contrast Requirements (WCAG 2.2 AA)
All text/background pairs must pass:
- body text: 4.5:1
- large text (24px+ or 18.66px bold): 3:1
- UI components and focus rings: 3:1

Run: `python3 contrast.py replica/design/tokens.json` — must exit 0.

## Next
Primitives built in code; then `/replica-build`.