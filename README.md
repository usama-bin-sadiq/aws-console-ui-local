# AWS Console - Local Stack

Local AWS Console clone built with Next.js 15, Cloudscape Design System, and all major AWS services.

## Quick Start

```bash
# 1. Start local AWS services (Ministack)
make start

# 2. Start the web UI
npm run dev

# 3. Open http://localhost:3000
```

## Docker Compose

```bash
# Ministack (default, 60+ services, free)
docker compose up -d ministack

# LocalStack (120+ services, requires license for some features)
docker compose --profile localstack up -d localstack
```

## Architecture

- **Frontend**: Next.js 15 + Cloudscape Design System
- **Backend**: Next.js API Routes (AWS SDK v3)
- **Provider**: Ministack / LocalStack on port 4566

## Services Supported

S3 | DynamoDB | Lambda | SQS | SNS | IAM | EC2 | RDS | ElastiCache | CloudWatch | CloudFormation | KMS | Secrets Manager | Route 53 | ECS | API Gateway | System Manager


## Build Status

✅ Build passes (`npm run build`)
✅ TypeScript strict mode
✅ All routes compile (dashboard + 15 service pages + 12 API routes)
