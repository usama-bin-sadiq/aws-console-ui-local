"use client";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { ServiceStatusOverview } from "@/components/service-layout/ServiceStatusOverview";

export default function Page() {
  return (
    <ServiceLayout
      serviceName="IAM Service-Linked Role"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "IAM Service-Linked Role", href: "#" },
      ]}
    >
      <ServiceStatusOverview
        serviceName="IAM Service-Linked Role"
        emulatorKey="iam"
        counts={[{ label: "Roles", route: "iam", path: "roles" }]}
      />
    </ServiceLayout>
  );
}
