# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: iam.spec.ts >> IAM Console — User & Policy Management >> shows IAM users table
- Location: tests/e2e/iam.spec.ts:16:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /iam/i })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('heading', { name: /iam/i })

```

```yaml
- list
- link "Skip to main content":
  - /url: "#main-content"
- banner:
  - link "AWS AWS Management Console":
    - /url: /
    - img "AWS"
    - text: AWS Management Console
  - button
  - link "AWS Documentation":
    - /url: https://docs.aws.amazon.com/
  - link "AWS Support Center":
    - /url: /support
  - button "Terminal"
  - button "US East (N. Virginia)"
  - 'button "Provider: localstack"': LOCALSTACK
  - button "Switch to light mode": ☀️ Light
  - button "Recently Visited"
  - button "Notifications"
  - button "Account"
- main:
  - navigation:
    - button
    - link "AWS Services Home":
      - /url: /
      - img "AWS"
      - text: AWS Services
    - list:
      - listitem:
        - button "Compute" [expanded]
        - text: Compute
        - group "Compute":
          - list:
            - listitem:
              - link "EC2":
                - /url: /ec2
            - listitem:
              - link "Lambda":
                - /url: /lambda
            - listitem:
              - link "ECS Clusters":
                - /url: /ecs-cluster
            - listitem:
              - link "ECS Services":
                - /url: /ecs-service
            - listitem:
              - link "EKS Clusters":
                - /url: /eks-cluster
            - listitem:
              - link "Fargate":
                - /url: /fargate
            - listitem:
              - link "ECR Repos":
                - /url: /ecr-repo
            - listitem:
              - link "Auto Scaling":
                - /url: /auto-scaling
            - listitem:
              - link "Launch Templates":
                - /url: /launch-template
            - listitem:
              - link "AMI":
                - /url: /ami
            - listitem:
              - link "Batch Jobs":
                - /url: /batch-job
      - listitem:
        - button "Storage" [expanded]
        - text: Storage
        - group "Storage":
          - list:
            - listitem:
              - link "S3":
                - /url: /s3
            - listitem:
              - link "S3 Tables":
                - /url: /s3-tables
            - listitem:
              - link "EBS Volumes":
                - /url: /volume
            - listitem:
              - link "EBS Snapshots":
                - /url: /snapshot
            - listitem:
              - link "EFS":
                - /url: /efs
            - listitem:
              - link "Backup":
                - /url: /backup
      - listitem:
        - button "Database" [expanded]
        - text: Database
        - group "Database":
          - list:
            - listitem:
              - link "DynamoDB":
                - /url: /dynamodb
            - listitem:
              - link "RDS":
                - /url: /rds
            - listitem:
              - link "RDS Data":
                - /url: /rds-data
            - listitem:
              - link "ElastiCache":
                - /url: /elasticache
            - listitem:
              - link "DSQL":
                - /url: /dsql
      - listitem:
        - button "Networking & Content Delivery" [expanded]
        - text: Networking & Content Delivery
        - group "Networking & Content Delivery":
          - list:
            - listitem:
              - link "VPC":
                - /url: /vpc
            - listitem:
              - link "Subnets":
                - /url: /subnet
            - listitem:
              - link "Route Tables":
                - /url: /route-table
            - listitem:
              - link "Internet Gateways":
                - /url: /internet-gateway
            - listitem:
              - link "NAT Gateways":
                - /url: /nat-gateway
            - listitem:
              - link "Network ACLs":
                - /url: /network-acl
            - listitem:
              - link "Security Groups":
                - /url: /security-group
            - listitem:
              - link "Elastic IPs":
                - /url: /elastic-ip
            - listitem:
              - link "VPC Endpoints":
                - /url: /ec2-vpc-endpoint
            - listitem:
              - link "VPC Peering":
                - /url: /ec2-vpc-peering
            - listitem:
              - link "Transit Gateway":
                - /url: /transit-gateway
            - listitem:
              - link "VPN Connections":
                - /url: /vpn
            - listitem:
              - link "Direct Connect":
                - /url: /direct-connect
            - listitem:
              - link "Route 53":
                - /url: /route53
            - listitem:
              - link "EC2 Health Checks":
                - /url: /ec2-health-check
            - listitem:
              - link "Global Accelerator":
                - /url: /global-accelerator
            - listitem:
              - link "CloudFront":
                - /url: /cloudfront
      - listitem:
        - button "Security & Identity" [expanded]
        - text: Security & Identity
        - group "Security & Identity":
          - list:
            - listitem:
              - link "IAM":
                - /url: /iam
            - listitem:
              - link "IAM Policies":
                - /url: /iam/policies
            - listitem:
              - link "IAM Access Keys":
                - /url: /iam-access-key
            - listitem:
              - link "IAM Groups":
                - /url: /iam-group
            - listitem:
              - link "IAM Instance Profiles":
                - /url: /iam-instance-profile
            - listitem:
              - link "IAM SAML":
                - /url: /iam-saml
            - listitem:
              - link "IAM OpenID Connect":
                - /url: /iam-openid-connect
            - listitem:
              - link "IAM Password Policy":
                - /url: /iam-password-policy
            - listitem:
              - link "IAM Credential Report":
                - /url: /iam-credential-report
            - listitem:
              - link "IAM Virtual MFA":
                - /url: /iam-virtual-mfa
            - listitem:
              - link "KMS":
                - /url: /kms
            - listitem:
              - link "Secrets Manager":
                - /url: /secrets-manager
            - listitem:
              - link "ACM":
                - /url: /acm
            - listitem:
              - link "WAF":
                - /url: /waf
            - listitem:
              - link "WAF Classic":
                - /url: /waf-classic
            - listitem:
              - link "WAF v2":
                - /url: /wafv2
            - listitem:
              - link "Shield":
                - /url: /shield
            - listitem:
              - link "GuardDuty":
                - /url: /guardduty
            - listitem:
              - link "Security Hub":
                - /url: /security-hub
            - listitem:
              - link "Macie":
                - /url: /macie
            - listitem:
              - link "Inspector":
                - /url: /inspector
            - listitem:
              - link "Detective":
                - /url: /detective
            - listitem:
              - link "Verified Access":
                - /url: /verified-access
      - listitem:
        - button "Management & Governance" [expanded]
        - text: Management & Governance
        - group "Management & Governance":
          - list:
            - listitem:
              - link "CloudFormation":
                - /url: /cloudformation
            - listitem:
              - link "CloudTrail":
                - /url: /cloudtrail
            - listitem:
              - link "AWS Config":
                - /url: /config
            - listitem:
              - link "Systems Manager":
                - /url: /systems-manager-parameter-store
            - listitem:
              - link "Organizations":
                - /url: /organizations
            - listitem:
              - link "Resource Groups":
                - /url: /resource-groups
            - listitem:
              - link "Resource Tags":
                - /url: /resource-groups-tagging
            - listitem:
              - link "Cost Explorer":
                - /url: /cost-explorer
            - listitem:
              - link "Billing":
                - /url: /billing
            - listitem:
              - link "Budgets":
                - /url: /budget
            - listitem:
              - link "Support":
                - /url: /support
            - listitem:
              - link "CloudControl":
                - /url: /cloudcontrol
            - listitem:
              - link "AppConfig":
                - /url: /appconfig
      - listitem:
        - button "Application Integration" [expanded]
        - text: Application Integration
        - group "Application Integration":
          - list:
            - listitem:
              - link "SQS":
                - /url: /sqs
            - listitem:
              - link "SNS":
                - /url: /sns
            - listitem:
              - link "SNS SMS":
                - /url: /sns-sms
            - listitem:
              - link "EventBridge":
                - /url: /eventbridge-schema
            - listitem:
              - link "EventBridge Pipes":
                - /url: /eventbridge-pipe
            - listitem:
              - link "EventBridge Scheduler":
                - /url: /eventbridge-scheduler
            - listitem:
              - link "Step Functions":
                - /url: /step-functions
            - listitem:
              - link "API Gateway":
                - /url: /api
            - listitem:
              - link "AppSync":
                - /url: /appsync
            - listitem:
              - link "App Mesh":
                - /url: /app-mesh
            - listitem:
              - link "Service Discovery":
                - /url: /servicediscovery
            - listitem:
              - link "Pipes":
                - /url: /pipes
      - listitem:
        - button "Developer Tools" [expanded]
        - text: Developer Tools
        - group "Developer Tools":
          - list:
            - listitem:
              - link "CodeBuild":
                - /url: /codebuild
            - listitem:
              - link "CodePipeline":
                - /url: /codepipeline
            - listitem:
              - link "CodeDeploy":
                - /url: /code-deploy
            - listitem:
              - link "App Auto Scaling":
                - /url: /app-auto-scaling
      - listitem:
        - button "Analytics" [expanded]
        - text: Analytics
        - group "Analytics":
          - list:
            - listitem:
              - link "Athena":
                - /url: /athena
            - listitem:
              - link "EMR":
                - /url: /emr
            - listitem:
              - link "Glue Catalog":
                - /url: /glue-catalog
            - listitem:
              - link "Glue Jobs":
                - /url: /glue-job
            - listitem:
              - link "Kinesis Streams":
                - /url: /kinesis
            - listitem:
              - link "Kinesis Firehose":
                - /url: /firehose
            - listitem:
              - link "QuickSight":
                - /url: /quicksight
            - listitem:
              - link "OpenSearch":
                - /url: /opensearch
      - listitem:
        - button "Machine Learning" [expanded]
        - text: Machine Learning
        - group "Machine Learning":
          - list:
            - listitem:
              - link "SageMaker":
                - /url: /sagemaker
            - listitem:
              - link "Bedrock":
                - /url: /bedrock
            - listitem:
              - link "Rekognition":
                - /url: /rekognition
            - listitem:
              - link "Comprehend":
                - /url: /comprehend
            - listitem:
              - link "Polly":
                - /url: /polly
            - listitem:
              - link "Lex":
                - /url: /lex
      - listitem:
        - button "Mobile & IoT" [expanded]
        - text: Mobile & IoT
        - group "Mobile & IoT":
          - list:
            - listitem:
              - link "Amplify":
                - /url: /amplify
            - listitem:
              - link "IoT Core":
                - /url: /iot-core
            - listitem:
              - link "IoT Analytics":
                - /url: /iot-analytics
            - listitem:
              - link "Device Farm":
                - /url: /device-farm
      - listitem:
        - button "Customer Engagement" [expanded]
        - text: Customer Engagement
        - group "Customer Engagement":
          - list:
            - listitem:
              - link "Amazon Connect":
                - /url: /connect
            - listitem:
              - link "Pinpoint":
                - /url: /pinpoint
            - listitem:
              - link "SES":
                - /url: /ses
      - listitem:
        - button "Monitoring & Observability" [expanded]
        - text: Monitoring & Observability
        - group "Monitoring & Observability":
          - list:
            - listitem:
              - link "CloudWatch":
                - /url: /cloudwatch
            - listitem:
              - link "CloudWatch Logs":
                - /url: /cloudwatch-logs
            - listitem:
              - link "X-Ray":
                - /url: /x-ray
            - listitem:
              - link "IMDS":
                - /url: /imds
  - navigation:
    - list:
      - listitem:
        - link "Home":
          - /url: /
      - listitem:
        - link "Console":
          - /url: /console
      - listitem:
        - link "Iam" [disabled]
  - main "Main content":
    - heading "404" [level=1]
    - heading "This page could not be found." [level=2]
- contentinfo "Footer":
  - text: © 2008-2026 Amazon Web Services, Inc. or its affiliates. All rights reserved.|
  - link "Privacy":
    - /url: /privacy
  - link "Legal":
    - /url: /legal
  - link "Communications Preferences":
    - /url: /communications
  - text: "Console v2.45.1 | Build 2026.09.01 | Active Backend: LOCALSTACK"
- alert
```

# Test source

```ts
  1  | /**
  2  |  * E2E: IAM User — Create, Permissions, Access Keys (Playwright)
  3  |  * Per PRD §15.5 (IAM User Creation Workflow) and F-012 (IAM Console).
  4  |  */
  5  | 
  6  | import { test, expect } from '@playwright/test';
  7  | 
  8  | test.describe.configure({ mode: 'serial' });
  9  | 
  10 | test.describe('IAM Console — User & Policy Management', () => {
  11 |   test.beforeEach(async ({ page }) => {
  12 |     await page.goto('/console/iam');
> 13 |     await expect(page.getByRole('heading', { name: /iam/i })).toBeVisible({ timeout: 10000 });
     |                                                               ^ Error: expect(locator).toBeVisible() failed
  14 |   });
  15 | 
  16 |   test('shows IAM users table', async ({ page }) => {
  17 |     await expect(page.getByRole('table')).toBeVisible();
  18 |   });
  19 | 
  20 |   test('opens user creation wizard', async ({ page }) => {
  21 |     await page.getByRole('button', { name: /Create user/i }).click();
  22 |     await expect(page.getByText(/user name/i, { exact: false })).toBeVisible({ timeout: 8000 });
  23 |   });
  24 | 
  25 |   test('verifies adapter endpoint indicator', async ({ page }) => {
  26 |     await expect(page.locator('text=localstack')).toBeVisible({ timeout: 5000 });
  27 |   });
  28 | });
  29 | 
```