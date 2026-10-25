"use client";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { ServiceStatusOverview } from "@/components/service-layout/ServiceStatusOverview";

export default function Page() {
  return (
    <ServiceLayout
      serviceName="EC2 Gateway Load Balancer"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "EC2 Gateway Load Balancer", href: "#" },
      ]}
    >
      <ServiceStatusOverview
        serviceName="EC2 Gateway Load Balancer"
        emulatorKey={["elb", "elbv2"]}
      />
    </ServiceLayout>
  );
}
