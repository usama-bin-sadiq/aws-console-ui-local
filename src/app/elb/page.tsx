"use client";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { ServiceStatusOverview } from "@/components/service-layout/ServiceStatusOverview";

export default function Page() {
  return (
    <ServiceLayout
      serviceName="Elastic Load Balancing"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "Elastic Load Balancing", href: "/elb" },
      ]}
    >
      <ServiceStatusOverview serviceName="Elastic Load Balancing" emulatorKey={["elb", "elbv2"]} />
    </ServiceLayout>
  );
}
