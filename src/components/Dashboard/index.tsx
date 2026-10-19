/**
 * Dashboard — Main homepage dashboard with adapter-connected widgets.
 * Matches AWS console homepage: service cards, health indicators, adapter status, resource counts.
 */

import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Input from "@cloudscape-design/components/input";
import Cards from "@cloudscape-design/components/cards";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Container from "@cloudscape-design/components/container";
import Box from "@cloudscape-design/components/box";
import { AdapterStatus } from "@/components/AdapterStatus/AdapterStatus";
import { ADAPTER_CONFIG } from "@/config/adapter-config";
import { SERVICE_REGISTRY } from "@/constants/service-compatibility";

export default function Dashboard() {
  const [adapterStatus, setAdapterStatus] = useState<"connected" | "disconnected" | "checking">(
    "checking",
  );
  const [serviceHealth, setServiceHealth] = useState<Record<string, boolean>>({});
  const [adapterServices, setAdapterServices] = useState<Record<string, any>>({});

  useEffect(() => {
    // Check adapter health via health endpoint and extract service status
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        setAdapterStatus(data.status === "healthy" ? "connected" : "disconnected");
        if (data.services) {
          setAdapterServices(data.services);
        }
        // Build health map from adapter services or registry status
        const health: Record<string, boolean> = {};
        SERVICE_REGISTRY.forEach((svc) => {
          health[svc.serviceName] =
            data.services?.[svc.serviceName] === true || svc.adapterStatusLocalStack === "full";
        });
        setServiceHealth(health);
      })
      .catch(() => {
        setAdapterStatus("disconnected");
        const health: Record<string, boolean> = {};
        SERVICE_REGISTRY.forEach((svc) => {
          health[svc.serviceName] = svc.adapterStatusLocalStack === "full";
        });
        setServiceHealth(health);
      });
  }, []);

  const dashboardCards = [
    { name: "Adapter Mode", content: ADAPTER_CONFIG.adapterMode.toUpperCase() },
    {
      name: "Endpoint",
      content:
        ADAPTER_CONFIG.endpointConfig.localstackEndpoint ||
        ADAPTER_CONFIG.endpointConfig.minstackEndpoint ||
        "Unknown",
    },
    {
      name: "Services (FULL)",
      content: SERVICE_REGISTRY.filter(
        (s) => s.adapterStatusLocalStack === "full",
      ).length.toString(),
    },
    {
      name: "Services (PARTIAL MinStack)",
      content: SERVICE_REGISTRY.filter(
        (s) => s.adapterStatusMinStack === "partial",
      ).length.toString(),
    },
    {
      name: "Services (NOT_SUPPORTED MinStack)",
      content: SERVICE_REGISTRY.filter(
        (s) => s.adapterStatusMinStack === "not-supported",
      ).length.toString(),
    },
    { name: "SDK Clients Installed", content: "98" },
  ];

  return (
    <div
      style={{
        padding: "24px",
        minHeight: "calc(100vh - 80px)",
        backgroundColor: "var(--awsui-color-background-main)",
        overflowX: "hidden",
      }}
    >
      <SpaceBetween size="xl" direction="vertical">
        <Header
          variant="h1"
          description="Universal adapter connecting all AWS SDK v3 clients to LocalStack / MinStack emulators"
        >
          AWS Management Console
        </Header>

        {/* Search bar — matches original AWS console */}
        <Container>
          <SpaceBetween size="m" direction="vertical">
            <Header variant="h2">Find Services</Header>
            <div style={{ maxWidth: 600 }}>
              <Input
                type="search"
                placeholder="Search services (EC2, S3, Lambda, IAM...)"
                value={""}
                onChange={() => {}}
                ariaLabel="Search AWS services"
              />
            </div>
          </SpaceBetween>
        </Container>

        {/* Recently Visited — matches original AWS console */}
        <Container header={<Header variant="h2">Recently Visited</Header>}>
          <Cards
            cardDefinition={
              {
                header: (item: any) => (
                  <span style={{ fontWeight: 600 }}>{item.name || "Service"}</span>
                ),
                sections: [
                  {
                    id: "link",
                    header: "Quick Access",
                    content: (item: any) => (
                      <a
                        href={item.href || "/"}
                        style={{
                          color: "var(--awsui-color-text-link-default)",
                          textDecoration: "none",
                        }}
                      >
                        {item.name || "Open"}
                      </a>
                    ),
                  },
                ],
              } as any
            }
            items={
              [
                {
                  name: "EC2",
                  href: "/ec2",
                  icon: "/icons/Architecture-Service/Arch_Compute/32/Arch_Amazon-EC2_32.svg",
                },
                {
                  name: "S3",
                  href: "/s3",
                  icon: "/icons/Architecture-Service/Arch_Storage/32/Arch_Amazon-Simple-Storage-Service_32.svg",
                },
                {
                  name: "Lambda",
                  href: "/lambda",
                  icon: "/icons/Architecture-Service/Arch_Compute/32/Arch_AWS-Lambda_32.svg",
                },
                {
                  name: "IAM",
                  href: "/iam",
                  icon: "/icons/Architecture-Service/Arch_Security-Identity/32/Arch_AWS-Identity-and-Access-Management_32.svg",
                },
                {
                  name: "VPC",
                  href: "/vpc",
                  icon: "/icons/Architecture-Service/Arch_Networking-Content-Delivery/32/Arch_Amazon-Virtual-Private-Cloud_32.svg",
                },
                {
                  name: "CloudFormation",
                  href: "/cloudformation",
                  icon: "/icons/Architecture-Service/Arch_Management-Tools/32/Arch_AWS-CloudFormation_32.svg",
                },
              ] as any
            }
          />
        </Container>

        <Container header={<Header variant="h2">Service health</Header>}>
          <SpaceBetween size="m" direction="vertical">
            <SpaceBetween size="m" direction="horizontal">
              <AdapterStatus
                status={adapterStatus}
                endpointUrl={process.env.NEXT_PUBLIC_LOCALSTACK_ENDPOINT || "http://localhost:4566"}
              />
              <StatusIndicator
                type={
                  adapterStatus === "connected"
                    ? "success"
                    : adapterStatus === "disconnected"
                      ? "warning"
                      : "loading"
                }
              >
                {adapterStatus === "connected"
                  ? "Connected to adapter (LocalStack / MiniStack)"
                  : adapterStatus === "disconnected"
                    ? "Adapter endpoint unreachable — ensure docker-compose is running at localhost:4566"
                    : "Checking adapter health..."}
              </StatusIndicator>
            </SpaceBetween>
            <Cards
              cardDefinition={{
                header: (item: { name?: string }) => item.name || "Service",
                sections: [
                  {
                    id: "icon",
                    header: "Service",
                    content: (item: any) =>
                      item.icon ? (
                        <img src={item.icon} alt="" style={{ width: 24, height: 24 }} />
                      ) : null,
                  },
                  {
                    id: "status",
                    header: "Status",
                    content: (item: any) => (
                      <StatusIndicator type={item.content === "FULL" ? "success" : "info"}>
                        {item.content || "Not configured"}
                      </StatusIndicator>
                    ),
                  },
                ],
              }}
              items={[
                {
                  name: "EC2",
                  key: "Amazon EC2",
                  content: adapterServices["Amazon EC2"] ? "FULL" : "Not Supported",
                  icon: "/icons/Architecture-Service/Arch_Compute/32/Arch_Amazon-EC2_32.svg",
                },
                {
                  name: "S3",
                  key: "Amazon S3",
                  content: adapterServices["Amazon S3"] ? "FULL" : "Not Supported",
                  icon: "/icons/Architecture-Service/Arch_Storage/32/Arch_Amazon-Simple-Storage-Service_32.svg",
                },
                {
                  name: "IAM",
                  key: "AWS Identity and Access Management (IAM)",
                  content: adapterServices["AWS Identity and Access Management (IAM)"]
                    ? "FULL"
                    : "Not Supported",
                  icon: "/icons/Architecture-Service/Arch_Security-Identity/32/Arch_AWS-Identity-and-Access-Management_32.svg",
                },
                {
                  name: "RDS",
                  key: "Amazon RDS",
                  content: adapterServices["Amazon RDS"] ? "FULL" : "Not Supported",
                  icon: "/icons/Architecture-Service/Arch_Databases/32/Arch_Amazon-RDS_32.svg",
                },
                {
                  name: "Lambda",
                  key: "AWS Lambda",
                  content: adapterServices["AWS Lambda"] ? "FULL" : "Not Supported",
                  icon: "/icons/Architecture-Service/Arch_Compute/32/Arch_AWS-Lambda_32.svg",
                },
                {
                  name: "VPC",
                  key: "Amazon VPC",
                  content: adapterServices["Amazon VPC"] ? "FULL" : "Not Supported",
                  icon: "/icons/Architecture-Service/Arch_Networking-Content-Delivery/32/Arch_Amazon-Virtual-Private-Cloud_32.svg",
                },
              ].filter((item: any) => adapterServices[item.key] === true)}
              loadingText="Loading services..."
              empty={
                <Box color="text-body-secondary">
                  No services are currently connected to the emulator.
                </Box>
              }
            />
          </SpaceBetween>
        </Container>

        <Container header={<Header variant="h2">Emulator configuration</Header>}>
          <SpaceBetween size="m" direction="vertical">
            <div>
              <strong>Mode:</strong> {ADAPTER_CONFIG.adapterMode}
            </div>
            <div>
              <strong>LocalStack Endpoint:</strong>{" "}
              {ADAPTER_CONFIG.endpointConfig.localstackEndpoint}
            </div>
            <div>
              <strong>MinStack Endpoint:</strong> {ADAPTER_CONFIG.endpointConfig.minstackEndpoint}
            </div>
            <div>
              <strong>Region:</strong> {ADAPTER_CONFIG.authConfig.region}
            </div>
            <div>
              <strong>Access Key:</strong> {ADAPTER_CONFIG.authConfig.accessKeyId}
            </div>
          </SpaceBetween>
        </Container>

        <Container header={<Header variant="h2">Resource summary</Header>}>
          <Cards
            cardDefinition={
              {
                header: (item: any) => <span>{item.name || "Metric"}</span>,
                sections: [
                  {
                    id: "count",
                    header: "Count / Status",
                    content: (item: any) => <span>{item.content || "0"}</span>,
                  },
                ],
              } as any
            }
            items={dashboardCards as any}
          />
        </Container>
      </SpaceBetween>
    </div>
  );
}
