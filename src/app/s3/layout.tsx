"use client";

import { usePathname } from "next/navigation";
import { ServiceLayout } from "@/components/layouts/ServiceLayout";

/**
 * S3 section tabs.
 *
 * The AWS S3 console has no "Overview" tab: the service landing page is the
 * bucket list, so the first tab is Buckets. Bucket detail and create-bucket
 * routes are excluded because those pages carry their own sub-navigation
 * (Objects, Permissions, Metrics, Management) and would otherwise show two
 * stacked tab bars.
 */
const TABBED_ROUTES = new Set(["/s3", "/s3/permissions", "/s3/metrics"]);

export default function S3Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";

  return (
    <ServiceLayout
      serviceName="S3"
      showTabs={TABBED_ROUTES.has(pathname)}
      tabs={[
        { label: "Buckets", href: "/s3" },
        { label: "Permissions", href: "/s3/permissions" },
        { label: "Metrics", href: "/s3/metrics" },
      ]}
    >
      {children}
    </ServiceLayout>
  );
}
