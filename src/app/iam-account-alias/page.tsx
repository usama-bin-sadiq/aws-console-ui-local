"use client";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { ServiceStatusOverview } from "@/components/service-layout/ServiceStatusOverview";

export default function Page() {
  return (
    <ServiceLayout
      serviceName="IAM Account Alias"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "IAM Account Alias", href: "#" },
      ]}
    >
      <ServiceStatusOverview
        serviceName="IAM Account Alias"
        emulatorKey="iam"
        counts={[
          { label: "Users", route: "iam", path: "users" },
          { label: "Roles", route: "iam", path: "roles" },
        ]}
      />
    </ServiceLayout>
  );
}
