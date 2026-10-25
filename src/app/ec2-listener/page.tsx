"use client";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { ServiceStatusOverview } from "@/components/service-layout/ServiceStatusOverview";

export default function Page() {
  return (
    <ServiceLayout
      serviceName="EC2 Listener"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "EC2 Listener", href: "#" },
      ]}
    >
      <ServiceStatusOverview serviceName="EC2 Listener" emulatorKey={["elb", "elbv2"]} />
    </ServiceLayout>
  );
}
