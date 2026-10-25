-- replica/schema.sql
-- Applied via drizzle-kit / better-sqlite3 migrations.
-- Single-file SQLite schema for the AWS Console emulator clone.

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
create index if not exists idx_resources_service_region on resources (service_id, region);
create index if not exists idx_resources_state on resources (state);
create index if not exists idx_resources_name on resources (name);

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
create index if not exists idx_health_checks_service_time on health_checks (service_id, checked_at desc);

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
create index if not exists idx_audit_events_service_time on audit_events (service, timestamp desc);
create index if not exists idx_audit_events_resource on audit_events (resource_id);

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
