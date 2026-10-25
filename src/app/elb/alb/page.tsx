"use client";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { ServiceStatusOverview } from "@/components/service-layout/ServiceStatusOverview";

export default function Page() {
  return (
    <ServiceLayout
      serviceName="Amazon ELB (Classic)"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "elb/alb", href: "#" },
      ]}
    >
      <ServiceStatusOverview serviceName="Amazon ELB (Classic)" emulatorKey={["elb", "elbv2"]} />
    </ServiceLayout>
  );
}
