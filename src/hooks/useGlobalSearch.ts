import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ALL_SERVICES } from "@/constants/navigation";
import { SERVICE_REGISTRY } from "@/constants/service-compatibility";
import { AdapterMode, EmulatorHealthStatus, findServiceCompatibility, getServiceAvailability } from "@/constants/service-compatibility";

interface SearchResult {
  text: string;
  href: string;
  category: string;
  description: string;
}

const SERVICE_CATEGORY_MAP: Record<string, string> = {
  "/s3": "Storage",
  "/s3-tables": "Storage",
  "/volume": "Storage",
  "/snapshot": "Storage",
  "/efs": "Storage",
  "/backup": "Storage",
  "/ec2": "Compute",
  "/lambda": "Compute",
  "/ecs-cluster": "Compute",
  "/ecs-service": "Compute",
  "/eks-cluster": "Compute",
  "/fargate": "Compute",
  "/auto-scaling": "Compute",
  "/launch-template": "Compute",
  "/ami": "Compute",
  "/batch-job": "Compute",
  "/dynamodb": "Database",
  "/rds": "Database",
  "/rds-data": "Database",
  "/elasticache": "Database",
  "/opensearch": "Database",
  "/dsql": "Database",
  "/vpc": "Networking",
  "/subnet": "Networking",
  "/route-table": "Networking",
  "/internet-gateway": "Networking",
  "/nat-gateway": "Networking",
  "/network-acl": "Networking",
  "/security-group": "Networking",
  "/elastic-ip": "Networking",
  "/ec2-vpc-endpoint": "Networking",
  "/ec2-vpc-peering": "Networking",
  "/transit-gateway": "Networking",
  "/vpn": "Networking",
  "/direct-connect": "Networking",
  "/route53": "Networking",
  "/ec2-health-check": "Networking",
  "/global-accelerator": "Networking",
  "/cloudfront": "Networking",
  "/iam": "Security",
  "/iam-access-key": "Security",
  "/iam-group": "Security",
  "/iam-instance-profile": "Security",
  "/iam-saml": "Security",
  "/iam-openid-connect": "Security",
  "/iam-password-policy": "Security",
  "/iam-credential-report": "Security",
  "/iam-virtual-mfa": "Security",
  "/kms": "Security",
  "/secrets-manager": "Security",
  "/acm": "Security",
  "/waf": "Security",
  "/waf-classic": "Security",
  "/wafv2": "Security",
  "/shield": "Security",
  "/guardduty": "Security",
  "/security-hub": "Security",
  "/macie": "Security",
  "/inspector": "Security",
  "/detective": "Security",
  "/verified-access": "Security",
  "/sqs": "Application Integration",
  "/sns": "Application Integration",
  "/sns-sms": "Application Integration",
  "/eventbridge-schema": "Application Integration",
  "/eventbridge-pipe": "Application Integration",
  "/eventbridge-scheduler": "Application Integration",
  "/step-functions": "Application Integration",
  "/appsync": "Application Integration",
  "/app-mesh": "Application Integration",
  "/servicediscovery": "Application Integration",
  "/pipes": "Application Integration",
  "/cloudwatch": "Monitoring",
  "/cloudwatch-logs": "Monitoring",
  "/x-ray": "Monitoring",
  "/imds": "Monitoring",
  "/ecr-repo": "Compute",
  "/cloudformation": "Management",
  "/cloudtrail": "Management",
  "/config": "Management",
  "/systems-manager-parameter-store": "Management",
  "/organizations": "Management",
  "/resource-groups": "Management",
  "/resource-groups-tagging": "Management",
  "/cloudcontrol": "Management",
  "/appconfig": "Management",
  "/cost-explorer": "Management",
  "/billing": "Management",
  "/budget": "Management",
  "/support": "Management",
  "/app-auto-scaling": "Developer Tools",
  "/code-deploy": "Developer Tools",
  "/kinesis": "Analytics",
  "/firehose": "Analytics",
  "/glue-catalog": "Analytics",
  "/glue-job": "Analytics",
  "/athena-workgroup": "Analytics",
  "/msk": "Analytics",
  "/emr": "Analytics",
};

const SERVICE_DESCRIPTIONS: Record<string, string> = {
  "S3": "Scalable object storage",
  "S3 Tables": "Apache Iceberg tables in S3",
  "EBS Volumes": "Elastic block storage volumes",
  "EBS Snapshots": "EBS volume snapshots",
  "EFS": "Elastic file system",
  "Backup": "Centralized backup service",
  "EC2": "Virtual servers in the cloud",
  "Lambda": "Run code without servers",
  "ECS Clusters": "Container orchestration",
  "ECS Services": "Container services",
  "EKS Clusters": "Kubernetes service",
  "ECR Repos": "Container image registry",
  "Fargate": "Serverless container compute",
  "Auto Scaling": "Automatic EC2 scaling groups",
  "Launch Templates": "EC2 instance launch templates",
  "AMI": "Amazon machine images",
  "Batch Jobs": "AWS Batch computing jobs",
  "DynamoDB": "NoSQL key-value database",
  "RDS": "Managed relational databases",
  "RDS Data": "Aurora Serverless Data API",
  "ElastiCache": "In-memory caching",
  "OpenSearch": "Search and analytics",
  "DSQL": "Aurora Distributed SQL",
  "VPC": "Virtual private cloud",
  "Subnets": "VPC subnet management",
  "Route Tables": "VPC routing configuration",
  "Internet Gateways": "VPC internet connectivity",
  "NAT Gateways": "Network address translation",
  "Network ACLs": "Subnet-level firewall rules",
  "Security Groups": "Firewall rules",
  "Elastic IPs": "Static public IP addresses",
  "VPC Endpoints": "Private VPC service connectivity",
  "VPC Peering": "VPC-to-VPC connections",
  "Transit Gateway": "VPC network transit hub",
  "VPN Connections": "Site-to-site VPN connections",
  "Direct Connect": "Dedicated network connection",
  "Route 53": "DNS and domain names",
  "EC2 Health Checks": "Health monitoring",
  "Global Accelerator": "Global network performance",
  "CloudFront": "Content delivery network",
  "IAM": "Identity and access management",
  "IAM Access Keys": "Programmatic AWS credentials",
  "IAM Groups": "IAM user group management",
  "IAM Instance Profiles": "EC2 role instance profiles",
  "IAM SAML": "SAML 2.0 identity providers",
  "IAM OpenID Connect": "OIDC identity providers",
  "IAM Password Policy": "Account password requirements",
  "IAM Credential Report": "IAM credentials audit report",
  "IAM Virtual MFA": "Virtual MFA device management",
  "KMS": "Key management service",
  "Secrets Manager": "Secrets rotation and storage",
  "ACM": "SSL/TLS certificate management",
  "WAF": "Web application firewall",
  "WAF Classic": "Legacy web application firewall",
  "WAF v2": "Web application firewall v2",
  "Shield": "DDoS protection",
  "GuardDuty": "Intelligent threat detection",
  "Security Hub": "Security posture management",
  "Macie": "Sensitive data discovery",
  "Inspector": "Automated vulnerability scanning",
  "Detective": "Security investigation and analysis",
  "Verified Access": "Zero-trust network access",
  "SQS": "Message queuing service",
  "SNS": "Pub/sub messaging",
  "SNS SMS": "SMS notifications via SNS",
  "EventBridge": "EventBridge event buses",
  "EventBridge Pipes": "Event pipes",
  "EventBridge Scheduler": "Scheduled events",
  "Step Functions": "Workflow orchestration",
  "API Gateway": "GraphQL and REST APIs",
  "App Mesh": "Microservices service mesh",
  "Service Discovery": "Cloud Map service discovery",
  "Pipes": "EventBridge event pipes",
  "App Auto Scaling": "Application auto scaling",
  "CodeDeploy": "Application deployment automation",
  "Kinesis Streams": "Real-time data streams",
  "Kinesis Firehose": "Streaming data delivery",
  "Glue Catalog": "Glue data catalog",
  "Glue Jobs": "Glue ETL jobs",
  "Athena Workgroups": "Serverless SQL query workgroups",
  "MSK": "Managed Streaming for Kafka",
  "EMR": "Elastic MapReduce big data",
  "CloudWatch": "Monitoring and observability",
  "CloudWatch Logs": "Log management and analysis",
  "X-Ray": "Distributed request tracing",
  "IMDS": "EC2 instance metadata service",
  "CloudFormation": "Infrastructure as code stacks",
  "CloudTrail": "AWS API activity logging",
  "AWS Config": "Resource compliance and inventory",
  "Systems Manager": "SSM Parameter Store",
  "Resource Tags": "Tag-based resource search",
  "Cost Explorer": "AWS cost visualization",
  "Billing": "AWS billing and invoices",
  "Budgets": "Cost budget alerts",
  "Support": "AWS technical support",
};

export function useGlobalSearch(
  mode: AdapterMode | 'unknown' = AdapterMode.LOCALSTACK,
  healthStatus: EmulatorHealthStatus = 'checking',
  healthServices: Record<string, unknown> = {},
) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const recent = localStorage.getItem("aws_recent_searches");
    if (recent) {
      try {
        setRecentSearches(JSON.parse(recent));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  useEffect(() => {
    if (searchValue.length >= 2) {
      const results: SearchResult[] = [];

      ALL_SERVICES.forEach((service: any) => {
        const compatibility = findServiceCompatibility(service.href);
        const available = compatibility
          ? getServiceAvailability(compatibility, mode, healthStatus, healthServices).enabled
          : false;
        if (available && service.text?.toLowerCase().includes(searchValue.toLowerCase())) {
          results.push({
            text: service.text,
            href: service.href,
            category: SERVICE_CATEGORY_MAP[service.href] || "Other",
            description: SERVICE_DESCRIPTIONS[service.text] || "",
          });
        }
      });

      // Also search SERVICE_REGISTRY for broader coverage
      SERVICE_REGISTRY.forEach((svc) => {
        const available = getServiceAvailability(svc, mode, healthStatus, healthServices).enabled;
        if (available && svc.serviceName.toLowerCase().includes(searchValue.toLowerCase())) {
          const existing = results.find((r) => r.text === svc.serviceName);
          if (!existing) {
            results.push({
              text: svc.serviceName,
              href: `/${svc.routeDir}`,
              category: SERVICE_CATEGORY_MAP[`/${svc.routeDir}`] || "Service",
              description: svc.commonDifferentNote || svc.serviceName,
            });
          }
        }
      });

      setSearchResults(results.slice(0, 20));
      setShowDropdown(true);
      setSelectedIndex(0);
    } else {
      setShowDropdown(false);
      setSearchResults([]);
    }
  }, [searchValue, mode, healthStatus, healthServices]);

  useEffect(() => {
    if (!showDropdown || searchResults.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (searchResults[selectedIndex]) {
            navigateToService(searchResults[selectedIndex]);
          }
          break;
        case "Escape":
          setShowDropdown(false);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showDropdown, selectedIndex, searchResults]);

  const navigateToService = (result: SearchResult) => {
    const updated = [result.text, ...recentSearches.filter(s => s !== result.text)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem("aws_recent_searches", JSON.stringify(updated));

    router.push(result.href);
    setShowDropdown(false);
    setSearchValue("");
  };

  return {
    searchValue,
    setSearchValue,
    searchResults,
    showDropdown,
    setShowDropdown,
    selectedIndex,
    navigateToService,
    recentSearches,
  };
}

export function groupByCategory(results: SearchResult[]): Record<string, SearchResult[]> {
  const grouped: Record<string, SearchResult[]> = {};

  results.forEach((result) => {
    if (!grouped[result.category]) {
      grouped[result.category] = [];
    }
    grouped[result.category].push(result);
  });

  return grouped;
}
