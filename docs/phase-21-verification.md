# Phase 21 Verification Gate Checklist — Global UI

Reference: `docs/prd-aws-management-console-v1.3.md` §7, §8, §11, §13, §14

## 1. AppShell (Console Shell)
- [x] Account menu updated with working links (Profile, Organization, Security Credentials, Billing, Service Quotas, Console Settings, Sign Out)
- [x] Documentation (`/docs`) and Support (`/support`) links present in top navigation utilities
- [x] Notifications dropdown (bell icon) shows adapter status, service health, announcements
- [x] Footer added with copyright (`© 2008-2026 Amazon Web Services, Inc.`), links (Privacy, Legal, Communications Preferences), version/build info
- [x] Region selector works and updates store
- [x] Provider indicator shows `LOCALSTACK` / `MINSTACK` / `AWS`
- [x] Theme toggle (dark/light) works
- [x] Terminal button opens/closes split panel and persists to `localStorage`

## 2. Navigation & Favorites
- [x] Favorites section rendered in SideNavigation via Zustand store (`useSettingsStore`)
- [x] Favorites persist across sessions (`aws-console-settings` persist middleware)
- [x] Add/remove/reorder favorites implemented (`addFavorite`, `removeFavorite`, `reorderFavorites`)
- [x] Favorites pulled from `src/stores/settings.ts` and mapped to `SideNavigation` expandable-link-group
- [x] Recently Visited dropdown preserved

## 3. Dashboard (`src/app/page.tsx` -> `Dashboard`)
- [x] Service status cards use `/api/health` adapter endpoint (live `data.services` and `data.status`)
- [x] Adapter connection state shown (`connected` / `disconnected` / `checking`)
- [x] Service health mapped from adapter response (FULL / AVAILABLE / Partial / Not Supported)
- [x] Resource summary cards show adapter mode, endpoint, service counts
- [x] Recently Visited section shows service cards with quick links

## 4. Keyboard Shortcuts (AppShell-level)
- [x] `Ctrl+K` (or `Cmd+K`) focuses search input and opens dropdown
- [x] `Esc` closes search dropdown, notifications dropdown, and terminal split panel
- [x] Arrow navigation (`Up`/`Down`) and `Enter` selection handled in search dropdown via `useEffect`

## 5. Global Search Results
- [x] `useGlobalSearch` searches across `ALL_SERVICES` (navigation links) + `SERVICE_REGISTRY` (150 services)
- [x] Results grouped by category (`Compute`, `Storage`, `Database`, etc.)
- [x] Recent searches persisted to `localStorage` (`aws_recent_searches`)
- [x] Fuzzy text match on service name, description, and category

## 6. Footer
- [x] Copyright text matches AWS standard
- [x] Privacy, Legal, Communications Preferences links present
- [x] Build/version info shown (`Console v2.45.1 | Build 2026.09.01`)
- [x] Active backend indicator (`LOCALSTACK` / `MINSTACK` / `AWS`)

## 7. Settings Store (`src/stores/settings.ts`)
- [x] Favorites array (`FavoriteItem[]`) added to `SettingsState`
- [x] `addFavorite`, `removeFavorite`, `reorderFavorites` actions exported
- [x] Persistence via `zustand` `persist` middleware (`aws-console-settings`)
- [x] Type definitions exported (`FavoriteItem`, `SettingsState`)

## 8. Accessibility & Design Tokens
- [x] All interactive elements have `aria-label`
- [x] Tables (if any) use `th` headers and `scope`
- [x] Focus visible on interactive elements
- [x] Colors use `var(--awsui-color-*)` tokens (Cloudscape design system)
- [x] No inline `any` types in new public interfaces

## 9. Security & Safety
- [x] Adapter dummy credentials (`test`/`test`) never transmitted to real AWS endpoints
- [x] No secrets in URLs or localStorage (except adapter settings and user preferences)
- [x] Real AWS target requires explicit opt-in (`ALLOW_REAL_AWS_TARGET` guard per Appendix D.5)
- [x] No destructive actions allowed against real AWS without typed confirmation

## 10. Build / Type Verification
- [x] TypeScript strict mode passes (`npm run build` or `npm run lint`)
- [x] No compilation errors in `AppShell.tsx`, `Dashboard/index.tsx`, `useGlobalSearch.ts`, `stores/settings.ts`
- [x] Component props use explicit interfaces (`AppShell`, `Dashboard`, `NotificationCenter`)

---
**Phase 21 Status:** Global UI edits delivered. Focused on Console Shell (AppShell), Navigation (favorites via Zustand), Dashboard (adapter health cards), Keyboard Shortcuts, Footer, Search (SERVICE_REGISTRY coverage), and Settings persistence.
