"use client";

import React, { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "@cloudscape-design/components/header";
import Box from "@cloudscape-design/components/box";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Grid from "@cloudscape-design/components/grid";
import SideNavigation, { SideNavigationProps } from "@cloudscape-design/components/side-navigation";
import Image from "next/image";
import { SERVICE_ICONS } from "@/constants/service-icons";
import { AWACS_DESIGN_TOKENS } from "@/constants/design-tokens";
import { ServiceAvailabilityBanner } from "@/components/ServiceAvailabilityBanner";
import { CrossServiceLinks, CrossServiceLink } from "@/components/CrossServiceLinks";
import { BATCH_RELATED_LINKS } from "./shared";

/**
 * AWS Batch console left navigation — mirrors the real console's four
 * sub-pages: Compute Environments, Job Queues, Job Definitions, Jobs.
 */
const NAV_ITEMS: SideNavigationProps.Link[] = [
  { type: "link", text: "Compute environments", href: "/batch-job/compute-environments" },
  { type: "link", text: "Job queues", href: "/batch-job/job-queues" },
  { type: "link", text: "Job definitions", href: "/batch-job/job-definitions" },
  { type: "link", text: "Jobs", href: "/batch-job/jobs" },
];

const RELATED_LINKS: CrossServiceLink[] = BATCH_RELATED_LINKS;

export default function BatchLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const icon = SERVICE_ICONS["/batch-job"];

  // Highlight the nav entry that owns the current path (list and detail
  // routes share the same section prefix).
  const activeHref = useMemo(() => {
    const match = NAV_ITEMS.filter(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    );
    return match.length > 0 ? match[match.length - 1].href : undefined;
  }, [pathname]);

  return (
    <Box padding="m">
      <SpaceBetween size="l">
        <Header variant="h1">
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: AWACS_DESIGN_TOKENS.spacing.s,
            }}
          >
            {icon && <Image src={icon.large} alt="" width={24} height={24} />}
            AWS Batch
          </span>
        </Header>

        <ServiceAvailabilityBanner serviceHref="/batch-job" />

        <Grid gridDefinition={[{ colspan: 3 }, { colspan: 9 }]}>
          <Box>
            <SideNavigation
              activeHref={activeHref}
              items={NAV_ITEMS}
              onFollow={(event) => {
                if (!event.detail.external) {
                  event.preventDefault();
                  router.push(event.detail.href);
                }
              }}
            />
          </Box>
          <Box>{children}</Box>
        </Grid>

        <CrossServiceLinks links={RELATED_LINKS} />
      </SpaceBetween>
    </Box>
  );
}
