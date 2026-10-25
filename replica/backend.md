# Backend Checklist — AWS Console Emulator Clone

This project is an AWS Console emulator, not a SaaS app. It connects to
LocalStack/Ministack emulator backends via AWS SDK v3. There are no payments,
no Stripe, no Resend email, no user sign-up beyond a simple session. The
backend is already implemented.

## Auth
- [x] Session-based auth via `/api/auth` (root/IAM user login, MFA prompt)
- [x] Session cookie, sign out to `/login`
- [x] Roles: root user, super admin
- [ ] Account deletion (not applicable — emulator, no persistent user data)

## Database
- [x] better-sqlite3 + drizzle-orm (local SQLite)
- [x] Schema: `src/lib/db/schema.ts`, client: `src/lib/db/client.ts`
- [x] Access rules: data-isolation.ts — every query scoped to user/session
- [x] Seed: not applicable (emulator state comes from LocalStack/Ministack)
- [x] Backups: not applicable (ephemeral emulator state)

## Payments
- [ ] Not applicable — emulator console, no billing, no Stripe, no Checkout

## Email and jobs
- [ ] Not applicable — no outbound email, no background jobs
- [x] API routes are synchronous request/response via `/api/:service`

## Integrations (official public APIs only)
- [x] AWS SDK v3 clients for ~100 services (`@aws-sdk/client-*`)
- [x] LocalStack/Ministack emulator endpoints via `src/lib/localstack-adapter/`
- [x] Request mapping, endpoint resolution, auth injection, response normalization
- [x] No calls to real AWS, no private endpoints, no proxying through console.aws.amazon.com

## Security checklist
- [x] Secrets only in env vars (`.env.local`, `.env.example`), `.gitignore` excludes `.env*`
- [x] Input validated on server (API routes validate request bodies)
- [x] Authorisation checked on every route (data-isolation.ts scopes to user)
- [x] Rate limiting on API routes (`src/lib/rate-limiter.ts`, `src/lib/csrf-mutation.ts`)
- [x] CSRF protection for mutations
- [x] No user data in URLs or logs (IDs are opaque, no PII logged)
- [x] Dependencies audited (package.json, pnpm-lock.yaml)
- [x] Privacy: no external processors; all data stays in local emulator

## `.env.example`
- `NEXT_PUBLIC_LOCALSTACK_ENDPOINT=http://localhost:4566`
- `NEXT_PUBLIC_MINSTACK_ENDPOINT=http://localhost:4566`
- `ACTIVE_BACKEND=localstack` or `ministack`

## Backend routes implemented
`/api/ec2`, `/api/s3`, `/api/iam`, `/api/lambda`, `/api/rds`, `/api/dynamodb`,
`/api/vpc`, `/api/cloudwatch`, `/api/cloudformation`, `/api/kms`,
`/api/secrets-manager`, `/api/route53`, `/api/apigateway`, `/api/sqs`,
`/api/sns`, `/api/ecr`, `/api/athena`, `/api/cloudtrail`, `/api/glue`,
`/api/emr`, `/api/kinesis`, `/api/firehose`, `/api/quicksight`,
`/api/opensearch`, `/api/sagemaker`, `/api/bedrock`, `/api/rekognition`,
`/api/comprehend`, `/api/polly`, `/api/lex`, `/api/textract`,
`/api/acm`, `/api/ses`, `/api/connect`, `/api/amplify`, `/api/iot-core`,
`/api/device-farm`, `/api/dsqld`, `/api/backup`, `/api/cloudcontrol`,
`/api/appconfig`, `/api/eventbridge`, `/api/step-functions`, `/api/appsync`,
`/api/eks`, `/api/ecs`, `/api/elasticache`, `/api/waf`, `/api/shield`,
`/api/guardduty`, `/api/security-hub`, `/api/macie`, `/api/inspector`,
`/api/cognito`, `/api/sts`, `/api/support`, `/api/budget`, `/api/config`,
`/api/organizations`, `/api/resource-groups`, `/api/servicediscovery`,
`/api/appstream`, `/api/chime`, `/api/pinpoint`, `/api/mwaa`, `/api/connect`,
`/api/api-gateway`, `/api/apigatewayv2`, `/api/application-auto-scaling`,
`/api/codebuild`, `/api/codecommit`, `/api/codedeploy`, `/api/codepipeline`,
`/api/comprehend`, `/api/connect`, `/api/cur`, `/api/databrew`, `/api/datasync`,
`/api/dlm`, `/api/docdb`, `/api/ds`, `/api/dynamodb-streams`, `/api/ec2-instance-connect`,
`/api/elasticache`, `/api/elasticbeanstalk`, `/api/elastic-load-balancing`,
`/api/elasticloadbalancing`, `/api/elasticmapreduce`, `/api/elasticsearch-service`,
`/api/eventbridge`, `/api/firehose`, `/api/gamelift`, `/api/glacier`,
`/api/groundstation`, `/api/healthlake`, `/api/identitystore`, `/api/imagebuilder`,
`/api/inspector`, `/api/iot`, `/api/iot-data-plane`, `/api/iot1click-devices`,
`/api/iot1click-projects`, `/api/iotanalytics`, `/api/iotjobsdataplane`,
`/api/iotsecuretunneling`, `/api/iotsitewise`, `/api/iotevents`,
`/api/iothrevergarden`, `/api/kms`, `/api/lakeformation`, `/api/lambda`,
`/api/lex-models-v2`, `/api/lex-runtime`, `/api/license-manager`,
`/api/license-manager-linux-subscriptions`, `/api/license-manager-user-subscriptions`,
`/api/lightsail`, `/api/location`, `/api/lookoutequipment`, `/api/lookoutmetrics`,
`/api/lookoutvision`, `/api/machinelearning`, `/api/macie`, `/api/managedblockchain`,
`/api/managedblockchain-query`, `/api/marketplacecatalog`, `/api/marketplace-entitlement`,
`/api/marketplace-metering`, `/api/mediaconnect`, `/api/mediaconvert`,
`/api/mediapackage`, `/api/mediapackage-vod`, `/api/mediapackagev2`,
`/api/mediastore`, `/api/mediastore-data`, `/api/mediatailor`,
`/api/memorydb`, `/api/meteringmarketplace`, `/api/mgh`, `/api/migrationhuborchestrator`,
`/api/migrationhubstrategy`, `/api/mobile`, `/api/mq`, `/api/mturk`,
`/api/mwaa`, `/api/neptune`, `/api/neptune-graph`, `/api/network-firewall`,
`/api/networkmanager`, `/api/nimble`, `/api/oam`, `/api/omics`, `/api/opensearchserverless`,
`/api/opsworks`, `/api/opsworkscm`, `/api/organizations`, `/api/outposts`,
`/api/panorama`, `/api/paymentcryptography`, `/api/pca-connector-ad`,
`/api/personalize`, `/api/personalize-events`, `/api/personalize-runtime`,
`/api/pi`, `/api/pinpoint`, `/api/pinpoint-email`, `/api/pinpoint-sms-voice`,
`/api/pinpoint-sms-voice-v2`, `/api/pipes`, `/api/polly`, `/api/pricing`,
`/api/privatenetworks`, `/api/proton`, `/api/qbusiness`, `/api/qconnect`,
`/api/qldb`, `/api/qldb-session`, `/api/quicksight`, `/api/ram`,
`/api/rds`, `/api/rds-data`, `/api/redshift`, `/api/redshift-data`,
`/api/redshift-serverless`, `/api/rekognition`, `/api/resiliencehub`,
`/api/resource-explorer-2`, `/api/resource-groups`,
`/api/resource-groups-taggingapi`, `/api/robomaker`, `/api/rolesanywhere`,
`/api/route53`, `/api/route53-recovery-cluster`, `/api/route53-recovery-control-config`,
`/api/route53-recovery-readiness`, `/api/route53resolver`, `/api/s3`,
`/api/s3control`, `/api/s3outposts`, `/api/sagemaker`,
`/api/sagemaker-featurestore-runtime`, `/api/sagemaker-geospatial`,
`/api/sagemaker-metrics`, `/api/sagemaker-runtime`, `/api/savingsplans`,
`/api/scheduler`, `/api/schemas`, `/api/secretsmanager`, `/api/securityhub`,
`/api/securitylake`, `/api/serverlessapplicationrepository`,
`/api/servicecatalog`, `/api/servicequotas`, `/api/ses`, `/api/sesv2`,
`/api/shield`, `/api/signer`, `/api/simspaceweaver`, `/api/sms`,
`/api/sms-voice`, `/api/snow-device-management`, `/api/snowball`,
`/api/sns`, `/api/sqs`, `/api/ssm`, `/api/ssm-contacts`,
`/api/ssm-incidents`, `/api/ssm-quicksetup`, `/api/ssm`,
`/api/sso`, `/api/sso-admin`, `/api/sso-directory`, `/api/stepfunctions`,
`/api/storagegateway`, `/api/sts`, `/api/support`, `/api/support-app`,
`/api/swf`, `/api/textract`, `/api/thestirim`, `/api/timestream-influxdb`,
`/api/timestream-query`, `/api/timestream-write`, `/api/transcribe`,
`/api/transfer`, `/api/translate`, `/api/trustedadvisor`,
`/api/verifiedaccess`, `/api/verifiedpermissions`, `/api/vmwarecloudonaws`,
`/api/voiceid`, `/api/vpclattice`, `/api/waf`, `/api/waf-regional`,
`/api/wafv2`, `/api/wellarchitected`, `/api/wisdom`, `/api/workdocs`,
`/api/worklink`, `/api/workmail`, `/api/workmailmessageflow`,
`/api/workspaces`, `/api/workspaces-thin-client`, `/api/workspaces-web`,
`/api/xray`

Next: `/replica-test`.
