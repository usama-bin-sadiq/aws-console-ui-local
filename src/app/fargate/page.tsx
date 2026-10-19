"use client";

import React, { useCallback, useEffect, useState } from "react";
import Alert from "@cloudscape-design/components/alert";
import Badge from "@cloudscape-design/components/badge";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import Link from "@cloudscape-design/components/link";
import type { LinkProps } from "@cloudscape-design/components/link";
import List from "@cloudscape-design/components/list";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import type { StatusIndicatorProps } from "@cloudscape-design/components/status-indicator";
import Tabs from "@cloudscape-design/components/tabs";
import type { TabsProps } from "@cloudscape-design/components/tabs";
import { useRouter } from "next/navigation";
import { CrossServiceLinks } from "@/components/CrossServiceLinks";
import type { CrossServiceLink } from "@/components/CrossServiceLinks";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import {
  findServiceCompatibility,
  getServiceAvailability,
  toAdapterMode,
} from "@/constants/service-compatibility";
import type { EmulatorHealthStatus, ServiceAvailability } from "@/constants/service-compatibility";

/**
 * Fargate overview page.
 *
 * AWS Fargate is not a standalone service with its own resources — it is a
 * launch type for ECS tasks (and EKS pods). This page is therefore an honest
 * information/landing page: it explains Fargate and deep-links into ECS. It
 * deliberately shows no fabricated clusters, tasks, or capacity data.
 */

interface FargateLink extends CrossServiceLink {
  /** Documents intent — CrossServiceLinks routes external hrefs via hard navigation. */
  readonly external?: boolean;
}

interface HealthData {
  readonly status: EmulatorHealthStatus;
  readonly provider: string;
  readonly services?: Record<string, unknown>;
}

interface Bullet {
  readonly id: string;
  readonly content: React.ReactNode;
}

interface BulletListProps {
  readonly ariaLabel: string;
  readonly bullets: readonly Bullet[];
}

const WORKFLOW_LINKS: readonly FargateLink[] = [
  {
    label: "Create ECS Cluster with Fargate",
    href: "/ecs-cluster",
    description: "Create an ECS cluster with FARGATE capacity providers",
  },
  {
    label: "View Fargate Tasks",
    href: "/ecs-service",
    description: "Open ECS services and filter tasks by the FARGATE launch type",
  },
  {
    label: "Fargate Pricing",
    href: "https://aws.amazon.com/fargate/pricing/",
    description: "Official AWS Fargate pricing",
    external: true,
  },
  {
    label: "Fargate Documentation",
    href: "https://docs.aws.amazon.com/AmazonECS/latest/userguide/AWS_Fargate.html",
    description: "Official AWS Fargate user guide",
    external: true,
  },
];

const RELATED_LINKS: readonly FargateLink[] = [
  { label: "Amazon ECS", href: "/ecs-cluster", description: "Container orchestration service" },
  {
    label: "Amazon EKS",
    href: "/eks-cluster",
    description: "Kubernetes control plane for Fargate pods",
  },
  { label: "Amazon ECR", href: "/ecr-repo", description: "Container image registry" },
  { label: "Amazon CloudWatch", href: "/cloudwatch", description: "Monitoring and logs" },
  { label: "AWS IAM", href: "/iam", description: "Task execution and task roles" },
  { label: "Amazon VPC", href: "/vpc", description: "Network isolation for tasks" },
  {
    label: "AWS Secrets Manager",
    href: "/secrets-manager",
    description: "Inject secrets into containers",
  },
  {
    label: "Application Load Balancer",
    href: "/ec2-elastic-loading",
    description: "Load balance Fargate services",
  },
  { label: "AWS App Mesh", href: "/app-mesh", description: "Service mesh for microservices" },
];

const HEALTH_STATUSES: readonly string[] = [
  "healthy",
  "degraded",
  "unreachable",
  "checking",
  "starting",
];

/**
 * Health keys the emulator may use for ECS. Fargate itself is never a health
 * key (LocalStack reports `ecs`), so ECS is the capability source of truth.
 */
const ECS_HEALTH_KEYS: readonly string[] = ["ecs", "ecscluster", "amazonecscluster"];

const normalizeHealthKey = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, "");

function parseHealthPayload(payload: unknown): HealthData | null {
  if (typeof payload !== "object" || payload === null) return null;
  const record = payload as Record<string, unknown>;
  const status =
    typeof record.status === "string" && HEALTH_STATUSES.includes(record.status)
      ? (record.status as EmulatorHealthStatus)
      : "unreachable";
  const provider = typeof record.provider === "string" ? record.provider : "localstack";
  const services =
    typeof record.services === "object" &&
    record.services !== null &&
    !Array.isArray(record.services)
      ? (record.services as Record<string, unknown>)
      : {};
  return { status, provider, services };
}

/** Map the emulator's ECS health key (e.g. `ecs`) onto the `ecs-cluster` registry route. */
function withEcsHealthAlias(services: Record<string, unknown>): Record<string, unknown> {
  const match = Object.entries(services).find(([key]) =>
    ECS_HEALTH_KEYS.includes(normalizeHealthKey(key)),
  );
  return match ? { ...services, "ecs-cluster": match[1] } : services;
}

const getStatusType = (status: string): StatusIndicatorProps.Type => {
  switch (status) {
    case "full":
    case "available":
      return "success";
    case "partial":
      return "warning";
    case "not-supported":
    case "unavailable":
      return "error";
    default:
      return "info";
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case "full":
      return "Full support";
    case "partial":
      return "Partial support";
    case "not-supported":
      return "Not supported";
    case "available":
      return "Available";
    case "unavailable":
      return "Unavailable";
    default:
      return "Unknown";
  }
};

const BulletList: React.FC<BulletListProps> = ({ ariaLabel, bullets }) => (
  <List
    ariaLabel={ariaLabel}
    items={bullets}
    renderItem={(item: Bullet) => ({ id: item.id, content: item.content })}
  />
);

const Code: React.FC<{ readonly children: React.ReactNode }> = ({ children }) => (
  <Box variant="awsui-inline-code">{children}</Box>
);

const HOW_IT_WORKS_TABS: TabsProps.Tab[] = [
  {
    id: "concepts",
    label: "Core Concepts",
    content: (
      <SpaceBetween size="l" direction="vertical">
        <SpaceBetween size="s" direction="vertical">
          <Header variant="h3">Launch types</Header>
          <Box variant="p">ECS supports two launch types for running tasks:</Box>
          <BulletList
            ariaLabel="ECS launch types"
            bullets={[
              {
                id: "launch-fargate",
                content: (
                  <>
                    <Box variant="strong">FARGATE</Box> — serverless, managed infrastructure. You
                    specify CPU and memory per task.
                  </>
                ),
              },
              {
                id: "launch-ec2",
                content: (
                  <>
                    <Box variant="strong">EC2</Box> — you manage the EC2 instances (container
                    instances) that run the tasks.
                  </>
                ),
              },
            ]}
          />
          <Box variant="p">
            There are no separate “Fargate clusters” or “Fargate tasks” resources. All tasks live in
            ECS clusters and services — the launch type is a property of the task or service.
          </Box>
        </SpaceBetween>
        <SpaceBetween size="s" direction="vertical">
          <Header variant="h3">Platform versions</Header>
          <Box variant="p">
            Fargate platform versions provide runtime improvements and features:
          </Box>
          <BulletList
            ariaLabel="Fargate platform versions"
            bullets={[
              {
                id: "pv-latest",
                content: (
                  <>
                    <Code>LATEST</Code> — always points to the newest platform version (recommended)
                  </>
                ),
              },
              {
                id: "pv-140",
                content: (
                  <>
                    <Code>1.4.0</Code> — current stable version with the full feature set
                  </>
                ),
              },
              {
                id: "pv-updates",
                content: "Each version includes kernel updates, security patches, and new features",
              },
            ]}
          />
        </SpaceBetween>
        <SpaceBetween size="s" direction="vertical">
          <Header variant="h3">CPU architectures</Header>
          <BulletList
            ariaLabel="Fargate CPU architectures"
            bullets={[
              {
                id: "arch-x86",
                content: (
                  <>
                    <Box variant="strong">X86_64</Box> — traditional Intel/AMD architecture
                  </>
                ),
              },
              {
                id: "arch-arm",
                content: (
                  <>
                    <Box variant="strong">ARM64</Box> — AWS Graviton2 processors, up to 40% better
                    price/performance
                  </>
                ),
              },
            ]}
          />
        </SpaceBetween>
      </SpaceBetween>
    ),
  },
  {
    id: "task-definition",
    label: "Task Definition",
    content: (
      <SpaceBetween size="l" direction="vertical">
        <SpaceBetween size="s" direction="vertical">
          <Header variant="h3">Fargate task definition requirements</Header>
          <BulletList
            ariaLabel="Fargate task definition requirements"
            bullets={[
              {
                id: "td-network",
                content: (
                  <>
                    <Code>networkMode</Code> must be <Code>awsvpc</Code> (each task gets its own
                    ENI)
                  </>
                ),
              },
              {
                id: "td-compat",
                content: (
                  <>
                    <Code>requiresCompatibilities</Code> must include <Code>FARGATE</Code>
                  </>
                ),
              },
              {
                id: "td-resources",
                content: (
                  <>
                    <Code>cpu</Code> and <Code>memory</Code> must be set at the task level using a
                    valid combination
                  </>
                ),
              },
              {
                id: "td-execution-role",
                content: (
                  <>
                    <Code>executionRoleArn</Code> is required for pulling images, CloudWatch Logs,
                    and Secrets Manager
                  </>
                ),
              },
              {
                id: "td-task-role",
                content: (
                  <>
                    <Code>taskRoleArn</Code> is optional — grants the task permissions to AWS
                    services
                  </>
                ),
              },
            ]}
          />
        </SpaceBetween>
        <SpaceBetween size="s" direction="vertical">
          <Header variant="h3">Valid CPU/memory combinations</Header>
          <Box variant="p">
            Fargate supports specific vCPU and memory combinations (memory in GB):
          </Box>
          <BulletList
            ariaLabel="Valid Fargate CPU and memory combinations"
            bullets={[
              { id: "cpu-025", content: "0.25 vCPU — 0.5, 1, 2 GB" },
              { id: "cpu-05", content: "0.5 vCPU — 1, 2, 3, 4 GB" },
              { id: "cpu-1", content: "1 vCPU — 2, 3, 4, 5, 6, 7, 8 GB" },
              { id: "cpu-2", content: "2 vCPU — 4 to 16 GB" },
              { id: "cpu-4", content: "4 vCPU — 8 to 30 GB (1 GB increments)" },
              { id: "cpu-8", content: "8 vCPU — 16 to 60 GB (4 GB increments)" },
              { id: "cpu-16", content: "16 vCPU — 32 to 120 GB (8 GB increments, Linux only)" },
            ]}
          />
        </SpaceBetween>
      </SpaceBetween>
    ),
  },
  {
    id: "networking",
    label: "Networking",
    content: (
      <SpaceBetween size="l" direction="vertical">
        <SpaceBetween size="s" direction="vertical">
          <Header variant="h3">awsvpc network mode</Header>
          <Box variant="p">
            Fargate tasks use <Code>awsvpc</Code> network mode, which provides:
          </Box>
          <BulletList
            ariaLabel="awsvpc network mode characteristics"
            bullets={[
              { id: "net-eni", content: "Each task gets its own elastic network interface (ENI)" },
              {
                id: "net-ip",
                content: "The task gets a primary private IPv4 address from the subnet",
              },
              { id: "net-sg", content: "Security groups attach directly to the task ENI" },
              {
                id: "net-ports",
                content: "No port mapping conflicts — each task has the full port range",
              },
              {
                id: "net-localhost",
                content: "Containers in the same task communicate over localhost",
              },
            ]}
          />
        </SpaceBetween>
        <SpaceBetween size="s" direction="vertical">
          <Header variant="h3">VPC configuration</Header>
          <Box variant="p">When running Fargate tasks, you must specify:</Box>
          <BulletList
            ariaLabel="Fargate VPC configuration requirements"
            bullets={[
              {
                id: "vpc-subnets",
                content: "One or more subnets (private subnets recommended for production)",
              },
              { id: "vpc-sg", content: "Security groups controlling inbound and outbound traffic" },
              {
                id: "vpc-public-ip",
                content: (
                  <>
                    <Code>assignPublicIp</Code> — <Code>ENABLED</Code> or <Code>DISABLED</Code> for
                    public IP assignment
                  </>
                ),
              },
            ]}
          />
          <Alert type="info" header="Private subnets">
            For production workloads, use private subnets with a NAT gateway for outbound internet
            access. Public subnets with public IPs suit development or internet-facing services.
          </Alert>
        </SpaceBetween>
      </SpaceBetween>
    ),
  },
  {
    id: "pricing-model",
    label: "Pricing Model",
    content: (
      <SpaceBetween size="l" direction="vertical">
        <SpaceBetween size="s" direction="vertical">
          <Header variant="h3">Per-second billing</Header>
          <Box variant="p">
            Fargate bills per second (1-minute minimum) for the vCPU and memory a task uses:
          </Box>
          <BulletList
            ariaLabel="Fargate per-second billing details"
            bullets={[
              { id: "price-vcpu", content: "vCPU: $0.04048 per vCPU per hour (Linux, us-east-1)" },
              {
                id: "price-memory",
                content: "Memory: $0.004445 per GB per hour (Linux, us-east-1)",
              },
              {
                id: "price-windows",
                content: "Windows containers: additional Windows license cost",
              },
              { id: "price-arm", content: "ARM64 (Graviton2): lower rates than x86_64" },
            ]}
          />
          <Box variant="p">
            See the{" "}
            <Link
              href="https://aws.amazon.com/fargate/pricing/"
              external
              externalIconAriaLabel="External AWS website"
            >
              AWS Fargate pricing page
            </Link>{" "}
            for current rates.
          </Box>
        </SpaceBetween>
        <SpaceBetween size="s" direction="vertical">
          <Header variant="h3">Fargate Spot</Header>
          <Box variant="p">Up to 70% discount compared to On-Demand Fargate pricing.</Box>
          <BulletList
            ariaLabel="Fargate Spot characteristics"
            bullets={[
              { id: "spot-variable", content: "Variable pricing based on supply and demand" },
              { id: "spot-interrupt", content: "Tasks can be interrupted with a 2-minute notice" },
              {
                id: "spot-strategy",
                content: (
                  <>
                    Mix <Code>FARGATE_SPOT</Code> and <Code>FARGATE</Code> in a capacity provider
                    strategy for blended workloads
                  </>
                ),
              },
            ]}
          />
        </SpaceBetween>
        <SpaceBetween size="s" direction="vertical">
          <Header variant="h3">Additional costs</Header>
          <BulletList
            ariaLabel="Additional costs related to Fargate"
            bullets={[
              { id: "cost-data-transfer", content: "Data transfer — standard AWS rates apply" },
              { id: "cost-logs", content: "CloudWatch Logs — ingestion and storage charges" },
              { id: "cost-ecr", content: "Amazon ECR — image storage and data transfer" },
              {
                id: "cost-ebs",
                content:
                  "EBS volumes (optional) — billed per GB-month for ephemeral storage above 20 GB",
              },
            ]}
          />
        </SpaceBetween>
      </SpaceBetween>
    ),
  },
];

export default function FargatePage() {
  const router = useRouter();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/health");
      const payload: unknown = await response.json();
      const parsed = parseHealthPayload(payload);
      if (parsed === null) {
        throw new Error("Unexpected response from /api/health");
      }
      setHealth(parsed);
    } catch (err) {
      setHealth(null);
      setError(err instanceof Error ? err.message : "Failed to fetch health");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHealth();
  }, [fetchHealth]);

  const pushOnFollow =
    (href: string) =>
    (event: CustomEvent<LinkProps.FollowDetail>): void => {
      event.preventDefault();
      router.push(href);
    };

  // Fargate has no health key — capability is derived from the ECS service.
  const activeMode = toAdapterMode(health?.provider);
  const ecsCompatibility = findServiceCompatibility("/ecs-cluster");
  const ecsAvailability: ServiceAvailability | null =
    health === null || ecsCompatibility === undefined
      ? null
      : getServiceAvailability(
          ecsCompatibility,
          activeMode,
          health.status,
          withEcsHealthAlias(health.services ?? {}),
        );

  const providerLabel =
    health === null
      ? undefined
      : health.provider === "ministack"
        ? "MiniStack"
        : health.provider === "localstack"
          ? "LocalStack"
          : health.provider;

  const headerHealthReason =
    error !== null
      ? "Emulator health check failed"
      : health === null
        ? "Checking emulator health"
        : health.status === "unreachable"
          ? "Emulator endpoint unreachable"
          : `${providerLabel ?? health.provider} ${health.status}`;

  const capabilityContent = loading ? (
    <StatusIndicator type="in-progress">Checking emulator capability…</StatusIndicator>
  ) : error !== null ? (
    <SpaceBetween size="s" direction="vertical">
      <Alert type="error" header="Failed to load emulator status">
        {error}
      </Alert>
      <Button onClick={() => void fetchHealth()}>Retry</Button>
    </SpaceBetween>
  ) : ecsAvailability !== null ? (
    <SpaceBetween size="l" direction="vertical">
      <ColumnLayout columns={3} variant="text-grid">
        <SpaceBetween size="xs" direction="vertical">
          <Box variant="strong" color="text-body-secondary">
            Adapter
          </Box>
          <Badge>{providerLabel ?? "Unknown"}</Badge>
        </SpaceBetween>
        <SpaceBetween size="xs" direction="vertical">
          <Box variant="strong" color="text-body-secondary">
            Amazon ECS (runs Fargate tasks)
          </Box>
          <StatusIndicator type={getStatusType(ecsAvailability.status)}>
            {getStatusLabel(ecsAvailability.status)}
          </StatusIndicator>
        </SpaceBetween>
        <SpaceBetween size="xs" direction="vertical">
          <Box variant="strong" color="text-body-secondary">
            Fargate launch type
          </Box>
          <StatusIndicator type={ecsAvailability.enabled ? "success" : "warning"}>
            {ecsAvailability.enabled ? "Available through ECS" : "Unavailable through ECS"}
          </StatusIndicator>
        </SpaceBetween>
      </ColumnLayout>
      <Alert
        type={ecsAvailability.enabled ? "info" : "warning"}
        header="Fargate has no separate health key"
      >
        {ecsAvailability.reason} The emulator reports ECS capability, not a standalone Fargate
        service — Fargate tasks run through ECS whenever ECS is enabled.
      </Alert>
    </SpaceBetween>
  ) : (
    <Alert type="warning" header="Capability status unavailable">
      No emulator health data was returned for the ECS service. Fargate capability cannot be
      determined without ECS.
    </Alert>
  );

  return (
    <ServiceLayout
      serviceName="AWS Fargate"
      serviceCategory="Compute"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "Compute", href: "#" },
        { text: "AWS Fargate", href: "/fargate" },
      ]}
      provider={providerLabel}
      healthStatus={health === null ? "checking" : health.status}
      healthReason={headerHealthReason}
      crossServiceLinks={
        <CrossServiceLinks title="Fargate workflow links" links={[...WORKFLOW_LINKS]} />
      }
    >
      <SpaceBetween size="l" direction="vertical">
        <Alert type="info" header="Fargate is managed via ECS">
          AWS Fargate is a serverless compute engine for containers. Fargate tasks are launched
          through ECS. Manage your Fargate workloads via{" "}
          <Link href="/ecs-cluster" onFollow={pushOnFollow("/ecs-cluster")}>
            ECS Clusters
          </Link>{" "}
          and{" "}
          <Link href="/ecs-service" onFollow={pushOnFollow("/ecs-service")}>
            ECS Services
          </Link>{" "}
          by selecting the FARGATE launch type.
        </Alert>

        <Container header={<Header variant="h2">What is AWS Fargate?</Header>}>
          <SpaceBetween size="m" direction="vertical">
            <Box variant="p">
              AWS Fargate is a serverless compute engine for containers that works with both Amazon
              Elastic Container Service (ECS) and Amazon Elastic Kubernetes Service (EKS). Fargate
              eliminates the need to provision and manage EC2 instances. You specify CPU and memory
              requirements in your task or pod definition, and Fargate handles the underlying
              infrastructure.
            </Box>
            <SpaceBetween size="xs" direction="vertical">
              <Box variant="strong">Key benefits</Box>
              <BulletList
                ariaLabel="AWS Fargate key benefits"
                bullets={[
                  {
                    id: "benefit-no-ec2",
                    content:
                      "No EC2 instances to manage — no cluster capacity planning, patching, or scaling",
                  },
                  {
                    id: "benefit-pay-per-task",
                    content: "Pay per task — granular billing by vCPU and memory per second",
                  },
                  {
                    id: "benefit-isolation",
                    content:
                      "Built-in security isolation — each task runs in its own kernel runtime environment",
                  },
                  {
                    id: "benefit-integration",
                    content: "Integrated with ECS and EKS — use familiar APIs and tooling",
                  },
                  {
                    id: "benefit-os",
                    content: "Supports both Linux and Windows containers",
                  },
                ]}
              />
            </SpaceBetween>
          </SpaceBetween>
        </Container>

        <Container header={<Header variant="h2">Fargate capacity providers</Header>}>
          <SpaceBetween size="m" direction="vertical">
            <Box variant="p">
              In ECS, Fargate is exposed through <Box variant="strong">capacity providers</Box>.
              When you create an ECS cluster, you can associate Fargate capacity providers to run
              tasks without managing EC2 instances.
            </Box>
            <Container>
              <SpaceBetween size="l" direction="vertical">
                <SpaceBetween size="xs" direction="vertical">
                  <Header variant="h3">FARGATE</Header>
                  <Box variant="p">The standard serverless capacity provider for ECS tasks.</Box>
                  <BulletList
                    ariaLabel="FARGATE capacity provider characteristics"
                    bullets={[
                      {
                        id: "fargate-on-demand",
                        content: "On-demand pricing — pay for vCPU and memory per second",
                      },
                      {
                        id: "fargate-production",
                        content:
                          "Suitable for production workloads requiring consistent performance",
                      },
                      {
                        id: "fargate-arch",
                        content:
                          "Supports all Fargate platform versions and CPU architectures (x86_64, ARM64)",
                      },
                    ]}
                  />
                </SpaceBetween>
                <SpaceBetween size="xs" direction="vertical">
                  <Header variant="h3">FARGATE_SPOT</Header>
                  <Box variant="p">
                    Spot capacity provider for fault-tolerant, flexible workloads at up to 70%
                    discount.
                  </Box>
                  <BulletList
                    ariaLabel="FARGATE_SPOT capacity provider characteristics"
                    bullets={[
                      {
                        id: "spot-savings",
                        content:
                          "Spot pricing — significant cost savings for interruptible workloads",
                      },
                      {
                        id: "spot-interrupt",
                        content: "Tasks may be interrupted with 2 minutes of notice",
                      },
                      {
                        id: "spot-use-cases",
                        content: "Ideal for batch jobs, CI/CD pipelines, and stateless workers",
                      },
                    ]}
                  />
                </SpaceBetween>
              </SpaceBetween>
            </Container>
            <Alert type="info" header="How to use capacity providers">
              Create an ECS cluster, then add <Code>FARGATE</Code> and/or <Code>FARGATE_SPOT</Code>{" "}
              as capacity providers. When creating a service or running a task, select the capacity
              provider strategy or launch type <Code>FARGATE</Code>. Fargate tasks do not appear as
              a separate resource type — they are ECS tasks with launchType <Code>FARGATE</Code>.
            </Alert>
          </SpaceBetween>
        </Container>

        <Container
          header={
            <Header
              variant="h2"
              description="Capability is derived from ECS — the emulator never reports a separate Fargate key."
            >
              Emulator capability
            </Header>
          }
        >
          {capabilityContent}
        </Container>

        <Container header={<Header variant="h2">How Fargate works in ECS</Header>}>
          <Tabs tabs={HOW_IT_WORKS_TABS} ariaLabel="How Fargate works in ECS" />
        </Container>

        <Container header={<Header variant="h2">Related services</Header>}>
          <CrossServiceLinks
            title="Services commonly used with Fargate"
            links={[...RELATED_LINKS]}
          />
        </Container>
      </SpaceBetween>
    </ServiceLayout>
  );
}
