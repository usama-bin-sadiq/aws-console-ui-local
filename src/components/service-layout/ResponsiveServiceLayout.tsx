/**
 * ResponsiveServiceLayout — Standard responsive layout matching AWS console service pages.
 * Uses AppLayout, SideNavigation reference, ContentLayout, responsive breakpoints.
 */

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import AppLayout from "@cloudscape-design/components/app-layout";
import SideNavigation from "@cloudscape-design/components/side-navigation";
import ContentLayout from "@cloudscape-design/components/content-layout";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Header from "@cloudscape-design/components/header";
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
  const [isCompactLayout, setIsCompactLayout] = useState(false);

  useEffect(() => {
    const update = () => setIsCompactLayout(window.innerWidth < 960);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <AppLayout
      ariaLabels={{ navigation: `${serviceName} service navigation` }}
      navigationWidth={isCompactLayout ? 220 : 240}
      navigationCollapsedWidth={56}
      navigationOpen={!isCompactLayout}
      navigation={
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
      }
      content={
        <ContentLayout
          header={
            <Header
              variant="h1"
              actions={
                <SpaceBetween size="xs" direction={isCompactLayout ? "vertical" : "horizontal"}>
                  <AdapterStatus status={adapterStatus} endpointUrl={process.env.NEXT_PUBLIC_LOCALSTACK_ENDPOINT || "http://localhost:4566"} />
                  {headerActions}
                </SpaceBetween>
              }
            >
              {serviceName}
            </Header>
          }
        >
          <SpaceBetween size="l">
            {content}
            {detailsLink ? <StatusIndicator type="info">Adapter connected. <a href={detailsLink}>View details</a></StatusIndicator> : null}
          </SpaceBetween>
        </ContentLayout>
      }
    />
  );
}
