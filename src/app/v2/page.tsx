"use client";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { ServiceStatusOverview } from "@/components/service-layout/ServiceStatusOverview";

export default function Page() {
  return (
    <ServiceLayout
      serviceName="V2"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "v2", href: "#" },
      ]}
    >
      <ServiceStatusOverview serviceName="V2" emulatorKey={["elb", "elbv2"]} />
    </ServiceLayout>
  );
}
