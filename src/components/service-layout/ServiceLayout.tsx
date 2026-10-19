import React from "react";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import Tabs from "@cloudscape-design/components/tabs";
import Box from "@cloudscape-design/components/box";
import type { TabsProps } from "@cloudscape-design/components/tabs";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Image from "next/image";
import { SERVICE_ICONS } from "@/constants/service-icons";
import { ServiceAvailabilityBanner } from "@/components/ServiceAvailabilityBanner";

export interface ServiceLayoutProps {
  readonly serviceName: string;
  readonly serviceHref?: string;
  readonly serviceCategory?: string;
  readonly breadcrumbs?: { text: string; href: string }[];
  readonly navigationItems?: React.ReactElement;
  readonly headerActions?: React.ReactElement;
  readonly tabs?: ReadonlyArray<TabsProps.Tab>;
  readonly children: React.ReactNode;
  readonly splitPanel?: React.ReactElement;
  readonly provider?: string;
  readonly region?: string;
  readonly healthStatus?: "healthy" | "degraded" | "unreachable" | "checking" | "starting";
  readonly healthReason?: string;
  readonly crossServiceLinks?: React.ReactElement;
  /**
   * Render the service name as the page heading. Set to false when this layout
   * is nested inside another service layout that already provides the heading,
   * otherwise the page shows the service name twice and the document has two
   * h1 elements.
   */
  readonly showServiceHeader?: boolean;

  /**
   * Heading level for the service name.
   *
   * A page must have exactly one h1. Where the enclosing route layout already
   * renders the service name as its h1, this layout still needs to show its own
   * title — it carries the icon, the provider and region, the health status and
   * the header actions, none of which the route layout has — but that title has
   * to be an h2. Passing "h2" keeps the visual hierarchy while leaving a single
   * h1 in the document.
   */
  readonly headingLevel?: "h1" | "h2";
}

/**
 * ServiceLayout — Standard service console layout per PRD Section 9
 * Matches AWS Console structure exactly:
 * - Works INSIDE AppShell (no nested AppLayout)
 * - Header with service icon, breadcrumbs, title, actions
 * - Related services links
 * - Main content area with tabs (Overview, Details, Monitoring, Tags, etc.)
 */
export const ServiceLayout: React.FC<ServiceLayoutProps> = ({
  serviceName,
  serviceHref,
  headerActions,
  tabs,
  children,
  provider,
  region,
  healthStatus,
  healthReason,
  crossServiceLinks,
  showServiceHeader = true,
  headingLevel = "h1",
}) => {
  const statusType =
    healthStatus === "healthy"
      ? "success"
      : healthStatus === "degraded"
        ? "warning"
        : healthStatus === "unreachable"
          ? "error"
          : "in-progress";
  const headerDescription = [provider, region].filter(Boolean).join(" | ");
  const icon = serviceHref ? SERVICE_ICONS[serviceHref] : null;

  return (
    <SpaceBetween size="l" direction="vertical" className="aws-service-layout">
      {showServiceHeader ? (
        <Header
          variant={headingLevel}
          className="aws-service-layout__header"
          description={headerDescription || undefined}
          info={
            healthStatus ? (
              <StatusIndicator type={statusType}>{healthReason || healthStatus}</StatusIndicator>
            ) : undefined
          }
          actions={
            headerActions ? (
              <SpaceBetween size="s" direction="horizontal">
                {headerActions}
              </SpaceBetween>
            ) : undefined
          }
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {icon && <Image src={icon.large} alt="" width={32} height={32} />}
            {serviceName}
          </div>
        </Header>
      ) : null}
      {serviceHref && <ServiceAvailabilityBanner serviceHref={serviceHref} />}
      {crossServiceLinks}
      <Container className="aws-service-layout__container">
        {tabs ? <Tabs tabs={tabs} /> : null}
        <Box padding="m" className="service-content">
          {children}
        </Box>
      </Container>
    </SpaceBetween>
  );
};
