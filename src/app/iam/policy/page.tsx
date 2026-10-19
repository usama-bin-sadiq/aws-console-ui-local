import PolicyEditor from "@/components/PolicyEditor";
import ServiceLayout from "@/components/layouts/ServiceLayout";

export default function PolicyPage() {
  return (
    <ServiceLayout
      serviceName="Policy"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "IAM", href: "/iam" },
        { text: "Policy", href: "/iam/policy" },
      ]}
    >
      <PolicyEditor />
    </ServiceLayout>
  );
}
