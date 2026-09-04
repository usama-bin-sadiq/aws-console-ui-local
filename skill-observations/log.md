# Skill Observations

### Observation 1: Shared emulator parity must own discovery
- The repository had compatibility metadata and health checks, but navigation, search, dashboard, and SDK clients each bypassed parts of that contract. A pure availability resolver plus focused tests provided the smallest reliable integration point.
- Repository-wide validation was noisy because Vitest collected Playwright specs and the existing TypeScript/ESLint toolchain is incompatible; editor diagnostics and focused Vitest tests were the dependable gates.

