"use client";
import React from "react";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { ServiceStatusOverview } from "@/components/service-layout/ServiceStatusOverview";

export default function Page() {
  return (
    <ServiceLayout
      serviceName="EC2 Reversible Query Log"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "EC2 Reversible Query Log", href: "#" },
      ]}
    >
      <ServiceStatusOverview
        serviceName="EC2 Reversible Query Log"
        emulatorKey="route53"
        counts={[{ label: "Hosted zones", route: "route53", path: "zones" }]}
      />
    </ServiceLayout>
  );
}
