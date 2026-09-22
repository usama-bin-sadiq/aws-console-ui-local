# Architecture Documentation

## Overview

Local AWS Emulator Console is a Next.js application that provides an AWS Management Console-style interface for local development using AWS service emulators (LocalStack and MiniStack).

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Client Browser                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React 19 + Next.js 15 App Router                        │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  Cloudscape Design System Components               │  │   │
│  │  │  ┌─────────┐ ┌──────────┐ ┌──────────────────┐   │  │   │
│  │  │  │ TopNav  │ │ SideNav  │ │ ContentArea      │   │  │   │
│  │  │  │(Search, │ │(Services │ │ (Service Pages,  │   │  │   │
│  │  │  │ Region, │ │ Groups)  │ │  Dashboards,     │   │  │   │
│  │  │  │ Account)│ │          │ │  Wizards, Tables) │   │  │   │
│  │  │  └─────────┘ └──────────┘ └──────────────────┘   │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  State Management: Zustand + React Context         │  │   │
│  │  │  ┌───────────┐ ┌───────────┐ ┌──────────────────┐ │  │   │
│  │  │  │Settings   │ │Auth       │ │Notifications    │ │  │   │
│  │  │  │(Zustand)  │ │(Context)  │ │(Context)        │ │  │   │
│  │  │  └───────────┘ └───────────┘ └──────────────────┘ │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  Terminal: xterm.js CloudShell Alternative         │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Next.js Server Layer                         │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  API Routes (src/app/api/)                                 │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │  │
│  │  │ /auth    │ │ /health  │ │ /{svc}  │ │ /favorites   │  │  │
│  │  │ (bcrypt, │ │ (probe)  │ │ (proxy) │ │ (CRUD)       │  │  │
│  │  │ rate-lim)│ │          │ │         │ │              │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │  Rate Limiter (in-memory)                            │  │  │
│  │  │  ┌──────────────────────────────────────────────┐    │  │  │
│  │  │  │  checkRateLimit()  resetRateLimit()          │    │  │  │
│  │  │  └──────────────────────────────────────────────┘    │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Database (SQLite via better-sqlite3)                      │  │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │  │
│  │  │ users     │ │favorites  │ │recently_  │ │terminal_  │  │  │
│  │  │(bcrypt)   │ │           │ │visited    │ │history    │  │  │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Adapter Layer                                │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  AdapterFactory (createAdapter)                            │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │  resolveEndpoint()  injectAuth()                     │  │  │
│  │  │  mapRequest()         normalizeResponse()            │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────┐    ┌──────────────────┐            │  │
│  │  │ LocalStack       │    │ MiniStack        │            │  │
│  │  │ Adapter          │    │ Adapter          │            │  │
│  │  └──────────────────┘    └──────────────────┘            │  │
│  │  ┌──────────────────┐    ┌──────────────────┐            │  │
│  │  │ LocalStack       │    │ MiniStack        │            │  │
│  │  │ Endpoint:4566    │    │ Endpoint:4566    │            │  │
│  │  │ Full Coverage    │    │ Partial Coverage │            │  │
│  │  └──────────────────┘    └──────────────────┘            │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                     AWS Emulators                                │
│  ┌────────────────────┐    ┌────────────────────┐              │
│  │   LocalStack       │    │   MiniStack        │              │
│  │   (Port 4566)      │    │   (Port 4566)      │              │
│  │   200+ Services    │    │   60+ Services     │              │
│  │   Full Coverage    │    │   Partial Coverage │              │
│  │   Docker           │    │   Docker           │              │
│  │   Docker Socket    │    │   Docker Socket    │              │
│  └────────────────────┘    └────────────────────┘              │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow

1. **User Action** → React component triggers API call
2. **API Route** → Validates request, applies rate limiting
3. **Adapter Layer** → Maps request to emulator endpoint
4. **Emulator** → Processes request, returns response
5. **Response Normalizer** → Standardizes response format
6. **UI Update** → Cloudscape component renders result

## Component Architecture

### Layout Components

- **AppShell**: Main layout wrapper (TopNavigation, AppLayout, Footer)
- **AwsConsoleSidebar**: Service navigation sidebar
- **RootLayoutClient**: Conditional layout wrapping
- **Providers**: React context providers

### Service Components

- **Dashboard**: Console home with service grid
- **ResourceTable**: Generic table component for collections
- **Service-specific**: EC2InstanceTable, S3BucketTable, etc.

### Shared Components

- **TagEditor**: Resource tag management
- **JsonEditor**: JSON editing with CodeMirror
- **InfiniteScrollSelect**: Paginated selection
- **Widget**: Dashboard widget container

## State Management

### Zustand Stores

- **Settings Store**: Region, theme, provider, favorites
- **Persistent**: localStorage via zustand persist middleware

### React Context

- **AuthContext**: User authentication, permissions, credentials
- **NotificationContext**: Toast notifications (Flashbar)

### Local State

- Component-level state for UI interactions
- URL state for filters, pagination, search

## Capability-Aware Navigation

### Service Registry

The `service-compatibility.ts` file maintains a registry of 150 services with their adapter status for each backend.

```typescript
interface ServiceCompatibilityEntry {
  routeDir: string;        // e.g., 'ec2', 's3'
  serviceName: string;      // e.g., 'Amazon EC2'
  adapterStatusLocalStack: AdapterStatus;  // FULL, PARTIAL, NOT_SUPPORTED
  adapterStatusMinStack: AdapterStatus;
  sdkClient: string;        // e.g., '@aws-sdk/client-ec2'
  hasRouteInRepo: boolean;  // Verified in src/app/
}
```

### Navigation Filtering

`getAvailableNavigationItems()` filters the full navigation list based on:
1. Active backend (LocalStack or MiniStack)
2. Provider health status
3. Individual service availability

Services are shown as:
- **Available**: Full support — clickable
- **Partial**: Limited operations — clickable with warnings
- **Unsupported**: Not available — disabled with reason
- **Unknown**: Health not reported — disabled

## Security Model

### Authentication

- **Local SQLite database** with user management
- **bcrypt hashing** for passwords (12 rounds)
- **TOTP MFA** support via otplib
- **Rate limiting** (5 attempts/15min for sign-in)
- **Session management** via localStorage (development mode)

### Default Users

| Username | Password | Role | Permissions |
|----------|----------|------|-------------|
| root | root123 | Root/Super Admin | All (*) |
| admin | admin123 | Admin | All (*) |
| readonly | readonly123 | Viewer | Read-only |

### Rate Limiting

| Action | Window | Max Requests |
|--------|--------|-------------|
| signin | 15 min | 5 |
| signup | 1 hour | 3 |
| resetPassword | 1 hour | 3 |

## Testing Strategy

### Unit Tests (Vitest)

- Database operations (db.test.ts)
- Rate limiter logic (rate-limiter.test.ts)
- Adapter functions (localstack-adapter/*.test.ts)
- Custom hooks (use*.test.ts)
- State management (stores/*.test.ts)

### Integration Tests

- API route handlers (auth, health, services)
- Database interactions
- Adapter request/response mapping

### E2E Tests (Playwright)

- Authentication flows (sign-in, sign-up, MFA)
- Navigation (sidebar, search, breadcrumbs)
- Service workflows (create, read, update, delete)
- Responsive behavior (320px, desktop, 400% zoom)

### Visual Regression Tests

- Baseline screenshots for key pages
- Comparison on every commit
- Manual update workflow

## Deployment

### Docker Compose

Three configurations available:
1. `docker-compose.localstack.yml` — LocalStack only
2. `docker-compose.ministack.yml` — MiniStack only
3. `docker-compose.both.yml` — Both backends

### Standalone Build

```bash
pnpm build
# Output: .next/standalone/
# Deploy to any Node.js 20+ server
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.3 |
| Language | TypeScript 5.9 (strict mode) |
| UI Library | React 19 + Cloudscape Design System |
| State | Zustand + React Context |
| Database | SQLite (better-sqlite3) |
| Auth | bcrypt + TOTP |
| HTTP Client | AWS SDK v3 |
| Terminal | xterm.js |
| Testing | Vitest + Playwright |
| Linting | ESLint 9 |
| Build | Next.js (standalone output) |

## Design Decisions (ADRs)

All architectural decisions are documented in `docs/adr/`:

| ADR | Title | Status |
|-----|-------|--------|
| ADR-001 | Cloudscape Design System for UI | Accepted |
| ADR-002 | Adapter Pattern for Multi-Backend | Accepted |
| ADR-003 | Capability-Aware Navigation | Accepted |
| ADR-004 | SQLite for Local Auth (with bcrypt) | Accepted |
| ADR-005 | Next.js App Router + React 19 | Accepted |
