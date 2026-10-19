import IAMCore from "@/components/IAMCore";
import ServiceLayout from "@/components/layouts/ServiceLayout";
export default function IAMRolePage() {
  return (
    <ServiceLayout
      serviceName="IAM Role"
      breadcrumbs={[
        { text: "IAM", href: "/iam" },
        { text: "Roles", href: "#" },
      ]}
    >
      <IAMCore />
    </ServiceLayout>
  );
}
