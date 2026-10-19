import { ALL_SERVICES, NAVIGATION_ITEMS } from "@/constants/navigation";

export interface ServiceNavigationLink {
  readonly text: string;
  readonly href: string;
}

export interface ServiceNavigationGroup {
  readonly text: string;
  readonly href?: string;
  readonly items: readonly ServiceNavigationLink[];
}

/**
 * Service-specific navigation shown inside a service console. The global
 * navigation remains available in AppShell; this registry is the contextual
 * second-level navigation that changes with the selected service.
 */
export const SERVICE_NAVIGATION: Record<string, readonly ServiceNavigationGroup[]> = {
  ec2: [
    {
      text: "EC2",
      href: "/ec2",
      items: [
        { text: "Instances", href: "/ec2" },
        { text: "Launch instances", href: "/ec2/launch" },
        { text: "Images", href: "/ami" },
        { text: "Key pairs", href: "/key-pair" },
        { text: "Security groups", href: "/security-group" },
        { text: "Volumes", href: "/volume" },
        { text: "Snapshots", href: "/snapshot" },
      ],
    },
    {
      text: "Networking",
      href: "/vpc",
      items: [
        { text: "VPCs", href: "/vpc" },
        { text: "Subnets", href: "/subnet" },
        { text: "Route tables", href: "/route-table" },
        { text: "Internet gateways", href: "/internet-gateway" },
        { text: "NAT gateways", href: "/nat-gateway" },
      ],
    },
  ],
  lambda: [
    {
      text: "Lambda",
      href: "/lambda",
      items: [
        { text: "Functions", href: "/lambda" },
        { text: "Layers", href: "/lambda/layers" },
        { text: "Aliases", href: "/lambda/aliases" },
        { text: "Event source mappings", href: "/eventbridge" },
      ],
    },
    {
      text: "Monitoring",
      href: "/cloudwatch",
      items: [
        { text: "CloudWatch", href: "/cloudwatch" },
        { text: "X-Ray", href: "/x-ray" },
      ],
    },
  ],
  s3: [
    {
      text: "S3",
      href: "/s3",
      items: [
        { text: "Buckets", href: "/s3" },
        { text: "S3 Tables", href: "/s3-tables" },
      ],
    },
    {
      text: "Storage",
      href: "/volume",
      items: [
        { text: "EBS volumes", href: "/volume" },
        { text: "EBS snapshots", href: "/snapshot" },
        { text: "EFS", href: "/efs" },
        { text: "Backup", href: "/backup" },
      ],
    },
  ],
  vpc: [
    {
      text: "VPC",
      href: "/vpc",
      items: [
        { text: "VPCs", href: "/vpc" },
        { text: "Subnets", href: "/subnet" },
        { text: "Route tables", href: "/route-table" },
        { text: "Internet gateways", href: "/internet-gateway" },
        { text: "NAT gateways", href: "/nat-gateway" },
        { text: "Network ACLs", href: "/network-acl" },
        { text: "Security groups", href: "/security-group" },
        { text: "Elastic IPs", href: "/elastic-ip" },
      ],
    },
    {
      text: "Connectivity",
      items: [
        { text: "VPC endpoints", href: "/ec2-vpc-endpoint" },
        { text: "VPC peering", href: "/ec2-vpc-peering" },
        { text: "Transit Gateway", href: "/transit-gateway" },
        { text: "VPN connections", href: "/vpn" },
        { text: "Direct Connect", href: "/direct-connect" },
      ],
    },
  ],
  iam: [
    {
      text: "IAM",
      href: "/iam",
      items: [
        { text: "Overview", href: "/iam" },
        { text: "Users", href: "/iam/user" },
        { text: "Roles", href: "/iam/role" },
        { text: "Policies", href: "/iam/policies" },
        { text: "Groups", href: "/iam-group" },
        { text: "Access keys", href: "/iam-access-key" },
        { text: "Instance profiles", href: "/iam-instance-profile" },
        { text: "SAML providers", href: "/iam-saml" },
        { text: "OIDC providers", href: "/iam-openid-connect" },
      ],
    },
    {
      text: "Security services",
      href: "/kms",
      items: [
        { text: "KMS", href: "/kms" },
        { text: "Secrets Manager", href: "/secrets-manager" },
        { text: "Certificate Manager", href: "/acm" },
      ],
    },
  ],
  dynamodb: [
    {
      text: "DynamoDB",
      href: "/dynamodb",
      items: [
        // /dynamodb is the table list and /dynamodb/[tableName] is the table
        // detail, so the rail needs no separate entry for either: a second
        // destination for the same resource only breaks active-state
        // resolution, and a route that renders one sentence is a dead end.
        { text: "Tables", href: "/dynamodb" },
        { text: "Backups", href: "/backup" },
      ],
    },
    {
      text: "Resources",
      href: "/resource-groups-tagging",
      items: [
        { text: "Resource groups", href: "/resource-groups" },
        { text: "Resource tags", href: "/resource-groups-tagging" },
      ],
    },
  ],
  cloudwatch: [
    {
      text: "CloudWatch",
      href: "/cloudwatch",
      items: [
        // Alarms are the first tab of /cloudwatch, with the full alarm table
        // and create/edit/delete behind it, so they are reached from there
        // rather than from a second page showing the same one resource.
        { text: "Overview", href: "/cloudwatch" },
        { text: "Logs", href: "/cloudwatch-logs" },
      ],
    },
    {
      text: "Monitoring",
      href: "/x-ray",
      items: [{ text: "X-Ray", href: "/x-ray" }],
    },
  ],
  rds: [
    {
      text: "RDS",
      href: "/rds",
      items: [
        { text: "Instances", href: "/rds" },
        { text: "Snapshots", href: "/snapshot" },
        { text: "Parameter groups", href: "/systems-manager-parameter-store" },
        { text: "Events", href: "/cloudwatch" },
      ],
    },
    {
      text: "Database security",
      href: "/iam",
      items: [
        { text: "Security groups", href: "/security-group" },
        { text: "KMS keys", href: "/kms" },
        { text: "Secrets", href: "/secrets-manager" },
      ],
    },
  ],
  ecs: [
    {
      text: "Amazon ECS",
      href: "/ecs",
      items: [
        { text: "Clusters", href: "/ecs" },
        { text: "Fargate", href: "/fargate" },
        { text: "Auto Scaling", href: "/auto-scaling" },
      ],
    },
    {
      text: "Related compute",
      href: "/ec2",
      items: [
        { text: "EC2 instances", href: "/ec2" },
        { text: "Launch instances", href: "/ec2/launch" },
        { text: "Lambda", href: "/lambda" },
      ],
    },
  ],
  kms: [
    {
      text: "AWS KMS",
      href: "/kms",
      items: [
        { text: "Customer managed keys", href: "/kms" },
        { text: "Create key", href: "/kms/create" },
      ],
    },
    {
      text: "Security services",
      href: "/secrets-manager",
      items: [
        { text: "Secrets Manager", href: "/secrets-manager" },
        { text: "Certificate Manager", href: "/acm" },
        { text: "IAM", href: "/iam" },
      ],
    },
  ],
  route53: [
    {
      text: "Amazon Route 53",
      href: "/route53",
      items: [{ text: "Hosted zones", href: "/route53" }],
    },
    {
      text: "Related networking",
      href: "/cloudfront",
      items: [
        { text: "CloudFront", href: "/cloudfront" },
        { text: "VPC", href: "/vpc" },
        { text: "Health checks", href: "/ec2-health-check" },
      ],
    },
  ],
  "secrets-manager": [
    {
      text: "AWS Secrets Manager",
      href: "/secrets-manager",
      items: [{ text: "Secrets", href: "/secrets-manager" }],
    },
    {
      text: "Security services",
      href: "/kms",
      items: [
        { text: "KMS", href: "/kms" },
        { text: "IAM", href: "/iam" },
        { text: "CloudTrail", href: "/cloudtrail" },
      ],
    },
  ],
  ecr: [
    {
      text: "Amazon ECR",
      href: "/ecr-repo",
      items: [{ text: "Repositories", href: "/ecr-repo" }],
    },
    {
      text: "Registries",
      href: "/ecr",
      items: [{ text: "Registries", href: "/ecr" }],
    },
  ],
  eks: [
    {
      text: "Amazon EKS",
      href: "/eks-cluster",
      items: [{ text: "Clusters", href: "/eks-cluster" }],
    },
    {
      text: "Related compute",
      href: "/ec2",
      items: [
        { text: "EC2 instances", href: "/ec2" },
        { text: "ECS clusters", href: "/ecs-cluster" },
        { text: "Lambda", href: "/lambda" },
      ],
    },
  ],
  sns: [
    {
      text: "Amazon SNS",
      href: "/sns",
      items: [{ text: "Topics", href: "/sns" }],
    },
    {
      text: "Related messaging",
      href: "/sqs",
      items: [
        { text: "SQS queues", href: "/sqs" },
        { text: "EventBridge", href: "/eventbridge" },
      ],
    },
  ],
  sqs: [
    {
      text: "Amazon SQS",
      href: "/sqs",
      items: [{ text: "Queues", href: "/sqs" }],
    },
    {
      text: "Related messaging",
      href: "/sns",
      items: [
        { text: "SNS topics", href: "/sns" },
        { text: "EventBridge", href: "/eventbridge" },
      ],
    },
  ],
  kinesis: [
    {
      text: "Amazon Kinesis",
      href: "/kinesis",
      items: [{ text: "Data streams", href: "/kinesis" }],
    },
    {
      text: "Related streaming",
      href: "/firehose",
      items: [
        { text: "Firehose", href: "/firehose" },
        { text: "S3", href: "/s3" },
      ],
    },
  ],
  firehose: [
    {
      text: "Amazon Data Firehose",
      href: "/firehose",
      items: [{ text: "Delivery streams", href: "/firehose" }],
    },
    {
      text: "Related streaming",
      href: "/kinesis",
      items: [
        { text: "Kinesis data streams", href: "/kinesis" },
        { text: "S3", href: "/s3" },
      ],
    },
  ],
  sfn: [
    {
      text: "AWS Step Functions",
      href: "/step-functions",
      items: [{ text: "State machines", href: "/step-functions" }],
    },
    {
      text: "Related orchestration",
      href: "/eventbridge",
      items: [
        { text: "EventBridge", href: "/eventbridge" },
        { text: "Lambda", href: "/lambda" },
      ],
    },
  ],
  athena: [
    {
      text: "Amazon Athena",
      href: "/athena",
      items: [
        { text: "Query results", href: "/athena" },
        { text: "Workgroups", href: "/athena-workgroup" },
      ],
    },
    {
      text: "Related analytics",
      href: "/redshift",
      items: [
        { text: "Redshift", href: "/redshift" },
        { text: "CloudWatch", href: "/cloudwatch" },
      ],
    },
  ],
  opensearch: [
    {
      text: "Amazon OpenSearch",
      href: "/opensearch",
      items: [{ text: "Domains", href: "/opensearch" }],
    },
    {
      text: "Related search",
      href: "/kinesis",
      items: [
        { text: "Kinesis", href: "/kinesis" },
        { text: "CloudWatch", href: "/cloudwatch" },
      ],
    },
  ],
  redshift: [
    {
      text: "Amazon Redshift",
      href: "/redshift",
      items: [{ text: "Clusters", href: "/redshift" }],
    },
    {
      text: "Related databases",
      href: "/dynamodb",
      items: [
        { text: "DynamoDB", href: "/dynamodb" },
        { text: "RDS", href: "/rds" },
      ],
    },
  ],
  backup: [
    {
      text: "AWS Backup",
      href: "/backup",
      items: [{ text: "Backup vaults", href: "/backup" }],
    },
    {
      text: "Related storage",
      href: "/s3",
      items: [
        { text: "S3", href: "/s3" },
        { text: "EBS volumes", href: "/volume" },
      ],
    },
  ],
  cloudtrail: [
    {
      text: "AWS CloudTrail",
      href: "/cloudtrail",
      items: [{ text: "Trails", href: "/cloudtrail" }],
    },
    {
      text: "Related governance",
      href: "/config",
      items: [
        { text: "AWS Config", href: "/config" },
        { text: "CloudWatch", href: "/cloudwatch" },
      ],
    },
  ],
  config: [
    {
      text: "AWS Config",
      href: "/config",
      items: [{ text: "Rules", href: "/config" }],
    },
    {
      text: "Related governance",
      href: "/cloudtrail",
      items: [
        { text: "CloudTrail", href: "/cloudtrail" },
        { text: "Organizations", href: "/organizations" },
      ],
    },
  ],
  guardduty: [
    {
      text: "Amazon GuardDuty",
      href: "/guardduty",
      items: [{ text: "Findings", href: "/guardduty" }],
    },
    {
      text: "Related security",
      href: "/security-hub",
      items: [
        { text: "Security Hub", href: "/security-hub" },
        { text: "Inspector", href: "/inspector" },
      ],
    },
  ],
  waf: [
    {
      text: "AWS WAF",
      href: "/wafv2",
      items: [
        { text: "WAF V2 web ACLs", href: "/wafv2" },
        { text: "WAF Classic", href: "/waf-classic" },
      ],
    },
    {
      text: "Related security",
      href: "/acm",
      items: [
        { text: "Certificate Manager", href: "/acm" },
        { text: "Shield", href: "/shield" },
      ],
    },
  ],
  cognito: [
    {
      text: "Amazon Cognito",
      href: "/cognito",
      items: [{ text: "User pools", href: "/cognito" }],
    },
    {
      text: "Related identity",
      href: "/iam",
      items: [
        { text: "IAM", href: "/iam" },
        { text: "Lambda", href: "/lambda" },
      ],
    },
  ],
  acm: [
    {
      text: "AWS Certificate Manager",
      href: "/acm",
      items: [{ text: "Certificates", href: "/acm" }],
    },
    {
      text: "Related security",
      href: "/kms",
      items: [
        { text: "KMS", href: "/kms" },
        { text: "IAM", href: "/iam" },
      ],
    },
  ],
  efs: [
    {
      text: "Amazon EFS",
      href: "/efs",
      items: [{ text: "File systems", href: "/efs" }],
    },
    {
      text: "Related storage",
      href: "/s3",
      items: [
        { text: "S3", href: "/s3" },
        { text: "EBS volumes", href: "/volume" },
      ],
    },
  ],
  elb: [
    {
      text: "Elastic Load Balancing",
      href: "/elb",
      items: [
        { text: "Load balancers", href: "/elb" },
        { text: "Application load balancers", href: "/elb/alb" },
        { text: "Network load balancers", href: "/elb/nlb" },
      ],
    },
    {
      text: "Related compute",
      href: "/ec2",
      items: [
        { text: "EC2 instances", href: "/ec2" },
        { text: "Auto Scaling", href: "/auto-scaling" },
      ],
    },
  ],
  eventbridge: [
    {
      text: "Amazon EventBridge",
      href: "/eventbridge",
      items: [
        { text: "Event buses", href: "/eventbridge" },
        { text: "Schemas", href: "/eventbridge-schema" },
        { text: "Pipes", href: "/eventbridge-pipe" },
        { text: "Scheduler", href: "/eventbridge-scheduler" },
      ],
    },
    {
      text: "Related eventing",
      href: "/sns",
      items: [
        { text: "SNS topics", href: "/sns" },
        { text: "Lambda", href: "/lambda" },
      ],
    },
  ],
  "auto-scaling": [
    {
      text: "Amazon EC2 Auto Scaling",
      href: "/auto-scaling",
      items: [{ text: "Auto Scaling groups", href: "/auto-scaling" }],
    },
    {
      text: "Related compute",
      href: "/ec2",
      items: [
        { text: "EC2 instances", href: "/ec2" },
        { text: "Launch instances", href: "/ec2/launch" },
      ],
    },
  ],
  appsync: [
    {
      text: "AWS AppSync",
      href: "/appsync",
      items: [{ text: "APIs", href: "/appsync" }],
    },
    {
      text: "Related compute",
      href: "/lambda",
      items: [
        { text: "Lambda", href: "/lambda" },
        { text: "API Gateway", href: "/apigateway" },
      ],
    },
  ],
};

function normalizeServiceName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildCatalogNavigation(
  pathname: string | null | undefined,
  serviceName?: string,
): readonly ServiceNavigationGroup[] | undefined {
  const routeKey = pathname?.split("/").filter(Boolean)[0]?.toLowerCase();
  const routePrefix = routeKey ? `/${routeKey}` : undefined;
  const routeMatch = routePrefix
    ? ALL_SERVICES.find(
        (service) => service.href === routePrefix || service.href?.startsWith(`${routePrefix}/`),
      )
    : undefined;
  const normalizedName = serviceName ? normalizeServiceName(serviceName) : undefined;
  const nameMatch = normalizedName
    ? ALL_SERVICES.find((service) => {
        const text = service.text;
        if (!text) return false;
        const normalizedText = normalizeServiceName(text);
        return normalizedText === normalizedName || normalizedText.startsWith(normalizedName);
      })
    : undefined;
  const currentService = routeMatch || nameMatch;
  const currentHref = currentService?.href;
  if (!currentHref) return undefined;

  const category = NAVIGATION_ITEMS.find((group) =>
    group.items?.some((service) => service.href === currentHref),
  );
  const relatedLinks = (category?.items || [])
    .filter((service) => service.href && service.text && service.href !== currentHref)
    .slice(0, 8)
    .map((service) => ({ text: service.text!, href: service.href! }));
  const currentLink = {
    text: "Overview",
    href: currentHref,
  };
  const items = [currentLink, ...relatedLinks];

  return [
    {
      text: currentService.text || serviceName || currentHref,
      href: currentHref,
      items,
    },
  ];
}

export function getServiceNavigation(
  pathname: string | null | undefined,
  serviceName?: string,
): readonly ServiceNavigationGroup[] | undefined {
  const routeKey = pathname?.split("/").filter(Boolean)[0]?.toLowerCase();
  if (routeKey && SERVICE_NAVIGATION[routeKey]) return SERVICE_NAVIGATION[routeKey];

  const routeFamily = routeKey
    ? Object.keys(SERVICE_NAVIGATION).find((key) => routeKey.startsWith(`${key}-`))
    : undefined;
  if (routeFamily) return SERVICE_NAVIGATION[routeFamily];

  const normalizedName = serviceName ? normalizeServiceName(serviceName) : undefined;
  if (normalizedName) {
    const configuredMatch = Object.entries(SERVICE_NAVIGATION).find(([key]) => {
      const normalizedKey = normalizeServiceName(key);
      return normalizedKey === normalizedName || normalizedName.startsWith(normalizedKey);
    });
    if (configuredMatch) return configuredMatch[1];
  }

  return buildCatalogNavigation(pathname, serviceName);
}
