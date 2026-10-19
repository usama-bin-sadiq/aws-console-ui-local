"use client";
import React from "react";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { ServiceStatusOverview } from "@/components/service-layout/ServiceStatusOverview";

export default function Page() {
  return (
    <ServiceLayout
      serviceName="IAM Tag"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "IAM Tag", href: "#" },
      ]}
    >
      <ServiceStatusOverview
        serviceName="IAM Tag"
        emulatorKey="iam"
        counts={[{ label: "Users", route: "iam", path: "users" }]}
      />
    </ServiceLayout>
  );
}
