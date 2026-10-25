# Architecture: aws-console (a rebuild of AWS Management Console's core features)

## Stack

| layer | choice | why |
| --- | --- | --- |
| web | Next.js (App Router) + TypeScript | Already in repo; React Server Components + client components fit the shell/service-page split |
| database | SQLite (better-sqlite3) via Drizzle ORM | Already in repo; zero-config, file-based, matches LocalStack/Ministack local-first model |
| auth | NextAuth-style session + AuthContext | Already in repo; provider is LocalStack/Ministack emulator, not external identity |
| payments | none | Emulator console; no billing |
| email | none | Emulator console; no outbound email |
| jobs | Next.js route handlers + in-memory queue | Already in repo; emulator adapters are synchronous route handlers |
| files | local filesystem + SQLite BLOBs for small assets | Already in repo; icons are static files in /public |
| hosting | Vercel / Node.js | Already in repo; deployable via `next start` |

## Schema

Tables: 7. Access rules: data-layer checks (every API route validates the session/region/provider before touching data).

```sql
-- replica/schema.sql (applied via drizzle-kit / better-sqlite3 migrations)

create table if not exists services (
  id text primary key,
  name text not null,
  href text not null unique,
  category text not null,
  icon text,
  status text not null default 'full'
    check (status in ('full','partial','not-supported')),
  description text,
  created_at text not null default (datetime('now')),
  updated_at text not null default (datetime('now'))
);

create table if not exists resources (
  id text primary key,
  service_id text not null references services(id) on delete cascade,
  name text not null,
  arn text,
  state text not null default 'pending',
  region text not null default 'us-east-1',
  created_at text not null default (datetime('now')),
  updated_at text not null default (datetime('now')),
  tags text, -- JSON object string
  attributes text -- JSON object string
);
create index on resources (service_id, region);
create index on resources (state);
create index on resources (name);

create table if not exists accounts (
  id text primary key,
  username text not null unique,
  provider text not null default 'localstack'
    check (provider in ('localstack','ministack','localemu')),
  region text not null default 'us-east-1',
  access_key_id text,
  created_at text not null default (datetime('now')),
  updated_at text not null default (datetime('now'))
);

create table if not exists health_checks (
  service_id text not null references services(id) on delete cascade,
  status text not null
    check (status in ('healthy','degraded','starting','unreachable')),
  adapter_mode text not null,
  checked_at text not null default (datetime('now')),
  primary key (service_id, checked_at)
);
create index on health_checks (service_id, checked_at desc);

create table if not exists audit_events (
  id text primary key,
  event_name text not null,
  service text not null,
  resource_id text,
  user_id text,
  timestamp text not null default (datetime('now')),
  outcome text not null
    check (outcome in ('success','failure')),
  details text -- JSON object string
);
create index on audit_events (service, timestamp desc);
create index on audit_events (resource_id);

create table if not exists favorites (
  user_id text not null references accounts(id) on delete cascade,
  service_href text not null,
  created_at text not null default (datetime('now')),
  primary key (user_id, service_href)
);

create table if not exists recently_visited (
  user_id text not null references accounts(id) on delete cascade,
  service_href text not null,
  visited_at text not null default (datetime('now')),
  primary key (user_id, service_href)
);
```

## API

| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| GET /api/health | emulator health + service status | any | none | { status, services, provider } | S01, S12 |
| POST /api/auth/login | create session | any | { username, provider } | { session, user } | S02 |
| POST /api/auth/logout | destroy session | authenticated | none | { ok } | S06 |
| GET /api/region | current region | authenticated | none | { region } | S05 |
| POST /api/region | change region | authenticated | { region } | { region } | S05 |
| GET /api/:service | list resources | authenticated | query params | { items[], count } | S07 |
| POST /api/:service | create resource | authenticated | body (service-specific) | { resource } | S08 |
| GET /api/:service/:id | get resource detail | authenticated | path params | { resource } | S09 |
| PUT /api/:service/:id | update resource | authenticated | body | { resource } | S10 |
| DELETE /api/:service/:id | delete resource | authenticated | path params | { ok } | S05/S07 |
| POST /api/:service/:id/action | instance action (start/stop/reboot/terminate) | authenticated | { action, instanceIds } | { ok } | S07 |
| POST /api/terminal | execute CLI command | authenticated | { command } | { output } | S13 |
| GET /api/search | global service search | authenticated | { q } | { results[] } | S04 |

Webhooks in: none. Webhooks out: none.
Jobs: none (emulator adapters are synchronous; no background jobs required).

## The parts that bite

- time zones: stored as ISO 8601 UTC strings; displayed in user's selected region timezone where applicable
- idempotency: create/delete actions are keyed by resource name within a service+region; duplicate creates return existing resource (Emulator idempotency, not AWS eventual consistency)
- races: SQLite file-level locking; write actions serialized per service+region via in-memory mutex; no distributed locking needed (single-node emulator)
- rate limits: none enforced (emulator); client-side debounce on search and refresh
- file size limits: none (icons are static SVGs under 50KB)
- search: client-side filter on ResourceTable; server-side /api/search for cross-service name matching
- realtime: none (polling via refresh button); no WebSocket
- offline: none (requires emulator backend); static assets cached by browser
- email deliverability: none
- multi-tenancy: none (single account per session; provider/region isolates data)
- GDPR deletion: none (local emulator; no personal data persisted beyond session)

## Build order

1. **Vertical slice.** S01 (Home), S07 (EC2 list), S08 (create instance wizard), S09 (instance detail), S11 (confirm delete). Tables: services, resources, accounts, health_checks. Routes: /api/health, /api/ec2, POST /api/auth/login. Proves shell + table + wizard + detail.
2. **Must-haves.** All `must` features in features.csv: every service list page (S07), create wizard (S08), detail page (S09), edit (S10), delete confirm (S11), search (S04), region (S05), account (S06), notifications (S12), terminal (S13). ~150 service routes all sharing the same ResourceTable + AwsServiceHeader + AwsServicePage components.
3. **Should-haves.** Recently visited / favorites persistence, column preferences, sorting, service detail tabs (Details/Tags/Monitoring), parameter store, secret value reveal, CloudWatch alarms.
4. **Fixes from replica-entrepreneur.** Once it has run, add the gaps users report (missing states, wrong icons, broken flows).

## Summary

Stack: Next.js + TypeScript + SQLite (better-sqlite3) + Drizzle, single-node emulator, no microservices.  
Table count: 7.  
Route count: ~11 shared API routes + ~150 service-specific routes (all served by generic /api/:service handler).  
Three riskiest parts: (1) per-service create wizards with service-specific forms, (2) detail tab sets per resource type (EC2 has different tabs than S3), (3) generic /api/:service handler mapping to the right emulator adapter behind the scenes.  
Next step: `/replica-design`.