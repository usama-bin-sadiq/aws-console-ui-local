"use client";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { ServiceStatusOverview } from "@/components/service-layout/ServiceStatusOverview";

export default function Page() {
  return (
    <ServiceLayout
      serviceName="EC2 Delegation Set"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "EC2 Delegation Set", href: "#" },
      ]}
    >
      <ServiceStatusOverview
        serviceName="EC2 Delegation Set"
        emulatorKey="ec2"
        counts={[{ label: "Addresses", route: "ec2", path: "addresses" }]}
      />
    </ServiceLayout>
  );
}
