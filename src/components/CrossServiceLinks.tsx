"use client";

import React from "react";
import { useRouter } from "next/navigation";
import ButtonDropdown, {
  type ButtonDropdownProps,
} from "@cloudscape-design/components/button-dropdown";

export interface CrossServiceLink {
  readonly label: string;
  readonly href: string;
  readonly description?: string;
}

export interface CrossServiceLinksProps {
  readonly title?: string;
  readonly links: CrossServiceLink[];
  /** Visible trigger text. AWS labels these menus rather than a section heading. */
  readonly triggerText?: string;
}

/**
 * CrossServiceLinks — the dependent-service create actions for the current
 * workflow, presented the way the AWS console presents them: one menu trigger
 * whose items each carry a label and a short description.
 *
 * The real AWS console does not render a "Related services" heading above a
 * wrapped row of links; those actions live in the service's own page toolbar and
 * in the service navigation. This component therefore renders an AWS-style menu
 * instead, keeping every destination reachable in a single place.
 */
export function CrossServiceLinks({ links, triggerText = "Create" }: CrossServiceLinksProps) {
  const router = useRouter();

  if (links.length === 0) return null;

  const items: ButtonDropdownProps.Item[] = links.map((link) => ({
    id: link.href,
    href: link.href,
    text: link.label,
    description: link.description,
  }));

  return (
    // Anchored and labelled, so it reads as a deliberate secondary action rather
    // than a stray button floating under the content. It sits next to a page's
    // own primary action, and competes with it if styled like one.
    <div className="aws-cross-service-create">
      <span className="aws-cross-service-create__label" id="aws-cross-service-create-label">
        In another service
      </span>
      <ButtonDropdown
        items={items}
        ariaLabel={`${triggerText}: dependent service actions`}
        variant="normal"
        expandToViewport
        onItemFollow={(event) => {
          if (event.detail.href) {
            event.preventDefault();
            router.push(event.detail.href);
          }
        }}
      >
        {triggerText}
      </ButtonDropdown>
    </div>
  );
}

/**
 * Workflow-oriented cross-service links for each service.
 * These are actionable links relevant during the current service's workflow.
 */
export const CROSS_SERVICE_LINKS: Record<string, CrossServiceLink[]> = {
  "/ec2": [
    {
      label: "Create Security Group",
      href: "/security-group",
      description: "Configure network firewall rules",
    },
    { label: "Create Key Pair", href: "/key-pair", description: "SSH key for instance access" },
    { label: "Create IAM Role", href: "/iam", description: "Instance profile permissions" },
    { label: "Create VPC", href: "/vpc", description: "Virtual private cloud" },
    { label: "Create Subnet", href: "/subnet", description: "Subnet for instance placement" },
    { label: "Allocate Elastic IP", href: "/elastic-ip", description: "Static public IP address" },
    {
      label: "Create CloudWatch Alarm",
      href: "/cloudwatch",
      description: "Monitor instance metrics",
    },
    {
      label: "Create Auto Scaling Group",
      href: "/auto-scaling",
      description: "Scale instances automatically",
    },
    {
      label: "Create Load Balancer",
      href: "/ec2-elastic-loading",
      description: "Distribute traffic",
    },
  ],
  "/s3": [
    { label: "Create IAM Policy", href: "/iam", description: "Bucket access policy" },
    { label: "Create KMS Key", href: "/kms", description: "Server-side encryption key" },
    { label: "Create Lambda Function", href: "/lambda", description: "Event notification handler" },
    {
      label: "Create CloudFront Distribution",
      href: "/cloudfront",
      description: "CDN for bucket content",
    },
    { label: "Create CloudTrail Trail", href: "/cloudtrail", description: "Data event logging" },
  ],
  "/lambda": [
    { label: "Create IAM Role", href: "/iam", description: "Function execution role" },
    { label: "Create API", href: "/api", description: "REST/HTTP API trigger" },
    { label: "Create SQS Queue", href: "/sqs", description: "Event source mapping" },
    { label: "Create SNS Topic", href: "/sns", description: "Event source mapping" },
    { label: "Create DynamoDB Table", href: "/dynamodb", description: "Stream trigger" },
    { label: "Create CloudWatch Log Group", href: "/cloudwatch", description: "Function logs" },
    {
      label: "Create Step Functions State Machine",
      href: "/step-functions",
      description: "Orchestrate workflows",
    },
    { label: "Create ECR Repository", href: "/ecr-repo", description: "Container image storage" },
    { label: "Create VPC", href: "/vpc", description: "VPC access for function" },
    { label: "Store Secret", href: "/secrets-manager", description: "Function secrets" },
  ],
  "/rds": [
    { label: "Create VPC", href: "/vpc", description: "Database VPC" },
    { label: "Create Security Group", href: "/security-group", description: "DB access rules" },
    { label: "Create IAM Role", href: "/iam", description: "DB authentication" },
    { label: "Create KMS Key", href: "/kms", description: "Encryption key" },
    { label: "Create CloudWatch Alarm", href: "/cloudwatch", description: "DB metrics monitoring" },
    { label: "Store Secret", href: "/secrets-manager", description: "DB credentials" },
    {
      label: "Create Parameter Group",
      href: "/systems-manager-parameter-store",
      description: "DB parameters",
    },
    { label: "Create DB Subnet Group", href: "/subnet", description: "Subnet group for DB" },
  ],
  "/vpc": [
    { label: "Create Subnet", href: "/subnet", description: "VPC subnet" },
    { label: "Create Route Table", href: "/route-table", description: "Routing rules" },
    { label: "Create Internet Gateway", href: "/internet-gateway", description: "Internet access" },
    { label: "Create NAT Gateway", href: "/nat-gateway", description: "Outbound internet access" },
    { label: "Create Security Group", href: "/security-group", description: "Firewall rules" },
    { label: "Create Network ACL", href: "/network-acl", description: "Subnet-level rules" },
    {
      label: "Create VPC Endpoint",
      href: "/ec2-vpc-endpoint",
      description: "Private AWS connectivity",
    },
    { label: "Allocate Elastic IP", href: "/elastic-ip", description: "Static IP" },
    { label: "Create Transit Gateway", href: "/transit-gateway", description: "Cross-VPC routing" },
  ],
  "/iam": [
    { label: "Create KMS Key", href: "/kms", description: "Encryption key" },
    { label: "Store Secret", href: "/secrets-manager", description: "Secure credentials" },
    { label: "Create CloudTrail Trail", href: "/cloudtrail", description: "API logging" },
    { label: "Get STS Credentials", href: "/sts", description: "Temporary credentials" },
    {
      label: "Create Organization",
      href: "/organizations",
      description: "Multi-account management",
    },
  ],
  "/dynamodb": [
    { label: "Create IAM Policy", href: "/iam", description: "Table access policy" },
    { label: "Create Lambda Function", href: "/lambda", description: "Stream trigger handler" },
    {
      label: "Create CloudWatch Alarm",
      href: "/cloudwatch",
      description: "Table metrics monitoring",
    },
    { label: "Create KMS Key", href: "/kms", description: "Encryption key" },
    { label: "Create VPC Endpoint", href: "/vpc", description: "Private table access" },
  ],
  "/cloudformation": [
    { label: "Create IAM Role", href: "/iam", description: "Stack execution role" },
    { label: "Create S3 Bucket", href: "/s3", description: "Template storage" },
    { label: "Create SNS Topic", href: "/sns", description: "Stack notifications" },
    {
      label: "Create CloudWatch Alarm",
      href: "/cloudwatch",
      description: "Stack event monitoring",
    },
  ],
  "/cloudwatch": [
    { label: "Create SNS Topic", href: "/sns", description: "Alarm notification target" },
    { label: "Create Log Group", href: "/cloudwatch-logs", description: "Log storage" },
  ],
  "/cloudtrail": [
    { label: "Create S3 Bucket", href: "/s3", description: "Trail log storage" },
    { label: "Create SNS Topic", href: "/sns", description: "Trail notifications" },
    { label: "Create IAM Role", href: "/iam", description: "Trail delivery role" },
    {
      label: "Create CloudWatch Log Group",
      href: "/cloudwatch",
      description: "Trail log delivery",
    },
  ],
  "/sqs": [
    { label: "Create IAM Policy", href: "/iam", description: "Queue access policy" },
    { label: "Create Lambda Function", href: "/lambda", description: "Event source consumer" },
    { label: "Create SNS Topic", href: "/sns", description: "Fan-out to queue" },
    {
      label: "Create CloudWatch Alarm",
      href: "/cloudwatch",
      description: "Queue depth monitoring",
    },
  ],
  "/sns": [
    { label: "Create IAM Policy", href: "/iam", description: "Topic access policy" },
    { label: "Create SQS Queue", href: "/sqs", description: "Subscription endpoint" },
    { label: "Create Lambda Function", href: "/lambda", description: "Subscription endpoint" },
    { label: "Create API", href: "/api", description: "HTTP subscription endpoint" },
  ],
  "/step-functions": [
    { label: "Create Lambda Function", href: "/lambda", description: "Lambda task" },
    { label: "Create SQS Queue", href: "/sqs", description: "SQS task target" },
    { label: "Create SNS Topic", href: "/sns", description: "SNS publish task" },
    { label: "Create DynamoDB Table", href: "/dynamodb", description: "DynamoDB task target" },
    { label: "Create IAM Role", href: "/iam", description: "Execution role" },
  ],
};
