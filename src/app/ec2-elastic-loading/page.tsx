"use client";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { ServiceStatusOverview } from "@/components/service-layout/ServiceStatusOverview";

export default function Page() {
  return (
    <ServiceLayout
      serviceName="Amazon Elastic Load Balancing"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "Amazon Elastic Load Balancing", href: "#" },
      ]}
    >
      <ServiceStatusOverview
        serviceName="Amazon Elastic Load Balancing"
        emulatorKey={["elb", "elbv2"]}
      />
    </ServiceLayout>
  );
}
