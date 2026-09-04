## Phase 12 — CloudWatch (Alarms + Logs + Metrics + Insights) Verification Gate

### Files Edited / Created
- [x] `src/types/cloudwatch.ts` (updated — full interfaces: Alarm, Metric, LogGroup, LogStream, InsightsQuery)
- [x] `src/constants/cloudwatch-constants.ts` (updated — statistics, namespaces, periods, comparison operators, evaluation periods)
- [x] `src/app/api/cloudwatch/route.ts` (rewritten — GET describeAlarms/describeLogGroups/describeLogStreams/getQueryResults; POST createAlarm/updateAlarm/createLogGroup/startQuery; DELETE deleteAlarms/deleteLogGroup; PUT updateAlarm; using @aws-sdk/client-cloudwatch and @aws-sdk/client-cloudwatch-logs)
- [x] `src/app/cloudwatch/page.tsx` (rewritten — real alarm/log/metrics/insights tabs; alarm create/edit/delete with metric thresholds; log group create/delete; Insights query support; refresh; pagination; filtering; design tokens)
- [x] `docs/verification-gate-phase12-cloudwatch.md` (this file)

### PRD Alignment (§9.2.8, §15.10 / F-013)
- [x] CloudWatch console has full sub-pages per PRD §9.2.8: Alarms, Metrics, Logs (Log groups, Log streams), Insights
- [x] Alarm creation workflow follows PRD §15.10: metric selection, statistic, period, threshold, comparison operator, evaluation periods, review and create
- [x] Alarm edit/update uses `PutMetricAlarm` with full metric threshold parameters
- [x] Alarm delete uses `DeleteAlarms` with alarm name list
- [x] Metrics listing uses `ListMetrics` with namespace/metric filtering
- [x] Log group management uses `CreateLogGroup` / `DeleteLogGroup` / `DescribeLogGroups`
- [x] Log stream listing uses `DescribeLogStreams`
- [x] Insights query uses `StartQuery` with log group selection, query string, time range, and result polling via `GetQueryResults`
- [x] All UI uses Cloudscape components (`Table`, `Tabs`, `Header`, `Modal`, `FormField`, `StatusIndicator`, `Select`, `Button`, `SpaceBetween`, `Container`, `Pagination`, `TextFilter`, `Alert`) with design tokens (`var(--awsui-color-*)`)
- [x] No custom CSS colors outside Cloudscape tokens
- [x] No hardcoded AWS endpoints — uses adapter layer (`/api/cloudwatch` → SDK clients configured via `src/lib/aws-clients.ts`)

### API Route Coverage (`src/app/api/cloudwatch/route.ts`)
- [x] `GET` — `DescribeAlarmsCommand`, `ListMetricsCommand`, `DescribeLogGroupsCommand`, `DescribeLogStreamsCommand`, `GetQueryResultsCommand`
- [x] `POST` — `PutMetricAlarmCommand` (create/update), `CreateLogGroupCommand`, `StartQueryCommand`
- [x] `PUT` — `PutMetricAlarmCommand` (update alarm)
- [x] `DELETE` — `DeleteAlarmsCommand`, `DeleteLogGroupCommand`
- [x] All commands use `@aws-sdk/client-cloudwatch` and `@aws-sdk/client-cloudwatch-logs`
- [x] Adapter error handling (`getAdapterStatus`, `handleAdapterError`) integrated

### TypeScript / Code Quality
- [x] Strict TypeScript — no implicit `any`; explicit interfaces exported from `src/types/cloudwatch.ts`
- [x] Constants extracted to `src/constants/cloudwatch-constants.ts` (no inline magic strings/numbers)
- [x] No inline interface definitions inside page or route
- [x] Reusable patterns: filter/paginate state, modal forms, table column definitions

### Accessibility / Security / Design System
- [x] All interactive elements have `ariaLabel`
- [x] Tables have `isRowHeader` on name/stream columns
- [x] Forms have `label` associated inputs (`FormField`)
- [x] Focus-visible buttons (Cloudscape default)
- [x] No secrets in URLs; adapter dummy credentials (`test`/`test`) never transmitted to real AWS endpoints
- [x] All text strings in component source (ready for i18n extraction)

### Verification Checklist Complete
Phase 12 CloudWatch features implemented per PRD §9.2.8 and §15.10.
