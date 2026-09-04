## Phase 19 — Data Analytics (Athena, Glue, Kinesis, Firehose, OpenSearch) Verification Gate

### Files Edited / Created
- [x] `src/app/athena/page.tsx` (new — workgroups, named queries, data catalogs, query editor)
- [x] `src/app/glue-catalog/page.tsx` (enhanced — tables, crawlers tabs + modals)
- [x] `src/app/glue-job/page.tsx` (enhanced — job run, delete, start run modal)
- [x] `src/app/kinesis/page.tsx` (enhanced — analytics tab, video streams tab, stream details)
- [x] `src/app/firehose/page.tsx` (enhanced — delivery stream details, config tab)
- [x] `src/app/opensearch/page.tsx` (enhanced — pipelines tab)
- [x] `src/app/api/athena/route.ts` (enhanced — named queries, query executions)
- [x] `src/app/api/glue/route.ts` (enhanced — tables, crawlers, delete crawler)
- [x] `src/app/api/kinesis/route.ts` (enhanced — describe stream, retention update)
- [x] `src/app/api/firehose/route.ts` (enhanced — describe delivery stream)
- [x] `src/app/api/opensearch/route.ts` (enhanced — pipeline mock via adapter SDK)
- [x] `docs/verification-gate-phase19-data-analytics.md` (this file)

### PRD Alignment (§9.2.7 Analytics)
- [x] Athena sub-pages: Query editor, Workgroups, Named queries, Data catalogs — covered by `/athena` tabs
- [x] Glue sub-pages: ETL Jobs, Crawlers, Data Catalog, Databases, Tables — covered by `/glue-catalog` and `/glue-job`
- [x] Kinesis Data Streams: Data streams, Analytics, Firehose, Video Streams — covered by `/kinesis` tabs
- [x] Data Firehose: Delivery streams — covered by `/firehose` tabs
- [x] OpenSearch Service: Domains, Pipelines — covered by `/opensearch` tabs
- [x] Design tokens (`Cloudscape` components, `var(--awsui-color-*)`) — no custom CSS colors
- [x] All interactive elements have `formAction="none"` where used as action triggers
- [x] Tables have `header` and column labels
- [x] Modal actions have associated `label` via `FormField`

### API Route Coverage (Analytics Services)
- [x] `/api/athena` — `GET` (workgroups, catalogs, named queries); `POST` (start query, create named query, list executions)
- [x] `/api/glue` — `GET` (databases, tables, crawlers, jobs); `POST` (create DB, create crawler, create job, start crawler, start job run)
- [x] `/api/glue` — `DELETE` (database, job, crawler) with `?type=` parameter
- [x] `/api/kinesis` — `GET` (streams + stream details); `POST` (create stream, update retention); `DELETE` (delete stream)
- [x] `/api/firehose` — `GET` (delivery streams + describe details); `POST` (create stream); `DELETE` (delete stream)
- [x] `/api/opensearch` — `GET` (domains + pipelines); `POST` (create domain, create pipeline via adapter SDK); `DELETE` (delete domain, delete pipeline)
- [x] All routes use adapter SDK singletons (`athena`, `glue`, `kinesis`, `firehose`, `opensearch` from `@/lib/aws-clients`)
- [x] Adapter middleware (`createAdapter`, `mapRequest`, endpoint/auth injection) used in `/api/opensearch`

### Adapter SDK Verification
- [x] `athena` singleton from `@/lib/aws-clients` uses `AthenaClient` with endpoint/auth from adapter config
- [x] `glue` singleton uses `GlueClient`
- [x] `kinesis` singleton uses `KinesisClient`
- [x] `firehose` singleton uses `FirehoseClient`
- [x] `opensearch` singleton uses `OpenSearchClient`
- [x] All adapter middleware interfaces (`AdapterConfigShape`, `MappedRequest`, `NormalizedResponse`, `AdapterFactoryResult`) exported and used
- [x] No inline `any` for adapter interfaces; types imported from `src/types/adapter.ts`

### TypeScript / Build Verification
- [x] Edited analytics routes have `try/catch` with `NextResponse.json` error shape
- [x] Adapter SDK clients are instantiated via `getClient()` factory with endpoint/auth from config
- [x] No new TypeScript errors introduced by analytics edits (`npx tsc --noEmit` verified for edited paths)

### Accessibility / Security / Design System
- [x] `Table` components include `header` with descriptive labels
- [x] `SpaceBetween` and `Container` used for consistent layout
- [x] `Header` used for page titles and section headers
- [x] No hardcoded AWS endpoints (routes call `/api/*`, adapter resolves endpoint from config)
- [x] No secrets in URLs (`encodeURIComponent` for resource names)
- [x] `FormField` labels associated with all inputs
- [x] All buttons in action columns have `formAction="none"`

### Feature Completeness Checklist (Per PRD §9.2.7 & §15 Workflows)
- [x] Athena: Workgroups list, Named queries list + creation, Data catalogs, Query editor (start query, get results)
- [x] Glue: Databases list + creation, Tables list, Crawlers list + creation/start/delete, Jobs list + creation/start/delete
- [x] Kinesis: Data streams list + creation/deletion, Analytics tab, Video Streams tab, Describe stream details, Retention period
- [x] Firehose: Delivery streams list + creation/deletion, Describe stream details, Configuration tab
- [x] OpenSearch: Domains list + creation/deletion, Pipelines list, Pipeline creation via adapter SDK middleware
- [x] All services reference adapter SDK (`@/lib/aws-clients`) and adapter layer (`@/lib/localstack-adapter`)

### Adapter SDK Verification (Per AGENTS.md §3 + §10)
- [x] Every analytics service route uses adapter singletons — no direct SDK instantiation
- [x] `AdapterConfigShape`, `MappedRequest`, `NormalizedResponse` exported and used
- [x] `mapRequest` uses `resolveEndpoint` + `injectAuth` from adapter layer
- [x] `normalizeResponse` applied where adapter middleware is active
- [x] No duplicate endpoint/auth logic in analytics routes
- [x] Adapter mode (`localstack` / `minstack` / `real`) propagated through middleware

### Verification Checklist Complete
Phase 19 Data Analytics implemented per PRD §9.2.7, adapter SDK rules (§4.2, §10.1), and verification gate requirements.
