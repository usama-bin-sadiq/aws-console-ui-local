import { NavigationItem } from "@/types/common";
import {
  AdapterMode,
  AdapterStatus,
  EmulatorHealthStatus,
  findServiceCompatibility,
  getServiceAvailability,
} from "@/constants/service-compatibility";

export const NAVIGATION_ITEMS: NavigationItem[] = [
  // Compute
  {
    type: "expandable-link-group",
    text: "Compute",
    items: [
      { type: "link", text: "EC2", href: "/ec2" },
      { type: "link", text: "Lambda", href: "/lambda" },
      { type: "link", text: "Lambda Layers", href: "/lambda/layers" },
      { type: "link", text: "ECS Clusters", href: "/ecs-cluster" },
      { type: "link", text: "ECS Services", href: "/ecs-service" },
      { type: "link", text: "EKS Clusters", href: "/eks-cluster" },
      { type: "link", text: "Fargate", href: "/fargate" },
      { type: "link", text: "ECR Repos", href: "/ecr-repo" },
      { type: "link", text: "Auto Scaling", href: "/auto-scaling" },
      { type: "link", text: "Launch Templates", href: "/launch-template" },
      { type: "link", text: "AMI", href: "/ami" },
      { type: "link", text: "Batch Jobs", href: "/batch-job" },
    ],
  },

  // Storage
  {
    type: "expandable-link-group",
    text: "Storage",
    items: [
      { type: "link", text: "S3", href: "/s3" },
      { type: "link", text: "S3 Tables", href: "/s3-tables" },
      { type: "link", text: "EBS Volumes", href: "/volume" },
      { type: "link", text: "EBS Snapshots", href: "/snapshot" },
      { type: "link", text: "EFS", href: "/efs" },
      { type: "link", text: "Backup", href: "/backup" },
    ],
  },

  // Database
  {
    type: "expandable-link-group",
    text: "Database",
    items: [
      { type: "link", text: "DynamoDB", href: "/dynamodb" },
      { type: "link", text: "RDS", href: "/rds" },
      { type: "link", text: "RDS Data", href: "/rds-data" },
      { type: "link", text: "ElastiCache", href: "/elasticache" },
      { type: "link", text: "DSQL", href: "/dsql" },
    ],
  },

  // Networking & Content Delivery
  {
    type: "expandable-link-group",
    text: "Networking & Content Delivery",
    items: [
      { type: "link", text: "VPC", href: "/vpc" },
      { type: "link", text: "Subnets", href: "/subnet" },
      { type: "link", text: "Route Tables", href: "/route-table" },
      { type: "link", text: "Internet Gateways", href: "/internet-gateway" },
      { type: "link", text: "NAT Gateways", href: "/nat-gateway" },
      { type: "link", text: "Network ACLs", href: "/network-acl" },
      { type: "link", text: "Security Groups", href: "/security-group" },
      { type: "link", text: "Elastic IPs", href: "/elastic-ip" },
      { type: "link", text: "VPC Endpoints", href: "/ec2-vpc-endpoint" },
      { type: "link", text: "VPC Peering", href: "/ec2-vpc-peering" },
      { type: "link", text: "Transit Gateway", href: "/transit-gateway" },
      { type: "link", text: "VPN Connections", href: "/vpn" },
      { type: "link", text: "Direct Connect", href: "/direct-connect" },
      { type: "link", text: "Route 53", href: "/route53" },
      { type: "link", text: "EC2 Health Checks", href: "/ec2-health-check" },
      { type: "link", text: "Global Accelerator", href: "/global-accelerator" },
      { type: "link", text: "CloudFront", href: "/cloudfront" },
    ],
  },

  // Security & Identity
  {
    type: "expandable-link-group",
    text: "Security & Identity",
    items: [
      { type: "link", text: "IAM", href: "/iam" },
      { type: "link", text: "IAM Policies", href: "/iam/policies" },
      { type: "link", text: "IAM Access Keys", href: "/iam-access-key" },
      { type: "link", text: "IAM Groups", href: "/iam-group" },
      { type: "link", text: "IAM Instance Profiles", href: "/iam-instance-profile" },
      { type: "link", text: "IAM SAML", href: "/iam-saml" },
      { type: "link", text: "IAM OpenID Connect", href: "/iam-openid-connect" },
      { type: "link", text: "IAM Password Policy", href: "/iam-password-policy" },
      { type: "link", text: "IAM Credential Report", href: "/iam-credential-report" },
      { type: "link", text: "IAM Virtual MFA", href: "/iam-virtual-mfa" },
      { type: "link", text: "KMS", href: "/kms" },
      { type: "link", text: "Secrets Manager", href: "/secrets-manager" },
      { type: "link", text: "ACM", href: "/acm" },
      { type: "link", text: "WAF", href: "/waf" },
      { type: "link", text: "WAF Classic", href: "/waf-classic" },
      { type: "link", text: "WAF v2", href: "/wafv2" },
      { type: "link", text: "Shield", href: "/shield" },
      { type: "link", text: "GuardDuty", href: "/guardduty" },
      { type: "link", text: "Security Hub", href: "/security-hub" },
      { type: "link", text: "Macie", href: "/macie" },
      { type: "link", text: "Inspector", href: "/inspector" },
      { type: "link", text: "Detective", href: "/detective" },
      { type: "link", text: "Verified Access", href: "/verified-access" },
    ],
  },

  // Management & Governance
  {
    type: "expandable-link-group",
    text: "Management & Governance",
    items: [
      { type: "link", text: "CloudFormation", href: "/cloudformation" },
      { type: "link", text: "CloudTrail", href: "/cloudtrail" },
      { type: "link", text: "AWS Config", href: "/config" },
      { type: "link", text: "Systems Manager", href: "/systems-manager-parameter-store" },
      { type: "link", text: "Organizations", href: "/organizations" },
      { type: "link", text: "Resource Groups", href: "/resource-groups" },
      { type: "link", text: "Resource Tags", href: "/resource-groups-tagging" },
      { type: "link", text: "Cost Explorer", href: "/cost-explorer" },
      { type: "link", text: "Billing", href: "/billing" },
      { type: "link", text: "Budgets", href: "/budget" },
      { type: "link", text: "Support", href: "/support" },
      { type: "link", text: "CloudControl", href: "/cloudcontrol" },
      { type: "link", text: "AppConfig", href: "/appconfig" },
    ],
  },

  // Application Integration
  {
    type: "expandable-link-group",
    text: "Application Integration",
    items: [
      { type: "link", text: "SQS", href: "/sqs" },
      { type: "link", text: "SNS", href: "/sns" },
      { type: "link", text: "SNS SMS", href: "/sns-sms" },
      { type: "link", text: "EventBridge", href: "/eventbridge-schema" },
      { type: "link", text: "EventBridge Pipes", href: "/eventbridge-pipe" },
      { type: "link", text: "EventBridge Scheduler", href: "/eventbridge-scheduler" },
      { type: "link", text: "Step Functions", href: "/step-functions" },
      { type: "link", text: "API Gateway", href: "/apigateway" },
      { type: "link", text: "AppSync", href: "/appsync" },
      { type: "link", text: "App Mesh", href: "/app-mesh" },
      { type: "link", text: "Service Discovery", href: "/servicediscovery" },
      { type: "link", text: "Pipes", href: "/pipes" },
    ],
  },

  // Developer Tools
  {
    type: "expandable-link-group",
    text: "Developer Tools",
    items: [
      { type: "link", text: "CodeBuild", href: "/codebuild" },
      { type: "link", text: "CodePipeline", href: "/codepipeline" },
      { type: "link", text: "CodeDeploy", href: "/code-deploy" },
      { type: "link", text: "App Auto Scaling", href: "/app-auto-scaling" },
    ],
  },

  // Analytics
  {
    type: "expandable-link-group",
    text: "Analytics",
    items: [
      { type: "link", text: "Athena", href: "/athena" },
      { type: "link", text: "EMR", href: "/emr" },
      { type: "link", text: "Glue Catalog", href: "/glue-catalog" },
      { type: "link", text: "Glue Jobs", href: "/glue-job" },
      { type: "link", text: "Kinesis Streams", href: "/kinesis" },
      { type: "link", text: "Kinesis Firehose", href: "/firehose" },
      { type: "link", text: "QuickSight", href: "/quicksight" },
      { type: "link", text: "OpenSearch", href: "/opensearch" },
    ],
  },

  // Machine Learning
  {
    type: "expandable-link-group",
    text: "Machine Learning",
    items: [
      { type: "link", text: "SageMaker", href: "/sagemaker" },
      { type: "link", text: "Bedrock", href: "/bedrock" },
      { type: "link", text: "Rekognition", href: "/rekognition" },
      { type: "link", text: "Comprehend", href: "/comprehend" },
      { type: "link", text: "Polly", href: "/polly" },
      { type: "link", text: "Lex", href: "/lex" },
    ],
  },

  // Mobile & IoT
  {
    type: "expandable-link-group",
    text: "Mobile & IoT",
    items: [
      { type: "link", text: "Amplify", href: "/amplify" },
      { type: "link", text: "IoT Core", href: "/iot-core" },
      { type: "link", text: "IoT Analytics", href: "/iot-analytics" },
      { type: "link", text: "Device Farm", href: "/device-farm" },
    ],
  },

  // Customer Engagement
  {
    type: "expandable-link-group",
    text: "Customer Engagement",
    items: [
      { type: "link", text: "Amazon Connect", href: "/connect" },
      { type: "link", text: "Pinpoint", href: "/pinpoint" },
      { type: "link", text: "SES", href: "/ses" },
    ],
  },

  // Monitoring & Observability
  {
    type: "expandable-link-group",
    text: "Monitoring & Observability",
    items: [
      { type: "link", text: "CloudWatch", href: "/cloudwatch" },
      { type: "link", text: "CloudWatch Logs", href: "/cloudwatch-logs" },
      { type: "link", text: "X-Ray", href: "/x-ray" },
      { type: "link", text: "IMDS", href: "/imds" },
    ],
  },
];

// Extract all service links for search
export const ALL_SERVICES = NAVIGATION_ITEMS.filter((item) => item.type === "expandable-link-group")
  .flatMap((group) => group.items || [])
  .filter((item) => item.type === "link");

export function getAvailableNavigationItems(
  mode: AdapterMode | "unknown",
  healthStatus: EmulatorHealthStatus = "checking",
  healthServices: Record<string, unknown> = {},
): NavigationItem[] {
  return NAVIGATION_ITEMS.map((item) => {
    if (item.type !== "expandable-link-group") return item;

    const items = (item.items || []).map((service) => {
      if (!service.href) return service;
      const compatibility = findServiceCompatibility(service.href);
      if (!compatibility) {
        return {
          ...service,
          disabled: true,
          disabledReason: "No emulator compatibility is registered for this service.",
        };
      }
      const availability = getServiceAvailability(
        compatibility,
        mode,
        healthStatus,
        healthServices,
      );
      const isChecking = healthStatus === "checking";
      return {
        ...service,
        disabled: !availability.enabled || isChecking,
        disabledReason: isChecking
          ? "The emulator capability check is still running."
          : availability.reason,
        ...(availability.status === AdapterStatus.PARTIAL
          ? { text: `${service.text} (partial)` }
          : {}),
      };
    });

    return { ...item, items };
  });
}
