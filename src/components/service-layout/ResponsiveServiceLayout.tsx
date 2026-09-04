/**
 * ResponsiveServiceLayout — Standard responsive layout matching AWS console service pages.
 * Uses AppLayout, SideNavigation reference, ContentLayout, responsive breakpoints.
 */

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import AppLayout from "@cloudscape-design/components/app-layout";
import SideNavigation from "@cloudscape-design/components/side-navigation";
import ContentLayout from "@cloudscape-design/components/content-layout";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import { AdapterStatus } from "@/components/AdapterStatus/AdapterStatus";

export interface ResponsiveServiceLayoutProps {
  readonly serviceName: string;
  readonly serviceRoute: string;
  readonly navigationItems?: Array<{ text: string; href: string; type?: string; items?: Array<{ text: string; href: string }> }>;
  readonly headerActions?: React.ReactNode;
  readonly content: React.ReactNode;
  readonly detailsLink?: string;
  readonly adapterStatus?: "connected" | "disconnected" | "checking";
}

export function ResponsiveServiceLayout({
  serviceName,
  serviceRoute,
  navigationItems = [{ text: "Overview", href: `/${serviceRoute}` }, { text: "Resources", href: `/${serviceRoute}/resources` }, { text: "Details", href: `/${serviceRoute}/details` }, { text: "Tags", href: `/${serviceRoute}/tags` }],
  headerActions,
  content,
  detailsLink,
  adapterStatus = "connected",
}: ResponsiveServiceLayoutProps): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "16px 24px", borderBottom: "1px solid var(--awsui-color-border-divider-default)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Header variant="h1">{serviceName}</Header>
        <SpaceBetween size="xs" direction="horizontal">
          <AdapterStatus status={adapterStatus} endpointUrl={process.env.NEXT_PUBLIC_LOCALSTACK_ENDPOINT || "http://localhost:4566"} />
          {headerActions}
        </SpaceBetween>
      </header>

      <div style={{ display: "flex", flex: 1, flexDirection: "row", minHeight: 0 }}>
        <nav
          aria-label={`${serviceName} service navigation`}
          style={{
            width: 240,
            minWidth: 200,
            borderRight: "1px solid var(--awsui-color-border-divider-default)",
            padding: "16px",
            overflowY: "auto",
            flexShrink: 0,
            backgroundColor: "var(--awsui-color-background-container-content)",
          }}
        >
          <SideNavigation
            activeHref={pathname || `/${serviceRoute}`}
            items={navigationItems.map((item) => {
              if (item.type === "divider") return { type: "divider" };
              if (item.items) {
                return {
                  type: "expandable-link-group",
                  text: item.text,
                  href: item.href || "#",
                  items: item.items,
                };
              }
              return {
                type: "link",
                text: item.text,
                href: item.href,
              };
            }) as any}
            onFollow={(event) => {
              if (!event.detail.external) {
                event.preventDefault();
                router.push(event.detail.href);
              }
            }}
          />
        </nav>

        <main style={{ flex: 1, padding: "24px", overflowY: "auto", backgroundColor: "var(--awsui-color-background-main)", minHeight: "calc(100vh - 80px)" }}>
          <ContentLayout header={<Header variant="h2">{serviceName} Resources</Header>}>
            <Container>
              {content}
              {detailsLink && (
                <div style={{ marginTop: 16 }}>
                  <SpaceBetween size="xs" direction="horizontal">
                    <StatusIndicator type="info">Adapter connected</StatusIndicator>
                    <a href={detailsLink} style={{ color: "var(--awsui-color-text-link-default)" }}>View details →</a>
                  </SpaceBetween>
                </div>
              )}
            </Container>
          </ContentLayout>
        </main>
      </div>
    </div>
  );
}
