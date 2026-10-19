import KMSCore from "@/components/KMSCore";
import ServiceLayout from "@/components/layouts/ServiceLayout";
export default function KMSPage() {
  return (
    <ServiceLayout
      serviceName="KMS"
      showServiceHeader={false}
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "KMS", href: "/kms" },
      ]}
    >
      <KMSCore />
    </ServiceLayout>
  );
}
