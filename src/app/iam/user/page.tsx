import IAMCore from "@/components/IAMCore";
import ServiceLayout from "@/components/layouts/ServiceLayout";
export default function IAMUserPage() {
  return (
    <ServiceLayout
      serviceName="IAM User"
      breadcrumbs={[
        { text: "IAM", href: "/iam" },
        { text: "Users", href: "#" },
      ]}
    >
      <IAMCore />
    </ServiceLayout>
  );
}
