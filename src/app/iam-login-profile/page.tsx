"use client";
import React from "react";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { ServiceStatusOverview } from "@/components/service-layout/ServiceStatusOverview";

export default function Page() {
  return (
    <ServiceLayout
      serviceName="IAM Login Profile"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "IAM Login Profile", href: "#" },
      ]}
    >
      <ServiceStatusOverview
        serviceName="IAM Login Profile"
        emulatorKey="iam"
        counts={[{ label: "Users", route: "iam", path: "users" }]}
      />
    </ServiceLayout>
  );
}
