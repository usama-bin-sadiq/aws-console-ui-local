"use client";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { ServiceStatusOverview } from "@/components/service-layout/ServiceStatusOverview";

export default function Page() {
  return (
    <ServiceLayout
      serviceName="EC2 Traffic Flow"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "EC2 Traffic Flow", href: "#" },
      ]}
    >
      <ServiceStatusOverview
        serviceName="EC2 Traffic Flow"
        emulatorKey="vpc"
        counts={[{ label: "VPCs", route: "vpc", path: "vpcs" }]}
      />
    </ServiceLayout>
  );
}
