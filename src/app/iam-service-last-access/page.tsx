"use client";
import React from "react";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { ServiceStatusOverview } from "@/components/service-layout/ServiceStatusOverview";

export default function Page() {
  return (
    <ServiceLayout
      serviceName="IAM Service Last Accessed"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "IAM Service Last Accessed", href: "#" },
      ]}
    >
      <ServiceStatusOverview
        serviceName="IAM Service Last Accessed"
        emulatorKey="iam"
        counts={[{ label: "Roles", route: "iam", path: "roles" }]}
      />
    </ServiceLayout>
  );
}
