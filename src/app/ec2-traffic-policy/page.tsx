"use client";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { ServiceStatusOverview } from "@/components/service-layout/ServiceStatusOverview";

export default function Page() {
  return (
    <ServiceLayout
      serviceName="EC2 Traffic Policy"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "EC2 Traffic Policy", href: "#" },
      ]}
    >
      <ServiceStatusOverview
        serviceName="EC2 Traffic Policy"
        emulatorKey="vpc"
        counts={[{ label: "VPCs", route: "vpc", path: "vpcs" }]}
      />
    </ServiceLayout>
  );
}
