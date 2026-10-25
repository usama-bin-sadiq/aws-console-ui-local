"use client";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { ServiceStatusOverview } from "@/components/service-layout/ServiceStatusOverview";

export default function Page() {
  return (
    <ServiceLayout
      serviceName="EC2 Health Check"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "EC2 Health Check", href: "#" },
      ]}
    >
      <ServiceStatusOverview
        serviceName="EC2 Health Check"
        emulatorKey="ec2"
        counts={[{ label: "Instances", route: "ec2", path: "instances" }]}
      />
    </ServiceLayout>
  );
}
