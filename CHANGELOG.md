# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- bcrypt password hashing (12 rounds) for all user credentials
- In-memory rate limiting for auth endpoints (5 attempts/15min)
- Comprehensive README with architecture overview and quick start
- CONTRIBUTING.md with coding standards and PR guidelines
- CODE_OF_CONDUCT.md (Contributor Covenant 2.1)
- SECURITY.md with vulnerability reporting guidelines
- MIT LICENSE with AWS attribution
- docs/architecture.md with full system architecture documentation
- ADRs (ADR-001 through ADR-005) in docs/adr/
- GitHub Actions CI/CD pipeline (lint, test, build, security, release)
- GitHub issue templates (bug report, feature request)
- GitHub PR template with checklist
- vitest.config.ts with coverage thresholds
- playwright.config.ts with responsive testing
- .env.example with all configuration variables
- .gitignore with project-specific exclusions
- CHANGELOG.md with Keep a Changelog format

### Changed
- Updated package.json with bcryptjs dependency
- Updated db.ts to use bcrypt hashSync/compareSync for password hashing
- Updated auth/route.ts with rate limiting middleware
- README updated from minimal to comprehensive open-source documentation

### Security
- Passwords now hashed with bcrypt (12 rounds) instead of plaintext storage
- Rate limiting applied to sign-in, sign-up, and password reset endpoints
- Rate limit headers included in HTTP responses (429)

## [0.1.0] - 2024-09-21

### Added
- Initial project structure with Next.js 15 + React 19
- Cloudscape Design System integration
- LocalStack and MiniStack adapter architecture
- Capability-aware navigation (150 services)
- SQLite-backed authentication with MFA support
- Dashboard with service grid, favorites, recently visited
- Global search with Autosuggest
- Terminal integration (xterm.js)
- Dark/light theme support
- Responsive layout (320px, 400% zoom)
- E2E testing with Playwright
- Visual regression testing
- Accessibility testing (axe-core)
- AWS Architecture Service Icons
- Docker Compose configurations for LocalStack and MiniStack
- 30+ service pages implemented (EC2, S3, Lambda, RDS, VPC, IAM, etc.)
